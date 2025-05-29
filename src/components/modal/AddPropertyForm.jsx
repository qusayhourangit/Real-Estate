import React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import L from 'leaflet';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./AddPropertyModal.css";
import api from '../../API/api';
import { useSelector } from 'react-redux';
import { Spinner, Alert, Form, Toast, ToastContainer } from 'react-bootstrap';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAX_PRICE = 100000000000; // مثال: 100 مليار
const MAX_AREA = 10000;      // مثال: 10,000 متر مربع
const formatPriceSimple = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// --- نهاية قسم الحدود القصوى ---

const schema = z.object({
  // title: مطابق لـ required|string|max:255 (الشرط الأدنى 5 لديك هو أكثر تحديداً)
  title: z.string()
    .min(5, 'الرجاء إدخال عنوان واضح للعقار (5 أحرف على الأقل)')
    .max(255, 'العنوان طويل جداً (الحد الأقصى 255 حرف)'),

  // description: مطابق لـ string. الخلفية تتطلبه (required)، هنا اختياري (optional)
  description: z.string()
    .optional(), // أبقيته اختياريًا كما كان، أزل .optional() إذا أردته إلزاميًا

  // price: مطابق لـ required|numeric|min:0 مع إضافة التحقق من الحد الأقصى
  price: z.string()
    .min(1, 'الرجاء إدخال السعر') // يضمن أنه ليس فارغاً (required)
    .refine(val => /^[,\d]+$/.test(val), { message: 'السعر يجب أن يحتوي على أرقام وفواصل فقط' }) // يضمن شكل رقمي
    .refine(val => {
      const num = parseInt(val.replace(/,/g, ''), 10);
      // التحقق من min:0 (أو > 0 كما كان لديك وهو مقبول)
      return !isNaN(num) && num >= 0; // تم التغيير إلى >= 0 ليطابق min:0
    }, { message: 'السعر يجب أن يكون صفراً أو أكبر' })
    .refine(val => {
      try {
        const num = BigInt(val.replace(/,/g, ''));
        // التحقق من الحد الأقصى لمنع خطأ SQL
        return num <= BigInt(MAX_PRICE);
      } catch (e) { return false; }
    }, { message: `السعر المدخل كبير جداً. الحد الأقصى المسموح به هو ${formatPriceSimple(MAX_PRICE)} ل.س` }),

  // area: مطابق لـ required|numeric|min:0 مع إضافة التحقق من الحد الأقصى
  area: z.string()
    .min(1, 'الرجاء إدخال المساحة') // يضمن أنه ليس فارغاً (required)
    .regex(/^\d+$/, 'المساحة يجب أن تكون رقماً صحيحاً موجباً') // يضمن رقم صحيح (numeric وموجب)
    .refine(val => {
       const num = parseInt(val, 10);
       // التحقق من min:0 (أو > 0 كما كان لديك)
       return !isNaN(num) && num >= 0; // تم التغيير إلى >= 0 ليطابق min:0
    }, { message: 'المساحة يجب أن تكون صفراً أو أكبر' })
    .refine(val => {
      const num = parseInt(val, 10);
      // التحقق من الحد الأقصى لمنع خطأ SQL
      return !isNaN(num) && num <= MAX_AREA;
    }, { message: `المساحة المدخلة كبيرة جداً. الحد الأقصى المسموح به هو ${MAX_AREA} م²` }),

  // type: مطابق لـ required | Rule::in (يجب تحديث القائمة لتطابق الخلفية)
  type: z.enum(['house', 'apartment', 'land', 'commercial'], { // <-- تم تحديث القائمة
     required_error: 'الرجاء تحديد نوع العقار'
     // يمكنك إضافة invalid_type_error إذا أردت رسالة مخصصة للقيم غير الصالحة
     // invalid_type_error: "قيمة نوع العقار غير صالحة"
  }),

  // purpose: مطابق لـ required | Rule::in (القائمة متطابقة)
  purpose: z.enum(['sale', 'rent'], {
     required_error: 'الرجاء تحديد الغرض من العقار'
     // invalid_type_error: "قيمة الغرض من العقار غير صالحة"
  }),

  // phone: مطابق لـ required|string، والتحقق الأمامي أكثر تحديداً (وهو أفضل)
  phone: z.string()
    .min(1, 'الرجاء إدخال رقم الهاتف') // يضمن required
    .max(20, 'رقم الهاتف طويل جداً') // يطابق max:20 في الخلفية
    .regex(/^09\d{8}$/, 'صيغة الرقم غير صحيحة (يجب أن يبدأ بـ 09 ويتكون من 10 أرقام)'), // تحقق الصيغة المفصل

  // address: مطابق لـ required|string (الشرط الأدنى 3 لديك مقبول)
  address: z.string()
    .min(3, "الرجاء إدخال عنوان صحيح ودقيق (3 أحرف على الأقل)")
    .max(255, 'العنوان طويل جداً (الحد الأقصى 255 حرف)'), // إضافة حد أقصى للعناوين الطويلة جداً (اختياري لكن جيد)

  // الحقول الأخرى (location_lat, location_lon, counters, images) تُدار خارج هذا المخطط
});
const formContainerVariants = { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.08 } } };
const sectionVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };
const countersSectionVariants = { hidden: { opacity: 0, height: 0, y: -10, marginBottom: 0 }, visible: { opacity: 1, height: 'auto', y: 0, marginBottom: '1rem', transition: { duration: 0.3, ease: "easeOut" } }, exit: { opacity: 0, height: 0, y: -10, marginBottom: 0, transition: { duration: 0.2, ease: "easeIn" } } };
const searchResultsVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } }, exit: { opacity: 0 } };
const resultItemVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } };
const previewContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const previewItemVariants = { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } } };

