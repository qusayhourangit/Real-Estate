import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom'; // Link لعناوين قابلة للنقر
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyDetails.css'; // ملف CSS خاص بهذه الصفحة
import { Spinner, Alert } from 'react-bootstrap'; // استخدام مكونات Bootstrap للتحميل والخطأ
import api from '../API/api';

// --- تعريف أيقونة الخريطة المخصصة ---
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
// -----------------------------------

// --- مكون لعرض حالة التحميل (باستخدام Bootstrap) ---
const LoadingSpinner = () => (
  <div className="d-flex flex-column justify-content-center align-items-center text-center py-5 my-5">
    <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem', color: '#d6762e !important' }}>
      <span className="visually-hidden">جاري التحميل...</span>
    </Spinner>
    <p className="mt-3 text-muted">جاري تحميل تفاصيل العقار...</p>
  </div>
);
// ----------------------------------------------------

// --- مكون لعرض رسالة خطأ (باستخدام Bootstrap) ---
const ErrorMessage = ({ message }) => (
  <Alert variant="danger" className="text-center shadow-sm my-5">
    <i className="bi bi-exclamation-triangle-fill fs-4 me-2"></i>
    {message || 'حدث خطأ أثناء تحميل البيانات.'}
  </Alert>
);
// ------------------------------------------------

