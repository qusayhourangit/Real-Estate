import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./AddPropertyModal.css";
import api from '../../API/api';
import { useSelector } from 'react-redux';

// إصلاح أيقونة Marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Schema
const schema = z.object({
  title: z.string().min(5, 'الرجاء إدخال عنوان واضح للعقار (5 أحرف على الأقل)'),
  description: z.string().optional(),
  type: z.enum(['house', 'commercial'], { required_error: 'الرجاء تحديد نوع العقار' }),
  purpose: z.enum(['sale', 'rent'], { required_error: 'الرجاء تحديد الغرض من العقار' }),
  price: z.string().min(1, 'الرجاء إدخال السعر'),
  area: z.string().min(1, 'الرجاء إدخال المساحة'),
  phone: z.string().min(9, 'الرجاء إدخال رقم هاتف صحيح').regex(/^09\d{8}$/, 'صيغة الرقم غير صحيحة (يجب أن يبدأ بـ 09 ويتكون من 10 أرقام)'),
  address: z.string().min(3, "الرجاء إدخال عنوان صحيح"),
});

// --- Variants للأنيميشن ---
const formContainerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.08 } } // تتالي بسيط
};
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};
const countersSectionVariants = {
  hidden: { opacity: 0, height: 0, y: -10, marginBottom: 0 },
  visible: { opacity: 1, height: 'auto', y: 0, marginBottom: '1rem', transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, height: 0, y: -10, marginBottom: 0, transition: { duration: 0.2, ease: "easeIn" } }
};
const searchResultsVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } },
  exit: { opacity: 0 }
};
const resultItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};
const previewContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const previewItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
};
// --------------------------

