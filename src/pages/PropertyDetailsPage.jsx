import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const num = Number(String(price).replace(/[^0-9.-]+/g, ""));
  if (isNaN(num)) return "السعر عند الطلب";
  return num.toLocaleString('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 });
};
const formatWhatsAppNumber = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('963')) { digits = digits.substring(3); }
  if (digits.startsWith('0')) { digits = digits.substring(1); }
  if (digits.startsWith('9') && digits.length === 9) { return `+963${digits}`; }
  return null;
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
  const { token } = useSelector((state) => state.auth); // افترضت أن التوكن يأتي من هنا
  const navigate = useNavigate();
  const CLOUDINARY_CLOUD_NAME = 'dyrxrlb8f'; 

   const fetchProperty = useCallback(async () => {
    if (!propertyId || isNaN(Number(propertyId))) {
      setError("معرّف العقار غير صالح.");
      setLoading(false);
      return;
    }
    console.log(`PropertyDetails: Fetching property details for ID: ${propertyId}`);
    setLoading(true); setError(null); setProperty(null);

    try {
      const endpoint = `/realestate/property-details/${propertyId}`;
      console.log(`PropertyDetails: Fetching from endpoint: ${endpoint} using GET`);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get(endpoint, { headers });
      
      console.log("PropertyDetails: API Response FULL:", JSON.stringify(response.data, null, 2));

      const propertyData = response.data?.data; // افترض أن البيانات الفعلية للعقار داخل 'data'
      console.log("PropertyDetails: Extracted propertyData:", JSON.stringify(propertyData, null, 2));

      if (propertyData && typeof propertyData === 'object' && propertyData.id) {
        console.log("PropertyDetails: Property data is valid, processing images...");

        const defaultImages = [
          'https://via.placeholder.com/800x600/e38e49/ffffff?text=No+Image+1',
          'https://via.placeholder.com/800x600/a0a0a0/ffffff?text=No+Image+2',
          'https://via.placeholder.com/800x600/cccccc/000000?text=No+Image+3',
          'https://via.placeholder.com/800x600/f0f0f0/000000?text=No+Image+4',
        ];
        
        // === معالجة الصور بناءً على استرجاع public_id (المفترض أنه في filename) ===
        // عدّل "propertyData.images" إلى اسم الحقل الصحيح الذي يرجع من الـ API ويحتوي على مصفوفة كائنات الصور
        // مثال: propertyData.image_objects أو propertyData.image_details
        const imageObjectsFromApi = propertyData.images; // <--- هذا هو الحقل من مثالك السابق الذي يحتوي على كائنات الصور
                                                        // كل كائن يحتوي على { id, filename, ... }
        
        console.log("PropertyDetails: Raw image objects from API (e.g., propertyData.images):", JSON.stringify(imageObjectsFromApi, null, 2));

        let processedImages = defaultImages; // ابدأ بالصور الافتراضية

        if (Array.isArray(imageObjectsFromApi) && imageObjectsFromApi.length > 0) {
         const constructedImageUrls = imageObjectsFromApi
  .map(imgObject => {
    const imageUrl = imgObject?.filename; // افترض أن filename يحتوي على الرابط الكامل
    if (typeof imageUrl === 'string' && imageUrl.trim() !== '' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl; // <--- هذا هو التغيير المهم: نستخدم الرابط مباشرة
    }
    console.warn(`PropertyDetails: Invalid or missing URL in image object's filename:`, imgObject);
    return null;
  })
  .filter(url => url !== null);
// ...
          if (constructedImageUrls.length > 0) {
            processedImages = constructedImageUrls;
            console.log("PropertyDetails: Successfully CONSTRUCTED Cloudinary URLs from API data (public_ids/filenames):", JSON.stringify(processedImages, null, 2));
          } else {
            console.warn("PropertyDetails: Image objects array from API was present, but FAILED TO CONSTRUCT VALID URLs from filenames/public_ids. Using default images. Original image objects:", JSON.stringify(imageObjectsFromApi, null, 2));
          }
        } else {
          console.log("PropertyDetails: No image objects array found in API response or it was empty. Using default images.");
        }
        // === نهاية معالجة الصور ===
        
        setProperty({ ...propertyData, images: processedImages }); // لا نزال نستخدم 'images' في الحالة للعرض
        console.log("PropertyDetails: Property state updated successfully.");

      } else {
        console.warn("PropertyDetails: Property data not found or invalid in response:", propertyData);
        throw new Error(`لم يتم العثور على بيانات للعقار بالمعرّف ${propertyId}. قد يكون العقار محذوفاً أو المعرف خاطئ.`);
      }

    } catch (err) {
      console.error('PropertyDetails: Error fetching property details:', err);
      let errorMessage = "لا يمكن تحميل تفاصيل العقار.";
      if (err.response) {
        errorMessage = `خطأ ${err.response.status}: ${err.response.data?.message || 'حدث خطأ في الخادم'}`;
        if (err.response.status === 404) {
          errorMessage = `لم يتم العثور على العقار المطلوب (المعرّف: ${propertyId}).`;
        }
      } else if (err.request) {
        errorMessage = "لا يمكن الوصول للخادم. تحقق من اتصال الشبكة.";
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId, token, CLOUDINARY_CLOUD_NAME]); // أضفت CLOUDINARY_CLOUD_NAME كـ dependency

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProperty} />;
  if (!property) return <ErrorMessage message={`لم يتم العثور على بيانات للعقار المطلوب (المعرّف: ${propertyId}). قد يكون تم حذفه أو أن الرابط غير صحيح.`} />;

  const lat = Number(property.location_lat);
  const lon = Number(property.location_lon);
  const mapPosition = [!isNaN(lat) ? lat : 33.5138, !isNaN(lon) ? lon : 36.2765];
  const hasValidCoordinates = !isNaN(lat) && !isNaN(lon) && property.location_lat && property.location_lon;

  return (
    <div className="property-details-container container my-4" dir="rtl">
      <Button variant="link" onClick={() => navigate(-1)} className="mb-3 text-secondary text-decoration-none p-0">
        <i className="bi bi-arrow-right me-1"></i> العودة للخلف
      </Button>

      <div className="row g-4">
        <div className="col-lg-8">
    <motion.div
  className="image-gallery-container mb-4 shadow-sm rounded overflow-hidden bg-light"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <div className={`image-gallery gallery-count-${Math.min(property.images?.length || 0, 4)}`}>
    {/* 
      الشرط property.images && property.images.length > 0 
      يضمن أننا نحاول فقط عرض الصور إذا كانت المصفوفة موجودة وغير فارغة.
      `property.images` يجب أن تكون الآن مصفوفة من روابط URL الكاملة.
    */}
    {property.images && property.images.length > 0 ? (
      property.images.slice(0, 4).map((imgUrl, index) => { 
        // `imgUrl` هنا هو الرابط الكامل للصورة من Cloudinary، 
        // تم تجهيزه في دالة fetchProperty
        
        return (
          <div className={`gallery-item item-${index + 1}`} key={imgUrl + index}> {/* استخدام imgUrl في المفتاح جيد */}
            <a href={imgUrl} target="_blank" rel="noopener noreferrer" title="عرض الصورة بحجم أكبر">
              <img
                src={imgUrl} 
                alt={`${property.title || 'عقار'} - صورة ${index + 1}`}
                onError={(e) => {
                  console.error(`PropertyDetails JSX: Error loading image: ${imgUrl}`, e);
                  e.target.onerror = null; // امنع حلقة لا نهائية إذا كانت الصورة البديلة بها خطأ أيضًا
                  e.target.src = 'https://via.placeholder.com/600x400/cccccc/969696?text=Image+Load+Error';
                }}
                loading="lazy"
              />
            </a>
            {/* عرض زر "عرض المزيد" إذا كان هناك أكثر من 4 صور */}
            {index === 3 && property.images.length > 4 && (
              <div className="view-all-overlay d-flex align-items-center justify-content-center flex-column">
                <i className="bi bi-images fs-1 mb-1"></i>
                <div>+{property.images.length - 4} صور</div>
                {/* يمكنك إضافة زر هنا لفتح modal يعرض كل الصور */}
              </div>
            )}
          </div>
        );
      })
    ) : (
      // هذا الجزء يُعرض إذا كانت مصفوفة property.images فارغة أو غير موجودة
      <div className="no-images-placeholder d-flex align-items-center justify-content-center p-5">
        <i className="bi bi-image-alt display-1 text-muted"></i>
        <p className="ms-3 h4 text-muted">لا توجد صور متاحة للعرض</p>
      </div>
    )}
  </div>
  {/* 
    يمكنك إضافة زر هنا خارج الـ div الرئيسي لمعرض الصور إذا كان لديك أكثر من 4 صور،
    ليفتح نافذة منبثقة (modal) تعرض جميع الصور.
  */}
  {property.images && property.images.length > 4 && (
    <Button variant="light" size="sm" className="view-all-btn m-2" onClick={() => {/* دالة لفتح Modal بالصور */}}>
        <i className="bi bi-images me-1"></i> عرض كل الصور ({property.images.length})
    </Button>
  )}
</motion.div>

          <motion.div
            className="property-header p-3 bg-white rounded mb-4 shadow-sm" // تغيير bg-light إلى bg-white أو أي لون آخر
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

          <motion.div
            className="property-features-card card mb-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0"><i className="bi bi-list-task me-2 text-primary"></i>الميزات والتفاصيل</h5>
            </div>
            <div className="card-body pt-2">
              <div className="features-grid">
                {property.type && (<div className="feature-item"><i className="bi bi-building feature-icon"></i><span>نوع العقار</span><strong>{getCategoryArabic(property.type)}</strong></div>)}
                {property.area && (<div className="feature-item"><i className="bi bi-arrows-angle-expand feature-icon"></i><span>المساحة</span><strong>{property.area} م²</strong></div>)}
                {property.type === 'house' && (
                  <>
                    {property.bedrooms ? (<div className="feature-item"><i className="bi bi-door-closed-fill feature-icon"></i><span>غرف النوم</span><strong>{property.bedrooms}</strong></div>) : null}
                    {property.bathrooms ? (<div className="feature-item"><i className="bi bi-droplet-half feature-icon"></i><span>الحمامات</span><strong>{property.bathrooms}</strong></div>) : null}
                    {/* تأكد من اسم الحقل الصحيح للصالون: livingRooms أو livingrooms */}
                    {property.livingRooms || property.livingrooms ? (<div className="feature-item"><i className="bi bi-display feature-icon"></i><span>الصالون</span><strong>{property.livingRooms || property.livingrooms}</strong></div>) : null}
                    {property.balconies ? (<div className="feature-item"><i className="bi bi-border-width feature-icon"></i><span>الشرفات</span><strong>{property.balconies}</strong></div>) : null}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {property.description && (
            <motion.div
              className="property-description-card card mb-4 shadow-sm"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >
              <div className="card-header bg-white border-bottom-0"> <h5 className="mb-0"><i className="bi bi-blockquote-left me-2 text-primary"></i>الوصف التفصيلي</h5> </div>
              <div className="card-body pt-2"> <p className="text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{property.description}</p> </div>
            </motion.div>
          )}

          <motion.div
            className="map-section-details card mb-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          >
            <div className="card-header bg-white border-bottom-0"> <h5 className="mb-0"><i className="bi bi-geo-alt-fill me-2 text-primary"></i>الموقع على الخريطة</h5> </div>
            <div className="map-container-details card-body p-0">
              {hasValidCoordinates ? (
                <MapContainer center={mapPosition} zoom={15} style={{ height: '400px', width: '100%' }} scrollWheelZoom={true} ref={mapRef} className='rounded-bottom'>
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
        </div>

        <div className="col-lg-4">
          <motion.div
            className="contact-box sticky-top shadow-sm rounded p-4 bg-white" // تغيير bg-light إلى bg-white
            style={{ top: 'calc(var(--navbar-height, 70px) + 20px)' }} // استخدام متغير CSS للنافبار أو قيمة ثابتة
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
                <a href={`tel:${property.phone}`} className="btn btn-lg btn-primary w-100 d-flex align-items-center justify-content-center contact-btn call-btn" style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
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
      </div>
    </div>
  );
};

export default PropertyDetails;