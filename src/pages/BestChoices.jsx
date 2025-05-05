import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Link removed as Card is clickable
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Spinner, Alert, Button, Card, Badge } from 'react-bootstrap';
import 'swiper/css';
import 'swiper/css/navigation';
import './BestChoices.css'; // Import the CLEANED CSS file
import api from '../API/api';
import { useSelector } from 'react-redux';

// --- Animation Variants (Assume defined correctly) ---
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
// const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }; // Uncomment if using motion.div per item
const formatPrice = (price) => {
  // Simplified price display - assumes price is a number or null/undefined
  if (price == null || isNaN(Number(price))) {
     return 'السعر عند الطلب';
  }
  // Using basic toLocaleString for number formatting with Syrian Pounds symbol
  return `${Number(price).toLocaleString('en-US')} ل.س`;
};
// --- Helper Functions ---
const getDealTypeColor = (type) => type === 'sale' ? 'danger' : type === 'rent' ? 'success' : 'primary';
const getPropertyTypeColor = (type) => type === 'house' ? 'info' : type === 'commercial' ? 'warning' : 'secondary';
const getCategoryArabic = (type) => type === 'house' ? 'شقة' : type === 'commercial' ? 'محل' : 'نوع غير معروف';
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

  // --- Data Fetching Callbacks ---
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
      console.error('Failed to fetch saved properties:', err);
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
        const pageData = Array.isArray(responseData?.data) ? responseData.data : [];
        allProperties = [...allProperties, ...pageData];
        currentPage++;
        lastPage = responseData?.last_page || 1;
      } while (currentPage <= lastPage);
      setProperties(allProperties);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError(err.message || 'حدث خطأ أثناء تحميل العقارات');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- useEffect Hooks ---
  useEffect(() => {
    fetchBestChoices();
  }, [fetchBestChoices]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds, propertyStatusCounter]);

  // --- Event Handlers ---
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
      console.error('Favorite toggle failed:', error);
      setSavedProperties(prev => { // Revert UI
        const reverted = new Set(prev);
        isSaved ? reverted.add(id) : reverted.delete(id);
        return reverted;
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  const handlePropertyClick = (id) => navigate(`/properties/${id}`);

  // --- Render Logic ---
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
      className="best-choices py-5"
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
            {/* Custom Navigation Buttons */}
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
              navigation={{ // Link refs
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper) => { // Ensure refs assigned
                 swiper.params.navigation.prevEl = prevRef.current;
                 swiper.params.navigation.nextEl = nextRef.current;
              }}
              className="pb-4"
            >
              {properties.map((property) => (
                <SwiperSlide key={property.id} className="h-auto"> {/* Ensure slide adapts height */}
                  {/* Removed motion.div for simplicity, add back with itemVariants if needed */}
                  <Card
                    className="property-card" // Main styling class
                    onClick={() => handlePropertyClick(property.id)}
                  >
                    <div className="position-relative">
                      <Card.Img
                        variant="top" // Bootstrap class
                        className="card-img-top" // Explicit class for CSS targeting
                        src={
                          property.images?.[0]?.image
                            ? `${api.defaults.baseURL}/storage/${property.images[0].image}`
                            : 'https://via.placeholder.com/300x200?text=No+Image'
                        }
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x200?text=Error';
                        }}
                        alt={property.title || 'صورة عقار'}
                      />
                      <div className="property-tags position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
                        {property.purpose && (
                          <Badge bg={getDealTypeColor(property.purpose)} className="rounded-pill px-2 py-1 text-white">
                            {getTypeArabic(property.purpose)}
                          </Badge>
                        )}
                        {property.type && (
                          <Badge bg={getPropertyTypeColor(property.type)} className="rounded-pill px-2 py-1 text-white">
                            {getCategoryArabic(property.type)}
                          </Badge>
                        )}
                      </div>
                       {isAuthenticated && (
                         <Button
                           variant="light"
                           className="fav-button position-absolute top-0 start-0 m-2 rounded-circle p-1 d-flex align-items-center justify-content-center"
                           style={{ width: '35px', height: '35px'}}
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
                    <div className="fw-bold fs-5 mb-1" style={{ color: '#d6762e' }}>
          {formatPrice(property.price)}
          {property.purpose === 'rent' && <span className="rent-period text-muted small"> / شهري</span>}
        </div>
                      <h5 className="card-title"> {/* Title color/overflow from CSS */}
                         {property.title || 'عنوان غير متوفر'}
                      </h5>
                      <p className="card-text small text-muted mt-auto"> {/* Location color/overflow from CSS */}
                        <i className="bi bi-geo-alt-fill me-1 IAD"></i> {/* Check if 'bi' icons are loaded */}
                        {property.address || 'العنوان غير محدد'}
                      </p>
                    </Card.Body>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        )}
      </div>
    </motion.section>
  );
};

export default BestChoices;