export default function AddPropertyForm({ onSubmissionSuccess }) {
  const [position, setPosition] = useState([33.5138, 36.2765]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [livingRooms, setLivingRooms] = useState(1);
  const [balconies, setBalconies] = useState(0);
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef();
  const navigate = useNavigate();
  const { isAuthenticated, user, token: reduxToken } = useSelector((state) => state.auth);

  const getToken = () => reduxToken || localStorage.getItem('token');

  useEffect(() => {
    if (!isAuthenticated || !getToken()) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'house', purpose: 'sale', title: '', description: '', price: '', area: '', phone: '', address: '' },
  });

  const propertyType = watch('type');

  const handleSearch = async () => {
    setError(null);
    if (!searchQuery) {
      setError('الرجاء إدخال اسم المنطقة للبحث');
      return;
    }
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=sy&limit=3`);
      if (response.data.length === 0) {
        setError('لم يتم العثور على نتائج للبحث المحدد.');
        setSearchResults([]);
        return;
      }
      const firstResult = response.data[0];
      const newPos = [parseFloat(firstResult.lat), parseFloat(firstResult.lon)];
      setPosition(newPos);
      setValue( firstResult.display_name);
      setSearchResults(response.data);
      setError(null);
      if (mapRef.current) {
        mapRef.current.flyTo(newPos, 15);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError('حدث خطأ أثناء البحث عن الموقع. يرجى المحاولة مرة أخرى.');
      setSearchResults([]);
    }
  };

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        const newPos = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
        if (mapRef.current) {
          mapRef.current.flyTo(e.latlng, map.getZoom());
        }
      },
    });
    return position ? <Marker position={position}></Marker> : null;
  }

  const handleImagesChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 4);
    setFiles(selected);
  };

  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const formatPrice = (value) => {
    const numberValue = value.replace(/\D/g, '');
    return numberValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    const token = getToken(); // الحصول على التوكن هنا

    if (!token) {
      setError("يجب تسجيل الدخول لإضافة عقار");
      setIsSubmitting(false);
      navigate('/login');
      return;
    }

    // تحقق من الصور
    if (files.length === 0) {
      setError("الرجاء إضافة صورة واحدة على الأقل للعقار");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('price', data.price.replace(/,/g, ''));
    formData.append('area', data.area);
    formData.append('type', data.type);
    formData.append('purpose', data.purpose);
    formData.append('phone', data.phone);
    formData.append('location_lat', position[0]);
    formData.append('location_lon', position[1]);
    formData.append('user_id', user.id);
    formData.append('address', data.address); // ✅ إرسال العنوان


    if (data.type === 'house') {
      formData.append('bedrooms', bedrooms);
      formData.append('bathrooms', bathrooms);
      formData.append('livingRooms', livingRooms);
      formData.append('balconies', balconies);
    } else {
      // ضروري تبعت قيم افتراضية أو فارغة مفهومة من Laravel
      formData.append('bedrooms', '0');
      formData.append('bathrooms', '0');
      formData.append('livingRooms', '0');
      formData.append('balconies', '0');
    }

    files.forEach((file) => {
      formData.append('images[]', file);
    });

    try {
      const response = await api.post('/user/storeProperty', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      console.log('تمت إضافة العقار بنجاح:', response.data);
      
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
      navigate('/', {
        state: {
          successMessage: "✅ تم إضافة العقار بنجاح، بانتظار قبوله من المسؤولين.",
          replace: true // هذا يمنع حفظ الـ state في التاريخ (history)

        }
      });    } catch (error) {
      console.error('خطأ في إضافة العقار:', error.response?.data || error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء إضافة العقار');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // --- تطبيق Motion على الحاوية الرئيسية ---
    <motion.div
      className="property-form-container"
      variants={formContainerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden" // لأن هذا النموذج قد يظهر في مودال
    >
      {/* Header */}
      <div className="form-header">
        <h2><i className="bi bi-house-add"></i> إضافة عقار جديد</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* رسالة الخطأ (مع أنيميشن) */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="alert alert-danger d-flex justify-content-between align-items-center"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
            >
              <span><i className="bi bi-exclamation-triangle-fill me-2"></i> {error}</span>
              {/* استخدم زر إغلاق Bootstrap القياسي */}
              <button type="button" className="btn-close btn-sm" onClick={() => setError(null)} aria-label="Close"></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Grid للنموذج --- */}
        <div className="form-grid">
          {/* --- قسم الخريطة (تطبيق Variants) --- */}
          <motion.div className="map-section" variants={sectionVariants}>
          <div className="mb-3">
  <label htmlFor="address" className="form-label">العنوان</label>
  <input
    type="text"
    className="form-control"
    id="address"
    {...register("address")}
    placeholder="مثلاً: دمشق، المزة"
  />
  {errors.address && <div className="text-danger">{errors.address.message}</div>}
</div>
            {/* البحث عن العنوان */}
            <div className="form-group">
              <label htmlFor="address"><i className="bi bi-geo-alt-fill"></i> البحث عن العنوان / المنطقة</label>
              <div className="map-search">
                <div className="search-input-group">
                  <input id="address" type="text" {...register('address')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="مثال: دمشق، المزة" />
                  <button type="button" onClick={handleSearch} disabled={isSubmitting}> <i className="bi bi-search"></i> </button>
                </div>
                {errors.address && <span className="error-message">{errors.address.message}</span>}
              </div>
              {/* نتائج البحث (مع أنيميشن) */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div className="search-results" variants={searchResultsVariants} initial="hidden" animate="visible" exit="exit">
                    {searchResults.map((result) => (
                      <motion.div key={result.place_id} className="result-item" variants={resultItemVariants}
                        onClick={() => { const newPos = [parseFloat(result.lat), parseFloat(result.lon)]; setPosition(newPos); setSearchQuery(result.display_name); setValue('address', result.display_name); setSearchResults([]); if (mapRef.current) { mapRef.current.flyTo(newPos, 15); } }}>
                        {result.display_name}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* حاوية الخريطة */}
            <div className="map-container">
              <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
                <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker />
              </MapContainer>
            </div>
            {/* إحداثيات الموقع */}
            <div className="location-coords">خط الطول: {position[1].toFixed(6)}, خط العرض: {position[0].toFixed(6)}</div>
          </motion.div>
          {/* ------------------------------- */}

          {/* --- قسم تفاصيل العقار (تطبيق Variants) --- */}
          <motion.div className="details-section" variants={sectionVariants}>
            {/* --- جميع الحقول الداخلية تبقى كما هي في الكود الأصلي --- */}
            {/* عنوان الإعلان */}
            <div className="form-group">
              <label htmlFor="title"><i className="bi bi-card-heading"></i> عنوان الإعلان</label>
              <input type="text" id="title" {...register('title')} placeholder="مثال: شقة مفروشة للإيجار في المزة" />
              {errors.title && <span className="error-message">{errors.title.message}</span>}
            </div>
            {/* الوصف */}
            <div className="form-group">
              <label htmlFor="description"><i className="bi bi-text-paragraph"></i> وصف العقار (اختياري)</label>
              <textarea id="description" {...register('description')} rows="3" placeholder="أضف تفاصيل إضافية عن العقار هنا..."></textarea>
            </div>
            {/* النوع والغرض */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type"><i className="bi bi-building"></i> نوع العقار</label>
                <select id="type" {...register('type')}>
                  <option value="house">سكني (شقة، منزل، فيلا)</option>
                  <option value="commercial">تجاري (محل، مكتب)</option>
                </select>
                {errors.type && <span className="error-message">{errors.type.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="purpose"><i className="bi bi-tag"></i> الغرض</label>
                <select id="purpose" {...register('purpose')}>
                  <option value="sale">بيع</option>
                  <option value="rent">إيجار</option>
                </select>
                {errors.purpose && <span className="error-message">{errors.purpose.message}</span>}
              </div>
            </div>
            {/* السعر والمساحة */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price"><i className="bi bi-cash-coin"></i> السعر</label>
                <div className="price-input">
                  <Controller name="price" control={control} render={({ field }) => (<input {...field} type="text" id="price" inputMode="numeric" placeholder="أدخل السعر" onChange={(e) => field.onChange(formatPrice(e.target.value))} />)} />
                  <span className="currency">ل.س</span>
                </div>
                {errors.price && <span className="error-message">{errors.price.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="area"><i className="bi bi-arrows-angle-expand"></i> المساحة (م²)</label>
                <input type="number" id="area" {...register('area')} placeholder="مثال: 120" />
                {errors.area && <span className="error-message">{errors.area.message}</span>}
              </div>
            </div>
            {/* رقم الهاتف */}
            <div className="form-group">
              <label htmlFor="phone"><i className="bi bi-telephone-fill"></i> رقم الهاتف للتواصل</label>
              <input type="tel" id="phone" {...register('phone')} placeholder="09xxxxxxxx" />
              {errors.phone && <span className="error-message">{errors.phone.message}</span>}
            </div>
            {/* ----------------------------------------------- */}

            {/* --- قسم عدادات الغرف (مع AnimatePresence) --- */}
            <AnimatePresence mode='wait'>
              {propertyType === 'house' && (
                <motion.div className="counters-section" variants={countersSectionVariants} initial="hidden" animate="visible" exit="exit">
                  <h4 className="counters-heading"><i className="bt-icon bi bi-door-closed-fill"></i> تفاصيل الغرف</h4>
                  <div className="counters-grid">
                    {/* العدادات كما هي */}
                    <div className="counter"><label><i className="bi bi-door-open"></i> غرف النوم</label><div className="counter-controls"><button type="button" onClick={() => setBedrooms(Math.max(0, bedrooms - 1))} disabled={isSubmitting}><i className="bi bi-dash"></i></button><span>{bedrooms}</span><button type="button" onClick={() => setBedrooms(bedrooms + 1)} disabled={isSubmitting}><i className="bi bi-plus"></i></button></div></div>
                    <div className="counter"><label><i className="bi bi-bucket"></i> الحمامات</label><div className="counter-controls"><button type="button" onClick={() => setBathrooms(Math.max(0, bathrooms - 1))} disabled={isSubmitting}><i className="bi bi-dash"></i></button><span>{bathrooms}</span><button type="button" onClick={() => setBathrooms(bathrooms + 1)} disabled={isSubmitting}><i className="bi bi-plus"></i></button></div></div>
                    <div className="counter"><label><i className="bi bi-lamp"></i> الصالون</label><div className="counter-controls"><button type="button" onClick={() => setLivingRooms(Math.max(0, livingRooms - 1))} disabled={isSubmitting}><i className="bi bi-dash"></i></button><span>{livingRooms}</span><button type="button" onClick={() => setLivingRooms(livingRooms + 1)} disabled={isSubmitting}><i className="bi bi-plus"></i></button></div></div>
                    <div className="counter"><label><i className="bi bi-flower1"></i> البرندا (الشرفات)</label><div className="counter-controls"><button type="button" onClick={() => setBalconies(Math.max(0, balconies - 1))} disabled={isSubmitting}><i className="bi bi-dash"></i></button><span>{balconies}</span><button type="button" onClick={() => setBalconies(balconies + 1)} disabled={isSubmitting}><i className="bi bi-plus"></i></button></div></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* ------------------------------------------------- */}

            {/* --- قسم تحميل الصور (مع تحريك المعاينة) --- */}
            <div className="form-group">
              <label><i className="bi bi-images"></i> صور العقار (4 صور كحد أقصى)</label>
              <div className="file-upload">
                <label className="upload-btn"><i className="bi bi-upload"></i> اختر الصور<input type="file" multiple accept="image/*" onChange={handleImagesChange} style={{ display: 'none' }} disabled={isSubmitting} /></label>
                <span className="file-names">{files.length > 0 ? `${files.length} ملف ${files.length === 1 ? 'محدد' : 'محددة'}` : 'لم يتم اختيار ملفات'}</span>
              </div>
              <small className="form-text text-muted">يمكنك تحميل حتى 4 صور بصيغة PNG, JPG, JPEG, أو WEBP.</small>

              {/* حاوية معاينة الصور (مع أنيميشن وتتالي) */}
              <motion.div className="image-previews" variants={previewContainerVariants} initial="hidden" animate={files.length > 0 ? "visible" : "hidden"}>
                <AnimatePresence>
                  {files.map((file, index) => (
                    <motion.div key={file.name + index} className="image-preview" variants={previewItemVariants} initial="hidden" animate="visible" exit="exit" layout>
                      <img src={URL.createObjectURL(file)} alt={`preview-${index}`} />
                      <button type="button" className="remove-image" onClick={() => removeImage(index)} disabled={isSubmitting} title="إزالة الصورة"><i className="bi bi-x-lg"></i></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              {/* -------------------------------------------- */}
            </div>
            {/* -------------------------------------------- */}
          </motion.div>
          {/* -------------------------------------- */}
        </div> {/* نهاية form-grid */}

        {/* --- زر الإرسال (يرث الأنيميشن) --- */}
        <motion.div className="form-actions" variants={sectionVariants}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>جاري الحفظ...</>
            ) : (
              <><i className="bi bi-check-circle-fill me-2"></i> حفظ العقار</>
            )}
          </button>
        </motion.div>
        {/* -------------------------------- */}
      </form>
    </motion.div>
    // ----------------------------------------
  );
}