const PropertyDetails = () => {
  const { propertyId } = useParams(); // الحصول على ID العقار من الـ URL
  const [property, setProperty] = useState(null); // لتخزين بيانات العقار
  const [loading, setLoading] = useState(true);   // حالة التحميل
  const [error, setError] = useState(null);       // حالة الخطأ
  const mapRef = useRef();

  // --- useEffect لجلب بيانات العقار المحدد من API ---
  useEffect(() => {
    // التأكد من وجود propertyId قبل محاولة الجلب
    if (!propertyId) {
        setError("لم يتم تحديد معرّف العقار المطلوب.");
        setLoading(false);
        return;
    }

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        // !!! ====> استبدل هذا بالمسار الصحيح للـ API لجلب عقار واحد <==== !!!
        // !!! ============================================================ !!!
        console.log(`Fetching property details from: ${apiUrl}`);

        // يمكنك إضافة headers هنا إذا كان الـ API يتطلب مصادقة
        const headers = { Authorization: `Bearer ${token}` };
        const response = await api.get(`/user/get-property/${propertyId}`, { headers });

        // التحقق من وجود بيانات في الاستجابة
        // افترض أن البيانات موجودة مباشرة في response.data
        // إذا كانت داخل حقل آخر مثل response.data.property، عدّل الشرط
        if (response.data) {
           const propertyData = response.data; // الكائن الذي يمثل العقار

           // --- التعامل مع الصور ---
           const defaultImages = [ // صور افتراضية محسنة
             'https://via.placeholder.com/800x600/e38e49/ffffff?text=Property+Image+1',
             'https://via.placeholder.com/800x600/a0a0a0/ffffff?text=Property+Image+2',
             'https://via.placeholder.com/800x600/cccccc/000000?text=Property+Image+3',
             'https://via.placeholder.com/800x600/f0f0f0/000000?text=Property+Image+4',
           ];
           // تأكد أن حقل الصور موجود وهو مصفوفة وغير فارغ
           const images = (Array.isArray(propertyData.images) && propertyData.images.length > 0)
                            ? propertyData.images // استخدم الصور من الـ API
                            : defaultImages; // استخدم الصور الافتراضية

           // تحديث حالة العقار بالبيانات + الصور المعالجة
           setProperty({ ...propertyData, images });
           // ----------------------

        } else {
           console.warn("API response data is empty or invalid:", response);
           // خطأ أكثر تحديدًا إذا كانت الاستجابة 200 ولكن لا يوجد بيانات
           throw new Error("لم يتم العثور على بيانات للعقار المحدد.");
        }

      } catch (err) {
        console.error('Error fetching property details:', err);
        // تحديد رسالة الخطأ بشكل أفضل
        let errorMessage = "لا يمكن تحميل تفاصيل العقار.";
        if (err.response) {
            // خطأ من الخادم (مثل 404 Not Found, 500 Internal Server Error)
            errorMessage += ` (خطأ ${err.response.status})`;
            if (err.response.status === 404) {
                errorMessage = `لم يتم العثور على العقار بالمعرّف ${propertyId}.`;
            }
        } else if (err.request) {
            // لم يتم تلقي أي استجابة (مشكلة في الشبكة؟)
            errorMessage = "لا يمكن الوصول للخادم. تحقق من اتصال الشبكة.";
        } else if (err.message === "لم يتم العثور على بيانات للعقار المحدد.") {
             errorMessage = err.message; // استخدام الرسالة المخصصة
        } else {
            // خطأ آخر
            errorMessage += ` (${err.message})`;
        }
        setError(errorMessage);
        setProperty(null); // مسح أي بيانات قديمة
      } finally {
        setLoading(false); // إيقاف التحميل في كل الحالات
      }
    };

    fetchProperty();
  }, [propertyId]); // إعادة الجلب فقط عند تغير propertyId
  // ----------------------------------------------------

  // --- دوال مساعدة (تنسيق السعر ورقم الواتساب) ---
  const formatPrice = (price) => {
    // تحويل السعر إلى رقم مع التعامل مع القيم غير الرقمية
    const num = Number(String(price).replace(/[^0-9.-]+/g,""));
    if (isNaN(num)) return price || "السعر غير محدد"; // إرجاع الأصل أو نص افتراضي
    // استخدام تنسيق العملة السورية
    return num.toLocaleString('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 });
  };

  const formatWhatsAppNumber = (phone) => {
    if (!phone) return null; // إذا لم يكن هناك رقم هاتف
    let digits = String(phone).replace(/\D/g, ''); // تحويل لـ string احتياطاً
    if (digits.startsWith('963')) { digits = digits.substring(3); }
    if (digits.startsWith('0')) { digits = digits.substring(1); }
    if (digits.startsWith('9') && digits.length === 9) { return `+963${digits}`; }
    console.warn("Could not format WhatsApp number:", phone); // تحذير إذا فشل التنسيق
    return phone; // إرجاع الرقم الأصلي كحل أخير
  };
  // -----------------------------------------------

  // --- عرض حالات التحميل والخطأ ---
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  // إذا انتهى التحميل ولم يكن هناك خطأ ولكن لا يوجد بيانات (حالة نادرة)
  if (!property) return <ErrorMessage message="لم يتم العثور على العقار المطلوب." />;
  // ----------------------------------

  // --- تحديد موقع الخريطة (مع قيم افتراضية أكثر أمانًا) ---
  const mapPosition = [
    Number(property.location_lat) || 33.5138, // دمشق كافتراضي
    Number(property.location_lon) || 36.2765
  ];
  const hasValidCoordinates = !!(property.location_lat && property.location_lon); // التحقق من وجود الإحداثيات
  // ----------------------------------------------------

  // --- عرض تفاصيل العقار (JSX) ---
  return (
    <div className="property-details-container container my-4" dir="rtl">
      <div className="row g-4">

        {/* === العمود الأيسر === */}
        <div className="col-lg-8">

          {/* معرض الصور */}
          <div className="image-gallery-container mb-4 shadow-sm rounded overflow-hidden">
            {/* عرض شبكة الصور (يمكن تحسينها لاحقًا بمكتبة carousel) */}
            <div className={`image-gallery gallery-count-${Math.min(property.images.length, 4)}`}>
              {property.images && property.images.length > 0 ? (
                property.images.slice(0, 4).map((imgUrl, index) => (
                  <div className={`gallery-item item-${index + 1}`} key={index}>
                    <img
                      src={imgUrl}
                      alt={`${property.title || 'عقار'} - صورة ${index + 1}`}
                      onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/600x400/cccccc/969696?text=Image+Error'; }}
                      loading="lazy"
                      />
                       {/* إضافة overlay لرؤية كل الصور عند وجود أكثر من 4 */}
                       {index === 3 && property.images.length > 4 && (
                            <div className="view-all-overlay">
                                +{property.images.length - 4} <br/> صور أخرى
                            </div>
                       )}
                  </div>
                ))
              ) : (
                <div className="no-images-placeholder d-flex align-items-center justify-content-center">
                    <i className="bi bi-image-alt display-1 text-muted"></i>
                    <p className='ms-3'>لا توجد صور متاحة</p>
                </div>
              )}
            </div>
             {/* زر عرض كل الصور (يمكن ربطه بـ modal لاحقًا) */}
             {property.images && property.images.length > 4 && (
                 <button className="btn btn-light btn-sm view-all-btn">
                    <i className="bi bi-images me-1"></i> عرض كل الصور ({property.images.length})
                 </button>
             )}
          </div>

          {/* رأسية العقار */}
          <div className="property-header p-3 bg-light rounded mb-4 shadow-sm">
            <h1 className="property-title h2 mb-2">{property.title || 'عنوان العقار غير متوفر'}</h1>
            <div className="property-location-purpose d-flex justify-content-between align-items-center mb-3 flex-wrap">
              <span className="text-muted d-flex align-items-center mb-1">
                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                {property.address || (hasValidCoordinates ? `العنوان التقريبي (${mapPosition[0].toFixed(4)}, ${mapPosition[1].toFixed(4)})` : 'العنوان غير متوفر')}
              </span>
              {property.purpose && (
                   <Badge pill bg={property.purpose === 'sale' ? 'danger' : 'success'} className="fs-6 px-3 py-1 mb-1">
                     {property.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
                   </Badge>
              )}
            </div>
             <div className="property-price-tag display-6 fw-bold text-primary">
              <span className="price">{formatPrice(property.price)}</span>
              {property.purpose === 'rent' && <span className="rent-period fs-5 text-muted"> / شهري</span>}
            </div>
          </div>

          {/* الميزات والتفاصيل */}
          <div className="property-features-card card mb-4 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0"><i className="bi bi-list-ul me-2 text-primary"></i>الميزات والتفاصيل</h5>
            </div>
            <div className="card-body">
              <div className="features-grid">
                {/* عرض النوع والمساحة بشكل أساسي */}
                {property.type && (
                    <div className="feature-item">
                        <i className="bi bi-building feature-icon"></i>
                        <span>نوع العقار</span>
                        <strong>{property.type === 'house' ? 'سكني' : (property.type === 'commercial' ? 'تجاري' : property.type)}</strong>
                    </div>
                )}
                {property.area && (
                    <div className="feature-item">
                        <i className="bi bi-arrows-angle-expand feature-icon"></i>
                        <span>المساحة</span>
                        <strong>{property.area} م²</strong>
                    </div>
                )}
                 {/* عرض تفاصيل الغرف فقط إذا كان النوع 'house' والحقول موجودة */}
                 {property.type === 'house' && (
                    <>
                        {property.bedrooms && (<div className="feature-item"><i className="bi bi-door-open-fill feature-icon"></i><span>غرف النوم</span><strong>{property.bedrooms}</strong></div>)}
                        {property.bathrooms && (<div className="feature-item"><i className="bi bi-bucket-fill feature-icon"></i><span>الحمامات</span><strong>{property.bathrooms}</strong></div>)}
                        {property.livingrooms && (<div className="feature-item"><i className="bi bi-lamp-fill feature-icon"></i><span>الصالون</span><strong>{property.livingrooms}</strong></div>)}
                        {property.balconies && (<div className="feature-item"><i className="bi bi-flower1 feature-icon"></i><span>الشرفات</span><strong>{property.balconies}</strong></div>)}
                    </>
                 )}
                  {/* يمكنك إضافة حقول أخرى من الـ API هنا بنفس الطريقة */}
              </div>
            </div>
          </div>

           {/* وصف العقار */}
           {property.description && (
               <div className="property-description-card card mb-4 shadow-sm">
                <div className="card-header bg-white">
                    <h5 className="mb-0"><i className="bi bi-text-paragraph me-2 text-primary"></i>الوصف</h5>
                </div>
                <div className="card-body">
                    {/* استخدام pre للحفاظ على تنسيق النص إن وجد */}
                    <p style={{ whiteSpace: 'pre-wrap' }}>{property.description}</p>
                </div>
                </div>
            )}

          {/* قسم الخريطة */}
          <div className="map-section-details card mb-4 shadow-sm">
             <div className="card-header bg-white">
                 <h5 className="mb-0"><i className="bi bi-map-fill me-2 text-primary"></i>الموقع على الخريطة</h5>
             </div>
            <div className="map-container-details card-body p-0">
              {hasValidCoordinates ? (
                <MapContainer
                  center={mapPosition}
                  zoom={15}
                  style={{ height: '350px', width: '100%' }}
                  scrollWheelZoom={true} // تمكين الزوم بالعجلة
                  ref={mapRef}
                  className='rounded-bottom' // لإضافة حواف دائرية للخريطة
                >
                  <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={mapPosition} icon={customIcon}>
                    <Tooltip>{property.title || 'موقع العقار'}</Tooltip>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="p-3 text-muted text-center">
                    <i className="bi bi-geo-alt fs-3 d-block mb-2"></i> لا تتوفر إحداثيات لعرض الموقع على الخريطة.
                </div>
              )}
            </div>
              {/* زر خرائط جوجل */}
              {hasValidCoordinates && (
                <div className="card-footer text-center bg-light">
                    <a
                     href={`https://www.google.com/maps/search/?api=1&query=${mapPosition[0]},${mapPosition[1]}`} // استخدام search query
                     target="_blank"
                     rel="noopener noreferrer"
                     className="btn btn-sm btn-outline-secondary"
                    >
                        <i className="bi bi-cursor-fill me-1"></i> عرض في خرائط جوجل
                    </a>
                </div>
               )}
          </div>

        </div>
        {/* === نهاية العمود الأيسر === */}


        {/* === العمود الأيمن === */}
        <div className="col-lg-4">
          <div className="contact-box sticky-top shadow-sm rounded p-3 bg-light">
            <h5 className="mb-3 border-bottom pb-2"><i className="bi bi-person-lines-fill me-2 text-primary"></i>تواصل الآن</h5>
            {/* --- أزرار التواصل --- */}
            {property.phone ? ( // التأكد من وجود رقم هاتف
              <>
                {/* زر واتساب */}
                {formatWhatsAppNumber(property.phone) && ( // التأكد من أن التنسيق نجح
                   <a
                    href={`https://wa.me/${formatWhatsAppNumber(property.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-lg btn-success w-100 mb-3 d-flex align-items-center justify-content-center contact-btn whatsapp-btn"
                  >
                    <i className="bi bi-whatsapp fs-4 me-2"></i>واتساب
                  </a>
                )}
                 {/* زر اتصال */}
                <a
                  href={`tel:${property.phone}`} // استخدام الرقم الأصلي هنا
                  className="btn btn-lg btn-primary w-100 d-flex align-items-center justify-content-center contact-btn call-btn"
                  style={{backgroundColor: '#d6762e', borderColor: '#d6762e'}} // لون الهوية
                >
                  <i className="bi bi-telephone-fill fs-4 me-2"></i>اتصال هاتفي ({property.phone}) {/* عرض الرقم */}
                </a>
              </>
            ) : (
                 // رسالة إذا لم يتوفر رقم هاتف
                 <p className="text-muted text-center mt-3 mb-0">
                    <i className="bi bi-telephone-x-fill me-1"></i> لا يتوفر رقم تواصل لهذا العقار.
                 </p>
            )}
             {/* يمكنك إضافة معلومات المالك أو زر الإيميل هنا إذا توفرت في الـ API */}
          </div>
        </div>
        {/* === نهاية العمود الأيمن === */}

      </div> {/* نهاية الصف */}
    </div> // نهاية الحاوية الرئيسية
  );
};

export default PropertyDetails;