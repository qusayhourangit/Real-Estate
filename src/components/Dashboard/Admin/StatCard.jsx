import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';
import CountUp from 'react-countup'; // استيراد CountUp هنا إذا أردت استخدامه داخل الكارد

// Variant خاص بكل كارد إحصائية
const statCardVariant = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};


// دالة لتحديد الأيقونة واللون بناءً على العنوان أو مفتاح
const getStatStyle = (key) => {
    switch (key) {
        case 'totalProperties': return { icon: 'bi-buildings-fill', color: 'primary' };
        case 'pendingProperties': return { icon: 'bi-clock-history', color: 'warning' };
        case 'approvedProperties': return { icon: 'bi-building-check', color: 'success' };
        case 'propertiesForSale': return { icon: 'bi-tags-fill', color: 'info' };
        case 'propertiesForRent': return { icon: 'bi-key-fill', color: 'secondary' };
        case 'totalUsers': return { icon: 'bi-people-fill', color: 'dark' };
        case 'activeUsers': return { icon: 'bi-person-check-fill', color: 'success' };
        case 'blockedUsers': return { icon: 'bi-person-x-fill', color: 'danger' };
        case 'recentSignups': return { icon: 'bi-person-plus-fill', color: 'primary' };
        default: return { icon: 'bi-question-circle', color: 'muted' }; // افتراضي
    }
};

// مكون الكارد المحسن
const StatCard = ({ title, value, statKey }) => {
  const { icon, color } = getStatStyle(statKey); // الحصول على الأيقونة واللون
  const valueIsNumber = typeof value === 'number';

  return (
    // تطبيق motion على العمود الذي يحتوي الكارد
    <motion.div className="col" variants={statCardVariant}>
      <Card className={`stat-card-improved shadow-sm border-0 h-100 overflow-hidden`}>
        <Card.Body className="d-flex align-items-center p-3">
           {/* دائرة الأيقونة */}
          <div className={`stat-icon-circle bg-soft-${color} text-${color} me-3`}>
            <i className={`bi ${icon}`}></i>
          </div>
           {/* النص والقيمة */}
          <div className="flex-grow-1">
            <h6 className={`stat-title text-muted text-uppercase small mb-1`}>{title}</h6>
            <div className={`stat-value h3 fw-bold mb-0 text-${color}`}>
              {value === null || value === undefined ? (
                <Spinner size="sm" animation="border" variant={color} />
              ) : valueIsNumber ? (
                  // استخدام CountUp هنا لتحريك الأرقام
                 <CountUp end={value} duration={2} separator="," />
              ) : (
                 value // عرض القيمة كما هي إذا لم تكن رقمًا
              )}
            </div>
          </div>
        </Card.Body>
         {/* (اختياري) إضافة شريط سفلي بلون مميز */}
         <div className={`card-footer-line bg-${color}`}></div>
      </Card>
    </motion.div>
  );
};
export default StatCard;