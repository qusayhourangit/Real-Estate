import React, { useEffect, useState, useRef , useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyDetails.css'; // تأكد من المسار الصحيح
import { Spinner, Alert, Badge, Button } from 'react-bootstrap';
import api from '../API/api'; // تأكد من المسار الصحيح
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';


// --- تعريف أيقونة الخريطة المخصصة ---
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41],
});
// -----------------------------------

// --- مكون لعرض حالة التحميل ---
const LoadingSpinner = () => (
  <div className="d-flex flex-column justify-content-center align-items-center text-center py-5 my-5">
    <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem', color: '#d6762e !important' }}>
      <span className="visually-hidden">جاري التحميل...</span>
    </Spinner>
    <p className="mt-3 text-muted">جاري تحميل تفاصيل العقار...</p>
  </div>
);
// -----------------------------

// --- مكون لعرض رسالة خطأ ---
const ErrorMessage = ({ message, onRetry }) => (
  <Alert variant="danger" className="text-center shadow-sm my-5">
    <i className="bi bi-exclamation-triangle-fill fs-4 me-2"></i>
    {message || 'حدث خطأ أثناء تحميل البيانات.'}
    {onRetry && (
         <div className="mt-3">
            <Button variant="primary" size="sm" onClick={onRetry} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
               <i className="bi bi-arrow-clockwise me-1"></i> إعادة المحاولة
            </Button>
         </div>
    )}
  </Alert>
);
// -------------------------

