import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Spinner, Button, Container, Row, Col, Card, Badge, Alert } from 'react-bootstrap'; // استيراد Alert
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/navigation';
import './SavedProperties.css'; // تأكد من استيراد ملف CSS
import api from '../API/api';
import { useSelector } from 'react-redux';

// --- Variants للأنيميشن (تبقى كما هي) ---
const promptVariants = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } } };
const savedContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, when: "beforeChildren" } } };
const savedItemVariants = { hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } } };
// ----------------------

// --- دوال الألوان (تبقى كما هي) ---
const getDealTypeColor = (type) => { /* ... */ };
const getPropertyTypeColor = (category) => { /* ... */ };
const getTypeArabic = (type) => { /* ... */ };
const getCategoryArabic = (category) => { /* ... */ };
// -----------------------------------

const SavedProperties = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  

  // --- State لإدارة البيانات والتحميل والخطأ ---
  const [savedPropertiesData, setSavedPropertiesData] = useState([]); // لتخزين بيانات العقارات المحفوظة
  const [savedPropertyIds, setSavedPropertyIds] = useState([]);     // لتخزين IDs المحفوظة (لتحديث زر القلب بسرعة)
  const [loading, setLoading] = useState(false); // لا نبدأ التحميل إلا إذا كان المستخدم مسجلًا
  const [error, setError] = useState(null);
  // ------------------------------------------

  // --- useEffect لجلب العقارات المحفوظة من API ---
  useEffect(() => {
    // لا تقم بالجلب إلا إذا كان المستخدم مسجلاً ولديه ID
    if (!isAuthenticated || !user?.id) {
      setSavedPropertiesData([]); // أفرغ البيانات إذا لم يكن مسجلاً
      setLoading(false);
      return;
    }

    const fetchSavedProperties = async () => {
       setLoading(true);
       setError(null);
       try {
           // !!! ====> استبدل هذا بالمسار الصحيح لـ API جلب المحفوظات <==== !!!
           // يفترض أن المسار يتضمن ID المستخدم
           // !!! ======================================================= !!!

           // افترض أن axios مهيأ لإرسال التوكن من AuthContext
           const response = await api.get(`/user/show-saved-property/${user.id}`
           , {
            headers: {
              Authorization: `Bearer ${user.token}` // إذا كنت تستخدم توكن مصادقة.
            }});

           // التحقق من صحة الاستجابة
           if (response.data && Array.isArray(response.data)) {
                // افتراض أن الـ API يرجع مصفوفة بكائنات العقارات المحفوظة مباشرة
                setSavedPropertiesData(response.data);
                // تحديث قائمة IDs المحلية للتأكد من تطابقها مع الخادم
                const serverSavedIds = response.data.map(p => p.id);
                setSavedPropertyIds(serverSavedIds);
                // (اختياري) تحديث localStorage ليكون متزامنًا مع الخادم
                localStorage.setItem(`savedProperties_${user.id}`, JSON.stringify(serverSavedIds));
            } else {
                console.warn("Saved properties API response is not a valid array:", response.data);
                setSavedPropertiesData([]);
                setSavedPropertyIds([]);
                // setError("فشل تحميل المحفوظات: تنسيق غير متوقع.");
            }

       } catch (error) {
         console.error('Error fetching saved properties:', error);
         // عرض خطأ أكثر تحديدًا للمستخدم
         setError(`فشل تحميل العقارات المحفوظة. (${error.response?.data?.message || error.message})`);
         setSavedPropertiesData([]);
         setSavedPropertyIds([]);
       } finally {
         setLoading(false);
       }
     };

    fetchSavedProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // إعادة الجلب عند تغير المستخدم أو حالة المصادقة
  // --------------------------------------------------------------------

  // --- handleRemoveFromSaved (يجب إضافة API call هنا) ---
  const handleRemoveFromSaved = async (propertyIdToRemove) => { // جعلها async
    if (!isAuthenticated || !user?.id) return; // تأكيد إضافي

    const originalSavedIds = [...savedPropertyIds]; // حفظ الحالة الأصلية للتراجع عند الخطأ

    // 1. تحديث الواجهة فورًا لتجربة مستخدم أفضل
    const updatedIds = savedPropertyIds.filter(id => id !== propertyIdToRemove);
    setSavedPropertyIds(updatedIds);
    // (اختياري) تحديث البيانات المعروضة فورًا أيضًا
    setSavedPropertiesData(prevData => prevData.filter(p => p.id !== propertyIdToRemove));
    localStorage.setItem(`savedProperties_${user.id}`, JSON.stringify(updatedIds));

    // 2. إرسال طلب للـ API لحذفها من الخادم
    try {
        // !!! ====> استبدل هذا بالمسار الصحيح لـ API حذف المفضلة <==== !!!
        // قد يكون DELETE /api/user/favorites/{propertyId}
        // أو POST /api/user/favorites/remove { propertyId }
        await api.delete(`/user/deleteProperty/${propertyId}`); // افتراض استخدام DELETE
        // !!! ======================================================= !!!
        console.log(`Property ${propertyId} removed from favorites on server.`);
        // لا حاجة لتحديث الحالة هنا لأنها حدثت بالفعل

    } catch (error) {
        console.error("Error removing property from favorites:", error);
        // 3. في حالة فشل الـ API، قم بالتراجع عن التغيير في الواجهة
        alert("حدث خطأ أثناء إزالة العقار من المفضلة. حاول مرة أخرى.");
        setSavedPropertyIds(originalSavedIds); // استعادة IDs الأصلية
        localStorage.setItem(`savedProperties_${user.id}`, JSON.stringify(originalSavedIds));
        // (اختياري) إعادة جلب البيانات من الخادم لضمان التزامن
        // fetchSavedProperties(); // أو إعادة جلب البيانات التي كانت معروضة
        setSavedPropertiesData(prevData => {
             // إعادة إضافة العنصر المحذوف (يتطلب البحث في allProperties أو إعادة الجلب)
             // هذا الجزء قد يكون معقدًا، إعادة الجلب قد تكون أسهل
             return prevData; // حاليًا لا نعيد العنصر للبيانات المعروضة عند الفشل
        });
    }
};

  // --- handlePropertyClick (تبقى كما هي) ---
  const handlePropertyClick = (propertyId) => { navigate(`/property/${propertyId}`); };
  // -----------------------------------

  // --- العرض للمستخدم غير المسجل (يبقى كما هو مع الأنيميشن) ---
  if (!isAuthenticated) {
    return (
      <motion.section /* ... قسم الدعوة ... */ >
        {/* ... محتوى قسم الدعوة ... */}
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
  // -----------------------------------------------------

  // --- العرض للمستخدم المسجل ---

  // عرض التحميل إذا كان المستخدم مسجلاً ونحن نجلب البيانات
  if (loading && isAuthenticated) {
     return <div className="text-center py-5"><Spinner animation="border" style={{ color: '#d6762e' }} /></div>;
  }

   // عرض القسم فقط إذا كان المستخدم مسجلًا، وانتهى التحميل، ولا يوجد خطأ
   if (isAuthenticated && !loading && !error) {
        // عرض رسالة إذا لا توجد عقارات محفوظة
        if (savedPropertiesData.length === 0) {
            return (
                 <Container className="text-center py-5 my-4">
                    <i className="bi bi-bookmarks fs-1 text-muted mb-3 d-block"></i>
                    <p className="lead text-muted">لا توجد عقارات محفوظة في قائمتك بعد.</p>
                    <Button variant="outline-primary" onClick={() => navigate('/properties')} style={{ color: '#d6762e', borderColor: '#d6762e' }}>
                        <i className="bi bi-search me-2"></i> تصفح العقارات الآن
                    </Button>
                 </Container>
            );
        }

      // عرض السلايدر إذا وجدت عقارات محفوظة
      return (
        <motion.section
            className="saved-properties py-5"
            dir="rtl"
            style={{ background: '#fcfaf7' }}
            variants={savedContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
        >
          <Container className="py-lg-4">
             <motion.h2 className="mb-5 text-center fw-bold section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} >
                <i className="bi bi-bookmark-star-fill text-primary me-2"></i> محفوظاتك
            </motion.h2>

            <div className="saved-properties-container position-relative">
              <Swiper
                 modules={[Navigation]}
                 spaceBetween={20} // إعادة للمسافة الأصلية
                 slidesPerView={1}
                 navigation // استخدام الأزرار الافتراضية
                 breakpoints={{
                   576: { slidesPerView: 2 },
                   992: { slidesPerView: 3 },
                   1200: { slidesPerView: 4 }
                 }}
                 className="pb-4"
              >
                {savedPropertiesData.map((property) => ( // استخدام savedPropertiesData هنا
                   <SwiperSlide key={property.id} className="h-auto">
                      <motion.div variants={savedItemVariants} className="h-100">
                        <Card className="property-card h-100 shadow-sm border-0 overflow-hidden" onClick={() => handlePropertyClick(property.id)} style={{ cursor: 'pointer' }}>
                            <div className="property-image-wrapper">
                                <Card.Img variant="top" src={property.images && property.images.length > 0 ? property.images[0] : 'https://via.placeholder.com/400x250?text=No+Image'} alt={property.title || 'صورة عقار'} className="property-image" loading="lazy" onError={(e) => { /*...*/ }}/>
                                <div className="property-tags">
                                    {property.type && (<Badge pill bg="" className="tag-deal" style={{ backgroundColor: getDealTypeColor(property.type) }}>{getTypeArabic(property.type)}</Badge>)}
                                    {property.category && (<Badge pill bg="" className="tag-category" style={{ backgroundColor: getPropertyTypeColor(property.category) }}>{getCategoryArabic(property.category)}</Badge>)}
                                </div>
                                <Button variant={'danger'} size="sm" className={`favorite-btn shadow-sm active`} onClick={(e) => handleRemoveFromSaved(property.id)} title="إزالة من المفضلة">
                                    <FaHeart /> {/* دائمًا قلب ممتلئ لأنها محفوظة */}
                                </Button>
                            </div>
                            <Card.Body className="d-flex flex-column p-3">
                                <div className="property-card-price fw-bold fs-5 mb-1">{property.price || "السعر غير محدد"}</div>
                                <h5 className="property-card-title mb-1 text-truncate">{property.title || "عنوان غير متوفر"}</h5>
                                {/* يمكن عرض الوصف هنا إذا كان قصيرًا */}
                                {/* <p className="property-card-description text-muted small mb-0 text-truncate">{property.description || "لا يوجد وصف"}</p> */}
                                {/* أو العنوان */}
                                <p className="property-card-address text-muted small mb-0 text-truncate"><i className="bi bi-geo-alt-fill me-1"></i>{property.address || "العنوان غير متوفر"}</p>
                            </Card.Body>
                        </Card>
                      </motion.div>
                    </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </Container>
        </motion.section>
      );
   }

   // عرض الخطأ إذا كان المستخدم مسجلاً وانتهى التحميل ووجد خطأ
   if (isAuthenticated && !loading && error) {
       return (
           <Container className="my-5">
                <Alert variant="danger" className="text-center"> <i className="bi bi-exclamation-triangle-fill me-2"></i> {error} </Alert>
           </Container>
       );
   }

   // حالة افتراضية (لا يُفترض الوصول لها كثيرًا)
   return null;
};

export default SavedProperties;