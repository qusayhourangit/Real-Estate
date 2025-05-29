// PropertyCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyCard.css'; // تأكد أن هذا الملف سيحتوي على الأنماط الجديدة

// --- Helper Functions ---
const formatPrice = (price) => {
  if (price == null || isNaN(Number(price))) {
    return 'السعر عند الطلب';
  }
  return `${Number(price).toLocaleString('en-US')} ل.س`;
};

const getDealTypeColor = (type) => type === 'sale' ? 'danger' : type === 'rent' ? 'success' : 'primary';
const getPropertyTypeColor = (type) => type === 'house' ? 'info' : type === 'commercial' ? 'warning' : 'secondary';
const getCategoryArabic = (type) => {
    if (type === 'house' || type === 'apartment' || type === 'villa' || type === 'residential') return 'سكني';
    if (type === 'commercial') return 'تجاري';
    if (type === 'land') return 'أرض';
    return 'غير محدد';
};
const getTypeArabic = (purpose) => purpose === 'sale' ? 'للبيع' : purpose === 'rent' ? 'للإيجار' : 'غير محدد';

const PropertyCard = ({ property, isSaved, onToggleFavorite, isSaving }) => {
  const navigate = useNavigate();

  if (!property) {
    console.warn("PropertyCard received null or undefined property data.");
    return null;
  }
  
  const isPropertyTrulyFeatured = property.is_featured === 1 || String(property.is_featured) === "1";
  const isFromVerifiedAgent = property.is_featured === 1 || String(property.is_featured) === "1";

  const imageUrl = (
    property.images &&
    Array.isArray(property.images) &&
    property.images.length > 0 &&
    property.images[0] &&
    typeof property.images[0].url === 'string' &&
    (property.images[0].url.startsWith('http://') || property.images[0].url.startsWith('https://'))
  )
    ? property.images[0].url
    : 'https://via.placeholder.com/300x200?text=NoImage';


  const handleCardClick = () => {
    if (property.id) {
      navigate(`/properties/${property.id}`);
    } else {
      console.warn("Property ID is missing, cannot navigate.");
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (typeof onToggleFavorite === 'function') {
      onToggleFavorite();
    } else {
      console.error("PropertyCard: onToggleFavorite prop is missing or not a function.");
    }
  };

  return (
    <Card
      className={`property-card h-100 border-0 rounded-4 overflow-hidden shadow-sm ${isPropertyTrulyFeatured ? 'truly-featured-property-card' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="position-relative property-card-image-container"> {/* أضفت كلاس هنا للتحكم الدقيق إذا لزم الأمر */}
        {/* --- شارة "عقار مميز" العلوية (أيقونة الإشارة المرجعية البرتقالية) --- */}
        {isPropertyTrulyFeatured && (
                          <div className="top-featured-badge">
                            <i class="bi bi-bookmark-check-fill"></i>
                          </div>
                        )}
        
        <Card.Img
          variant="top"
          src={imageUrl}
          alt={property.title || "صورة عقار"}
          className="property-card-image" // استخدام الكلاس من ملف CSS الخاص بك
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/300x200?text=ImgError';
          }}
        />

        <div className="property-tags position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
          {property.purpose && (
            <Badge bg={getDealTypeColor(property.purpose)} className="rounded-pill px-2 py-1 text-white small">
              {getTypeArabic(property.purpose)}
            </Badge>
          )}
          {property.type && (
            <Badge bg={getPropertyTypeColor(property.type)} className="rounded-pill px-2 py-1 text-white small">
              {getCategoryArabic(property.type)}
            </Badge>
          )}
        </div>

        {typeof onToggleFavorite === 'function' && (
          <Button
            variant="light"
            className="fav-button position-absolute top-0 start-0 m-2 rounded-circle p-1 d-flex align-items-center justify-content-center" // fav-button بدلاً من favorite-btn-card
            style={{ width: '35px', height: '35px', border: 'none', zIndex: 3 }} // z-index أعلى من featured-tag
            onClick={handleFavoriteClick}
            disabled={isSaving}
            aria-label={isSaved ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            {isSaving ? (
              <Spinner animation="border" size="sm" variant="secondary" />
            ) : isSaved ? (
              <FaHeart className="text-danger" />
            ) : (
              <FaRegHeart className="text-secondary" />
            )}
          </Button>
        )}
      </div>

      <Card.Body className="d-flex flex-column p-3">
        <div className="fw-bold fs-5 mb-2" style={{ color: '#d6762e' }}> {/* السعر */}
          {formatPrice(property.price)}
          {property.purpose === 'rent' && <span className="rent-period text-muted small"> / شهري</span>}
        </div>

        {/* --- شارة "وكيل معتمد" --- */}
      
        
        {/* تعديل العنوان لضبط المسافة العلوية */}
        <h5 
            className={`card-title text-truncate mb-2 ${!isFromVerifiedAgent ? 'mt-0' : ''}`} 
            style={{ color: '#333' }} 
            // إذا لم تكن هناك شارة وكيل، العنوان يقترب من السعر (الذي لديه mb-2)
            // إذا كانت شارة الوكيل موجودة، فهي لديها mb-2, لذا العنوان لا يحتاج margin-top كبير
        >
          {property.title || 'عنوان غير متوفر'}  
        </h5>

        <p className="card-text small text-muted mt-auto mb-0 text-truncate property-card-address"> {/* الموقع */}
          <i className="bi bi-geo-alt-fill me-1"></i> {/* سيتم تلوين الأيقونة عبر CSS */}
          {property.address || 'العنوان غير محدد'} {isFromVerifiedAgent && (
                                      <Badge className="verified-agent-info-badge mb-2" > {/* تمت إزالة 'pill' و 'bg' */}
                                        <i className="bi bi-patch-check-fill"></i> {/* الأيقونة، يمكن إزالتها إذا لم تعد مرغوبة */}
                                        <span>وكيل معتمد</span> {/* وضع النص في span للتحكم الأفضل إذا لزم الأمر */}
                                      </Badge>
                                    )}
        </p>
      </Card.Body>
      <div className="d-flex justify-content-around text-muted py-2 border-top det-icn">
            {property.type === 'commercial' ? ( 
              property.area > 0 && (
                <div className="d-flex align-items-center gap-1">
                  <i className="bi bi-aspect-ratio"></i>
                  <span>{property.area} م²</span>
                </div>
              )
            ) : ( 
              <>
                {property.area > 0 && ( <div className="d-flex align-items-center gap-1"> <i className="bi bi-aspect-ratio"></i> <span>{property.area} م²</span> </div> )}
                {property.bedrooms > 0 && ( <div className="d-flex align-items-center gap-1"> <i className="bi bi-door-closed-fill"></i> <span>{property.bedrooms}</span> </div> )}
                {property.bathrooms > 0 && ( <div className="d-flex align-items-center gap-1"> <i className="bi bi-droplet-half"></i> <span>{property.bathrooms}</span> </div> )}
                {(property.livingRooms > 0 || property.livingrooms > 0) && ( <div className="d-flex align-items-center gap-1"> <i className="bi bi-display"></i> <span>{property.livingRooms || property.livingrooms}</span> </div> )}
                {property.balconies > 0 && ( <div className="d-flex align-items-center gap-1"> <i className="bi bi-border-width"></i> <span>{property.balconies}</span> </div> )}
              </>
            )}
      </div>
    </Card>
  );
};

export default PropertyCard;