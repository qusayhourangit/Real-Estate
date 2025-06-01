import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, InputGroup, ButtonGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../API/api';
import { motion } from 'framer-motion';
import { z } from 'zod'; // <-- 1. استيراد Zod

import './AgentSubscriptionPage.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import syriatelCashIcon from '/images/syriatel_cash.png';
import mtnCashIcon from '/images/mtn_cash.png';

const pricingPlansData = [
  {
    id: "standard",
    name: "الأساسية",
    icon: "bi-star",
    recommended: false,
    color: "secondary",
    periods: {
      monthly: { label: "شهرياً", price: "49,000", periodSuffix: " ل.س/شهرياً", features: [" عرض حتى 10 عقارات موثوقة", "ظهور مميز محدود", "شارة وكيل موثوق", "صفحة وكيل خاصة"], planId: "standard_monthly" },
      quarterly: { label: "كل 3 أشهر", price: "135,000", periodSuffix: " ل.س/3 أشهر", features: ["عرض حتى 10 عقارات موثوقة", "ظهور مميز محدود", "شارة وكيل موثوق", "صفحة وكيل خاصة"], planId: "standard_quarterly" },
      annually: { label: "سنوياً", price: "470,000", periodSuffix: " ل.س/سنوياً", features: ["عرض حتى 10 عقارات موثوقة", "ظهور مميز محدود", "شارة وكيل موثوق", "صفحة وكيل خاصة"], planId: "standard_annually" },
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
    id: "golden",
    name: "الذهبية",
    icon: "bi-gem",
    recommended: false,
    color: "dark",
    periods: {
      monthly: { label: "شهرياً", price: "149,000", periodSuffix: "  ل.س/شهرياً", features: ["عرض لا محدود", "أولوية الظهور", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "golden_monthly" },
      quarterly: { label: "كل 3 أشهر", price: "400,000", periodSuffix: " ل.س/3 أشهر", features: ["عرض لا محدود", "أولوية الظهور", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "golden_quarterly" },
      annually: { label: "سنوياً", price: "1,500,000", periodSuffix: " ل.س/سنوياً ", features: ["عرض لا محدود", "أولوية الظهور", "شارة 'وكيل موثوق", "صفحة وكيل خاصة"], planId: "golden_annually" },
    }
  }
];

// --- 2. تعريف Zod Schema ---
// يتوافق مع requestPayload المرسل للـ API بناءً على قواعد الباك-اند
const subscriptionRequestSchema = z.object({
  name: z.string().min(1, "الاسم الكامل مطلوب").max(255, "الاسم الكامل يجب ألا يتجاوز 255 حرفًا"),
  office_name: z.string().min(1, "اسم المكتب العقاري مطلوب").max(255, "اسم المكتب يجب ألا يتجاوز 255 حرفًا"), // بناءً على صورة الباك-اند، هذا الحقل مطلوب
  office_location: z.string().min(1, "عنوان المكتب مطلوب").max(255, "عنوان المكتب يجب ألا يتجاوز 255 حرفًا"), // بناءً على صورة الباك-اند، هذا الحقل مطلوب
  phone: z.string()
    .min(1, "رقم الهاتف مطلوب")
    .regex(/^09[0-9]{8}$/, "صيغة رقم الهاتف غير صحيحة (يجب أن يبدأ بـ 09 ويتكون من 10 أرقام)"),
  about: z.string().max(1000, "النبذة التعريفية يجب ألا تتجاوز 1000 حرف").optional().or(z.literal('')), // optional ويقبل سلسلة فارغة
  plan: z.enum(["standard", "pro", "golden"], {
    errorMap: () => ({ message: "الرجاء اختيار باقة صالحة." })
  }),
  duration: z.enum(["month", "three month", "year"], { // القيم التي يرسلها mapDurationForAPI
    errorMap: () => ({ message: "الرجاء اختيار فترة اشتراك صالحة." })
  })
});


const cardVariants = { /* ... كما هو ... */ };
const formSectionVariants = { /* ... كما هو ... */ };

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // لخطأ الـ API العام
  const [formErrors, setFormErrors] = useState({}); // <-- 3. حالة لتخزين أخطاء حقول الفورم
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        officeName: user.officeName || '',
        officeAddress: user.officeAddress || '',
        phoneNumber: user.phone || '',
        bio: user.bio || '',
        selectedPlanId: getDefaultPlanId() || ''
      }));
      setLoading(false);
    } else if (!user && token) {
        setLoading(true);
    } else {
        setLoading(false);
    }
  }, [user, token]);

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
      setError(null); // مسح خطأ اختيار الباقة عند الاختيار
      setFormErrors(prev => ({...prev, plan: null, duration: null})); // مسح أخطاء الباقة والفترة
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // مسح الخطأ الخاص بالحقل عند التعديل عليه
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    // مسح الخطأ العام إذا كان هناك تعديل
    if(error){
        setError(null);
    }
  };

  const mapDurationForAPI = (planDuration) => {
    switch (planDuration) {
      case 'monthly': return 'month';
      case 'quarterly': return 'three month';
      case 'annually': return 'year';
      default: return planDuration;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({}); // مسح الأخطاء السابقة
    setError(null);
    setSuccessMessage('');

    if (!user || !token) {
      setError("يجب تسجيل الدخول أولاً لإرسال طلب الاشتراك.");
      navigate('/login', { state: { from: '/premium' } });
      return;
    }

    if (!formData.selectedPlanId) {
      setError("يرجى اختيار باقة وفترة اشتراك أولاً.");
      // يمكنك أيضًا تعيين خطأ محدد لحقل الباقة إذا كان لديك مكان لعرضه
      // setFormErrors(prev => ({...prev, selectedPlanId: "يرجى اختيار باقة"}));
      return;
    }
    
    const [planType, planDuration] = formData.selectedPlanId.split('_');

    const requestPayload = {
      name: formData.fullName,
      office_name: formData.officeName,
      office_location: formData.officeAddress,
      phone: formData.phoneNumber,
      about: formData.bio,
      plan: planType,
      duration: mapDurationForAPI(planDuration)
    };

    console.log("البيانات للتحقق (قبل الإرسال):", requestPayload);

    // --- 4. تنفيذ التحقق باستخدام Zod ---
    const validationResult = subscriptionRequestSchema.safeParse(requestPayload);

    if (!validationResult.success) {
      const fieldErrors = {};
      validationResult.error.issues.forEach(issue => {
        const path = issue.path[0]; // اسم الحقل
        if (!fieldErrors[path]) { // أضف أول خطأ فقط لكل حقل
          fieldErrors[path] = issue.message;
        }
      });
      setFormErrors(fieldErrors);
      setLoading(false); // أوقف التحميل إذا كان هناك خطأ في التحقق
      // setError("يرجى تصحيح الأخطاء المميزة في النموذج."); // رسالة خطأ عامة (اختياري)
      // عرض الأخطاء تحت كل حقل سيكون كافياً
      // إذا كان حقل الباقة أو المدة فارغاً بشكل غير متوقع (لا يجب أن يحدث إذا تم اختيار selectedPlanId)
      if (!requestPayload.plan || !requestPayload.duration) {
        setError("خطأ في تحديد الباقة أو المدة. يرجى إعادة اختيار الباقة.");
      }
      return;
    }
    // إذا نجح التحقق، استخدم validationResult.data (يحتوي على البيانات المتحقق منها)
    const validatedData = validationResult.data;
    // ------------------------------------

    setLoading(true); // ابدأ التحميل لإرسال الطلب

    console.log("البيانات المرسلة للـ API (بعد التحقق):", validatedData);

    try {
      const response = await api.post('/user/user-premium', validatedData, { // إرسال البيانات المتحقق منها
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response from API:', response.data);
      if (response.data && response.data.error) {
        if (response.data.error === "This user already send premium request") {
          setError("لقد قمت بالفعل بإرسال طلب اشتراك سابق. يرجى انتظار مراجعته أو التواصل مع الدعم.");
        } else {
          setError(response.data.error || "حدث خطأ ما من الخادم.");
        }
        setSuccessMessage('');
      } else if (response.data && response.data.message) {
        setSuccessMessage(response.data.message || "تم إرسال طلب اشتراكك بنجاح! سيتم التواصل معك قريبًا.");
        setError(null);
      } else {
        setSuccessMessage("تم إرسال طلب اشتراكك بنجاح! سيتم التواصل معك قريبًا.");
        setError(null);
      }
    } catch (apiError) {
      console.error("خطأ أثناء إرسال طلب الاشتراك (catch block):", apiError);
      let errorMessageToDisplay = "حدث خطأ غير متوقع أثناء إرسال طلبك.";
      if (apiError.response) {
        const responseData = apiError.response.data;
        const statusCode = apiError.response.status;
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
        } else if (responseData && responseData.errors) { // أخطاء التحقق من الباك-اند
            const backendValidationErrors = {};
            for (const key in responseData.errors) {
                backendValidationErrors[key] = responseData.errors[key].join(', ');
            }
            setFormErrors(prev => ({...prev, ...backendValidationErrors})); // دمج مع أخطاء الواجهة الأمامية أو استبدالها
            errorMessageToDisplay = "فشل التحقق من البيانات من جهة الخادم. يرجى مراجعة الحقول.";
        }
      } else if (apiError.request) {
        errorMessageToDisplay = "لا يمكن الوصول إلى الخادم. يرجى التحقق من اتصالك بالإنترنت.";
      } else {
        errorMessageToDisplay = apiError.message;
      }
      setError(errorMessageToDisplay);
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlanFullDetails = () => { /* ... كما هو ... */ };
  const selectedPlanFullDetails = getSelectedPlanFullDetails();

  useEffect(() => { /* ... كما هو ... */ }, [selectedPeriodsForPlans, formData.selectedPlanId, user]);
  if (loading && (!user || !token)) { /* ... كما هو ... */ }
  if (!user || !token) { /* ... كما هو ... */ }

  return (
    <Container className="agent-subscription-page py-5" dir="rtl">
      {/* ... قسم اختيار الباقات كما هو ... */}
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
                      {/* ... محتوى بطاقة الباقة كما هو ... */}
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
                {successMessage && <Alert variant="success" className="text-center fs-5 py-3">{successMessage}</Alert>}
                {error && !successMessage && <Alert variant="danger" className="text-center fs-5 py-3">{error}</Alert>}

                {!successMessage && ( // لا تعرض الفورم إذا ظهرت رسالة نجاح
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                  <Col md={6}>
                      <Form.Group controlId="fullName">
                      <Form.Label>الاسم الكامل <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                          <InputGroup.Text className="form-icon-bg"><i className="bi bi-person-badge-fill form-icon"></i></InputGroup.Text>
                          <Form.Control 
                              type="text" 
                              name="fullName" 
                              value={formData.fullName} 
                              onChange={handleChange} 
                              placeholder="أدخل اسمك الثلاثي" 
                              isInvalid={!!formErrors.name} // <-- 5. إضافة isInvalid
                          />
                      </InputGroup>
                      {formErrors.name && <Form.Text className="text-danger ms-1 mt-1 d-block">{formErrors.name}</Form.Text>} {/* <-- 5. عرض الخطأ */}
                      </Form.Group>
                  </Col>
                  <Col md={6}>
                      <Form.Group controlId="officeName">
                      {/* إذا كان الحقل مطلوباً حسب الباك-اند، يجب إضافة النجمة هنا أيضاً */}
                      <Form.Label>اسم المكتب العقاري <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                          <InputGroup.Text className="form-icon-bg"><i className="bi bi-building form-icon"></i></InputGroup.Text>
                          <Form.Control 
                              type="text" 
                              name="officeName" 
                              value={formData.officeName} 
                              onChange={handleChange} 
                              placeholder="مثال: شركة النجوم العقارية"
                              isInvalid={!!formErrors.office_name}
                          />
                      </InputGroup>
                      {formErrors.office_name && <Form.Text className="text-danger ms-1 mt-1 d-block">{formErrors.office_name}</Form.Text>}
                      </Form.Group>
                  </Col>
                  <Col xs={12}>
                      <Form.Group controlId="officeAddress">
                      <Form.Label>عنوان المكتب <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                          <InputGroup.Text className="form-icon-bg"><i className="bi bi-geo-alt-fill form-icon"></i></InputGroup.Text>
                          <Form.Control 
                              type="text" 
                              name="officeAddress" 
                              value={formData.officeAddress} 
                              onChange={handleChange} 
                              placeholder="مثال: دمشق - شارع الحمرا - بناء الأمل"
                              isInvalid={!!formErrors.office_location}
                          />
                      </InputGroup>
                      {formErrors.office_location && <Form.Text className="text-danger ms-1 mt-1 d-block">{formErrors.office_location}</Form.Text>}
                      </Form.Group>
                  </Col>
                  <Col md={6}>
                      <Form.Group controlId="phoneNumber">
                      <Form.Label>رقم الهاتف <span className="text-danger">*</span></Form.Label>
                      <InputGroup>
                          <InputGroup.Text className="form-icon-bg"><i className="bi bi-telephone-fill form-icon"></i></InputGroup.Text>
                          <Form.Control 
                              type="tel" 
                              name="phoneNumber" 
                              value={formData.phoneNumber} 
                              onChange={handleChange} 
                              placeholder="مثال: 0912345678"
                              isInvalid={!!formErrors.phone}
                          />
                      </InputGroup>
                      {formErrors.phone && <Form.Text className="text-danger ms-1 mt-1 d-block">{formErrors.phone}</Form.Text>}
                      </Form.Group>
                  </Col>
                  <Col md={6}>
                      <Form.Group controlId="bio">
                      <Form.Label>نبذة بسيطة (اختياري)</Form.Label>
                      <InputGroup>
                          <InputGroup.Text className="form-icon-bg align-items-start pt-2"><i className="bi bi-info-circle-fill form-icon"></i></InputGroup.Text>
                          <Form.Control 
                              as="textarea" 
                              rows={1} 
                              name="bio" 
                              value={formData.bio} 
                              onChange={handleChange} 
                              placeholder="عنك أو عن مكتبك..." 
                              style={{ minHeight: 'calc(1.5em + 0.75rem + 2px)' }}
                              isInvalid={!!formErrors.about}
                          />
                      </InputGroup>
                      {formErrors.about && <Form.Text className="text-danger ms-1 mt-1 d-block">{formErrors.about}</Form.Text>}
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
                          isInvalid={!!formErrors.plan || !!formErrors.duration || (!formData.selectedPlanId && Object.keys(formErrors).length > 0 && !successMessage && !error)} // يظهر خطأ إذا لم يتم الاختيار والضغط على إرسال
                          />
                      </InputGroup>
                      {selectedPlanFullDetails && <small className="text-muted d-block mt-1 form-text-offset-icon">السعر: {selectedPlanFullDetails.price} {selectedPlanFullDetails.periodSuffix}</small>}
                      {/* عرض خطأ خاص بالباقة أو المدة إذا لم يتم الاختيار */}
                      {(formErrors.plan || formErrors.duration) && (
                          <Form.Text className="text-danger ms-1 mt-1 d-block">
                          {formErrors.plan || formErrors.duration || "الرجاء اختيار باقة وفترة صالحة."}
                          </Form.Text>
                      )}
                      {!formData.selectedPlanId && Object.keys(formErrors).length > 0 && !successMessage && !error && !formErrors.plan && !formErrors.duration && (
                          <Form.Text className="text-danger ms-1 mt-1 d-block">الرجاء اختيار باقة وفترة اشتراك.</Form.Text>
                      )}
                      </Form.Group>
                  </Col>
                  </Row>
                  <div className="payment-methods-section my-4">
                  {/* ... طرق الدفع كما هي ... */}
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
                  <div className="d-grid sub-send mt-4">
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