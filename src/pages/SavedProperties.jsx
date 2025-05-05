import React, { useState, useEffect, useCallback, useRef } from 'react'; // استيراد useRef
import { useNavigate, Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // استيراد أيقونات الأسهم
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Spinner, Button, Container, Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/navigation'; // للأساسيات أو الأزرار الافتراضية
import './SavedProperties.css'; // تأكد من استيراد ملف CSS
import api from '../API/api'; // تأكد من المسار الصحيح
import { useSelector } from 'react-redux'; // <-- 1. استخدام useSelector من Redux

// --- Variants للأنيميشن ---
const promptVariants = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } } };
const savedContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, when: "beforeChildren" } } };
const savedItemVariants = { hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } } };
// ----------------------

// --- دوال الألوان والترجمة والتنسيق ---
const getDealTypeColor = (type) => {
    switch (type?.toLowerCase()) {
        case 'rent': return 'success';
        case 'sale': return 'danger';
        default: return 'secondary';
    }
};
const getPropertyTypeColor = (category) => {
     switch (category?.toLowerCase()) {
        case 'commercial': return 'warning';
        case 'house': return 'info';
        default: return 'secondary';
    }
};
const getTypeArabic = (type) => type === 'rent' ? 'للإيجار' : (type === 'sale' ? 'للبيع' : type);
const getCategoryArabic = (category) => category === 'commercial' ? 'تجاري' : (category === 'house' ? 'سكني' : category);
const formatPrice = (price) => {
    if (price === null || typeof price === 'undefined') return "السعر غير محدد";
    const num = Number(String(price).replace(/[^0-9.-]+/g,""));
    if (isNaN(num)) return String(price);
    return num.toLocaleString('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 });
};
// ------------------------------------

const SavedProperties = () => {
  const navigate = useNavigate();
  // --- 2. جلب الحالة من Redux ---
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  // افترض أن حالة Redux لديك تحتوي على slice اسمه 'auth' وبه هذه القيم
  // -----------------------------

  // --- State ---
  const [savedPropertiesData, setSavedPropertiesData] = useState([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingStates, setSavingStates] = useState({});
  // ------------

  // Refs لأزرار التنقل المخصصة
  const navigationPrevRef = useRef(null);
  const navigationNextRef = useRef(null);

  // --- جلب IDs المحفوظة (باستخدام token من Redux) ---
  const fetchSavedPropertyIds = useCallback(async () => {
    // الاعتماد على isAuthenticated و token من Redux
    if (!isAuthenticated || !token) {
      setSavedPropertyIds(new Set());
      setSavedPropertiesData([]);
      return;
    }
    setLoading(true);
    setError(null);
    console.log("SavedProperties (Home): Fetching saved properties data...");
    try {
      const response = await api.get(`user/show-saved-property`, {
        headers: { Authorization: `Bearer ${token}` } // استخدام token من Redux
      });
      console.log("SavedProperties (Home): API Response:", response.data);
      let dataToSet = [];
      let idsToSet = new Set();
      if (response.data && response.data.data && Array.isArray(response.data.data.properties)) {
          dataToSet = response.data.data.properties;
          idsToSet = new Set(dataToSet.map(savedItem => savedItem.property?.id).filter(id => id != null));
          console.log("SavedProperties (Home): Extracted saved IDs:", idsToSet);
      } else {
          console.warn("SavedProperties (Home): Could not find 'properties' array.");
      }
      setSavedPropertiesData(dataToSet);
      setSavedPropertyIds(idsToSet);
    } catch (err) {
        console.error('Error fetching saved properties:', err.response?.data || err.message);
        setSavedPropertiesData([]);
        setSavedPropertyIds(new Set());
    } finally {
        setLoading(false);
        console.log("SavedProperties (Home): Fetching finished.");
    }
  }, [isAuthenticated, token]); // الاعتماد على قيم Redux

  useEffect(() => {
    fetchSavedPropertyIds();
  }, [fetchSavedPropertyIds]);
  // ----------------------------------------------------

  // --- إضافة/إزالة من المفضلة (باستخدام token من Redux) ---
  const handleToggleFavorite = async (e, propertyId) => {
    e.stopPropagation();
    // الاعتماد على isAuthenticated و token من Redux
    if (!isAuthenticated || !token || !propertyId) {
      navigate('/login');
      return;
    }

    const isCurrentlySaved = savedPropertyIds.has(propertyId);
    setSavingStates(prev => ({ ...prev, [propertyId]: true }));

    const newIdsSet = new Set(savedPropertyIds);
    if (isCurrentlySaved) newIdsSet.delete(propertyId);
    else newIdsSet.add(propertyId);
    setSavedPropertyIds(newIdsSet);

     if (isCurrentlySaved) {
        setSavedPropertiesData(prevData => prevData.filter(savedItem => savedItem.property?.id !== propertyId));
     } else {
        console.log("Property added to favorites, UI update for data might require re-fetch.");
     }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }; // استخدام token من Redux
      if (isCurrentlySaved) {
        await api.delete(`user/remove-saved-property/${propertyId}`, config);
      } else {
        await api.post(`user/saved-property/${propertyId}`, {}, config);
      }
    } catch (err) {
      console.error('Error toggling favorite status:', err.response?.data || err.message);
      setSavedPropertyIds(prev => {
          const revertedSet = new Set(prev);
          if (isCurrentlySaved) revertedSet.add(propertyId);
          else revertedSet.delete(propertyId);
          return revertedSet;
      });
       await fetchSavedPropertyIds(); // إعادة الجلب عند الخطأ
      alert('حدث خطأ أثناء تحديث حالة المفضلة.');
    } finally {
       setSavingStates(prev => ({ ...prev, [propertyId]: false }));
    }
  };
  // --------------------------------------------------

  // --- النقر على الكارد ---
  const handlePropertyClick = (propertyId) => { navigate(`/property/${propertyId}`); };
  // ----------------------

  // --- 1. العرض للمستخدم غير المسجل (يعتمد على isAuthenticated من Redux) ---
  if (!isAuthenticated) {
    return (
      <motion.section
        className="saved-prompt-section py-5 container "
        dir="rtl"
        style={{ background: '#fcfaf7' }}
        variants={promptVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
         <Container className="py-4">
          <Row className="justify-content-center text-center">
            <Col md={9} lg={7}>
              <Card className="border-0 shadow p-4 p-md-5 saved-prompt-card">
                <Card.Body>
                   <div className="prompt-icon-container mb-4"><i className="bi bi-bookmark-heart-fill"></i></div>
                  <h2 className="mb-3 fw-bold prompt-title">هل وجدت عقارًا لفت انتباهك؟</h2>
                  <p className="text-secondary mb-4 lead prompt-text">لا تضيّعه! سجّل دخولك أو أنشئ حسابًا مجانيًا الآن لحفظ مفضلاتك والوصول إليها من أي جهاز.</p>
                  <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
                    <Link to="/register" className="register-btn btn btn-lg shadow-sm"><i className="bi bi-person-plus-fill me-2"></i> إنشاء حساب</Link>
                    <Link to="/login" className="login-btn btn btn-lg shadow-sm"><i className="bi bi-box-arrow-in-right me-2"></i> تسجيل الدخول</Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </motion.section>
    );
  }
  // -------------------------------------------------------------------

  // --- 2. العرض للمستخدم المسجل ---

  // عرض التحميل
  if (loading) {
     return (
        <div className="text-center py-5" style={{minHeight: '300px'}}>
            <Spinner animation="border" style={{ color: '#d6762e' }} />
             <p className="mt-2 text-muted small">تحميل المحفوظات...</p>
        </div>
     );
  }

   // عرض القسم فقط إذا انتهى التحميل، لا يوجد خطأ، وهناك بيانات
   if (!loading && !error && savedPropertiesData.length > 0) {
      return (
        <motion.section
            className="saved-properties py-5 container"
            dir="rtl"
            style={{ background: '#fcfaf7' }}
            variants={savedContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
        >
          <Container className="py-lg-4 position-relative">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.1}}>
                 <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0">
                        <i className="bi bi-bookmark-star-fill text-primary me-2"></i> محفوظاتك الأخيرة
                    </h2>
                    <Link to="/dashboard/saved" className="btn btn-outline-primary btn-sm" style={{color: '#d6762e', borderColor: '#d6762e'}}>
                        عرض الكل ({savedPropertiesData.length}) <i className="bi bi-arrow-left-short"></i>
                    </Link>
                 </div>
            </motion.div>

            <div className="saved-properties-container">
               {/* --- أزرار التنقل المخصصة --- */}
               {savedPropertiesData.length > 4 && (
                   <div className="swiper-nav-btns saved-nav-home">
                        <button ref={navigationPrevRef} className="custom-swiper-button-prev shadow-sm"><FaChevronRight /></button>
                        <button ref={navigationNextRef} className="custom-swiper-button-next shadow-sm"><FaChevronLeft /></button>
                   </div>
               )}
               {/* ---------------------------- */}

              <Swiper
                 modules={[Navigation]}
                 spaceBetween={20}
                 slidesPerView={1}
                 navigation={{ // ربط الأزرار المخصصة
                    prevEl: navigationPrevRef.current,
                    nextEl: navigationNextRef.current,
                 }}
                 onBeforeInit={(swiper) => {
                     swiper.params.navigation.prevEl = navigationPrevRef.current;
                     swiper.params.navigation.nextEl = navigationNextRef.current;
                     swiper.navigation.update();
                 }}
                 breakpoints={{
                   576: { slidesPerView: 2 },
                   992: { slidesPerView: 3 },
                   1200: { slidesPerView: 4 }
                 }}
                 className="pb-4"
              >
                {savedPropertiesData.map((savedItem) => {
                   if (!savedItem.property) return null;
                   const property = savedItem.property;
                   const propertyId = property.id;

                   return (
                       <SwiperSlide key={savedItem.id} className="h-auto d-flex">
                          <motion.div variants={savedItemVariants} className="h-100 w-100 ">
                            <Card className="property-card h-100 shadow-sm border-0 rounded-4 overflow-hidden d-flex flex-column" onClick={() => handlePropertyClick(propertyId)} style={{ cursor: 'pointer' }} whileHover={{ y: -5 }}>
                                <div className="property-image-wrapper position-relative">
                                    <Card.Img variant="top"
                                        src={
                                            property.images && property.images.length > 0 && property.images[0]?.image
                                            ? `${api.defaults.baseURL}/storage/${property.images[0].image}`
                                            : property.main_image
                                            ? `${api.defaults.baseURL}/storage/${property.main_image}`
                                            : property.image
                                            ? `${api.defaults.baseURL}/storage/${property.image}`
                                            : 'https://via.placeholder.com/400x250?text=No+Image'
                                        }
                                        alt={property.title || 'صورة عقار'} className="property-image" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/400x250?text=No+Image'; }}/>
                                    <div className="property-tags position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
                                        {property.purpose && (<Badge pill bg={getDealTypeColor(property.purpose)} className="px-2 small fw-semibold">{getTypeArabic(property.purpose)}</Badge>)}
                                        {property.type && (<Badge pill bg={getPropertyTypeColor(property.type)} className="px-2 small fw-semibold">{getCategoryArabic(property.type)}</Badge>)}
                                    </div>
                                    <Button
                                        variant="light"
                                        className="position-absolute top-0 start-0 m-2 rounded-circle p-0 d-flex align-items-center justify-content-center shadow"
                                        style={{ zIndex: 10, width: '35px', height: '35px', fontSize: '1rem' }}
                                        onClick={(e) => handleToggleFavorite(e, propertyId)}
                                        disabled={savingStates[propertyId]}
                                        title={savedPropertyIds.has(propertyId) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                                    >
                                      {savingStates[propertyId] ? (<Spinner animation="border" size="sm" variant="secondary" />)
                                        : savedPropertyIds.has(propertyId) ? (<FaHeart style={{ color: '#d6762e' }} />)
                                        : (<FaRegHeart style={{ color: '#6c757d' }}/>)
                                      }
                                    </Button>
                                </div>
                                <Card.Body className="d-flex flex-column p-3 flex-grow-1">
                                    <div className="property-card-price fw-bold fs-5 mb-1">{formatPrice(property.price)}</div>
                                    <h5 className="property-card-title mb-1 text-truncate">
                                        <Link to={`/property/${propertyId}`} onClick={(e) => e.stopPropagation()} className="text-dark text-decoration-none stretched-link">{property.title || "عنوان غير متوفر"}</Link>
                                    </h5>
                                    <p className="property-card-address text-muted small mb-0 mt-auto text-truncate"><i className="bi bi-geo-alt-fill me-1"></i>{property.address || "العنوان غير متوفر"}</p>
                                </Card.Body>
                            </Card>
                          </motion.div>
                        </SwiperSlide>
                   );
                })}
              </Swiper>
            </div>
          </Container>
        </motion.section>
      );
   }

   // عرض رسالة خطأ للمستخدم المسجل
   if (isAuthenticated && !loading && error) {
       return (
           <Container className="my-4 text-center">
                <Alert variant="light" className="d-inline-block border small p-2 text-danger"> <i className="bi bi-exclamation-triangle text-danger me-1"></i> خطأ في تحميل المحفوظات. </Alert>
           </Container>
       );
   }

    // إذا كان مسجلاً وانتهى التحميل ولا يوجد خطأ ولا توجد بيانات
    if (isAuthenticated && !loading && !error && savedPropertiesData.length === 0) {
       return (
           <Container className="my-4 text-center">
                <p className="text-muted small"> <i className="bi bi-info-circle me-1"></i> لا توجد عناصر محفوظة لعرضها هنا. </p>
           </Container>
       );
   }

   // حالة افتراضية أخيرة
   return null;
};

export default SavedProperties;