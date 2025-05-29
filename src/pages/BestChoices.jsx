import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Spinner, Alert, Button, Card, Badge } from 'react-bootstrap';
import 'swiper/css';
import 'swiper/css/navigation';
import './BestChoices.css'; // تأكد أن هذا الملف CSS موجود ويحتوي على الأنماط
import api from '../API/api'; // تأكد من صحة هذا المسار
import { useSelector } from 'react-redux';

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.2,
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

const formatPrice = (price) => {
  if (price == null || isNaN(Number(price))) {
    return 'السعر عند الطلب';
  }
  return `${Number(price).toLocaleString('en-US')} ل.س`;
};

// --- Helper Functions ---
const getDealTypeColor = (type) => type === 'sale' ? 'danger' : type === 'rent' ? 'success' : 'primary';
const getPropertyTypeColor = (type) => type === 'house' ? 'info' : type === 'commercial' ? 'warning' : 'secondary';
const getCategoryArabic = (type) => {
  // تأكد أن هذه القيم تطابق القيم الفعلية التي تأتي من الـ API للحقل 'type'
  if (type === 'house' || type === 'apartment' || type === 'villa' || type === 'residential') return 'سكني';
  if (type === 'commercial') return 'تجاري';
  if (type === 'land') return 'أرض';
  return 'غير محدد'; // أو type إذا أردت عرض القيمة كما هي
};
const getTypeArabic = (purpose) => purpose === 'sale' ? 'للبيع' : purpose === 'rent' ? 'للإيجار' : 'غير محدد';

