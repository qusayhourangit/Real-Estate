// src/pages/AgentProfilePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Image, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { FaHeart, FaRegHeart } from 'react-icons/fa'; // لزر المفضلة، تأكد من تثبيت react-icons
import './AgentProfilePage.css'; 
import "bootstrap-icons/font/bootstrap-icons.css";
import api from '../API/api'; 
import { useSelector } from 'react-redux';

const DEFAULT_AVATAR = 'https://www.flaticon.com/free-icons/person" '; 

const AgentProfilePage = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // --- افترض أن هذه القيم تأتي من Redux أو Context ---
  const { isAuthenticated, token, statusChangeCounter: propertyStatusCounter } = useSelector((state) => state.auth);
  const [savedProperties, setSavedProperties] = useState(new Set()); // حالة للمفضلة (مثال بسيط)
  const [savingStates, setSavingStates] = useState({}); // حالة لحفظ المفضلة (مثال بسيط)
  // --- نهاية الافتراضات ---

 // --- حالات خاصة بالمفضلة (مأخوذة من BestChoices) ---


  // --- دالة جلب العقارات المحفوظة (مأخوذة من BestChoices) ---
  const fetchSavedIds = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setSavedProperties(new Set()); // مسح المفضلة إذا لم يكن المستخدم مسجلاً
      return;
    }
    try {
      const res = await api.get(`/user/show-saved-property`, { // تأكد من صحة هذا المسار
        headers: { Authorization: `Bearer ${token}` }
      });
      const ids = new Set(
        res.data?.data?.properties?.map(p => p.property?.id).filter(Boolean) ?? 
        res.data?.savedProperties?.map(p => p.property?.id).filter(Boolean) ?? // محاولة بنية أخرى إذا كانت الأولى خاطئة
        []
      );
      setSavedProperties(ids);
    } catch (err) {
      console.error('AgentProfilePage: Failed to fetch saved properties:', err);
      // لا تقم بتغيير savedProperties هنا عند الخطأ، قد يكون المستخدم لا يزال لديه بيانات محلية
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds, propertyStatusCounter]); // أضفنا propertyStatusCounter هنا


  useEffect(() => {
    const fetchAgentAndPropertiesData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const response = await api.get(`/agent-detail/${agentId}`); 

        if (response.data && response.data.success && response.data.data) {
          const apiAgentOuterData = response.data.data;
          const apiUserInnerData = apiAgentOuterData.user;

          if (!apiUserInnerData) {
            throw new Error("بيانات المستخدم غير موجودة في الاستجابة.");
          }

          const agentDetails = {
            id: apiAgentOuterData.id,
            name: apiUserInnerData.name || apiAgentOuterData.name,
            officeName: apiAgentOuterData.office_name,
            officeAddress: apiAgentOuterData.office_location,
            phoneNumber: apiAgentOuterData.phone,
            email: apiUserInnerData.email,
            bio: apiAgentOuterData.about,
            avatarUrl: apiUserInnerData.avatar_url || DEFAULT_AVATAR,
            memberSince: apiUserInnerData.created_at,
            isVerifiedAgent: !!apiUserInnerData.is_verified_agent,
          };
          setAgent(agentDetails);

          const agentProperties = (apiUserInnerData.properties || []).map(prop => ({
            ...prop,
            images: prop.images || [],
            isFeatured: !!prop.is_featured,
            currency: prop.currency || 'ل.س',
            // الحقول من API مباشرة مثل: bedrooms, bathrooms, area, livingRooms
          }));
          setProperties(agentProperties);

        } else {
          throw new Error(response.data.message || "البيانات المستلمة من الـ API غير صالحة أو غير مكتملة.");
        }
      } catch (err) {
        console.error("Error fetching agent data:", err);
        const apiErrorMessage = err.response?.data?.message || err.response?.data?.error;
        setError(apiErrorMessage || err.message || "لم يتم العثور على بيانات الوكيل أو حدث خطأ ما.");
        setAgent(null);
        setProperties([]);
      } finally {
        setLoadingData(false);
      }
    };

    if (agentId) {
      fetchAgentAndPropertiesData();
    } else {
      setError("معرّف الوكيل غير متوفر.");
      setLoadingData(false);
    }
  }, [agentId]);

  const formatPrice = (price) => {
    const num = Number(price);
    return num.toLocaleString('ar-SY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  const getPurposeArabic = (purpose) => purpose === 'sale' ? 'للبيع' : (purpose === 'rent' ? 'للإيجار' : purpose);
  
  const getCategoryArabic = (type) => {
    const types = { 
      apartment: 'شقة', villa: 'فيلا', shop: 'محل', 
      office: 'مكتب', land: 'أرض', house: 'منزل',
      commercial: 'تجاري', residential: 'سكني' 
    };
    return types[type] || type;
  };

  const getDealTypeColor = (type) => type === 'sale' ? 'danger' : type === 'rent' ? 'success' : 'primary';
const getPropertyTypeColor = (type) => type === 'house' ? 'info' : type === 'commercial' ? 'warning' : 'secondary';

  const handlePropertyClick = (propertyId) => { navigate(`/properties/${propertyId}`); };
 
 // --- دالة إضافة/إزالة من المفضلة (مأخوذة من BestChoices) ---
  const handleToggleFavorite = async (e, id) => {
    e.stopPropagation();
    if (!isAuthenticated || !token) { 
      navigate('/login', { state: { from: window.location.pathname } }); // توجيه لتسجيل الدخول مع حفظ الصفحة الحالية
      return; 
    }
    if (!id || savingStates[id]) return;

    const isSaved = savedProperties.has(id);
    setSavingStates(prev => ({ ...prev, [id]: true }));
    
    // Optimistic update
    setSavedProperties(prev => {
      const updated = new Set(prev);
      isSaved ? updated.delete(id) : updated.add(id);
      return updated;
    });

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      isSaved
        ? await api.delete(`/user/remove-saved-property/${id}`, config) // تأكد من صحة هذا المسار
        : await api.post(`/user/saved-property/${id}`, {}, config);     // تأكد من صحة هذا المسار
      // (اختياري) يمكنك إعادة جلب قائمة المفضلة للتأكيد النهائي من الخادم
      // await fetchSavedIds(); 
    } catch (error) {
      console.error('AgentProfilePage: Favorite toggle failed:', error);
      // Revert optimistic update on error
      setSavedProperties(prev => {
        const reverted = new Set(prev);
        isSaved ? reverted.add(id) : reverted.delete(id);
        return reverted;
      });
      // (اختياري) عرض رسالة خطأ للمستخدم
      // setError("فشل تحديث المفضلة. يرجى المحاولة مرة أخرى."); 
    } finally {
      setSavingStates(prev => ({ ...prev, [id]: false }));
    }
  };
  if (loadingData) { 
    return <Container className="text-center py-5 page-loading-spinner"><Spinner animation="border" variant="primary" /><p className="mt-2">جاري تحميل بيانات الوكيل...</p></Container>;
  }
  if (error && !agent) {
    return <Container className="py-5 text-center" dir="rtl"><Alert variant="danger">{error}</Alert><Button as={Link} to="/" variant="primary-orange">الرئيسية</Button></Container>;
  }
  if (!agent) { 
    return <Container className="py-5 text-center" dir="rtl"><Alert variant="warning">لم يتم العثور على الوكيل.</Alert><Button as={Link} to="/" variant="primary-orange">الرئيسية</Button></Container>;
  }

  return (
    <div className="agent-profile-page-wrapper">
      <Container className="agent-profile-page-content py-4 py-md-5" dir="rtl">
        <Row>
          <Col md={4} lg={3} className="agent-sidebar-info">
            <Card className="agent-details-card shadow-sm">
              <Card.Body className="text-center">
                <Image
                  src={"/images/man.png"}
                  alt={`صورة ${agent.name}`}
                  roundedCircle
                  className="agent-avatar-sidebar"
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                />
                <h4 className="agent-name-sidebar mt-3 mb-1">{agent.name}</h4>
                {agent.officeName && <p className="agent-office-name-sidebar text-muted small">{agent.officeName}</p>}
                
                {agent.isVerifiedAgent && 
                  <Badge pill bg="" className="verified-agent-badge-sidebar mt-2 mb-3">
                    <i className="bi bi-patch-check-fill me-2"></i> وكيل معتمد
                  </Badge>
                }
                <hr className="my-3" />
                <ul className="list-unstyled agent-contact-info text-start">
                  {agent.officeAddress && <li><i className="bi bi-geo-alt-fill text-primary-orange me-2"></i>{agent.officeAddress}</li>}
                  {agent.phoneNumber && <li><i className="bi bi-telephone-fill text-primary-orange me-2"></i><a href={`tel:${agent.phoneNumber}`} className="text-decoration-none">{agent.phoneNumber}</a></li>}
                  {agent.email && <li><i className="bi bi-envelope-fill text-primary-orange me-2"></i><a href={`mailto:${agent.email}`} className="text-decoration-none">{agent.email}</a></li>}
                  {agent.memberSince && <li className="mt-2"><i className="bi bi-calendar-check text-secondary me-2"></i><small className="text-muted">عضو منذ: {new Date(agent.memberSince).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long' })}</small></li>}
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={8} lg={9} className="agent-main-content">
            {agent.bio && (
              <Row className="justify-content-center mb-4">
                <Col xs={12} lg={11} xl={10}>
                    <Card className="agent-bio-section-card shadow-sm">
                        <Card.Body>
                        <Card.Title as="h5" className="mb-3 section-title-underline">
                            <i className="bi bi-person-lines-fill me-2 text-primary-orange"></i>نبذة عن الوكيل
                        </Card.Title>
                        <Card.Text style={{ whiteSpace: 'pre-line' }}>
                            {agent.bio}
                        </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
              </Row>
            )}

            <h3 className="mb-4 section-title-underline properties-title-main">
              <i className="bi bi-grid-3x3-gap-fill me-2 text-primary-orange"></i>عقارات الوكيل ({properties.length})
            </h3>

            {properties.length > 0 ? (
              <Row xs={1} sm={1} md={2} lg={2} xl={3} className="g-4">
                {properties.map((property) => (
                  <Col key={property.id} className="d-flex">
                    {/* استخدام كلاس `property-card` المشترك من BestChoices */}
                    <Card
                      className={`property-card h-100 profileagent ${property.isFeatured ? 'truly-featured-property-card' : ''}`}
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      <div className="position-relative">
                        {property.isFeatured && (
                          <div className="top-featured-badge">
                            <i className="bi bi-bookmark-check-fill"></i>
                          </div>
                        )}

                        <Card.Img
                          variant="top"
                          src={
                            (property.images && Array.isArray(property.images) && property.images.length > 0 && property.images[0]?.url)
                              ? property.images[0].url : 'https://via.placeholder.com/400x250?text=NoImage'
                          }
                          alt={property.title || 'صورة عقار'}
                          className="property-image" // كلاس من BestChoices CSS
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x250?text=Error'; }}
                        />

                        <div className="property-tags position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
                          {property.purpose && (
                            <Badge bg={getDealTypeColor(property.purpose).replace('-bg','')} className="rounded-pill px-2 py-1">
                              {getPurposeArabic(property.purpose)}
                            </Badge>
                          )}
                          {property.type && (
                            <Badge bg={getPropertyTypeColor(property.type)} className="rounded-pill px-2 py-1">
                              {getCategoryArabic(property.type)}
                            </Badge>
                          )}
                        </div>
                        
                    {/* --- بداية: زر المفضلة المحدث --- */}
                        {isAuthenticated && ( 
                          <Button
                            variant="light"
                            className="fav-button position-absolute top-0 start-0 m-2 rounded-circle"
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
                        {/* --- نهاية: زر المفضلة المحدث --- */}
                      </div>

                      <Card.Body>
                        <div className="fw-bold fs-5 mb-1 price-output"> {/* كلاس price-output من BestChoices */}
                          {formatPrice(property.price)} {property.currency || 'ل.س'}
                          {property.purpose === 'rent' && property.period && <span className="rent-period text-muted small"> / {property.period === 'month' ? 'شهري' : property.period}</span>}
                        </div>

                        <h5 className="card-title property-card-title"> {/* كلاس property-card-title */}
                          {property.title || 'عنوان غير متوفر'}
                        </h5>
                        
                        <p className="card-text small text-muted property-card-address mt-auto"> {/* كلاس property-card-address */}
                          <i className="bi bi-geo-alt-fill me-1 IAD"></i>
                          {property.address || 'العنوان غير محدد'}
                        </p>
                        
                        {agent.isVerifiedAgent && (
                          <Badge className="verified-agent-info-badge align-self-start mt-1 mb-2">
                            <i className="bi bi-patch-check-fill me-1"></i> وكيل معتمد
                          </Badge>
                        )}
                      </Card.Body>

                      <div className="d-flex justify-content-around text-muted py-2 border-top det-icn">
                        {property.type === 'commercial' || property.type === 'shop' || property.type === 'land' ? (
                          property.area > 0 && (
                            <div className="d-flex align-items-center gap-1"><i className="bi bi-rulers"></i><span>{property.area} م²</span></div>
                          )
                        ) : (
                          <>
                            {property.bedrooms > 0 && (<div className="d-flex align-items-center gap-1"><i className="bi bi-door-closed-fill"></i><span>{property.bedrooms}</span></div>)}
                            {property.bathrooms > 0 && (<div className="d-flex align-items-center gap-1"><i className="bi bi-droplet-half"></i><span>{property.bathrooms}</span></div>)}
                            {(property.livingRooms > 0 || property.livingrooms > 0) && (<div className="d-flex align-items-center gap-1"><i className="bi bi-display"></i><span>{property.livingRooms || property.livingrooms}</span></div> )}
                            {property.area > 0 && (<div className="d-flex align-items-center gap-1"><i className="bi bi-rulers"></i><span>{property.area} م²</span></div>)}
                          </>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              !loadingData && (
                  <Alert variant="info" className="text-center">
                      <i className="bi bi-info-circle-fill me-2"></i>لا توجد عقارات مضافة من قبل هذا الوكيل حاليًا.
                  </Alert>
              )
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AgentProfilePage;