// components/common/CountdownTimer.jsx (أو أي مسار مناسب)
import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from 'react-bootstrap';

const CountdownTimer = ({ targetDate, onExpire }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (!targetDate) return;

    // التحقق إذا كان الوقت قد انتهى بالفعل عند تحميل المكون
    if (+new Date(targetDate) - +new Date() <= 0) {
      setTimeLeft({}); // لا يوجد وقت متبقي
      if (onExpire) onExpire();
      return;
    }

    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (Object.keys(newTimeLeft).length === 0 && onExpire) {
        onExpire(); // استدعاء onExpire عندما ينتهي العد
      }
    }, 1000);

    // تنظيف المؤقت عند إلغاء تحميل المكون أو تغيير targetDate
    return () => clearTimeout(timer);
  }, [timeLeft, targetDate, onExpire]); // إعادة تشغيل المؤقت عند تغيير timeLeft أو targetDate

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval] && interval !== 'days' && timerComponents.length === 0) {
      // لا تعرض الأصفار البادئة إلا إذا كانت الأيام صفرًا
      return;
    }
    if (timeLeft[interval] < 0) return; // تجاهل القيم السالبة (التي لا يجب أن تحدث مع المنطق الحالي)

    let label = '';
    switch (interval) {
      case 'days': label = 'أيام'; break;
      case 'hours': label = 'ساعات'; break;
      case 'minutes': label = 'دقائق'; break;
      case 'seconds': label = 'ثواني'; break;
      default: break;
    }
    if (label) {
      timerComponents.push(
        <span key={interval} className="mx-1">
          {timeLeft[interval]} {label}
        </span>
      );
    }
  });

  if (!targetDate) {
    return <Badge bg="light" text="dark" className="p-2">غير محدد</Badge>;
  }

  return (
    <Badge bg={Object.keys(timeLeft).length ? "info" : "danger"} className="p-2 countdown-badge">
      {timerComponents.length ? timerComponents : "انتهى الاشتراك"}
    </Badge>
  );
};

export default CountdownTimer;