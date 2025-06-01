import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import PropertyCard from './PropertyCard'; // تأكد أن PropertyCard يستقبل ويعرض بيانات is_featured بشكل صحيح
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyListingsPage.css'; // يمكنك إضافة أنماط للمفتاح الجديد هنا
import api from '../API/api';
import { useSelector } from 'react-redux';

const listingsContainerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const propertyCardVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

const PropertyListingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  const [allFetchedProperties, setAllFetchedProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedProperties, setSavedProperties] = useState(new Set());
  const [savingStates, setSavingStates] = useState({});

  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(location.search);
    return {
      purpose: params.get('purpose') || location.state?.initialPurpose || 'any',
      type: params.get('type') || 'any',
      bedrooms: params.get('bedrooms') || 'any',
      minPrice: params.get('min_price') || '',
      maxPrice: params.get('max_price') || '',
      location: params.get('location') || location.state?.initialLocation || '',
      showFeaturedOnly: params.get('featured') === 'true',
    };
  });

  const fetchSavedIds = useCallback(async () => {
    if (!isAuthenticated || !token) return setSavedProperties(new Set());
    try {
      const res = await api.get('/user/show-saved-property', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const saved = res.data?.data?.properties || [];
      const ids = new Set(saved.map((item) => item.property?.id).filter(Boolean));
      setSavedProperties(ids);
    } catch {
      setSavedProperties(new Set());
    }
  }, [isAuthenticated, token]);

  const fetchAllProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let allProperties = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const res = await api.get(`/realestate?page=${currentPage}`);
        const responseData =
          res.data?.data?.properties ||
          res.data?.data ||
          res.data;

        const pageData = Array.isArray(responseData?.data)
          ? responseData.data
          : (Array.isArray(responseData) ? responseData : []); 

        allProperties = [...allProperties, ...pageData];

        currentPage++;
        lastPage = responseData?.last_page || 1;
      } while (currentPage <= lastPage);
      // console.log("PropertyListingsPage - All properties fetched (check for 'is_featured'):", JSON.stringify(allProperties[0], null, 2));
      setAllFetchedProperties(allProperties);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحميل العقارات');
      setAllFetchedProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllProperties();
    fetchSavedIds();
  }, [fetchAllProperties, fetchSavedIds]);

  useEffect(() => {
    let filtered = [...allFetchedProperties];

    if (filters.purpose !== 'any') filtered = filtered.filter(p => p.purpose === filters.purpose);
    if (filters.type !== 'any') filtered = filtered.filter(p => p.type === filters.type);

    if (filters.bedrooms !== 'any' && filters.type !== 'commercial' && filters.type !== 'land') {
      filtered = filtered.filter(p => {
        const beds = parseInt(p.bedrooms);
        if (isNaN(beds)) return false;
        return filters.bedrooms === '5+' ? beds >= 5 : beds === parseInt(filters.bedrooms);
      });
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min)) filtered = filtered.filter(p => parseFloat(p.price) >= min);
    }

    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max)) filtered = filtered.filter(p => parseFloat(p.price) <= max);
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase().trim();
      if (loc) { 
        filtered = filtered.filter(p =>
          p.address?.toLowerCase().includes(loc) ||
          p.title?.toLowerCase().includes(loc)
        );
      }
    }

    if (filters.showFeaturedOnly) {
      filtered = filtered.filter(p => p.is_featured === 1 || p.is_featured === true || String(p.is_featured) === "1");
    }

    // ---!!! تعديل: فرز العقارات لإعطاء الأولوية للمميزة !!!---
    filtered.sort((a, b) => {
      const aIsFeatured = a.is_featured === 1 || a.is_featured === true || String(a.is_featured) === "1";
      const bIsFeatured = b.is_featured === 1 || b.is_featured === true || String(b.is_featured) === "1";

      if (aIsFeatured && !bIsFeatured) {
        return -1; // العقار 'a' مميز وغير 'b', لذا 'a' يأتي أولاً
      }
      if (!aIsFeatured && bIsFeatured) {
        return 1;  // العقار 'b' مميز وغير 'a', لذا 'b' يأتي أولاً
      }
      // إذا كان كلاهما مميزاً أو كلاهما غير مميز, يمكن إضافة معايير فرز ثانوية هنا إذا لزم الأمر
      // مثلاً، الفرز حسب تاريخ الإضافة تنازلياً (الأحدث أولاً) إذا كان لديك حقل مثل 'created_at'
      // if (a.created_at && b.created_at) {
      //   return new Date(b.created_at) - new Date(a.created_at);
      // }
      return 0; // الحفاظ على الترتيب النسبي إذا كانت حالة التمييز متساوية
    });
    // ---!!! نهاية تعديل الفرز !!!---

    setFilteredProperties(filtered);

    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'showFeaturedOnly') {
        if (value === true) { 
          searchParams.set('featured', 'true');
        }
      } else if (value && value !== 'any' && value !== '') {
        const paramKey = key === 'minPrice' ? 'min_price' : key === 'maxPrice' ? 'max_price' : key;
        searchParams.set(paramKey, value);
      }
    });

    const newSearchString = searchParams.toString();
    if (location.search.substring(1) !== newSearchString) {
      navigate(`${location.pathname}?${newSearchString}`, { replace: true, state: {} });
    }

  }, [filters, allFetchedProperties, location.pathname, location.search, navigate]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' || type === 'switch' ? checked : value
    }));
  };

  const resetFilters = () => {
    setFilters({
      purpose: 'any',
      type: 'any',
      bedrooms: 'any',
      minPrice: '',
      maxPrice: '',
      location: '',
      showFeaturedOnly: false,
    });
  };

  const handleToggleFavorite = async (propertyId) => {
    if (!isAuthenticated || !token) return navigate('/login');
    if (!propertyId) return;

    const isSaved = savedProperties.has(propertyId);
    setSavingStates(prev => ({ ...prev, [propertyId]: true }));
    const newSet = new Set(savedProperties);
    isSaved ? newSet.delete(propertyId) : newSet.add(propertyId);
    setSavedProperties(newSet);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      isSaved
        ? await api.delete(`/user/remove-saved-property/${propertyId}`, config)
        : await api.post(`/user/saved-property/${propertyId}`, {}, config);
    } catch {
      // Revert optimistic update on error
      const revertedSet = new Set(savedProperties);
      isSaved ? revertedSet.add(propertyId) : revertedSet.delete(propertyId);
      setSavedProperties(revertedSet);
      // Consider showing an error message to the user
    } finally {
      setSavingStates(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  return (
    <Container fluid className="my-4 property-listings-page" dir="rtl">
      <Row>
        <Col lg={3} className="mb-4">
          <div className="p-3 border rounded shadow-sm sticky-top filter-sidebar">
            <h5 className="mb-3 fw-bold border-bottom pb-2">
              <i className="bi bi-funnel-fill text-primary me-2"></i>تصفية البحث
            </h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>الموقع / العنوان</Form.Label>
                <Form.Control name="location" value={filters.location} onChange={handleFilterChange} placeholder="مثال: المزة، دمشق" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>الغرض</Form.Label>
                <Form.Select name="purpose" value={filters.purpose} onChange={handleFilterChange}>
                  <option value="any">الكل</option>
                  <option value="rent">للإيجار</option>
                  <option value="sale">للبيع</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>نوع العقار</Form.Label>
                <Form.Select name="type" value={filters.type} onChange={handleFilterChange}>
                  <option value="any">الكل</option>
                  <option value="house">سكني (شقة، فيلا..)</option>
                  <option value="commercial">تجاري (محل، مكتب)</option>
                  <option value="land">أرض</option>
                </Form.Select>
              </Form.Group>
              {(filters.type === 'any' || filters.type === 'house') && (
                <Form.Group className="mb-3">
                  <Form.Label>غرف النوم</Form.Label>
                  <Form.Select name="bedrooms" value={filters.bedrooms} onChange={handleFilterChange}>
                    <option value="any">أي عدد</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </Form.Select>
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>السعر الأدنى (ل.س)</Form.Label>
                <Form.Control type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="مثال: 5000000" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>السعر الأعلى (ل.س)</Form.Label>
                <Form.Control type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="مثال: 25000000" />
              </Form.Group>

              <Form.Group className="mb-3 pt-2 border-top">
                <Form.Check
                  type="switch"
                  id="show-featured-switch"
                  label="عرض العقارات المميزة فقط"
                  name="showFeaturedOnly"
                  checked={filters.showFeaturedOnly}
                  onChange={handleFilterChange}
                  className="custom-filter-switch" 
                />
              </Form.Group>

              <Button variant="outline-secondary" className="w-100 mt-2" onClick={resetFilters}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين الفلاتر
              </Button>
            </Form>
          </div>
        </Col>

        <Col lg={9}>
          {loading ? (
            <div className="text-center my-5 py-5">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
              <p className="mt-3 fs-5">جاري تحميل العقارات...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="py-4 text-center fs-5">{error}</Alert>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center my-5 py-5">
              <i className="bi bi-search display-1 text-muted mb-3"></i>
              <h3 className="mt-3">لا توجد عقارات تطابق معايير بحثك</h3>
              <p className="text-muted">حاول تعديل الفلاتر أو إعادة تعيينها.</p>
            </div>
          ) : (
            <motion.div variants={listingsContainerVariants} initial="hidden" animate="visible">
              <Row xs={1} sm={1} md={2} lg={3} className="g-4">
                {filteredProperties.map((property) => (
                  <motion.div key={property.id} variants={propertyCardVariants} className="d-flex"> 
                    <PropertyCard
                      property={property}
                      isSaved={savedProperties.has(property.id)}
                      onToggleFavorite={() => handleToggleFavorite(property.id)}
                      isSaving={savingStates[property.id] || false}
                    />
                  </motion.div>
                ))}
              </Row>
            </motion.div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PropertyListingsPage;