export default function PropertyForm({ onSubmissionSuccess }) {
  const { propertyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const propertyToEditFromState = location.state?.propertyToEdit;
  const isEditMode = !!propertyId;
  const isCurrentUserSubscribed = user && (user.is_verified_agent === 1 || user.is_verified_agent === true);

  const [position, setPosition] = useState([33.5138, 36.2765]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [livingRooms, setLivingRooms] = useState(1);
  const [balconies, setBalconies] = useState(0);
  const [files, setFiles] = useState([]);
    const [makeFeatured, setMakeFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);
  const mapRef = useRef();

  const getToken = useCallback(() => user?.token || localStorage.getItem('token'), [user?.token]);
  const userDashboardPath = '/user/my-properties';

  const { register, handleSubmit, formState: { errors }, setValue, watch, control, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', description: '', type: 'house', purpose: 'sale', price: '', area: '', phone: '', address: ''
    }
  });
  const propertyType = watch('type');


  const formatPriceForDisplay = useCallback((value) => {
    if (value === null || value === undefined || value === '') return '';
    const numberValue = String(value).replace(/[^\d]/g, '');
    return numberValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, []);

  const formatPriceForSubmit = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/,/g, '');
  };

  const populateForm = useCallback((propertyData) => {
    if (!propertyData) return;
    console.log("Populating form with data:", propertyData);

    reset({
      title: propertyData.title || '',
      description: propertyData.description || '',
      type: propertyData.type || 'house',
      purpose: propertyData.purpose || 'sale',
      price: formatPriceForDisplay(propertyData.price),
      area: String(propertyData.area || ''),
      phone: propertyData.phone || '',
      address: propertyData.address || '',
    });
 // ---!!! تحديث حالة makeFeatured عند تعديل عقار !!!---
    if (propertyData.hasOwnProperty('is_featured')) {
        setMakeFeatured(propertyData.is_featured === 1 || propertyData.is_featured === true);
    } else {
        setMakeFeatured(false); // قيمة افتراضية إذا لم يكن الحقل موجوداً
    }
    // ---!!! نهاية التحديث !!!---  
    setBedrooms(parseInt(propertyData.bedrooms || '0', 10));
    setBathrooms(parseInt(propertyData.bathrooms || '0', 10));
    setLivingRooms(parseInt(propertyData.livingRooms || '0', 10));
    setBalconies(parseInt(propertyData.balconies || '0', 10));

    if (propertyData.location_lat && propertyData.location_lon) {
      const editPos = [parseFloat(propertyData.location_lat), parseFloat(propertyData.location_lon)];
      setPosition(editPos);
      // Avoid resetting search query if it already matches the address from data
      if (propertyData.address && searchQuery !== propertyData.address) {
        setSearchQuery(propertyData.address);
      }
      // Use timeout to ensure map container is ready
      setTimeout(() => { mapRef.current?.flyTo(editPos, 15); }, 100);
    } else {
      setPosition([33.5138, 36.2765]); // Default position if no location data
    }
    setFiles([]); // Clear file selection when populating

  }, [reset, formatPriceForDisplay]); // Removed searchQuery dependency

  useEffect(() => {
    if (!isAuthenticated || !getToken()) {
      navigate('/login', { replace: true });
      return;
    }

    const loadAndPopulate = async () => {
      if (isEditMode) {
        console.log("Edit mode detected. Property ID:", propertyId);
        setIsLoadingData(true);
        setFormError(null);
        let dataToPopulate = propertyToEditFromState;

        if (!dataToPopulate) {
          console.log("No data found in location.state. Fetching from API...");
          try {
            const token = getToken();
            if (!token) throw new Error("Authentication token not found.");

            const response = await api.get(`/user/getProperty/${propertyId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fetched property data:", response.data);
            dataToPopulate = response.data?.data || response.data;

            if (!dataToPopulate || typeof dataToPopulate !== 'object') {
              throw new Error("Property data not found or invalid format received from API.");
            }

          } catch (err) {
            console.error("Error fetching property details:", err.response?.data || err.message || err);
            setFormError(`فشل تحميل بيانات العقار. (${err.response?.data?.message || err.message}). يرجى المحاولة مرة أخرى أو العودة.`);
            setIsLoadingData(false);
            return; // Stop execution if fetch fails
          }
        } else {
          console.log("Using data from location.state.");
        }

        populateForm(dataToPopulate);
        setIsLoadingData(false);

      } else {
        console.log("Add mode detected. Resetting form.");
        // Ensure full reset for add mode
        reset({ title: '', description: '', type: 'house', purpose: 'sale', price: '', area: '', phone: '', address: '' });
        setBedrooms(1); setBathrooms(1); setLivingRooms(1); setBalconies(0);
        setPosition([33.5138, 36.2765]);
        setSearchQuery('');
        setFiles([]);
        setMakeFeatured(false); // ---!!! إعادة تعيين مفتاح التمييز لوضع الإضافة !!!---
        setIsLoadingData(false);
        setFormError(null);
        setFormSuccess(null);
      }
    };

    loadAndPopulate();
    // Adding navigate and reset as dependencies since they are used inside.
    // Added user?.token as a dependency for getToken.
  }, [isEditMode, propertyId, propertyToEditFromState, populateForm, getToken, navigate, isAuthenticated, reset, user?.token]);


  const handleSearch = async () => {
    if (!searchQuery) return;

    setIsLoadingData(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.length > 0) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat);
        const lon = parseFloat(firstResult.lon);
        setPosition([lat, lon]);
        setSearchResults([]); // ← إخفاء الـ list
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const newPos = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(newPos);
    setSearchQuery(result.display_name);
    setValue('address', result.display_name); // Update form field as well
    setSearchResults([]); // Clear results after selection
    mapRef.current?.flyTo(newPos, 15);
  };

  function LocationMarker() {
    useMapEvents({ click(e) { const newPos = [e.latlng.lat, e.latlng.lng]; setPosition(newPos); mapRef.current?.flyTo(e.latlng, mapRef.current.getZoom()); } });
    // Ensure Marker has a position before rendering
    return position ? <Marker position={position}></Marker> : null;
  }

  const handleImagesChange = (e) => { setFiles(Array.from(e.target.files).slice(0, 4)); };

  const removeImage = (index) => { setFiles(files.filter((_, i) => i !== index)); };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const token = getToken();
    // Check user ID exists as well
    if (!token || !user?.id) { setFormError("يجب تسجيل الدخول."); setIsSubmitting(false); navigate('/login'); return; }
    // Validate image requirement for add mode only
    if (!isEditMode && files.length === 0) { setFormError("الرجاء إضافة صورة واحدة على الأقل."); setIsSubmitting(false); return; }
    // Validate position is set
    if (!position || position.length !== 2) { setFormError("الرجاء تحديد الموقع على الخريطة."); setIsSubmitting(false); return; }
   // تحميل الصور إلى Cloudinary


    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('price', formatPriceForSubmit(data.price));
    formData.append('area', data.area);
    formData.append('type', data.type);
    formData.append('purpose', data.purpose);
    formData.append('phone', data.phone);
    formData.append('location_lat', position[0]);
    formData.append('location_lon', position[1]);
    formData.append('address', data.address);
    formData.append('user_id', user.id); // Ensure user_id is included
    
  // ---!!! تحديد قيمة is_featured بناءً على اشتراك المستخدم وحالة المفتاح !!!---
    let finalIsFeaturedValue = '0'; // القيمة الافتراضية (غير مميز)
    if (isCurrentUserSubscribed && makeFeatured) {
        finalIsFeaturedValue = '1'; // اجعله مميزاً فقط إذا كان المستخدم مشتركاً والمفتاح مُفعّل
    }
    formData.append('is_featured', finalIsFeaturedValue);
    console.log('PropertyForm Debug: isCurrentUserSubscribed:', isCurrentUserSubscribed);
    console.log('PropertyForm Debug: makeFeatured state:', makeFeatured);
    console.log('PropertyForm Debug: Sending is_featured as:', finalIsFeaturedValue);
    // ---!!! نهاية تحديد is_featured !!!---
    if (data.type === 'house') {
      formData.append('bedrooms', bedrooms); formData.append('bathrooms', bathrooms); formData.append('livingRooms', livingRooms); formData.append('balconies', balconies);
    } else {
      // Append default 0 values if commercial
      formData.append('bedrooms', '0'); formData.append('bathrooms', '0'); formData.append('livingRooms', '0'); formData.append('balconies', '0');
    }
    // Append files if any are selected
files.forEach((file) => {
  formData.append('images[]', file); // ← مباشرة نرسل الملفات الأصلية
});

    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }; // Correct content type
      let response;

      if (isEditMode) {
        formData.append('_method', 'PATCH'); // Use _method for PATCH simulation if backend expects it
        console.log(`Submitting EDIT (PATCH via POST) to: /user/updateProperty/${propertyId}`);
        // console.log("FormData for edit:", Object.fromEntries(formData.entries())); // Be careful logging files
   
        response = await api.post(`/user/updateProperty/${propertyId}`, formData, { headers }); // Using POST with _method
        console.log('Update Response:', response.data);
        setFormSuccess("✅ تم تعديل العقار بنجاح.");
        setTimeout(() => navigate('/', { replace: true }), 1500); // Navigate back to dashboard
      } else {
        console.log("Submitting ADD to: /user/storeProperty");
        // console.log("FormData for add:", Object.fromEntries(formData.entries())); // Be careful logging files
             console.log("PropertyForm: Final FormData content before sending to backend:");
for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
}
        response = await api.post('/user/storeProperty', formData, { headers });
        console.log('Add Response:', response.data);
        setFormSuccess("✅ تم إضافة العقار بنجاح، بانتظار المراجعة من قبل المسؤولين.");
        setTimeout(() => navigate('/', { replace: true }), 2500); // Navigate back to dashboard
        // Reset form completely after successful add
        reset({ title: '', description: '', type: 'house', purpose: 'sale', price: '', area: '', phone: '', address: '' });
        setFiles([]); setPosition([33.5138, 36.2765]); setSearchQuery('');
        setBedrooms(1); setBathrooms(1); setLivingRooms(1); setBalconies(0);
        setSearchResults([]); setFormError(null); // Clear search results and errors
        if (onSubmissionSuccess) { onSubmissionSuccess(); } // Call success callback (e.g., close modal)
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} property:`, err.response?.data || err.message || err);
      const apiErrorMessage = err.response?.data?.message || `حدث خطأ غير متوقع.`;
      const validationErrors = err.response?.data?.errors;
      let detailedError = apiErrorMessage;
      if (validationErrors && typeof validationErrors === 'object') {
        detailedError += "\n\nالتفاصيل:\n" + Object.entries(validationErrors)
          .map(([field, messages]) => `- ${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join("\n");
      }
      setFormError(detailedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state only for edit mode initial load
  if (isLoadingData && isEditMode) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#d6762e' }} />
        <p className="mt-2">جاري تحميل بيانات العقار...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="property-form-container"
      variants={formContainerVariants} initial="hidden" animate="visible" exit="hidden" >

      <div className="form-header">
        <h2> <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-house-add'} me-2`}></i>
          {isEditMode ? 'تعديل العقار' : 'إضافة عقار جديد'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AnimatePresence>
          {formError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <Alert variant="danger" className="d-flex align-items-center mb-3">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
                <div style={{ whiteSpace: 'pre-wrap' }}>{formError}</div>
              </Alert>
            </motion.div>
          )}
          {formSuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <Alert variant="success" onClose={() => setFormSuccess(null)} dismissible className="d-flex align-items-center mb-3">
                <i className="bi bi-check-circle-fill flex-shrink-0 me-2"></i> {formSuccess}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="form-grid">
          <motion.div className="map-section" variants={sectionVariants}>
            <div className="form-group">
              <label htmlFor="addressInput"><i className="bi bi-signpost-split-fill"></i> عنوان العقار</label>
              <input id="addressInput" type="text" {...register('address')}
                placeholder="مثال: دمشق، المزة، شارع الروضة"
                className={`form-control ${errors.address ? 'is-invalid' : ''}`} />
              {errors.address && <span className="invalid-feedback d-block">{errors.address.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="mapSearch"><i className="bi bi-geo-alt-fill"></i> البحث وتحديد الموقع على الخريطة</label>
              <div className="map-search">
                <div className="input-group">
                  <input id="mapSearch" type="text" className="form-control" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن منطقة أو عنوان..." />
                  <button className="btn btn-outline-secondary" type="button" onClick={handleSearch} disabled={isSubmitting || isLoadingData}> <i className="bi bi-search"></i> </button>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.ul className="list-group search-results" variants={searchResultsVariants} initial="hidden" animate="visible" exit="exit">
                  {searchResults.map((result) => (
                    <motion.li key={result.place_id} className="list-group-item list-group-item-action result-item" variants={resultItemVariants}
                      onClick={() => handleSelectSearchResult(result)} style={{ cursor: 'pointer' }}>
                      {result.display_name}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="map-outer-container">
              <MapContainer center={position} zoom={13} style={{ height: '300px', width: '100%' }} ref={mapRef} key={JSON.stringify(position)} /* Key to force re-render on position change if needed */>
                <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker />
              </MapContainer>
            </div>
            <div className="location-coords mt-2 text-muted small">
              خط العرض: {position ? position[0].toFixed(6) : 'N/A'}, خط الطول: {position ? position[1].toFixed(6) : 'N/A'}
            </div>
          </motion.div>

          <motion.div className="details-section" variants={sectionVariants}>
            <div className="form-group">
              <label htmlFor="title"><i className="bi bi-card-heading"></i> عنوان الإعلان</label>
              <input type="text" id="title" {...register('title')} placeholder="مثال: شقة مفروشة للإيجار في المزة" className={`form-control ${errors.title ? 'is-invalid' : ''}`} />
              {errors.title && <span className="invalid-feedback d-block">{errors.title.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="description"><i className="bi bi-text-paragraph"></i> وصف العقار (اختياري)</label>
              <textarea id="description" {...register('description')} rows="3" placeholder="أضف تفاصيل إضافية هنا..." className="form-control"></textarea>
            </div>
            <div className="row">
              <div className="col-md-6 form-group">
                <label htmlFor="type"><i className="bi bi-building"></i> نوع العقار</label>
                <select id="type" {...register('type')} className={`form-select ${errors.type ? 'is-invalid' : ''}`}>
                  <option value="house">سكني (شقة، منزل، فيلا)</option>
                  <option value="commercial">تجاري (محل، مكتب)</option>
                </select>
                {errors.type && <span className="invalid-feedback d-block">{errors.type.message}</span>}
              </div>
              <div className="col-md-6 form-group">
                <label htmlFor="purpose"><i className="bi bi-tag"></i> الغرض</label>
                <select id="purpose" {...register('purpose')} className={`form-select ${errors.purpose ? 'is-invalid' : ''}`}>
                  <option value="sale">بيع</option>
                  <option value="rent">إيجار</option>
                </select>
                {errors.purpose && <span className="invalid-feedback d-block">{errors.purpose.message}</span>}
              </div>
            </div>
            <div className="row det">
              <div className="col-md-6 form-group">
                <label htmlFor="price"><i className="bi bi-cash-coin"></i> السعر</label>
                <div className="input-group">
                  <Controller name="price" control={control} render={({ field }) => (
                    <input {...field} type="text" id="price" inputMode="numeric" placeholder="أدخل السعر"
                      onChange={(e) => field.onChange(formatPriceForDisplay(e.target.value))}
                      className={`form-control ${errors.price ? 'is-invalid' : ''}`} />)} />
                  <span className="input-group-text">ل.س</span>
                </div>
                {errors.price && <span className="invalid-feedback d-block">{errors.price.message}</span>}
              </div>
              <div className="col-md-6 form-group">
                <label htmlFor="area"><i className="bi bi-arrows-angle-expand"></i> المساحة (م²)</label>
                <input type="number" id="area" {...register('area')} placeholder="مثال: 120" className={`form-control ${errors.area ? 'is-invalid' : ''}`} />
                {errors.area && <span className="invalid-feedback d-block">{errors.area.message}</span>}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="phone"><i className="bi bi-telephone-fill"></i> رقم الهاتف للتواصل</label>
              <input type="tel" id="phone" {...register('phone')} placeholder="09xxxxxxxx" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} />
              {errors.phone && <span className="invalid-feedback d-block">{errors.phone.message}</span>}
            </div>
  {/* ---!!! إضافة مفتاح التبديل هنا إذا كان المستخدم مشتركاً !!!--- */}
            {isCurrentUserSubscribed && (
                <motion.div className="form-group mt-3 mb-2" variants={sectionVariants}> {/* استخدام sectionVariants أو إنشاء variant خاص */}
                    <Form.Check 
                        type="switch"
                        id="is-featured-property-switch"
                        label="تمييز هذا العقار (سيظهر بشكل أفضل للزوار)"
                        checked={makeFeatured}
                        onChange={(e) => setMakeFeatured(e.target.checked)}
                        className="custom-property-feature-switch" // كلاس لتطبيق تنسيقات خاصة إذا أردت
                    />
                    <small className="form-text text-muted d-block mt-1">
                        عند تفعيل هذا الخيار، سيتم اعتبار عقارك مميزاً.
                    </small>
                </motion.div>
            )}
            {/* ---!!! نهاية مفتاح التبديل !!!--- */}
            <AnimatePresence mode='wait'>
              {propertyType === 'house' && (
                <motion.div className="room-counters-section" variants={countersSectionVariants} initial="hidden" animate="visible" exit="exit">
                  <h4 className="mb-3 fw-bold text-secondary"><i className="bt-icon bi bi-door-closed-fill"></i> تفاصيل الغرف</h4>
                  <div className="row gy-3">
                    <div className="col-6 col-md-3"><label className="mb-1"><i className="bi bi-door-open me-1"></i> غرف النوم</label><div className="counter-controls input-group input-group-sm"><button className="btn btn-outline-secondary" type="button" onClick={() => setBedrooms(Math.max(0, bedrooms - 1))} disabled={isSubmitting}><i className="bi bi-dash"></i></button><span className="form-control text-center">{bedrooms}</span><button className="btn btn-outline-secondary" type="button" onClick={() => setBedrooms(bedrooms + 1)} disabled={isSubmitting}><i className="bi bi-plus"></i></button></div></div>
                    <div className="col-6 col-md-3"><label className="mb-1"><i className="bi bi-bucket me-1"></i> الحمامات</label><div className="counter-controls input-group input-group-sm"><button className="btn btn-outline-secondary" type="button" onClick={() => setBathrooms(Math.max(0, bathrooms - 1))} disabled={isSubmitting}><i className="bi bi-dash"></i></button><span className="form-control text-center">{bathrooms}</span><button className="btn btn-outline-secondary" type="button" onClick={() => setBathrooms(bathrooms + 1)} disabled={isSubmitting}><i className="bi bi-plus"></i></button></div></div>
                    <div className="col-6 col-md-3"><label className="mb-1"><i className="bi bi-lamp me-1"></i> الصالون</label><div className="counter-controls input-group input-group-sm"><button className="btn btn-outline-secondary" type="button" onClick={() => setLivingRooms(Math.max(0, livingRooms - 1))} disabled={isSubmitting}><i className="bi bi-dash"></i></button><span className="form-control text-center">{livingRooms}</span><button className="btn btn-outline-secondary" type="button" onClick={() => setLivingRooms(livingRooms + 1)} disabled={isSubmitting}><i className="bi bi-plus"></i></button></div></div>
                    <div className="col-6 col-md-3"><label className="mb-1"><i className="bi bi-flower1 me-1"></i> البرندا</label><div className="counter-controls input-group input-group-sm"><button className="btn btn-outline-secondary" type="button" onClick={() => setBalconies(Math.max(0, balconies - 1))} disabled={isSubmitting}><i className="bi bi-dash"></i></button><span className="form-control text-center">{balconies}</span><button className="btn btn-outline-secondary" type="button" onClick={() => setBalconies(balconies + 1)} disabled={isSubmitting}><i className="bi bi-plus"></i></button></div></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label htmlFor="images"><i className="bi bi-images"></i> {isEditMode ? 'إضافة صور جديدة (اختياري)' : 'صور العقار'} 
              (4 كحد أقصى)
              <h6>*ملاحظة : الحد الأقصى لحجم الصورة هو 10MB</h6></label>
              <div className="file-upload">
                <label htmlFor="images" className={`btn btn-outline border ${isSubmitting ? 'disabled' : ''}`}>
                  <i className="bi bi-upload"></i> اختر الصور
                </label>
                <input type="file" id="images" multiple accept="image/*" onChange={handleImagesChange} style={{ display: 'none' }} disabled={isSubmitting} />
                <span className="file-names ms-2">{files.length > 0 ? `${files.length} صور جديدة محددة` : (isEditMode ? 'لم يتم اختيار صور جديدة' : 'لم يتم اختيار صور')}</span>
              </div>
              <small className="form-text text-muted d-block mt-1">
                {isEditMode ? 'الصور الحالية للعقار ستبقى ما لم تقم بإضافة صور جديدة لتحل محلها أو حذف العقار وإضافته من جديد (حسب منطق الواجهة الخلفية).' : 'يمكنك تحميل حتى 4 صور.'}
              </small>

              <motion.div className="image-previews d-flex flex-wrap gap-2 mt-2" variants={previewContainerVariants} initial="hidden" animate={files.length > 0 ? "visible" : "hidden"}>
                <AnimatePresence>
                  {files.map((file, index) => (
                    <motion.div key={file.name + index} className="image-preview position-relative" variants={previewItemVariants} initial="hidden" animate="visible" exit="exit" layout>
                      <img src={URL.createObjectURL(file)} alt={`preview-${index}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                      <button type="button" className="btn btn-danger btn-sm remove-image position-absolute top-0 end-0 m-1" onClick={() => removeImage(index)} disabled={isSubmitting} title="إزالة الصورة" style={{ lineHeight: '1', padding: '0.2rem 0.4rem' }}><i className="bi bi-x-lg"></i></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div className="form-actions mt-4 text-center" variants={sectionVariants}>
          <button type="submit" className="btn btn-primary btn-lg addprop" disabled={isSubmitting || isLoadingData}>
            {isSubmitting ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />جاري الحفظ...</>
            ) : (
              <><i className={`bi ${isEditMode ? 'bi-check-circle-fill' : 'bi-plus-circle-fill'} me-2`}></i> {isEditMode ? 'حفظ التعديلات' : 'إضافة العقار'}</>
            )}
          </button>
          <button type="button" className="btn btn-secondary btn-lg ms-2" onClick={() => navigate(isEditMode ? userDashboardPath : '/')} disabled={isSubmitting}>
            <i className="bi bi-x-lg me-2"></i>إلغاء
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}