import React, { useState, useEffect, useCallback, useRef } from 'react'; // استيراد useRef
import { useNavigate, Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // استيراد FaArrowLeft
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Spinner, Button, Container, Alert, Card, Badge, Row, Col } from 'react-bootstrap'; // استيراد Row, Col
import { motion } from 'framer-motion'; // استيراد motion
import 'swiper/css';
import 'swiper/css/navigation';
import './SavedProperties.css'; // تأكد من وجود ملف CSS المناسب
import api from '../../../API/api'; // تأكد من المسار الصحيح لـ API
import { useSelector } from 'react-redux';

// --- Variants للأنيميشن ---
const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
};
const gridItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};
// ----------------------

// --- دوال المساعدة (الألوان، الترجمة، التنسيق) ---
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
const getCategoryArabic = (category) => category === 'commercial' ? 'تجاري' : (category === 'house' ? 'شقة' : category);
const formatPrice = (price) => {
    if (price === null || typeof price === 'undefined') return "السعر غير محدد";
    const num = Number(String(price).replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return String(price);
    return num.toLocaleString('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 });
};
// -----------------------------------------------

const SavedPropertiesPage = () => {
    const [savedPropertiesData, setSavedPropertiesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingStates, setSavingStates] = useState({}); // لتتبع حالة الحفظ/الحذف لكل بطاقة
    const navigate = useNavigate();
    const { isAuthenticated, user, token } = useSelector((state) => state.auth);

    // Refs لأزرار التنقل (إذا استخدمت Swiper)
    const navigationPrevRef = useRef(null);
    const navigationNextRef = useRef(null);

    // جلب البيانات
    const fetchSavedProperties = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setSavedPropertiesData([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`user/show-saved-property`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let dataToSet = [];
            if (response.data && response.data.data && Array.isArray(response.data.data.properties)) {
                dataToSet = response.data.data.properties;
            }
            setSavedPropertiesData(dataToSet);
        } catch (err) {
            console.error('Error fetching saved properties:', err.response?.data || err.message);
            setError(`فشل تحميل العقارات المحفوظة. حاول مرة أخرى لاحقاً.`);
            setSavedPropertiesData([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        fetchSavedProperties();
    }, [fetchSavedProperties]);

    // إزالة من المفضلة
    const handleRemoveFromSaved = async (propertyIdToRemove) => {
        if (!isAuthenticated || !token || !propertyIdToRemove) return;
        if (!window.confirm("هل أنت متأكد من رغبتك في إزالة هذا العقار من المفضلة؟")) return;

        setSavingStates(prev => ({ ...prev, [propertyIdToRemove]: true })); // إظهار التحميل
        const originalSavedData = [...savedPropertiesData];
        // تحديث الواجهة فوراً لتجربة أفضل
        setSavedPropertiesData(prev => prev.filter(savedItem => savedItem.property?.id !== propertyIdToRemove));

        try {
            await api.delete(`/user/remove-saved-property/${propertyIdToRemove}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // تم الحذف بنجاح من الـ backend
        } catch (error) {
            console.error('Error removing property from saved:', error.response?.data || error.message);
            alert("حدث خطأ أثناء إزالة العقار من المفضلة. سيتم استعادة القائمة.");
            // إعادة القائمة الأصلية عند الخطأ
            setSavedPropertiesData(originalSavedData);
        } finally {
            setSavingStates(prev => ({ ...prev, [propertyIdToRemove]: false })); // إخفاء التحميل
        }
    };

    // الانتقال لصفحة تفاصيل العقار
    const handlePropertyClick = (propertyId) => { navigate(`/properties/${propertyId}`); };

    // --- عرض حالة عدم تسجيل الدخول ---
    if (!isAuthenticated) {
        return (
            <Container className="text-center py-5 my-5">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                    <Alert variant="warning" className="p-4 shadow-sm rounded-3">
                        <i className="bi bi-exclamation-triangle display-4 text-warning mb-3 d-block"></i>
                        <h3 className="mb-3">يرجى تسجيل الدخول</h3>
                        <p className="text-muted mb-4">يجب عليك تسجيل الدخول أولاً لعرض قائمة العقارات المحفوظة.</p>
                        <Button variant="primary" onClick={() => navigate('/login')} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
                            <i className="bi bi-box-arrow-in-right me-2"></i> تسجيل الدخول
                        </Button>
                    </Alert>
                </motion.div>
            </Container>
        );
    }
    // --------------------------------

    // --- عرض حالة التحميل ---
    if (loading) {
        return (
            <div className="text-center py-5 my-5" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Spinner animation="border" style={{ color: '#d6762e', width: '3rem', height: '3rem' }} role="status" />
                <p className="mt-3 text-muted fs-5">جاري تحميل محفوظاتك...</p>
            </div>
        );
    }
    // --------------------------

    // --- عرض حالة الخطأ ---
    if (error) {
        return (
            <Container className="my-5">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <Alert variant="danger" className="text-center p-4 shadow-sm rounded-3">
                        <i className="bi bi-exclamation-circle-fill display-4 text-danger mb-3 d-block"></i>
                        <h4 className="mb-3">حدث خطأ!</h4>
                        <p className="text-muted">{error}</p>
                        <Button variant="outline-secondary" size="sm" onClick={fetchSavedProperties}>
                            <i className="bi bi-arrow-clockwise me-1"></i> إعادة المحاولة
                        </Button>
                    </Alert>
                </motion.div>
            </Container>
        );
    }
    // -----------------------

    // --- العرض الرئيسي للصفحة ---
    return (
        <motion.section
            className="saved-properties-page py-5 bg-light" // تعديل اسم الكلاس ليكون أوضح
            dir="rtl"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >
            {/* تم إزالة container من الـ section */}
            <Container>
                {/* --- ترويسة الصفحة --- */}
                <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                    <Button variant="light" onClick={() => navigate(-1)} className="me-3 border shadow-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                        <FaArrowLeft />
                    </Button>
                    <h1 className="mb-0 h2 fw-bold">العقارات المحفوظة ({savedPropertiesData.length})</h1>
                </div>
                {/* -------------------- */}

                {/* --- حالة عدم وجود عقارات محفوظة --- */}
                {!loading && savedPropertiesData.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <Alert variant="info" className="text-center p-5 shadow-sm rounded-3">
                            <i className="bi bi-bookmarks-fill fs-1 d-block mb-3 text-info"></i> {/* تغيير الأيقونة واللون */}
                            <h4 className="mb-3">قائمة المفضلة فارغة</h4>
                            <p className="text-muted mb-4">لم تقم بإضافة أي عقارات إلى قائمتك المفضلة بعد.</p>
                            <Button variant="primary" onClick={() => navigate('/properties')} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
                                <i className="bi bi-search me-2"></i> تصفح العقارات الآن
                            </Button>
                        </Alert>
                    </motion.div>
                )}
                {/* ---------------------------------- */}

                {/* --- عرض العقارات المحفوظة (استخدام Row/Col بدلاً من Swiper) --- */}
                {!loading && savedPropertiesData.length > 0 && (
                    <Row xs={1} md={2} lg={3} xl={4} className="g-4"> {/* استخدام Grid */}
                        {savedPropertiesData.map((savedItem, index) => {
                            if (!savedItem.property) return null;
                            const property = savedItem.property;
                            const propertyIdForActions = property.id;

                            return (
                                <Col key={savedItem.id || index} className="d-flex"> {/* استخدام Col و d-flex */}
                                    {/* تطبيق motion على كل Col */}
                                    <motion.div
                                        className="w-100"
                                        variants={gridItemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        transition={{ delay: index * 0.08 }} // تأثير تتالي بسيط
                                    >
                                        {/* --- كود البطاقة الموحد (نفس تصميم الكود الأول) --- */}
                                        <Card className="property-card h-100 shadow-sm border-0 rounded-4 overflow-hidden d-flex flex-column"
                                            onClick={() => handlePropertyClick(propertyIdForActions)}
                                            style={{ cursor: 'pointer' }}
                                            whileHover={{ y: -5 }}> {/* إضافة تأثير رفع بسيط عند المرور */}

                                            <div className="property-image-wrapper position-relative">
                                                <Card.Img variant="top"
                                                    src={
                                                        // 1. تحقق أن property.images موجود وهو مصفوفة وغير فارغ.
                                                        // 2. تحقق أن العنصر الأول property.images[0] موجود.
                                                        // 3. تحقق أن property.images[0] لديه خاصية 'filename' (التي تحمل الرابط الكامل).
                                                        // 4. تحقق أن قيمة 'filename' هي سلسلة نصية (رابط URL صالح).
                                                        (
                                                            property.images &&
                                                            Array.isArray(property.images) &&
                                                            property.images.length > 0 &&
                                                            property.images[0] && // تأكد أن الكائن الأول موجود
                                                            typeof property.images[0].url === 'string' && // تأكد أن filename هو سلسلة نصية
                                                            (property.images[0].url.startsWith('http://') || property.images[0].url.startsWith('https://')) // تأكد أنه رابط
                                                        )
                                                            ? property.images[0].url // <--- استخدم الرابط الكامل مباشرة من 'filename'
                                                            : 'https://via.placeholder.com/400x250?text=NoSavedItemImg' // صورة افتراضية مميزة (غيرت النص قليلاً)
                                                    }
                                                    alt={property.title || 'صورة عقار'}
                                                    className="property-image" // تأكد أن لديك CSS لهذه الكلاسات
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        console.error(`SavedPropertiesPage: Error loading image for property ID ${propertyIdForActions}. Attempted src: ${e.target.src}`, e);
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://via.placeholder.com/400x250?text=SavedItemImgError'; // صورة خطأ مميزة
                                                    }}
                                                    style={{ height: '200px', objectFit: 'cover' }} // أسلوب بسيط لضمان حجم الصورة (اختياري)
                                                />
                                                {/* العلامات (Tags) */}
                                                <div className="property-tags position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
                                                    {property.purpose && (<Badge pill bg={getDealTypeColor(property.purpose)} className="px-2 py-1 small fw-semibold shadow-sm">{getTypeArabic(property.purpose)}</Badge>)}
                                                    {property.type && (<Badge pill bg={getPropertyTypeColor(property.type)} className="px-2 py-1 small fw-semibold shadow-sm">{getCategoryArabic(property.type)}</Badge>)}
                                                </div>
                                                {/* زر الحذف */}
                                                <Button
                                                    variant="light" // نفس اللون الفاتح
                                                    className="position-absolute top-0 start-0 m-2 rounded-circle p-0 d-flex align-items-center justify-content-center shadow btn-remove-favorite" // استخدام نفس الفئة
                                                    style={{ zIndex: 10, width: '35px', height: '35px', fontSize: '1rem' }}
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveFromSaved(propertyIdForActions); }}
                                                    disabled={savingStates[propertyIdForActions]} // استخدام savingStates
                                                    title="إزالة من المفضلة"
                                                >
                                                    {/* عرض Spinner أثناء الحذف */}
                                                    {savingStates[propertyIdForActions] ? (
                                                        <Spinner animation="border" size="sm" variant="secondary" />
                                                    ) : (
                                                        <FaHeart style={{ color: '#dc3545' }} /> // أيقونة قلب أحمر للإشارة للحذف
                                                    )}
                                                </Button>
                                            </div>
                                            <Card.Body className="d-flex flex-column p-3 flex-grow-1">
                                                <div className="property-card-price fw-bold fs-5 mb-1" style={{ color: '#d6762e' }}> {/* لون السعر */}
                                                    {formatPrice(property.price)}
                                                </div>
                                                <h5 className="property-card-title mb-2 text-truncate">
                                                    <Link
                                                        to={`/property/${propertyIdForActions}`}
                                                        onClick={(e) => e.stopPropagation()} // منع النقر على الكارد
                                                        className="text-dark text-decoration-none stretched-link"
                                                    >
                                                        {property.title || 'عنوان غير متوفر'}
                                                    </Link>
                                                </h5>
                                                <p className="property-card-address text-muted small mb-0 mt-auto text-truncate">
                                                    <i className="bi bi-geo-alt-fill me-1"></i>
                                                    {property.address || 'العنوان غير محدد'}
                                                </p>
                                            </Card.Body>
                                        </Card>
                                        {/* --------------------------------------------------- */}
                                    </motion.div>
                                </Col>
                            );
                        })}
                    </Row>
                )}
                {/* --------------------------------------------------------- */}
            </Container>
        </motion.section>
    );
};

export default SavedPropertiesPage;