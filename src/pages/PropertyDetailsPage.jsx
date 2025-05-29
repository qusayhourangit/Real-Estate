// PropertyDetails.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip as LeafletTooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyDetails.css';
import { Spinner, Alert, Badge, Button } from 'react-bootstrap';
import api from '../API/api';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css'; // تأكد من استيراده
import { FaHeart, FaRegHeart } from 'react-icons/fa'; // <-- تمت الإضافة لزر المفضلة

// --- تعريف أيقونة الخريطة المخصصة ---
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41],
});

// --- مكونات مساعدة (LoadingSpinner, ErrorMessage, formatPrice, ...) تبقى كما هي ---
const LoadingSpinner = () => (
  <div className="d-flex flex-column justify-content-center align-items-center text-center py-5 my-5">
    <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem', color: '#d6762e !important' }}>
      <span className="visually-hidden">جاري التحميل...</span>
    </Spinner>
    <p className="mt-3 text-muted">جاري تحميل تفاصيل العقار...</p>
  </div>
);

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

const formatPrice = (price) => {
  const num = Number(String(price).replace(/[^0-9.-]+/g, ""));
  if (isNaN(num)) return "السعر عند الطلب";
  // استخدام 'ar-AE' أو 'ar-SA' لضمان ظهور رمز العملة بشكل صحيح مع التنسيق العربي إذا كان 'ar-SY' لا يدعمها جيداً
  return num.toLocaleString('ar-EG', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace('SYP', 'ل.س');
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
    case 'house': return 'سكني'; // يمكن أن يكون شاملاً لـ منزل، فيلا
    case 'apartment': return 'شقة';
    case 'land': return 'أرض';
    case 'villa': return 'فيلا';
    case 'shop': return 'محل';
    case 'office': return 'مكتب';
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


const PropertyDetails = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef();
  const navigate = useNavigate();

  // --- بداية: جلب حالة المصادقة وحالات المفضلة ---
  const { isAuthenticated, token, statusChangeCounter: propertyStatusCounter } = useSelector((state) => state.auth);
  const [savedProperties, setSavedProperties] = useState(new Set());
  const [savingStates, setSavingStates] = useState({});
  // --- نهاية: جلب حالة المصادقة وحالات المفضلة ---

  // --- بداية: دالة جلب العقارات المحفوظة ---
  const fetchSavedIds = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setSavedProperties(new Set());
      return;
    }
    try {
      const res = await api.get(`/user/show-saved-property`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // محاولة استخلاص IDs من بنيات مختلفة قد يرجعها الـ API
      const ids = new Set(
        res.data?.data?.properties?.map(p => p.property?.id).filter(id => id != null) ?? 
        res.data?.savedProperties?.map(p => p.property?.id).filter(id => id != null) ??
        res.data?.data?.map(p => p.property?.id).filter(id => id != null) ?? // إذا كانت البيانات في response.data.data مباشرةً
        []
      );
      setSavedProperties(ids);
    } catch (err) {
      console.error('PropertyDetails: Failed to fetch saved properties:', err);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds, propertyStatusCounter]);
  // --- نهاية: دالة جلب العقارات المحفوظة ---


  const fetchProperty = useCallback(async () => {
    if (!propertyId || isNaN(Number(propertyId))) {
      setError("معرّف العقار غير صالح."); setLoading(false); return;
    }
    setLoading(true); setError(null); setProperty(null);
    try {
      const endpoint = `/realestate/property-details/${propertyId}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get(endpoint, { headers });
      
      console.log("PropertyDetails: API Response Data:", JSON.stringify(response.data?.data, null, 2));
      
      const propertyData = response.data?.data;
      if (propertyData && typeof propertyData === 'object' && propertyData.id) {
        const defaultImages = [
          'https://via.placeholder.com/800x600/e0e0e0/969696?text=Image+Not+Available+1',
          'https://via.placeholder.com/800x600/d0d0d0/969696?text=Image+Not+Available+2',
        ];
        const imageObjectsFromApi = propertyData.images;
        let processedImages = defaultImages;

        if (Array.isArray(imageObjectsFromApi) && imageObjectsFromApi.length > 0) {
          const constructedImageUrls = imageObjectsFromApi
            .map(imgObject => imgObject?.url)
            .filter(url => typeof url === 'string' && url.trim() !== '' && (url.startsWith('http://') || url.startsWith('https://')));
          if (constructedImageUrls.length > 0) {
            processedImages = constructedImageUrls;
          }
        }
        setProperty({ ...propertyData, images: processedImages });
      } else {
        throw new Error(`لم يتم العثور على بيانات للعقار بالمعرّف ${propertyId}.`);
      }
    } catch (err) {
      console.error('PropertyDetails: Error fetching property details:', err);
      let errorMessage = "لا يمكن تحميل تفاصيل العقار.";
      if (err.response) {
        errorMessage = `خطأ ${err.response.status}: ${err.response.data?.message || 'حدث خطأ في الخادم'}`;
        if (err.response.status === 404) errorMessage = `لم يتم العثور على العقار المطلوب (المعرّف: ${propertyId}).`;
      } else if (err.request) errorMessage = "لا يمكن الوصول للخادم. تحقق من اتصال الشبكة.";
      else errorMessage = err.message;
      setError(errorMessage); setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId, token]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // --- بداية: دالة إضافة/إزالة من المفضلة ---
  const handleToggleFavorite = async () => {
    const numericPropertyId = Number(propertyId); // هام: تأكد من أن propertyId هو رقم
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    if (!numericPropertyId || savingStates[numericPropertyId]) return;

    const isSaved = savedProperties.has(numericPropertyId);
    setSavingStates(prev => ({ ...prev, [numericPropertyId]: true }));
    
    setSavedProperties(prev => {
      const updated = new Set(prev);
      isSaved ? updated.delete(numericPropertyId) : updated.add(numericPropertyId);
      return updated;
    });

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      isSaved
        ? await api.delete(`/user/remove-saved-property/${numericPropertyId}`, config)
        : await api.post(`/user/saved-property/${numericPropertyId}`, {}, config);
      // يمكنك استدعاء fetchSavedIds() هنا إذا أردت تأكيد الحالة من الخادم
    } catch (error) {
      console.error('PropertyDetails: Favorite toggle failed:', error);
      setSavedProperties(prev => { // Revert on error
        const reverted = new Set(prev);
        isSaved ? reverted.add(numericPropertyId) : reverted.delete(numericPropertyId);
        return reverted;
      });
      // يمكنك عرض رسالة خطأ للمستخدم هنا
    } finally {
      setSavingStates(prev => ({ ...prev, [numericPropertyId]: false }));
    }
  };
  // --- نهاية: دالة إضافة/إزالة من المفضلة ---


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProperty} />;
  if (!property) return <ErrorMessage message={`لم يتم العثور على بيانات للعقار المطلوب (المعرّف: ${propertyId}).`} />;

  const lat = Number(property.location_lat);
  const lon = Number(property.location_lon);
  const mapPosition = [!isNaN(lat) ? lat : 33.5138, !isNaN(lon) ? lon : 36.2765];
  const hasValidCoordinates = !isNaN(lat) && !isNaN(lon) && property.location_lat && property.location_lon;
  const isPropertyFeatured = property.is_featured === 1 || String(property.is_featured) === "1";
  const agentOwnerId = property.user_id || property.user?.id; //  تحقق من المسار الصحيح لمعرف الوكيل

  return (
    <div className="property-details-container container my-4" dir="rtl">
      <Button variant="link" onClick={() => navigate(-1)} className="mb-3 text-secondary text-decoration-none p-0 go-back-button">
        <i className="bi bi-arrow-right me-1"></i> العودة للخلف
      </Button>

      <div className="row g-4">
        <div className="col-lg-8">
          <motion.div 
            className="image-gallery-container mb-4 shadow-sm rounded overflow-hidden bg-light"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          >
            <div className={`image-gallery gallery-count-${Math.min(property.images?.length || 0, 4)}`}>
              {property.images && property.images.length > 0 ? (
                property.images.slice(0, 4).map((imgUrl, index) => (
                  <div className={`gallery-item item-${index + 1}`} key={imgUrl + index}>
                    <a href={imgUrl} target="_blank" rel="noopener noreferrer" title="عرض الصورة بحجم أكبر">
                      <img
                        src={imgUrl} 
                        alt={`${property.title || 'عقار'} - صورة ${index + 1}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/600x400/cccccc/969696?text=Image+Error';}}
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
                  <p className="ms-3 h4 text-muted">لا توجد صور متاحة للعرض</p>
                </div>
              )}
            </div>
            {property.images && property.images.length > 4 && (
              <Button variant="light" size="sm" className="view-all-btn m-2" onClick={() => {/* TODO: Implement Modal for all images */}}>
                <i className="bi bi-images me-1"></i> عرض كل الصور ({property.images.length})
              </Button>
            )}
          </motion.div>

          <motion.div 
            className="property-header p-3 bg-white rounded mb-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <h1 className="property-title h2 mb-2">{property.title || 'عنوان العقار غير متوفر'}</h1>
            <div className="property-location-purpose d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <span className="text-muted d-flex align-items-center mb-1 property-address-span">
                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                {property.address || (hasValidCoordinates ? `(${mapPosition[0].toFixed(4)}, ${mapPosition[1].toFixed(4)})` : 'العنوان غير متوفر')}
              </span>
              {property.purpose && (
                <Badge pill bg={property.purpose === 'sale' ? 'danger' : 'success'} className="fs-6 px-3 py-1 mb-1 shadow-sm property-purpose-badge">
                  {getTypeArabic(property.purpose)}
                </Badge>
              )}
            </div>
            <div className="property-price-tag display-6 fw-bold text-primary">
              <span className="price">{formatPrice(property.price)}</span>
              {property.purpose === 'rent' && property.period && <span className="rent-period fs-5 text-muted"> / {property.period === 'month' ? 'شهري' : property.period}</span>}
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
                {(property.type === 'house' || property.type === 'apartment' || property.type === 'villa') && (
                  <>
                    {property.bedrooms ? (<div className="feature-item"><i className="bi bi-door-closed-fill feature-icon"></i><span>غرف النوم</span><strong>{property.bedrooms}</strong></div>) : null}
                    {property.bathrooms ? (<div className="feature-item"><i className="bi bi-droplet-half feature-icon"></i><span>الحمامات</span><strong>{property.bathrooms}</strong></div>) : null}
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
                  <Marker position={mapPosition} icon={customIcon}> <LeafletTooltip>{property.title || 'موقع العقار'}</LeafletTooltip> </Marker>
                </MapContainer>
              ) : (
                <div className="p-5 text-muted text-center">
                  <i className="bi bi-map fs-1 d-block mb-2"></i> لا تتوفر إحداثيات لعرض الموقع.
                </div>
              )}
            </div>
            {hasValidCoordinates && (
              <div className="card-footer text-center bg-light">
                <a href={`https://www.google.com/maps?q=${mapPosition[0]},${mapPosition[1]}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-dark">
                  <i className="bi bi-pin-map-fill me-1"></i> عرض في خرائط جوجل
                </a>
              </div>
            )}
          </motion.div>
        </div>

        <div className="col-lg-4">
          <motion.div 
            className="contact-box sticky-top shadow-sm rounded p-4 bg-white"
            style={{ top: 'calc(var(--navbar-height, 70px) + 20px)' }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          >
            <h5 className="mb-3 border-bottom pb-2"><i className="bi bi-person-lines-fill me-2 text-primary"></i>التواصل والمعلومات</h5>
            
            {property.phone && (
              <>
                {formatWhatsAppNumber(property.phone) && (
                  <a 
                    href={`https://wa.me/${formatWhatsAppNumber(property.phone)}`} 
                    target="_blank" rel="noopener noreferrer" 
                    className="btn btn-lg btn-success w-100 mb-3 d-flex align-items-center justify-content-center contact-btn whatsapp-btn"
                  >
                    <i className="bi bi-whatsapp fs-4 me-2"></i>واتساب
                  </a>
                )}
                <a 
                  href={`tel:${property.phone}`} 
                  className="btn btn-lg btn-primary w-100 d-flex align-items-center justify-content-center contact-btn call-btn" 
                  style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}
                >
                  <i className="bi bi-telephone-fill fs-4 me-2"></i>اتصال هاتفي ({property.phone})
                </a>
              </>
            )}

            {isPropertyFeatured && agentOwnerId && (
              <Link 
                to={`/agent/${agentOwnerId}`} 
                className="btn btn-lg btn-outline-primary w-100 mt-3 d-flex align-items-center justify-content-center contact-btn agent-profile-btn"
              >
                <i className="bi bi-person-workspace fs-4 me-2"></i>
                صفحة الوكيل
              </Link>
            )}

            {/* --- بداية: زر إضافة/إزالة من المحفوظات --- */}
            {isAuthenticated && property && (
                <Button
                    variant="outline-primary" 
                    className="w-100 mt-3 save-property-button" 
                    onClick={handleToggleFavorite}
                    disabled={savingStates[Number(propertyId)]}
                >
                    {savingStates[Number(propertyId)] ? (
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                    ) : savedProperties.has(Number(propertyId)) ? (
                        // أيقونة للحالة المحفوظة: إشارة مرجعية ممتلئة بداخلها شرطة، ولونها أصفر
<i class="bi bi-bookmark-x-fill me-2 text-warning"></i>
                    ) : (
                        // أيقونة للحالة غير المحفوظة: إشارة مرجعية فارغة
<i class="bi bi-bookmark-check-fill me-2 text-warning"></i>
                    )}
                    {savedProperties.has(Number(propertyId)) 
                        ? 'إزالة من المحفوظات' 
                        : 'إضافة هذا العقار إلى المحفوظات'}
                </Button>
            )}
            {/* --- نهاية: زر إضافة/إزالة من المحفوظات --- */}


            {!property.phone && !(isPropertyFeatured && agentOwnerId) && !isAuthenticated && ( // شرط إضافي لعدم المصادقة
              <p className="text-muted text-center mt-3 mb-0">
                <i className="bi bi-info-circle-fill me-1"></i> لا تتوفر معلومات اتصال إضافية.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;