import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Spinner, Alert, Button, Card, Container, Badge } from 'react-bootstrap';
import 'swiper/css';
import 'swiper/css/navigation';
import './BestChoices.css';
import api from '../API/api';
import { useSelector } from 'react-redux';

// --- Variants للأنيميشن (تبقى كما هي) ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delayChildren: 0.2, staggerChildren: 0.15, when: "beforeChildren" } } };
const itemVariants = { hidden: { y: 40, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 90, damping: 15 } } };
// --------------------------------------

// --- دوال الألوان (معادة) ---
const getDealTypeColor = (type) => {
    switch (type?.toLowerCase()) { 
        case 'rent': return 'rgba(40, 167, 69, 0.9)'; // أخضر للإيجار
        case 'sale': return 'rgba(220, 53, 69, 0.9)'; // أحمر للبيع
        default: return 'rgba(108, 117, 125, 0.9)'; // رمادي
    }
};
const getPropertyTypeColor = (category) => {
    switch (category?.toLowerCase()) {
        case 'commercial': return 'rgba(108, 52, 131, 0.9)'; // بنفسجي للتجاري (أغمق قليلاً)
        case 'house': return 'rgba(23, 162, 184, 0.9)'; // أزرق سماوي للسكني
        default: return 'rgba(108, 117, 125, 0.9)'; // رمادي
    }
};
// -----------------------------
const BestChoices = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savedProperties, setSavedProperties] = useState([]);
    const [pageNumber, setPageNumber] = useState(1); // التعديل: بدء من الصفحة 1

    // ------------------------------------------

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            setError(null);
            try {
                // التعديل 1: استخدام نقطة نهاية خاصة بالعقارات المميزة
                const response = await api.get(`/realestate?page=${pageNumber}`);
                
                // التعديل 2: التحقق من الهيكل الصحيح للبيانات
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    setProperties(response.data.data.data);
                    if(response.data.totalPages) {
                        // يمكنك إضافة ترقيم الصفحات هنا إذا لزم الأمر
                    }
                } else {
                    setProperties([]);
                }
            } catch (err) {
                console.error("Error:", err);
                setError("حدث خطأ أثناء جلب البيانات. الرجاء المحاولة لاحقًا.");
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, [pageNumber]);

    // التعديل 3: دمج العقارات المفضلة من localStorage مع البيانات
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            const saved = JSON.parse(localStorage.getItem(`savedProperties_${user.id}`)) || [];
            setSavedProperties(saved);
            
            // دمج البيانات مع حالة الموافقة
            setProperties(prev => prev.map(p => ({
                ...p,
                isSaved: saved.includes(p.id)
            })));
        }
    }, [isAuthenticated, user]);

    // --- handleAddToFavorites ---
    const handleAddToFavorites = async (e, propertyId) => {
        e.stopPropagation();
        if (!isAuthenticated || !user?.id) {
            alert("الرجاء تسجيل الدخول لحفظ العقارات في المفضلة.");
            navigate('/login');
            return;
        }

        // تحديث المفضلة في الـ localStorage
        const storageKey = `savedProperties_${user.id}`;
        let updated;
        if (savedProperties.includes(propertyId)) {
            updated = savedProperties.filter(id => id !== propertyId);
        } else {
            updated = [...savedProperties, propertyId];
        }
        setSavedProperties(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));

        // إرسال طلب POST لإضافة العقار إلى المفضلة عبر API
        try {
            const response = await api.post(`/user/saved-property/${user.id}`, { propertyId });
            if (response.status === 200) {
                console.log("تم إضافة العقار إلى المفضلة بنجاح!");
            } else {
                console.error("فشل إضافة العقار إلى المفضلة عبر الـ API.");
            }
        } catch (err) {
            console.error("حدث خطأ أثناء إضافة العقار إلى المفضلة:", err);
            alert("حدث خطأ أثناء إضافة العقار إلى المفضلة.");
        }
    };

    // --- handlePropertyClick ---
    const handlePropertyClick = (propertyId) => {
        navigate(`/property/${propertyId}`);
    };

    // دالة لترجمة نوع العقار للعربية
    const getCategoryArabic = (category) => {
        switch (category?.toLowerCase()) {
            case 'commercial': return 'تجاري';
            case 'house': return 'سكني';
            default: return category || 'غير محدد';
        }
    }

    // دالة لترجمة الغرض للعربية
    const getTypeArabic = (type) => {
        switch (type?.toLowerCase()) {
            case 'rent': return 'للإيجار';
            case 'sale': return 'للبيع';
            default: return type || 'غير محدد';
        }
    }

    return (
        <motion.section
            className="best-choices py-5"
            dir="rtl"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
        >
            <div className="container position-relative">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <div className="text-center mb-5">
                        <h2 className="section-title1">أفضل الخيارات</h2>
                        <p className="section-subtitle text-muted">أماكن سكنية شائعة</p>
                    </div>
                </motion.div>

                {/* أزرار التنقل */}
                {!loading && !error && properties.length > 0 && (
                    <div className="swiper-nav-btns">
                        <button className="swiper-button-prev" onClick={() => setPageNumber(pageNumber - 1)}>
                            <FaChevronRight />
                        </button>
                        <button className="swiper-button-next" onClick={() => setPageNumber(pageNumber + 1)}>
                            <FaChevronLeft />
                        </button>
                    </div>
                )}

                {/* عرض حالات التحميل والخطأ */}
                {loading && <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" style={{ color: '#d6762e' }} role="status">
                        <span className="visually-hidden">جاري التحميل...</span>
                    </Spinner>
                    <p className="mt-2 text-muted">جاري تحميل أفضل الخيارات...</p>
                </div>}
                {error && !loading &&  <Alert variant="danger" className="text-center shadow-sm">
                       <i className="bi bi-exclamation-triangle-fill me-2"></i>
                       <strong>خطأ في التحميل:</strong> {error}
                    </Alert>}
                {!loading && !error && properties.length === 0 &&    <Alert variant="secondary" className="text-center shadow-sm">
                       <i className="bi bi-info-circle-fill me-2"></i>
                       لا توجد عقارات مميزة لعرضها في الوقت الحالي.
                    </Alert>}

                {/* عرض Swiper بالبيانات */}
                {!loading && !error && properties.length > 0 && (
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={20}
                        slidesPerView={1}
                        breakpoints={{
                            576: { slidesPerView: 2, spaceBetween: 20 },
                            992: { slidesPerView: 3, spaceBetween: 20 },
                            1200: { slidesPerView: 4, spaceBetween: 20 }
                        }}
                        navigation={{
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev'
                        }}
                        className="pb-4"
                    >
                        {properties.map((property) => (
                            <SwiperSlide key={property.id}>
                               <motion.div variants={itemVariants} className="h-100">
                                    <Card
                                        className="property-card h-100 shadow-sm border-0 overflow-hidden"
                                        onClick={() => handlePropertyClick(property.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="property-image-wrapper">
                                            <Card.Img
                                                variant="top"
                                                src={property.images && property.images.length > 0 ? property.images[0] : 'https://via.placeholder.com/400x250?text=No+Image'}
                                                alt={property.title || 'صورة عقار'}
                                                className="property-image"
                                                loading="lazy"
                                                onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/400x250/cccccc/969696?text=Image+Error'; }}
                                            />
                                            <div className="property-tags">
                                                {property.type && (
                                                    <Badge pill bg="" className="tag-deal" style={{ backgroundColor: getDealTypeColor(property.type) }}>
                                                        {getTypeArabic(property.type)}
                                                    </Badge>
                                                )}
                                                {property.category && (
                                                    <Badge pill bg="" className="tag-category" style={{ backgroundColor: getPropertyTypeColor(property.category) }}>
                                                        {getCategoryArabic(property.category)}
                                                    </Badge>
                                                )}
                                            </div>
                                             <Button
                                                variant={savedProperties.includes(property.id) ? 'danger' : 'light'}
                                                size="sm"
                                                className={`favorite-btn shadow-sm ${savedProperties.includes(property.id) ? 'active' : ''}`}
                                                onClick={(e) => handleAddToFavorites(e, property.id)}
                                                title={savedProperties.includes(property.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                                            >
                                                {savedProperties.includes(property.id) ? <FaHeart /> : <FaRegHeart />}
                                            </Button>
                                        </div>
                                        <Card.Body className="d-flex flex-column p-3">
                                            <div className="property-card-price fw-bold fs-5 mb-1">{property.price ? `${property.price.toLocaleString()} ل.س` : "السعر غير محدد"}</div>
                                            <h5 className="property-card-title mb-1 text-truncate">
                                                {property.title || "عنوان غير متوفر"}
                                            </h5>
                                            <p className="property-card-description text-muted small mb-0 text-truncate">
                                                {property.description || "لا يوجد وصف"}
                                            </p>
                                        </Card.Body>
                                    </Card>
                                </motion.div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )}
            </div>
        </motion.section>
    );
};

export default BestChoices;
