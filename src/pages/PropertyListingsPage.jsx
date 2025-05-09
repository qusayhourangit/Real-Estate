import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import PropertyCard from './PropertyCard';
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyListingsPage.css';
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
          : [];
  
        allProperties = [...allProperties, ...pageData];
  
        currentPage++;
        lastPage = responseData?.last_page || 1;
      } while (currentPage <= lastPage);
  console.log("PropertyListingsPage - All properties fetched from API:", JSON.stringify(allProperties, null, 2));
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

    if (filters.bedrooms !== 'any' && filters.type !== 'commercial') {
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
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter(p =>
        p.address?.toLowerCase().includes(loc) ||
        p.title?.toLowerCase().includes(loc)
      );
    }

    setFilteredProperties(filtered);

    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'any') {
        const key = k === 'minPrice' ? 'min_price' : k === 'maxPrice' ? 'max_price' : k;
        searchParams.set(key, v);
      }
    });
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true, state: {} });
  }, [filters, allFetchedProperties, location.pathname, navigate]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      purpose: 'any',
      type: 'any',
      bedrooms: 'any',
      minPrice: '',
      maxPrice: '',
      location: '',
    });
    navigate(location.pathname, { replace: true, state: {} });
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
      // rollback
      isSaved ? newSet.add(propertyId) : newSet.delete(propertyId);
      setSavedProperties(new Set(newSet));
    } finally {
      setSavingStates(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  return (
    <Container fluid className="my-4 property-listings-page" dir="rtl">
      <Row>
        <Col lg={3} className="mb-4">
          <div className="p-3 border rounded shadow-sm sticky-top">
            <h5 className="mb-3 fw-bold border-bottom pb-2">
              <i className="bi bi-funnel-fill text-primary me-2"></i>تصفية البحث
            </h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>الموقع / العنوان</Form.Label>
                <Form.Control name="location" value={filters.location} onChange={handleFilterChange} />
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
                  <option value="house">شقة</option>
                  <option value="commercial">محل تجاري</option>
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
                <Form.Label>السعر الأدنى</Form.Label>
                <Form.Control type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>السعر الأعلى</Form.Label>
                <Form.Control type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} />
              </Form.Group>
              <Button variant="outline-secondary" className="w-100" onClick={resetFilters}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>إعادة تعيين
              </Button>
            </Form>
          </div>
        </Col>

        <Col lg={9}>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">جاري تحميل العقارات...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center my-5">
              <i className="bi bi-search display-4 text-muted"></i>
              <h4 className="mt-3">لا توجد نتائج</h4>
            </div>
          ) : (
            <motion.div variants={listingsContainerVariants} initial="hidden" animate="visible">
              <Row xs={1} sm={2} md={2} lg={3} className="g-4">
                {filteredProperties.map((property) => (
                  <motion.div key={property.id} variants={propertyCardVariants}>
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