const BestChoices = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const propertyStatusCounter = useSelector((state) => state.auth.statusChangeCounter);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedProperties, setSavedProperties] = useState(new Set());
  const [savingStates, setSavingStates] = useState({});

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const fetchSavedIds = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await api.get(`user/show-saved-property`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ids = new Set(
        res.data?.data?.properties?.map(p => p.property?.id).filter(Boolean) ?? []
      );
      setSavedProperties(ids);
    } catch (err) {
      console.error('BestChoices: Failed to fetch saved properties:', err);
    }
  }, [isAuthenticated, token]);

  const fetchBestChoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let allProperties = [];
      let currentPage = 1;
      let lastPage = 1;
      do {
        const res = await api.get(`/realestate?page=${currentPage}`);
        const responseData = res.data?.data?.properties || res.data?.data || res.data;
        const pageData = Array.isArray(responseData?.data) ? responseData.data : (Array.isArray(responseData) ? responseData : []);
        allProperties = [...allProperties, ...pageData];
        currentPage++;
        lastPage = responseData?.last_page || 1;
      } while (currentPage <= lastPage);

      if (allProperties.length > 0) {
        console.log("BestChoices - Data structure of the first property (check for 'is_featured'):", JSON.stringify(allProperties[0], null, 2));
      } else {
        console.log("BestChoices - No properties fetched to check data structure.");
      }

      setProperties(allProperties);
    } catch (err) {
      console.error('BestChoices: Failed to fetch properties:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل العقارات');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBestChoices();
  }, [fetchBestChoices]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds, propertyStatusCounter]);

  const handleToggleFavorite = async (e, id) => {
    e.stopPropagation();
    if (!isAuthenticated || !token) { navigate('/login'); return; }
    if (!id || savingStates[id]) return;

    const isSaved = savedProperties.has(id);
    setSavingStates(prev => ({ ...prev, [id]: true }));
    setSavedProperties(prev => {
      const updated = new Set(prev);
      isSaved ? updated.delete(id) : updated.add(id);
      return updated;
    });

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      isSaved
        ? await api.delete(`/user/remove-saved-property/${id}`, config)
        : await api.post(`/user/saved-property/${id}`, {}, config);
    } catch (error) {
      console.error('BestChoices: Favorite toggle failed:', error);
      setSavedProperties(prev => {
        const reverted = new Set(prev);
        isSaved ? reverted.add(id) : reverted.delete(id);
        return reverted;
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  const handlePropertyClick = (id) => navigate(`/properties/${id}`);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
      className="best-choices py-5 container"
      dir="rtl"
    >
      <div className="container position-relative">
        <div className="text-center mb-5">
          <h2 className="section-title bestch">أفضل الخيارات</h2>
          <p className="text-muted">عقارات مميزة تحظى بالاهتمام</p>
        </div>

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted mb-0">جاري التحميل...</p>
          </div>
        )}
        {error && !loading && (
          <Alert variant="warning" className="text-center">{error}</Alert>
        )}
        {!loading && !error && properties.length === 0 && (
          <Alert variant="info" className="text-center">
            لا توجد عقارات مميزة لعرضها حالياً.
          </Alert>
        )}

        {!loading && !error && properties.length > 0 && (
          <>
            <motion.div dir='ltr' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="d-flex justify-content-start mb-3">
              <Button className="login-btn btn btn-lg shadow-sm" variant="outline-primary" onClick={() => navigate('/properties')}>
                عرض كل العقارات <i className="bi bi-arrow-left-short"></i>
              </Button>
            </motion.div>
            <button ref={nextRef} className="custom-swiper-button custom-swiper-button-prev" aria-label="Previous Property">
              <FaChevronLeft />
            </button>
            <button ref={prevRef} className="custom-swiper-button custom-swiper-button-next" aria-label="Next Property">
              <FaChevronRight />
            </button>

            <Swiper
              dir="rtl"
              modules={[Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                576: { slidesPerView: 2, spaceBetween: 15 },
                992: { slidesPerView: 3, spaceBetween: 20 },
                1200: { slidesPerView: 4, spaceBetween: 20 },
              }}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              className="pb-4"
            >
              {properties.map((property) => {
                const isPropertyTrulyFeatured = property.is_featured === 1 || String(property.is_featured) === "1";
                const isFromVerifiedAgent = property.is_featured === 1 || String(property.is_featured) === "1";

                return (
                  <SwiperSlide key={property.id} className="h-auto">
                    <Card
                      className={`property-card ${isPropertyTrulyFeatured ? 'truly-featured-property-card' : ''}`}
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      <div className="position-relative">
                        {isPropertyTrulyFeatured && (
                          <div className="top-featured-badge">
                            <i class="bi bi-bookmark-check-fill"></i>
                          </div>
                        )}

                        <Card.Img
                          variant="top"
                          src={
                            (
                              property.images &&
                              Array.isArray(property.images) &&
                              property.images.length > 0 &&
                              property.images[0] &&
                              typeof property.images[0].url === 'string' &&
                              (property.images[0].url.startsWith('http://') || property.images[0].url.startsWith('https://'))
                            )
                              ? property.images[0].url
                              : 'https://via.placeholder.com/400x250?text=NoImageAvailable'
                          }
                          alt={property.title || 'صورة عقار'}
                          className="property-image"
                          loading="lazy"
                          onError={(e) => {
                            console.error(`BestChoices: Error loading image for property ID ${property.id}. Attempted src: ${e.target.src}`, e);
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x250?text=ImageLoadError';
                          }}
                          style={{ height: '200px', objectFit: 'cover' }}
                        />

                        <div className="property-tags position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
                          {property.purpose && (
                            <Badge bg={getDealTypeColor(property.purpose)} className="rounded-pill px-2 py-1 text-white">
                              {getTypeArabic(property.purpose)}
                            </Badge>
                          )}
                          {property.type && ( // تأكد أن property.type يُرجع قيمة مثل 'house', 'commercial'
                            <Badge bg={getPropertyTypeColor(property.type)} className="rounded-pill px-2 py-1 text-white">
                              {getCategoryArabic(property.type)}
                            </Badge>
                          )}
                        </div>

                        {isAuthenticated && (
                          <Button
                            variant="light"
                            className="fav-button position-absolute top-0 start-0 m-2 rounded-circle p-1 d-flex align-items-center justify-content-center"
                            style={{ width: '35px', height: '35px' }}
                            onClick={(e) => handleToggleFavorite(e, property.id)}
                            disabled={savingStates[property.id]}
                            aria-label={savedProperties.has(property.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                          >
                            {savingStates[property.id] ? (
                              <Spinner animation="border" size="sm" />
                            ) : savedProperties.has(property.id) ? (
                              <FaHeart className="text-danger" />
                            ) : (
                              <FaRegHeart className="text-secondary" />
                            )}
                          </Button>
                        )}
                      </div>

                      <Card.Body>
                        {/* ---!!! إضافة شارة "وكيل معتمد" هنا !!!--- */}

                        {/* ---!!! نهاية شارة "وكيل معتمد" !!!--- */}
                        <div className="fw-bold fs-5 mb-1" style={{ color: '#d6762e' }}>
                          {formatPrice(property.price)}
                          {property.purpose === 'rent' && <span className="rent-period text-muted small"> / شهري</span>}
                        </div>

                        <h5 className="card-title">
                          {property.title || 'عنوان غير متوفر'}
                        </h5>

                        <p className="card-text small text-muted mt-auto">
                          <i className="bi bi-geo-alt-fill me-1 IAD"></i>
                          {property.address || 'العنوان غير محدد'}                                  {isFromVerifiedAgent && (
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
                            {property.area > 0 && (
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-aspect-ratio"></i>
                                <span>{property.area} م²</span>
                              </div>
                            )}
                            {property.bedrooms > 0 && (
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-door-closed-fill"></i>
                                <span>{property.bedrooms}</span>
                              </div>
                            )}
                            {property.bathrooms > 0 && (
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-droplet-half"></i>
                                <span>{property.bathrooms}</span>
                              </div>
                            )}
                            {(property.livingRooms > 0 || property.livingrooms > 0) && (
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-display"></i>
                                <span>{property.livingRooms || property.livingrooms}</span>
                              </div>
                            )}
                            {property.balconies > 0 && (
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-border-width"></i>
                                <span>{property.balconies}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Card>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </>
        )}
      </div>
    </motion.section>
  );
};

export default BestChoices;