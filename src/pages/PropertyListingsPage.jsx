import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import PropertyCard from './PropertyCard';
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './PropertyListingsPage.css';
import api from '../API/api';
import { useSelector } from 'react-redux';

const listingsContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const propertyCardVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } } };

const PropertyListingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

  const initialLocationSearch = location.state?.initialLocation || '';
  const initialPurposeSearch = location.state?.initialPurpose || 'any';

  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedProperties, setSavedProperties] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);

  const initialFilters = {
    purpose: initialPurposeSearch, bedrooms: 'any', minPrice: '', maxPrice: '', type: 'any', location: initialLocationSearch,
  };
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const storageKey = `savedProperties_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(storageKey)) || [];
      setSavedProperties(saved);
    } else {
      setSavedProperties([]);
    }
  }, [isAuthenticated, user]);

  const applyFilters = (propertiesToFilter = allProperties, currentFilters = filters) => {
    setLoading(true);
    setFilteredProperties([]);

    setTimeout(() => {
      let result = [...propertiesToFilter];

      if (currentFilters.purpose !== 'any') result = result.filter(p => p.purpose === currentFilters.purpose);
      if (currentFilters.type !== 'any') result = result.filter(p => p.type === currentFilters.type);
      if (currentFilters.bedrooms !== 'any') {
        result = result.filter(p => {
          if (p.type !== 'house') return true;
          const requiredBeds = parseInt(currentFilters.bedrooms);
          if (currentFilters.bedrooms === '5+') return (p.bedrooms && parseInt(p.bedrooms) >= 5);
          return (p.bedrooms && parseInt(p.bedrooms) === requiredBeds);
        });
      }
      if (currentFilters.minPrice && !isNaN(Number(currentFilters.minPrice))) result = result.filter(p => p.price >= Number(currentFilters.minPrice));
      if (currentFilters.maxPrice && !isNaN(Number(currentFilters.maxPrice))) result = result.filter(p => p.price <= Number(currentFilters.maxPrice));
      if (currentFilters.location && currentFilters.location.trim() !== '') {
        const searchTermLower = currentFilters.location.trim().toLowerCase();
        result = result.filter(p => 
          (p.address && p.address.toLowerCase().includes(searchTermLower)) ||
          (p.title && p.title.toLowerCase().includes(searchTermLower))
        );
      }

      setFilteredProperties(result);
      setLoading(false);
    }, 100);
  };

  useEffect(() => {
    const fetchAllProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/user/get-property?page=${pageNumber}`);
        if (response.data && Array.isArray(response.data.data)) {
          setAllProperties(response.data.data);
          applyFilters(response.data.data, filters);
        } else {
          setAllProperties([]);
          setFilteredProperties([]);
          setError("فشل تحميل البيانات.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching all properties:", err);
        setError(`حدث خطأ أثناء تحميل العقارات. (${err.message})`);
        setAllProperties([]);
        setFilteredProperties([]);
        setLoading(false);
      }
    };

    fetchAllProperties();
  }, [pageNumber]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const resetFilters = () => {
    const defaultFilters = { purpose: 'any', bedrooms: 'any', minPrice: '', maxPrice: '', type: 'any', location: '' };
    setFilters(defaultFilters);
    applyFilters(allProperties, defaultFilters);
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handleToggleFavorite = async (propertyId) => {
    if (!isAuthenticated) {
      alert("الرجاء تسجيل الدخول لحفظ العقارات في المفضلة.");
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!user?.id) {
      console.error("User ID not found.");
      alert("خطأ، لم يتم العثور على المستخدم.");
      return;
    }

    // إضافة/إزالة العقار من المفضلة عبر API
    try {
      const response = await api.post(`/user/saved-property/${user.id}`, { propertyId });
      if (response.status === 200) {
        // تحديث الحالة المحلية للـ savedProperties
        setSavedProperties((prevSavedProperties) => {
          if (prevSavedProperties.includes(propertyId)) {
            return prevSavedProperties.filter(id => id !== propertyId); // إزالة من المفضلة
          } else {
            return [...prevSavedProperties, propertyId]; // إضافة للمفضلة
          }
        });
      }
    } catch (err) {
      console.error("Error saving property:", err);
      alert("حدث خطأ أثناء حفظ العقار.");
    }
  };

  const handleNextPage = () => setPageNumber(prev => prev + 1);
  const handlePrevPage = () => setPageNumber(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <Container fluid className="my-4 property-listings-page" dir='rtl'>
      <Row>
        <Col lg={3} className="mb-4 mb-lg-0">
          <div className="filter-sidebar p-3 border rounded shadow-sm sticky-top">
            <h5 className="mb-3 fw-bold border-bottom pb-2">
              <i className="bi bi-funnel-fill text-primary me-2"></i> تصفية البحث
            </h5>
            <Form>
              <Form.Group className="mb-3" controlId="filterLocation">
                <Form.Label className="fw-semibold small">الموقع / العنوان</Form.Label>
                <Form.Control type="text" placeholder="ابحث بالمنطقة أو العنوان..." name="location" value={filters.location} onChange={handleFilterChange} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="filterPurpose">
                <Form.Label className="fw-semibold small">الغرض</Form.Label>
                <Form.Select name="purpose" value={filters.purpose} onChange={handleFilterChange}>
                  <option value="any">الكل</option>
                  <option value="rent">للإيجار</option>
                  <option value="sale">للبيع</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3" controlId="filterType">
                <Form.Label className="fw-semibold small">نوع العقار</Form.Label>
                <Form.Select name="type" value={filters.type} onChange={handleFilterChange}>
                  <option value="any">الكل</option>
                  <option value="house">سكني</option>
                  <option value="commercial">تجاري</option>
                </Form.Select>
              </Form.Group>
              {(filters.type === 'any' || filters.type === 'house') && (
                <Form.Group className="mb-3" controlId="filterBedrooms">
                  <Form.Label className="fw-semibold small">غرف النوم</Form.Label>
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
              <Form.Group className="mb-3" controlId="filterPrice">
                <Form.Label className="fw-semibold small">نطاق السعر (ل.س)</Form.Label>
                <Row>
                  <Col md={6}><Form.Control className='mb-2 mb-md-0' type="number" placeholder="أدنى" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} min="0" /></Col>
                  <Col md={6}><Form.Control type="number" placeholder="أقصى" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} min="0" /></Col>
                </Row>
              </Form.Group>
              <div className="d-grid gap-2 mt-4">
                <Button variant="primary" onClick={() => applyFilters()} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }} disabled={loading}>
                  {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <i className="bi bi-search me-2"></i>}
                  تطبيق الفلتر
                </Button>
                <Button variant="outline-secondary" onClick={resetFilters} disabled={loading}>
                  <i className="bi bi-arrow-clockwise me-2"></i> إعادة تعيين
                </Button>
              </div>
            </Form>
          </div>
        </Col>

        <Col lg={9}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">العقارات المتاحة</h4>
            <div className={`alert d-flex align-items-center py-1 px-2 mb-0 ${loading ? 'alert-light text-muted' : 'alert-success'}`} role="alert" style={{ fontSize: '0.9rem' }}>
              <div>{loading ? 'جاري البحث...' : `تم العثور على ${filteredProperties.length} عقار`}</div>
            </div>
          </div>

          {error && (<Alert variant="danger"><i className="bi bi-exclamation-triangle-fill me-2"></i> {error}</Alert>)}

          {loading && filteredProperties.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" style={{ color: '#d6762e' }} />
              <p className="mt-2">جاري التحميل...</p>
            </div>
          ) : !error && filteredProperties.length === 0 ? (
            <motion.div className="col-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Alert variant="info" className="text-center">
                <i className="bi bi-info-circle-fill me-2"></i> لا توجد عقارات تطابق معايير البحث الحالية.
              </Alert>
            </motion.div>
          ) : (
            <motion.div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4" variants={listingsContainerVariants} initial="hidden" animate="visible" key={JSON.stringify(filters)}>
              {filteredProperties.map((property) => (
                <motion.div key={property.id} variants={propertyCardVariants} className="col">
                  <PropertyCard
                    property={property}
                    isSaved={savedProperties.includes(property.id)}
                    onToggleFavorite={() => handleToggleFavorite(property.id)}
                    isAuthenticated={isAuthenticated}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="d-flex justify-content-center mt-4">
            <Button variant="outline-primary" onClick={handlePrevPage} disabled={pageNumber === 1} className="me-2">السابق</Button>
            <Button variant="outline-primary" onClick={handleNextPage}>التالي</Button>
          </div>

        </Col>
      </Row>
    </Container>
  );
};

export default PropertyListingsPage;
