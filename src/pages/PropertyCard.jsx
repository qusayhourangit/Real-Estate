// PropertyCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyCard.css';

// دالة تنسيق السعر (محدثة)
const formatPrice = (price) => {
  const num = Number(String(price).replace(/[^0-9.-]+/g, ""));
  if (isNaN(num)) return price;
  return num.toLocaleString('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 });
};

const PropertyCard = ({ property, isSaved, onToggleFavorite, isAuthenticated }) => {
  if (!property) return null;

  const imageUrl = (property.images && property.images.length > 0)
    ? property.images[0]
    : 'https://via.placeholder.com/400x250/cccccc/969696?text=No+Image';

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(property.id);
  };

  return (
    <Card className="property-card h-100 shadow-sm">
      <div className="property-card-image-container position-relative">
        {/* النقر على الصورة يوجه للتفاصيل */}
        <Link to={`/property/${property.id}`} style={{ display: 'block', height: '100%' }}>
          <Card.Img
            variant="top"
            src={imageUrl}
            alt={property.title || 'صورة عقار'}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x250/cccccc/969696?text=Image+Error';
              e.target.alt = 'صورة غير متوفرة';
            }}
            className="property-card-image"
          />
        </Link>

        {/* بادج نوع الصفقة */}
        <Badge bg={property.purpose === 'sale' ? 'danger' : 'success'} className="property-purpose-badge">
          {property.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
        </Badge>

        {/* زر المفضلة */}
        {isAuthenticated && (
          <Button
            variant={isSaved ? "danger" : "light"}
            size="sm"
            className="favorite-btn-card shadow-sm"
            onClick={handleFavoriteClick}
            title={isSaved ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            {isSaved ? <FaHeart /> : <FaRegHeart />}
          </Button>
        )}
      </div>

      <Card.Body className="d-flex flex-column p-3">
        {/* العنوان كرابط */}
        <h5 className="property-card-title mb-1">
          <Link to={`/property/${property.id}`} className="stretched-link text-decoration-none">
            {property.title || 'عنوان غير متوفر'}
          </Link>
        </h5>

        {/* العنوان التفصيلي */}
        <Card.Subtitle className="mb-2 text-muted property-address small">
          <i className="bi bi-geo-alt-fill text-primary me-1"></i>
          {property.address || 'العنوان غير محدد'}
        </Card.Subtitle>

        {/* السعر */}
        <div className="property-price mt-auto pt-2">
          <span className="h5 text-primary fw-bold">{formatPrice(property.price)}</span>
          {property.purpose === 'rent' && <span className="rent-period text-muted"> / شهري</span>}
        </div>

        <hr className="my-2" />

        {/* تفاصيل سريعة */}
        <div className="property-quick-stats d-flex justify-content-around text-center small">
          {property.type === 'house' && (
            <>
              <div><i className="bi bi-door-open-fill fs-6 text-secondary"></i><p className="mb-0 mt-1">{property.bedrooms ?? '?'} غرف</p></div>
              <div><i className="bi bi-bucket-fill fs-6 text-secondary"></i><p className="mb-0 mt-1">{property.bathrooms ?? '?'} حمام</p></div>
            </>
          )}
          <div><i className="bi bi-arrows-angle-expand fs-6 text-secondary"></i><p className="mb-0 mt-1">{property.area ? `${property.area} م²` : '?'}</p></div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PropertyCard;
