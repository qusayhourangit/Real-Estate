import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Link مضافة
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, InputGroup, ButtonGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../API/api';
import { motion } from 'framer-motion';

import './AgentSubscriptionPage.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import syriatelCashIcon from '/images/syriatel_cash.png';
import mtnCashIcon from '/images/mtn_cash.png';

const pricingPlansData = [
  {
    id: "standard", // يبقى كما هو للاستخدام الداخلي في الواجهة
    name: "الأساسية",
    icon: "bi-star",
    recommended: false,
    color: "secondary",
    periods: {
      monthly: { label: "شهرياً", price: "49,000", periodSuffix: " ل.س/شهرياً", features: [" عرض حتى 10 عقارات موثوقة", "ظهور مميز محدود", "شارة وكيل موثوق", "صفحة وكيل خاصة"], planId: "standard_monthly" }, // <--- تم التعديل
      quarterly: { label: "كل 3 أشهر", price: "135,000", periodSuffix: " ل.س/3 أشهر", features: ["عرض حتى 10 عقارات موثوقة", "ظهور مميز محدود", "شارة وكيل موثوق", "صفحة وكيل خاصة"], planId: "standard_quarterly" }, // <--- تم التعديل
      annually: { label: "سنوياً", price: "470,000", periodSuffix: " ل.س/سنوياً", features: ["عرض حتى 10 عقارات موثوقة", "ظهور مميز محدود", "شارة وكيل موثوق", "صفحة وكيل خاصة"], planId: "standard_annually" }, // <--- تم التعديل
    }
  },
  {
    id: "pro",
    name: "الاحترافية",
    icon: "bi-briefcase-fill",
    recommended: true,
    color: "primary",
    periods: {
      monthly: { label: "شهرياً", price: "89,000", periodSuffix: " ل.س/شهرياً", features: ["عرض حتى 50 عقاراً موثوق", "ظهور مميز", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "pro_monthly" },
      quarterly: { label: "كل 3 أشهر", price: "250,000", periodSuffix: " ل.س/3 أشهر", features: ["عرض حتى 50 عقاراً موثوق", "ظهور مميز", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "pro_quarterly" },
      annually: { label: "سنوياً", price: "850,000", periodSuffix: " ل.س/سنوياً", features: ["عرض حتى 50 عقاراً موثوق", "ظهور مميز", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "pro_annually" },
    }
  },
  {
    id: "golden", // يبقى كما هو للاستخدام الداخلي في الواجهة
    name: "الذهبية",
    icon: "bi-gem",
    recommended: false,
    color: "dark",
    periods: {
      monthly: { label: "شهرياً", price: "149,000", periodSuffix: "  ل.س/شهرياً", features: ["عرض لا محدود", "أولوية الظهور", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "golden_monthly" }, // <--- تم التعديل
      quarterly: { label: "كل 3 أشهر", price: "400,000", periodSuffix: " ل.س/3 أشهر", features: ["عرض لا محدود", "أولوية الظهور", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "golden_quarterly" }, // <--- تم التعديل
      annually: { label: "سنوياً", price: "1,500,000", periodSuffix: " ل.س/سنوياً ", features: ["عرض لا محدود", "أولوية الظهور", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "golden_annually" }, // <--- تم التعديل
    }
  }
];
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" }
  })
};
const formSectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", delay: 0.2 } }
};

const AgentSubscriptionPage = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login', { state: { from: '/premium' } });
    }
  }, [user, token, navigate]);

  const [selectedPeriodsForPlans, setSelectedPeriodsForPlans] = useState(() => {
    const initialPeriods = {};
    pricingPlansData.forEach(plan => {
      const firstAvailablePeriodKey = Object.keys(plan.periods)[0];
      initialPeriods[plan.id] = firstAvailablePeriodKey || 'monthly';
    });
    return initialPeriods;
  });

  const recommendedPlan = pricingPlansData.find(p => p.recommended);

  const getDefaultPlanId = () => {
    if (recommendedPlan) {
        const periodKey = selectedPeriodsForPlans[recommendedPlan.id] || Object.keys(recommendedPlan.periods)[0];
        return recommendedPlan.periods[periodKey]?.planId;
    }
    if (pricingPlansData.length > 0) {
        const firstPlan = pricingPlansData[0];
        const periodKey = selectedPeriodsForPlans[firstPlan.id] || Object.keys(firstPlan.periods)[0];
        return firstPlan.periods[periodKey]?.planId;
    }
    return '';
  };

  const [formData, setFormData] = useState({
    fullName: '',
    officeName: '',
    officeAddress: '',
    phoneNumber: '',
    bio: '',
    selectedPlanId: '',
  });

  const [loading, setLoading] = useState(true); // ابدأ التحميل حتى يتم ملء البيانات من المستخدم
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        officeName: user.officeName || '', // إذا كان الـ API يتطلب هذه الحقول دائماً, قد تحتاج لجعلها إلزامية
        officeAddress: user.officeAddress || '',
        phoneNumber: user.phone || '',
        bio: user.bio || '',
        selectedPlanId: getDefaultPlanId() || ''
      }));
      setLoading(false); // انتهى تحميل بيانات المستخدم
    } else if (!user && token) {
        // حالة وجود توكن ولكن لا يوجد مستخدم (قد يكون Redux لا يزال يحمل)
        setLoading(true);
    } else {
        setLoading(false); // لا مستخدم ولا توكن
    }
  }, [user, token]); // أضف token للاعتمادية

  const handlePeriodChangeForPlan = (planId, periodKey) => {
    setSelectedPeriodsForPlans(prev => ({ ...prev, [planId]: periodKey }));
    const planData = pricingPlansData.find(p => p.id === planId);
    if (planData && planData.periods[periodKey]) {
      const newPlanIdInForm = planData.periods[periodKey].planId;
      const currentSelectedPlanBaseId = formData.selectedPlanId.split('_')[0];
      if (currentSelectedPlanBaseId === planId) {
        setFormData(prev => ({ ...prev, selectedPlanId: newPlanIdInForm }));
      }
    }
  };

  const handlePlanSelect = (planObject, selectedPeriodKeyForThisPlan) => {
    const selectedFullPlanId = planObject.periods[selectedPeriodKeyForThisPlan]?.planId;
    if (selectedFullPlanId) {
      setFormData(prev => ({ ...prev, selectedPlanId: selectedFullPlanId }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // دالة لتحويل فترة الـ planId إلى ما يتوقعه الـ API
  const mapDurationForAPI = (planDuration) => {
    switch (planDuration) {
      case 'monthly':
        return 'month';
      case 'quarterly':
        return 'three month'; // تأكد من أن الـ API يتوقع 'quarter' للفترة ربع السنوية
      case 'annually':
        return 'year';   // تأكد من أن الـ API يتوقع 'year' للفترة السنوية
      default:
        return planDuration; // قيمة احتياطية
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !token) {
      setError("يجب تسجيل الدخول أولاً لإرسال طلب الاشتراك.");
      navigate('/login', { state: { from: '/premium' } });
      return;
    }

    if (!formData.selectedPlanId) {
      setError("يرجى اختيار باقة وفترة اشتراك أولاً.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    const [planType, planDuration] = formData.selectedPlanId.split('_'); // مثال: "pro_monthly" -> ["pro", "monthly"]

    const requestPayload = {
      name: formData.fullName,
      office_name: formData.officeName,
      office_location: formData.officeAddress,
      phone: formData.phoneNumber,
      about: formData.bio,
      plan: planType, // "basic", "pro", أو "gold"
      duration: mapDurationForAPI(planDuration) // "month", "quarter", أو "year" (تأكد من القيم الفعلية)
    };

    console.log("البيانات المرسلة للـ API:", requestPayload);

    try {
      
      const response = await api.post('/user/user-premium', requestPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response from API:', response.data);
      if (response.data && response.data.error) {
        // إذا كان هناك حقل 'error' في الاستجابة، تعامل معه كخطأ
        if (response.data.error === "This user already send premium request") {
          setError("لقد قمت بالفعل بإرسال طلب اشتراك سابق. يرجى انتظار مراجعته أو التواصل مع الدعم.");
        } else {
          // خطأ منطقي آخر من الـ API
          setError(response.data.error || "حدث خطأ ما من الخادم.");
        }
        setSuccessMessage(''); // تأكد من عدم عرض رسالة نجاح
      } else if (response.data && response.data.message) {
        // إذا لم يكن هناك خطأ، اعتبرها رسالة نجاح
        setSuccessMessage(response.data.message || "تم إرسال طلب اشتراكك بنجاح! سيتم التواصل معك قريبًا.");
        setError(null); // تأكد من عدم عرض رسالة خطأ
        // يمكنك إعادة تعيين الفورم هنا أو إعادة التوجيه
      } else {
        // استجابة ناجحة ولكن بدون رسالة واضحة أو خطأ
        setSuccessMessage("تم إرسال طلب اشتراكك بنجاح! سيتم التواصل معك قريبًا.");
        setError(null);
      }
      // =======================================================================

    } catch (apiError) {
      // هذا البلوك سيتعامل مع أخطاء الشبكة أو استجابات الخادم 4xx/5xx
      console.error("خطأ أثناء إرسال طلب الاشتراك (catch block):", apiError);
      let errorMessageToDisplay = "حدث خطأ غير متوقع أثناء إرسال طلبك.";

      if (apiError.response) {
        const responseData = apiError.response.data;
        const statusCode = apiError.response.status;

        // هنا يمكن أن يكون هناك خطأ 501 حقيقي (Not Implemented)
        // أو أي خطأ آخر 4xx/5xx
        if (responseData && responseData.message) {
          errorMessageToDisplay = responseData.message;
        } else if (responseData && responseData.error) {
          errorMessageToDisplay = responseData.error;
        } else {
          errorMessageToDisplay = `خطأ من الخادم: ${statusCode}`;
        }

        if (statusCode === 401) {
            errorMessageToDisplay = "جلسة المستخدم غير صالحة أو منتهية. يرجى تسجيل الدخول مرة أخرى.";
        } else if (statusCode === 403) {
            errorMessageToDisplay = "ليس لديك الصلاحية للقيام بهذا الإجراء.";
        } else if (responseData && responseData.errors) {
            const validationErrors = Object.values(responseData.errors).flat().join(' ');
            errorMessageToDisplay = `فشل التحقق: ${validationErrors}`;
        }
      } else if (apiError.request) {
        errorMessageToDisplay = "لا يمكن الوصول إلى الخادم. يرجى التحقق من اتصالك بالإنترنت.";
      } else {
        errorMessageToDisplay = apiError.message;
      }
      setError(errorMessageToDisplay);
      setSuccessMessage(''); // تأكد من عدم عرض رسالة نجاح في حالة الخطأ
    } finally {
      setLoading(false);
    }
  };
  const getSelectedPlanFullDetails = () => {
      if (!formData.selectedPlanId) return null;
      for (const plan of pricingPlansData) {
          for (const periodKey in plan.periods) {
              const periodDetail = plan.periods[periodKey];
              if (periodDetail.planId === formData.selectedPlanId) {
                  return {
                      planName: plan.name,
                      ...periodDetail
                  };
              }
          }
      }
      return null;
  };
  const selectedPlanFullDetails = getSelectedPlanFullDetails();

 useEffect(() => {
    if (formData.selectedPlanId) {
        const [baseId, currentPeriodInForm] = formData.selectedPlanId.split('_');
        const planInFormData = pricingPlansData.find(p => p.id === baseId);
        const actualSelectedPeriodForKey = selectedPeriodsForPlans[baseId];

        if (planInFormData && actualSelectedPeriodForKey && planInFormData.periods[actualSelectedPeriodForKey]) {
            if (actualSelectedPeriodForKey !== currentPeriodInForm) {
                // لا يتم التحديث هنا، يتم في handlePeriodChangeForPlan
            }
        } else if (planInFormData) {
            const firstAvailablePeriod = Object.keys(planInFormData.periods)[0];
            if (firstAvailablePeriod) {
                setFormData(prev => ({ ...prev, selectedPlanId: planInFormData.periods[firstAvailablePeriod].planId }));
            } else {
                 setFormData(prev => ({ ...prev, selectedPlanId: '' }));
            }
        }
    } else if (!formData.selectedPlanId && pricingPlansData.length > 0 && user) { // تأكد من وجود مستخدم قبل تعيين خطة افتراضية
        setFormData(prev => ({...prev, selectedPlanId: getDefaultPlanId() || ''}));
    }
  }, [selectedPeriodsForPlans, formData.selectedPlanId, user]);


  if (loading && (!user || !token)) { // تعديل شرط التحميل الأولي
    return (
        <Container className="py-5 text-center" dir="rtl">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">جاري تحميل البيانات...</p>
        </Container>
    );
  }

  if (!user || !token) {
    return (
        <Container className="py-5 text-center" dir="rtl">
            <Alert variant="warning">
                يرجى <Link to={`/login?redirect=${encodeURIComponent('/agent-subscription')}`}>تسجيل الدخول</Link> أولاً للاشتراك في الباقات.
            </Alert>
        </Container>
    );
  }

  return (
    <Container className="agent-subscription-page py-5" dir="rtl">
      <Row className="justify-content-center mb-4">
        <Col md={10} lg={8} className="text-center">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="display-5 fw-bold page-title">
            انضم لشبكة وكلائنا المعتمدين
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lead text-muted page-subtitle mt-3">
            اختر الباقة والفترة التي تناسب طموحاتك وانطلق نحو المزيد من النجاح.
          </motion.p>
        </Col>
      </Row>

      <section className="pricing-plans-section mb-5">
        <Row className="justify-content-center g-4">
          {pricingPlansData.map((plan, index) => {
            const currentSelectedPeriodKey = selectedPeriodsForPlans[plan.id] || Object.keys(plan.periods)[0];
            const currentPeriodDetailsForPlan = plan.periods[currentSelectedPeriodKey];

            if (!currentPeriodDetailsForPlan) return null;
            const isThisPlanSelectedInForm = formData.selectedPlanId === currentPeriodDetailsForPlan.planId;

            return (
              <Col md={6} lg={pricingPlansData.length >= 3 ? 4 : 5} key={plan.id} className="d-flex">
                <motion.div
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-100"
                >
                  <Card
                    className={`pricing-card h-100 shadow-lg ${isThisPlanSelectedInForm ? 'selected active-plan' : ''}`}
                    onClick={() => handlePlanSelect(plan, currentSelectedPeriodKey)}
                  >
                    {plan.recommended && <div className="recommended-badge">الأكثر طلباً</div>}
                    {isThisPlanSelectedInForm && <div className="selected-plan-badge"><i className="bi bi-check-lg"></i></div>}

                    <Card.Body className="d-flex flex-column p-4">
                      <div className="text-center mb-3">
                        <i className={`bi ${plan.icon} display-4 plan-icon mb-3`}></i>
                        <h4 className="plan-name fw-bold">{plan.name}</h4>
                      </div>

                      <div className="mb-4 period-buttons-in-card text-center">
                        <ButtonGroup size="sm" aria-label="اختر فترة الاشتراك">
                          {Object.keys(plan.periods).map(periodKey => (
                            <Button
                              key={periodKey}
                              variant={currentSelectedPeriodKey === periodKey ? 'primary' : 'outline-secondary'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePeriodChangeForPlan(plan.id, periodKey);
                              }}
                              className={`period-toggle-btn ${currentSelectedPeriodKey === periodKey ? 'active' : ''}`}
                            >
                              {plan.periods[periodKey].label.replace('ل.س/', '').replace('كل ', '')}
                            </Button>
                          ))}
                        </ButtonGroup>
                      </div>

                      <div className="text-center pricing-amount-wrapper mb-4">
                        <span className="pricing-amount">{currentPeriodDetailsForPlan.price}</span>
                        <span className="period-suffix ms-1">{currentPeriodDetailsForPlan.periodSuffix}</span>
                      </div>
                      <ul className="list-unstyled features-list mb-4 flex-grow-1 px-2">
                        {currentPeriodDetailsForPlan.features.map((feature, i) => (
                          <li key={i} className="mb-2 d-flex">
                            <i className="bi bi-check-circle text-success me-2 mt-1"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={isThisPlanSelectedInForm ? 'primary' : 'outline-primary'}
                        className="w-100 mt-auto select-plan-btn-new"
                      >
                        {isThisPlanSelectedInForm ? 'الباقة المختارة' : 'اختر هذه الباقة'}
                      </Button>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>
      </section>

      {/* الفورم يظهر فقط إذا كان المستخدم مسجلاً */}
      {user && token && (
        <motion.section
            className="subscription-form-section"
            variants={formSectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
        >
            <h3 className="text-center mb-4 section-heading">املأ بيانات طلب الاشتراك</h3>
            <Row className="justify-content-center">
            <Col md={10} lg={8}>
                <Card className="p-4 p-md-5 shadow-sm border-light form-card-with-icons">
                <Card.Body>
                    {successMessage && <Alert variant="success" className="text-center">{successMessage}</Alert>}
                    {error && <Alert variant="danger" className="text-center">{error}</Alert>}

                    {!successMessage && (
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                        <Col md={6}>
                            <Form.Group controlId="fullName">
                            <Form.Label>الاسم الكامل <span className="text-danger">*</span></Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="form-icon-bg"><i className="bi bi-person-badge-fill form-icon"></i></InputGroup.Text>
                                <Form.Control type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="أدخل اسمك الثلاثي" />
                            </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="officeName">
                            <Form.Label>اسم المكتب العقاري</Form.Label> {/* تم جعلها اختيارية إذا كان الـ API لا يتطلبها دائمًا */}
                            <InputGroup>
                                <InputGroup.Text className="form-icon-bg"><i className="bi bi-building form-icon"></i></InputGroup.Text>
                                <Form.Control type="text" name="officeName" value={formData.officeName} onChange={handleChange} placeholder="مثال: شركة النجوم العقارية" />
                            </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group controlId="officeAddress">
                            <Form.Label>عنوان المكتب</Form.Label> {/* تم جعلها اختيارية */}
                            <InputGroup>
                                <InputGroup.Text className="form-icon-bg"><i className="bi bi-geo-alt-fill form-icon"></i></InputGroup.Text>
                                <Form.Control type="text" name="officeAddress" value={formData.officeAddress} onChange={handleChange} placeholder="مثال: دمشق - شارع الحمرا - بناء الأمل" />
                            </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="phoneNumber">
                            <Form.Label>رقم الهاتف <span className="text-danger">*</span></Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="form-icon-bg"><i className="bi bi-telephone-fill form-icon"></i></InputGroup.Text>
                                <Form.Control type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="مثال: 0912345678" />
                            </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="bio">
                            <Form.Label>نبذة بسيطة (اختياري)</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="form-icon-bg align-items-start pt-2"><i className="bi bi-info-circle-fill form-icon"></i></InputGroup.Text>
                                <Form.Control as="textarea" rows={1} name="bio" value={formData.bio} onChange={handleChange} placeholder="عنك أو عن مكتبك..." style={{ minHeight: 'calc(1.5em + 0.75rem + 2px)' }} />
                            </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            <Form.Group controlId="selectedPlanDisplay">
                            <Form.Label>الخطة والفترة المختارة:</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="form-icon-bg"><i className="bi bi-patch-check-fill form-icon"></i></InputGroup.Text>
                                <Form.Control
                                type="text"
                                value={
                                    selectedPlanFullDetails
                                    ? `${selectedPlanFullDetails.planName || 'يرجى اختيار باقة'} - ${selectedPlanFullDetails.label || ''}`
                                    : 'يرجى اختيار باقة وفترة'
                                }
                                readOnly
                                disabled
                                />
                            </InputGroup>
                            {selectedPlanFullDetails && <small className="text-muted d-block mt-1 form-text-offset-icon">السعر: {selectedPlanFullDetails.price} {selectedPlanFullDetails.periodSuffix}</small>}
                            </Form.Group>
                        </Col>
                        </Row>
                        <div className="payment-methods-section my-4">
                        <h5 className="text-center mb-3 text-secondary fs-6">طرق الدفع المتاحة :</h5>
                        <div className="d-flex justify-content-center align-items-center gap-3 gap-md-4">
                            <div className="payment-option text-center">
                            <img src={syriatelCashIcon} alt="Syriatel Cash" className="payment-icon" />
                            <small className="d-block mt-1 text-muted">سيريتل كاش</small>
                            </div>
                            <div className="payment-option text-center">
                            <img src={mtnCashIcon} alt="MTN Cash" className="payment-icon" />
                            <small className="d-block mt-1 text-muted">MTN كاش</small>
                            </div>
                            <div className="payment-option text-center">
                            <i className="bi bi-cash-coin payment-icon-bs text-success"></i>
                            <small className="d-block mt-1 text-muted">نقداً للمندوب</small>
                            </div>
                        </div>
                        <p className="text-center text-muted small mt-3">سيتم التواصل معك لتأكيد الطلب وترتيب عملية الدفع.</p>
                        </div>
                        <div className="d-grid mt-4">
                        <Button variant="primary" type="submit" disabled={loading || !formData.selectedPlanId} size="lg" className="submit-agent-request-btn">
                            {loading ? (<><Spinner as="span" animation="border" size="sm" className="me-2" />جاري الإرسال...</>)
                            : (<><i className="bi bi-send-check-fill me-2"></i> إرسال طلب الاشتراك</>)
                            }
                        </Button>
                        {!formData.selectedPlanId && <small className="text-danger text-center d-block mt-2">يرجى اختيار باقة وفترة اشتراك أولاً.</small>}
                        </div>
                    </Form>
                    )}
                </Card.Body>
                </Card>
            </Col>
            </Row>
        </motion.section>
      )}
    </Container>
  );
};

export default AgentSubscriptionPage;