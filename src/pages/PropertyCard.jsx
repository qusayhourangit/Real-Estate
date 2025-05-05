import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyCard.css';
import api from '../API/api';

const formatPrice = (price) => {
  const num = Number(String(price).replace(/[^0-9.-]+/g, ""));
  if (isNaN(num)) return price;
  return num.toLocaleString('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 });
};


const getPropertyTypeColor = (type) => {
  switch (type) {
    case 'house':
      return 'info'; // لون بنفسجي للشقق
    case 'commercial':
      return 'warning'; // لون برتقالي للمحال
    default:
      return 'secondary'; // اللون الافتراضي
  }
};

const getCategoryArabic = (type) => {
  switch (type) {
    case 'house':
      return 'شقة';
    case 'commercial':
      return 'محل';
    default:
      return 'نوع غير معروف';
  }
};


const PropertyCard = ({ property ,  }) => {
  const navigate = useNavigate();
    const { isAuthenticated, user, token } = useSelector((state) => state.auth);

  const [isSaved, setIsSaved] = useState(property?.is_favorite || false);
  const [isSaving, setIsSaving] = useState(false); // حالة تحميل للزر
  useEffect(() => {
    // تحديث حالة الحفظ المحلية إذا تغيرت خاصية is_favorite القادمة من الـ props
    // هذا مفيد إذا تم تحديث قائمة العقارات في الصفحة الأم بعد عملية حفظ/إزالة
    setIsSaved(property?.is_favorite || false);
 }, [property?.is_favorite]);
  if (!property) return null;

  const imageUrl = (property.images && property.images.length > 0)
    ? property.images[0]
    : 'https://via.placeholder.com/400x250/cccccc/969696?text=No+Image';

  const handleCardClick = () => {
    if (property.id) {
      navigate(`/properties/${property.id}`);
    } else {
      console.warn("Property ID is missing, cannot navigate.");
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // <-- منع الانتقال لصفحة التفاصيل

    if (!isAuthenticated) {
      navigate('/login'); // توجيه لتسجيل الدخول
      return;
    }
    if (!token) {
        console.error("Favorite toggle failed: No auth token found.");
        alert("خطأ في المصادقة. حاول تسجيل الدخول مرة أخرى.");
        return;
    }

    setIsSaving(true); // بدء التحميل للزر
    const originalSavedState = isSaved; // حفظ الحالة الأصلية للتراجع

    // تحديث بصري فوري
    setIsSaved(!originalSavedState);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (originalSavedState) {
        // --- استدعاء API الحذف ---
        console.log(`PropertyCard: Attempting to unsave property ${property.id}`);
        await api.delete(`/user/remove-saved-property/${property.id}`, config);
        console.log(`PropertyCard: Unsaved property ${property.id}`);
      } else {
        // --- استدعاء API الإضافة ---
        console.log(`PropertyCard: Attempting to save property ${property.id}`);
        // لا نحتاج لإرسال body إذا كان الـ ID في المسار
        await api.post(`/user/saved-property/${property.id}`, {}, config);
        console.log(`PropertyCard: Saved property ${property.id}`);
      }
       // (اختياري) يمكنك إرسال dispatch لـ action في Redux هنا
       // إذا كنت تريد تحديث قائمة المحفوظات العامة أو العداد
       // import { useDispatch } from 'react-redux';
       // const dispatch = useDispatch();
       // dispatch(someActionToUpdateFavorites());

    } catch (error) {
      console.error('Favorite toggle failed:', error.response?.data || error.message);
      // --- التراجع عن التغيير البصري في حالة الفشل ---
      setIsSaved(originalSavedState);
      alert('حدث خطأ أثناء تحديث المفضلة.');
    } finally {
      setIsSaving(false); // إيقاف التحميل دائمًا
    }
  };
  

  return (
    <Card
      className="property-card h-100 shadow-sm"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="property-card-image-container position-relative">
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

        <Badge bg={property.purpose === 'sale' ? 'danger' : 'success'} className="property-purpose-badge">
          {property.purpose === 'sale' ? 'للبيع' : 'للإيجار'}
        </Badge>

        <Button
          variant={isSaved ? "danger" : "light"}
          size="sm"
          className="favorite-btn-card shadow-sm"
          onClick={handleFavoriteClick}
          title={isSaved ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          {isSaved ? <FaHeart /> : <FaRegHeart />}
        </Button>
      </div>

      <Card.Body className="d-flex flex-column p-3">
        <Link to={`/properties/${property.id}`} className="stretched-link text-decoration-none">
          {property.title || 'عنوان غير متوفر'}
        </Link>

        <Card.Subtitle className="mb-2 text-muted property-address small">
          <i className="bi bi-geo-alt-fill text-primary me-1"></i>
          {property.address || 'العنوان غير محدد'}
        </Card.Subtitle>

        <div className="property-price mt-auto pt-2">
          <span className="h5 text-primary fw-bold">{formatPrice(property.price)}</span>
          {property.purpose === 'rent' && <span className="rent-period text-muted"> / شهري</span>}
        </div>

        <hr className="my-2" />

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
