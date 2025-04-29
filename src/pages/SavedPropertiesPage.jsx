import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaArrowLeft } from 'react-icons/fa'; // تمت إعادة FaArrowLeft لزر العودة
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Spinner, Button, Container, Row, Col, Card, Badge, Alert } from 'react-bootstrap'; // استيراد Alert
import axios from 'axios'; // لاستدعاء API
import 'swiper/css';
import 'swiper/css/navigation';
import './SavedProperties.css'; // تأكد من وجود ملف التنسيق وتحديثه إذا لزم الأمر
import api from '../API/api';
import { useSelector } from 'react-redux';

// --- دوال الألوان (يمكن تعديلها حسب الحاجة) ---
const getDealTypeColor = (type) => {
    switch (type?.toLowerCase()) {
        case 'rent': return 'rgba(40, 167, 69, 0.9)';
        case 'sale': return 'rgba(220, 53, 69, 0.9)';
        default: return 'rgba(108, 117, 125, 0.9)';
    }
};
const getPropertyTypeColor = (category) => {
    switch (category?.toLowerCase()) {
        case 'commercial': return 'rgba(108, 52, 131, 0.9)';
        case 'house': return 'rgba(23, 162, 184, 0.9)';
        default: return 'rgba(108, 117, 125, 0.9)';
    }
};
const getTypeArabic = (type) => { /* ... دالة الترجمة ... */ };
const getCategoryArabic = (category) => { /* ... دالة الترجمة ... */ };
// --------------------------------------------------

