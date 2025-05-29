// src/components/PricingSectionHome.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ButtonGroup } from 'react-bootstrap';
import "bootstrap-icons/font/bootstrap-icons.css";
import './PricingSectionHome.css';

const pricingPlansData = [
  {
    id: "basic",
    name: "الأساسية",
    icon: "bi-star",
    recommended: false,
    periods: {
      monthly: {
        label: "شهرياً",
        price: "49,000",
        periodSuffix: " ل.س/شهرياً",
        features: ["عرض حتى 10 عقارات", "ظهور مميز محدود", "شارة وكيل موثوق"],
        planId: "basic_monthly"
      },
      quarterly: {
        label: "كل 3 أشهر",
        price: "135,000",
        periodSuffix: " ل.س/3 أشهر",
        features: ["عرض حتى 10 عقارات", "ظهور مميز محدود", "شارة وكيل موثوق"],
        planId: "basic_quarterly"
      },
      annually: {
        label: "سنوياً",
        price: "470,000",
        periodSuffix: " ل.س/سنوياً",
        features: ["عرض حتى 10 عقارات", "ظهور مميز محدود", "شارة وكيل موثوق"],
        planId: "basic_annually"
      },
    }
  },
  {
    id: "pro",
    name: "الاحترافية",
    icon: "bi-briefcase-fill",
    recommended: true,
    periods: {
      monthly: {
        label: "شهرياً",
        price: "89,000",
        periodSuffix: " ل.س/شهرياً",
        features: ["عرض حتى 50 عقاراً", "ظهور مميز دائم", "شارة وكيل موثوق"],
        planId: "pro_monthly"
      },
      quarterly: {
        label: "كل 3 أشهر",
        price: "250,000",
        periodSuffix: " ل.س/3 أشهر",
        features: ["عرض حتى 50 عقاراً", "ظهور مميز دائم", "شارة وكيل موثوق"],
        planId: "pro_quarterly"
      },
      annually: {
        label: "سنوياً",
        price: "850,000",
        periodSuffix: " ل.س/سنوياً",
        features: ["عرض حتى 50 عقاراً", "ظهور مميز دائم", "شارة وكيل موثوق"],
        planId: "pro_annually"
      },
    }
  },
  {
    id: "gold",
    name: "الذهبية",
    icon: "bi-gem",
    recommended: false,
    periods: {
      monthly: {
        label: "شهرياً",
        price: "149,000",
        periodSuffix: "  ل.س/شهرياً",
        features: ["عرض لا محدود من العقارات", "أولوية الظهور بالبحث", "شارة وكيل موثوق"],
        planId: "gold_monthly"
      },
      quarterly: {
        label: "كل 3 أشهر",
        price: "400,000",
        periodSuffix: " ل.س/3 أشهر",
        features: ["عرض لا محدود من العقارات", "أولوية الظهور بالبحث", "شارة وكيل موثوق"],
        planId: "gold_quarterly"
      },
      annually: {
        label: "سنوياً",
        price: "1,500,000",
        periodSuffix: " ل.س/سنوياً ",
        features: ["عرض لا محدود من العقارات", "أولوية الظهور بالبحث", "شارة وكيل موثوق"],
        planId: "gold_annually"
      },
    }
  }
];


const PricingSectionHome = () => {
  const navigate = useNavigate();
  const [selectedPeriods, setSelectedPeriods] = useState(() => {
    const initial = {};
    pricingPlansData.forEach(plan => {
      initial[plan.id] = plan.periods.quarterly ? 'quarterly' : 'monthly';
    });
    return initial;
  });

  const handlePeriodChange = (planId, periodKey) => {
    setSelectedPeriods(prev => ({ ...prev, [planId]: periodKey }));
  };

  const handleSubscribe = (planId, periodKey) => {
    navigate('/premium', {
      state: { preSelectedPlanId: planId, preSelectedPeriod: periodKey }
    });
  };

  return (
    <section className="pricing-section-home mb-5 container py-5" dir="rtl">
      <Container>
        <div className="text-center mb-5 section-header-home">
          <h2 className="fw-bold section-title-home">باقات الاشتراك لوكلائنا</h2>
          <p className="text-muted lead section-subtitle-home">
            اختر الباقة التي تناسب احتياجاتك ونمّي أعمالك معنا.
          </p>
        </div>
        <Row className="justify-content-center g-4 g-lg-5">
          {pricingPlansData.map(plan => {
            const currentPeriod = selectedPeriods[plan.id];
            const details = plan.periods[currentPeriod];

            return (
              <Col md={6} lg={4} key={plan.id} className="d-flex align-items-stretch">
                <Card className={`home-pricing-card w-100 d-flex flex-column ${plan.recommended ? 'recommended' : ''}`}>
                  {plan.recommended && (
                    <div className="recommended-badge-home">الأكثر طلباً</div>
                  )}
                  <Card.Body className="d-flex flex-column p-4 p-lg-5">
                    <div className="text-center mb-4">
                      <i className={`bi ${plan.icon} plan-icon-home mb-3 ${plan.recommended ? 'icon-recommended' : 'icon-standard'}`}></i>
                      <h4 className="plan-name-home fw-bold">{plan.name}</h4>
                    </div>

                    <div className="mb-4 period-buttons-home text-center">
                      <ButtonGroup size="sm" className="w-100">
                        {Object.keys(plan.periods).map(periodKey => (
                          <Button
                            key={periodKey}
                            variant={currentPeriod === periodKey ? 'primary-active' : 'secondary-inactive'}
                            onClick={() => handlePeriodChange(plan.id, periodKey)}
                            className={`period-toggle-btn-home flex-fill ${currentPeriod === periodKey ? 'active' : ''}`}
                          >
                            {plan.periods[periodKey].label.replace('كل ', '').replace('شهرياً', 'شهر').replace('3 أشهر', '3 أشهر').replace('سنوياً', 'سنة')}
                          </Button>
                        ))}
                      </ButtonGroup>
                    </div>

                    <div className="text-center pricing-amount-wrapper-home mb-4" style={{ minHeight: '3.5rem' }}>
                      <span className="pricing-amount-home">{details.price}</span>
                      <span className="period-suffix-home ms-1">{details.periodSuffix}</span>
                    </div>

                    <ul className="list-unstyled features-list-home mb-5 flex-grow-1 px-2">
                      {details.features.map((feature, i) => (
                        <li key={i} className="mb-2 d-flex align-items-center">
                          <i className="bi bi-check-circle-fill text-success me-2 list-icon-check"></i>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.recommended ? "primary-solid" : "outline-primary"}
                      className="w-100 mt-auto subscribe-btn-home fw-bold"
                      onClick={() => handleSubscribe(plan.id, currentPeriod)}
                    >
                      اشترك الآن
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
};

export default PricingSectionHome;