// --- دوال مساعدة للألوان والنصوص ---
const formatPrice = (price) => {
    const num = Number(String(price).replace(/[^0-9.-]+/g,""));
    if (isNaN(num)) return "السعر عند الطلب";
    return num.toLocaleString('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 });
};
const formatWhatsAppNumber = (phone) => {
    if (!phone) return null;
    let digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('963')) { digits = digits.substring(3); }
    if (digits.startsWith('0')) { digits = digits.substring(1); }
    if (digits.startsWith('9') && digits.length === 9) { return `+963${digits}`; }
    return null; // إرجاع null إذا فشل التنسيق
};
const getCategoryArabic = (type) => {
    switch (type?.toLowerCase()) {
      case 'commercial': return 'تجاري';
      case 'house': return 'سكني';
      default: return type || 'غير محدد';
    }
};
const getTypeArabic = (purpose) => {
    switch (purpose?.toLowerCase()) {
      case 'rent': return 'للإيجار';
      case 'sale': return 'للبيع';
      default: return purpose || 'غير محدد';
    }
};
// -----------------------------------

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef();
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  // --- دالة جلب البيانات ---
  const fetchProperty = useCallback(async () => {
    if (!propertyId || isNaN(Number(propertyId))) {
        setError("معرّف العقار غير صالح.");
        setLoading(false);
        return;
    }
    console.log(`Fetching property details for ID: ${propertyId}`);
    setLoading(true); setError(null); setProperty(null);

    try {
      const endpoint = `/realestate/property-details/${propertyId}`;
      console.log(`Fetching from endpoint: ${endpoint} using GET`);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get(endpoint, { headers });
      console.log("API Response for property details:", response.data);

      // قراءة البيانات من المسار الصحيح
      const propertyData = response.data?.data;
      console.log("Extracted propertyData:", propertyData);

      // التحقق من صحة البيانات
      if (propertyData && typeof propertyData === 'object' && propertyData.id) {
         console.log("Property data is valid, processing...");

         // معالجة الصور
         const defaultImages = [
           'https://via.placeholder.com/800x600/e38e49/ffffff?text=Property+Image+1',
           'https://via.placeholder.com/800x600/a0a0a0/ffffff?text=Property+Image+2',
           'https://via.placeholder.com/800x600/cccccc/000000?text=Property+Image+3',
           'https://via.placeholder.com/800x600/f0f0f0/000000?text=Property+Image+4',
         ];
         const apiImages = propertyData.images;
         let processedImages = defaultImages;

         if (Array.isArray(apiImages) && apiImages.length > 0) {
             processedImages = apiImages
                 .map(img => img?.image ? `${api.defaults.baseURL}/storage/${img.image}` : null)
                 .filter(url => url !== null);
             if (processedImages.length === 0) { processedImages = defaultImages; }
         }
         // نهاية معالجة الصور

         setProperty({ ...propertyData, images: processedImages }); // تحديث الحالة
         console.log("Property state updated successfully.");

      } else {
         console.warn("Property data not found or invalid in response:", propertyData);
         throw new Error(`لم يتم العثور على بيانات للعقار بالمعرّف ${propertyId}.`);
      }

    } catch (err) {
        console.error('Error fetching property details:', err);
        let errorMessage = "لا يمكن تحميل تفاصيل العقار.";
        if (err.response) { errorMessage = `خطأ ${err.response.status}: ${err.response.data?.message || 'حدث خطأ في الخادم'}`; if (err.response.status === 404) errorMessage = `لم يتم العثور على العقار المطلوب (المعرّف: ${propertyId}).`; }
        else if (err.request) { errorMessage = "لا يمكن الوصول للخادم. تحقق من اتصال الشبكة."; }
        else { errorMessage = err.message; }
        setError(errorMessage); setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId, token]);
  // -------------------------

  // --- useEffect لاستدعاء دالة الجلب ---
  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);
  // -----------------------------------

  // --- عرض حالات التحميل والخطأ ---
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProperty} />;
  if (!property) return <ErrorMessage message={`لم يتم العثور على بيانات للعقار المطلوب (المعرّف: ${propertyId}).`} />;
  // ----------------------------------

  // --- تحديد موقع الخريطة ---
  const lat = Number(property.location_lat);
  const lon = Number(property.location_lon);
  const mapPosition = [ !isNaN(lat) ? lat : 33.5138, !isNaN(lon) ? lon : 36.2765 ];
  const hasValidCoordinates = !isNaN(lat) && !isNaN(lon) && property.location_lat && property.location_lon;
  // -------------------------

  // --- عرض تفاصيل العقار (JSX) ---
  return (
    <div className="property-details-container container my-4" dir="rtl">
      <Button variant="link" onClick={() => navigate(-1)} className="mb-3 text-secondary text-decoration-none p-0">
           <i className="bi bi-arrow-right me-1"></i> العودة للخلف
      </Button>

      <div className="row g-4">

        {/* === العمود الأيمن === */}
        <div className="col-lg-8">

          {/* --- معرض الصور --- */}
          <motion.div
             className="image-gallery-container mb-4 shadow-sm rounded overflow-hidden bg-light"
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          >
            <div className={`image-gallery gallery-count-${Math.min(property.images.length, 4)}`}>
              {property.images && property.images.length > 0 ? (
                property.images.slice(0, 4).map((imgUrl, index) => (
                  <div className={`gallery-item item-${index + 1}`} key={imgUrl + index}>
                    <a href={imgUrl} target="_blank" rel="noopener noreferrer" title="عرض الصورة بحجم أكبر">
                        <img
                        src={imgUrl}
                        alt={`${property.title || 'عقار'} - صورة ${index + 1}`}
                        onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/600x400/cccccc/969696?text=Error'; }}
                        loading="lazy"
                        />
                    </a>
                    {index === 3 && property.images.length > 4 && (
                        <div className="view-all-overlay d-flex align-items-center justify-content-center flex-column">
                            <i className="bi bi-images fs-1 mb-1"></i>
                            <div>+{property.images.length - 4} صور</div>
                        </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-images-placeholder d-flex align-items-center justify-content-center p-5">
                    <i className="bi bi-image-alt display-1 text-muted"></i>
                    <p className='ms-3 h4 text-muted'>لا توجد صور متاحة</p>
                </div>
              )}
            </div>
             {property.images && property.images.length > 4 && (
                 <Button variant="light" size="sm" className="view-all-btn m-2">
                    <i className="bi bi-images me-1"></i> عرض كل الصور ({property.images.length})
                 </Button>
             )}
          </motion.div>
          {/* ----------------- */}

          {/* --- رأسية العقار --- */}
          <motion.div
              className="property-header p-3 bg-light rounded mb-4 shadow-sm"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
           >
            <h1 className="property-title h2 mb-2">{property.title || 'عنوان العقار غير متوفر'}</h1>
            <div className="property-location-purpose d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <span className="text-muted d-flex align-items-center mb-1">
                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                {property.address || (hasValidCoordinates ? `(${mapPosition[0].toFixed(4)}, ${mapPosition[1].toFixed(4)})` : 'العنوان غير متوفر')}
              </span>
              {property.purpose && (
                   <Badge pill bg={property.purpose === 'sale' ? 'danger' : 'success'} className="fs-6 px-3 py-1 mb-1 shadow-sm">
                     {getTypeArabic(property.purpose)}
                   </Badge>
              )}
            </div>
             <div className="property-price-tag display-6 fw-bold text-primary">
              <span className="price">{formatPrice(property.price)}</span>
              {property.purpose === 'rent' && <span className="rent-period fs-5 text-muted"> / شهري</span>}
            </div>
          </motion.div>
          {/* ------------------- */}

          {/* --- الميزات والتفاصيل --- */}
          <motion.div
             className="property-features-card card mb-4 shadow-sm"
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
           >
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0"><i className="bi bi-list-task me-2 text-primary"></i>الميزات والتفاصيل</h5>
            </div>
            <div className="card-body pt-2">
              <div className="features-grid">
                {property.type && ( <div className="feature-item"><i className="bi bi-building feature-icon"></i><span>نوع العقار</span><strong>{getCategoryArabic(property.type)}</strong></div> )}
                {property.area && ( <div className="feature-item"><i className="bi bi-arrows-angle-expand feature-icon"></i><span>المساحة</span><strong>{property.area} م²</strong></div> )}
                {property.type === 'house' && (
                    <>
                        {property.bedrooms ? (<div className="feature-item"><i className="bi bi-door-closed-fill feature-icon"></i><span>غرف النوم</span><strong>{property.bedrooms}</strong></div>) : null}
                        {property.bathrooms ? (<div className="feature-item"><i className="bi bi-droplet-half feature-icon"></i><span>الحمامات</span><strong>{property.bathrooms}</strong></div>) : null}
                        {property.livingrooms ? (<div className="feature-item"><i className="bi bi-display feature-icon"></i><span>الصالون</span><strong>{property.livingrooms}</strong></div>) : null}
                        {property.balconies ? (<div className="feature-item"><i className="bi bi-border-width feature-icon"></i><span>الشرفات</span><strong>{property.balconies}</strong></div>) : null}
                    </>
                 )}
              </div>
            </div>
          </motion.div>
          {/* ------------------------- */}

           {/* --- وصف العقار --- */}
           {property.description && (
               <motion.div
                  className="property-description-card card mb-4 shadow-sm"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                >
                <div className="card-header bg-white border-bottom-0"> <h5 className="mb-0"><i className="bi bi-blockquote-left me-2 text-primary"></i>الوصف التفصيلي</h5> </div>
                <div className="card-body pt-2"> <p className="text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{property.description}</p> </div>
               </motion.div>
            )}
           {/* ---------------- */}

          {/* --- قسم الخريطة --- */}
          <motion.div
             className="map-section-details card mb-4 shadow-sm"
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
           >
             <div className="card-header bg-white border-bottom-0"> <h5 className="mb-0"><i className="bi bi-geo-alt-fill me-2 text-primary"></i>الموقع على الخريطة</h5> </div>
             <div className="map-container-details card-body p-0">
              {hasValidCoordinates ? (
                <MapContainer center={mapPosition} zoom={15} style={{ height: '400px', width: '100%' }} scrollWheelZoom={true} ref={mapRef} className='rounded-bottom' >
                  <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={mapPosition} icon={customIcon}> <Tooltip>{property.title || 'موقع العقار'}</Tooltip> </Marker>
                </MapContainer>
              ) : (
                <div className="p-5 text-muted text-center">
                    <i className="bi bi-map fs-1 d-block mb-2"></i> لا تتوفر إحداثيات لعرض الموقع.
                </div>
               )}
             </div>
              {hasValidCoordinates && (
                <div className="card-footer text-center bg-light">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${mapPosition[0]},${mapPosition[1]}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-dark">
                        <i className="bi bi-pin-map-fill me-1"></i> عرض في خرائط جوجل
                    </a>
                </div>
               )}
          </motion.div>
          {/* ----------------- */}

        </div>
        {/* === نهاية العمود الأيسر === */}


        {/* === العمود الأيسر === */}
        <div className="col-lg-4">
          <motion.div
             className="contact-box sticky-top shadow-sm rounded p-4 bg-light"
             style={{top: 'calc(130px + 20px)'}} // تأكد أن هذه القيمة صحيحة لموقع النافبار
             initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
           >
            <h5 className="mb-3 border-bottom pb-2"><i className="bi bi-person-lines-fill me-2 text-primary"></i>تواصل مع المالك</h5>
          
            {property.phone ? (
              <>
                {formatWhatsAppNumber(property.phone) && (
                   <a href={`https://wa.me/${formatWhatsAppNumber(property.phone)}`} target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-success w-100 mb-3 d-flex align-items-center justify-content-center contact-btn whatsapp-btn">
                       <i className="bi bi-whatsapp fs-4 me-2"></i>واتساب
                   </a>
                )}
                <a href={`tel:${property.phone}`} className="btn btn-lg btn-primary w-100 d-flex align-items-center justify-content-center contact-btn call-btn" style={{backgroundColor: '#d6762e', borderColor: '#d6762e'}}>
                    <i className="bi bi-telephone-fill fs-4 me-2"></i>اتصال هاتفي ({property.phone})
                </a>
              </>
            ) : (
                <p className="text-muted text-center mt-3 mb-0">
                    <i className="bi bi-telephone-x-fill me-1"></i> لا يتوفر رقم تواصل.
                </p>
            )}
          </motion.div>
        </div>
        {/* === نهاية العمود الأيمن === */}

      </div> {/* نهاية الصف */}
    </div> // نهاية الحاوية الرئيسية
  );
};

export default PropertyDetails;