// --- دالة تنسيق السعر (مكررة، يفضل وضعها في ملف مشترك) ---
const formatPrice = (price) => {
    const num = Number(String(price).replace(/[^0-9.-]+/g,""));
    if (isNaN(num)) return price || "السعر غير محدد";
    return num.toLocaleString('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 });
};
// ---------------------------------------------------------

const SavedPropertiesPage = () => { // إعادة تسمية ليكون واضحًا أنها صفحة
  const [savedProperties, setSavedProperties] = useState([]); // لتخزين بيانات العقارات
  const [loading, setLoading] = useState(false); // نبدأ بـ false، ونفعلها فقط إذا كنا سنجلب البيانات
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // --- useEffect لجلب العقارات المحفوظة عند التحميل أو تغير المستخدم ---
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setSavedProperties([]); // أفرغ القائمة إذا لم يكن مسجلاً
      setLoading(false);
      // لا نعرض رسالة خطأ هنا، بل العرض الشرطي هو الذي يتعامل مع عدم المصادقة
      return;
    }

    const fetchSavedProperties = async () => {
       setLoading(true);
       setError(null);
       try {
           // !!! ====> استبدل هذا بالمسار الصحيح لـ API جلب المحفوظات <==== !!!
           // !!! ======================================================= !!!

           const response = await api.get(`/user/show-saved-property/${user.id}`
            , {
             headers: {
               Authorization: `Bearer ${user.token}` // إذا كنت تستخدم توكن مصادقة.
             }});
           if (response.data && Array.isArray(response.data)) {
                setSavedProperties(response.data);
                 // (اختياري) تحديث localStorage ليكون متزامنًا
                const serverSavedIds = response.data.map(p => p.id);
                localStorage.setItem(`savedProperties_${user.id}`, JSON.stringify(serverSavedIds));
            } else {
                console.warn("Saved properties API response is not a valid array:", response.data);
                setSavedProperties([]);
            }
       } catch (err) {
         console.error('Error fetching saved properties:', err);
         setError(`فشل تحميل العقارات المحفوظة. (${err.response?.data?.message || err.message})`);
         setSavedProperties([]);
       } finally {
         setLoading(false);
       }
     };

    fetchSavedProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // إعادة الجلب عند تغير المستخدم أو حالة المصادقة
  // --------------------------------------------------------------------

  // --- handleRemoveFromSaved (مع إضافة API Call للحذف) ---
  const handleRemoveFromSaved = async (propertyIdToRemove) => {
    if (!isAuthenticated || !user?.id) return;

    const originalSavedProperties = [...savedProperties]; // للحفظ قبل التحديث المحلي

    // 1. تحديث الواجهة فورًا
    setSavedProperties(prev => prev.filter(p => p.id !== propertyIdToRemove));
    // تحديث localStorage أيضًا (للتناسق المؤقت)
    const updatedIds = originalSavedProperties.filter(p => p.id !== propertyIdToRemove).map(p => p.id);
    localStorage.setItem(`savedProperties_${user.id}`, JSON.stringify(updatedIds));


    // 2. إرسال طلب للـ API للحذف من الخادم
    try {
        // !!! ====> استبدل هذا بالمسار الصحيح لـ API حذف المفضلة <==== !!!
        await axios.delete(`/api/user/favorites/${propertyIdToRemove}`);
        // !!! ======================================================= !!!
        console.log(`Property ${propertyIdToRemove} removed from server favorites.`);
        // لا حاجة لتحديث الحالة هنا مرة أخرى

    } catch (error) {
        console.error("Error removing property from favorites API:", error);
        alert("حدث خطأ أثناء إزالة العقار من المفضلة. حاول مرة أخرى.");
        // 3. التراجع عن التغيير في الواجهة عند فشل الـ API
        setSavedProperties(originalSavedProperties);
        localStorage.setItem(`savedProperties_${user.id}`, JSON.stringify(originalSavedProperties.map(p => p.id)));
    }
  };
  // --------------------------------------------------

  // --- التعامل مع عدم تسجيل الدخول (رسالة مع أزرار) ---
  if (!isAuthenticated) {
    return (
      // يمكن استخدام نفس تنسيق قسم الدعوة في الصفحة الرئيسية أو تصميم مخصص للصفحة
      <Container className="text-center py-5 my-5">
         <Alert variant="warning" className="p-4 shadow-sm">
            <i className="bi bi-exclamation-triangle display-4 text-warning mb-3 d-block"></i>
            <h3 className="mb-3">يرجى تسجيل الدخول</h3>
            <p className="text-muted mb-4">يجب عليك تسجيل الدخول أولاً لعرض أو إدارة قائمة العقارات المحفوظة.</p>
            <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                <Button variant="primary" onClick={() => navigate('/login')} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
                   <i className="bi bi-box-arrow-in-right me-2"></i> تسجيل الدخول
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/')}>
                   <i className="bi bi-house-door me-2"></i> العودة للرئيسية
                </Button>
            </div>
        </Alert>
      </Container>
    );
  }
  // -----------------------------------------------------

  // --- عرض حالات التحميل والخطأ للمستخدم المسجل ---
  if (loading) {
    return (
      <div className="text-center py-5 my-5">
        <Spinner animation="border" style={{ color: '#d6762e' }} role="status" />
        <p className="mt-2 text-muted">جاري تحميل محفوظاتك...</p>
      </div>
    );
  }
  if (error) {
     return (
        <Container className="my-5">
            <Alert variant="danger" className="text-center"> <i className="bi bi-exclamation-triangle-fill me-2"></i> {error} </Alert>
             <div className="text-center mt-3">
                <Button variant="outline-secondary" size="sm" onClick={() => window.location.reload()}> <i className="bi bi-arrow-clockwise me-1"></i> إعادة المحاولة </Button>
             </div>
        </Container>
    );
  }
  // ---------------------------------------------------

  // --- العرض الأساسي للمستخدم المسجل ---
  return (
    <section className="saved-properties-page py-5 bg-light" dir="rtl">
      <Container>
         {/* زر العودة والعنوان */}
         <div className="d-flex align-items-center mb-4">
            <Button variant="light" onClick={() => navigate(-1)} className="me-3 border">
                <FaArrowLeft />
            </Button>
            <h1 className="mb-0 h2 fw-bold">العقارات المحفوظة</h1>
         </div>

        {/* عرض رسالة إذا لم توجد عقارات محفوظة */}
        {!loading && savedProperties.length === 0 && (
            <Alert variant="info" className="text-center p-4 shadow-sm">
                <i className="bi bi-bookmarks fs-2 d-block mb-2"></i>
                <p className="fs-5 mb-3">قائمة المفضلة فارغة حالياً.</p>
                <Button variant="primary" onClick={() => navigate('/properties')} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
                    <i className="bi bi-search me-2"></i> ابدأ بتصفح العقارات
                </Button>
            </Alert>
        )}

        {/* عرض السلايدر إذا وجدت عقارات محفوظة */}
        {!loading && savedProperties.length > 0 && (
            <div className="saved-properties-container position-relative">
              <Swiper
                 modules={[Navigation]}
                 spaceBetween={20}
                 slidesPerView={1}
                 navigation // تفعيل الأزرار الافتراضية
                 breakpoints={{
                   576: { slidesPerView: 2 },
                   768: { slidesPerView: 2 }, // تعديل بسيط للشاشات المتوسطة
                   992: { slidesPerView: 3 },
                   1200: { slidesPerView: 4 }
                 }}
                 className="pb-4" // مسافة للنقاط إذا استخدمت
              >
                {savedProperties.map((property) => (
                   <SwiperSlide key={property.id} className="h-auto">
                    {/* استخدام Card من Bootstrap */}
                     <Card className="property-card h-100 shadow-sm border-0 overflow-hidden">
                        <div className="property-image-wrapper">
                            <Card.Img variant="top" src={property.images && property.images.length > 0 ? property.images[0] : 'https://via.placeholder.com/400x250?text=No+Image'} alt={property.title || 'صورة عقار'} className="property-image" onClick={() => handlePropertyClick(property.id)} loading="lazy" onError={(e) => { /*...*/ }}/>
                            <div className="property-tags">
                                {property.type && (<Badge pill bg="" className="tag-deal" style={{ backgroundColor: getDealTypeColor(property.type) }}>{getTypeArabic(property.type)}</Badge>)}
                                {property.category && (<Badge pill bg="" className="tag-category" style={{ backgroundColor: getPropertyTypeColor(property.category) }}>{getCategoryArabic(property.category)}</Badge>)}
                            </div>
                            <Button variant={'danger'} size="sm" className={`favorite-btn shadow-sm active`} onClick={(e) => { e.stopPropagation(); handleRemoveFromSaved(property.id); }} title="إزالة من المفضلة">
                                <FaHeart />
                            </Button>
                        </div>
                        <Card.Body className="d-flex flex-column p-3">
                             {/* استخدام formatPrice لتنسيق السعر */}
                             <div className="property-card-price fw-bold fs-5 mb-1">{formatPrice(property.price)}</div>
                            <h5 className="property-card-title mb-1 text-truncate">
                                {/* جعل العنوان رابطًا أيضًا */}
                                <Link to={`/property/${property.id}`} className="text-decoration-none stretched-link">{property.title || "عنوان غير متوفر"}</Link>
                            </h5>
                            <p className="property-card-address text-muted small mb-0 text-truncate"><i className="bi bi-geo-alt-fill me-1"></i>{property.address || "العنوان غير متوفر"}</p>
                        </Card.Body>
                     </Card>
                   </SwiperSlide>
                ))}
              </Swiper>
               {/* أزرار Swiper الافتراضية ستظهر هنا */}
            </div>
        )}
      </Container>
    </section>
  );
};

export default SavedPropertiesPage; // تصدير بالاسم الصحيح