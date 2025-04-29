// src/components/Auth/ProtectedRoute.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap'; // لعرض مؤشر تحميل

const ProtectedRoute = ({ children, allowedRoles }) => {
  // احصل على حالة المصادقة والتحميل والمستخدم من Redux
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  // 1. عرض مؤشر تحميل إذا كان Redux لا يزال يحمل (خاصة عند التحميل الأولي أو تسجيل الدخول)
  //    أو إذا كنت تستخدم initialLoading
  if (loading /* || initialLoading */) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" style={{ color: '#d6762e', width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  // 2. التحقق من المصادقة بعد انتهاء التحميل
  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login.");
    // أعد التوجيه لصفحة تسجيل الدخول مع حفظ المسار الحالي
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. التحقق من الدور (الصلاحية) إذا كانت مطلوبة
 

  // 4. إذا كان مصادقًا ولديه الدور المطلوب (أو لا يوجد دور مطلوب)
  return children; // اعرض المكون المحمي
};

export default ProtectedRoute;