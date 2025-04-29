import React, { useContext } from 'react';
import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom'; // استيراد useLocation
import { Container, Row, Col, Nav, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion'; // <-- 1. استيراد motion و AnimatePresence
import 'bootstrap-icons/font/bootstrap-icons.css';
import './DashboardAdmin.css'; // ملف تنسيق خاص بداشبورد الأدمن
import { useSelector } from 'react-redux';

// --- 2. تعريف Variants لأنيميشن المحتوى ---
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20 // يبدأ من الأسفل قليلاً
  },
  in: {
    opacity: 1,
    y: 0 // يتحرك لمكانه الأصلي
  },
  out: {
    opacity: 0,
    y: -10 // يتحرك للأعلى قليلاً عند الخروج
  }
};
const AnimatedOutlet = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="main-content-wrapper" // يمكنك إزالة هذا الكلاس إذا لم يكن له تنسيقات خاصة
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {/* --- المحتوى الفعلي يأتي من Outlet --- */}
        <div className="main-content p-3 border rounded shadow-sm bg-white">
          <Outlet /> {/* عرض المكون الفرعي هنا */}
        </div>
        {/* -------------------------------- */}
      </motion.div>
    </AnimatePresence>
  );
};
// --- تعريف Transition ---
const pageTransition = {
  type: "tween", // نوع الانتقال (tween أكثر سلاسة من spring للانتقال بين الصفحات)
  ease: "anticipate", // تأثير Ease (يمكن تجربة "easeOut", "easeInOut")
  duration: 0.4 // مدة الأنيميشن
};
// ------------------------------------------

const AdminDashboardLayout = () => {
    const { isAuthenticated, user ,logout } = useSelector((state) => state.auth);
  const location = useLocation(); // <-- 3. الحصول على الموقع الحالي لمفتاح AnimatePresence

    if (!isAuthenticated && !window.location.pathname.includes('/login')) {
     return <Navigate to="/login" replace />;
   }
   if (isAuthenticated && user?.role !== 'admin') {
     console.warn("Access denied: User is not an admin.");
     return <Navigate to="/unauthorized" replace />;
   }
  // ----------------------------------------

  return (
    <Container fluid className="dashboard-container my-4" dir='rtl'>
    <Row>
      {/* القائمة الجانبية (بدون تغيير) */}
      <Col md={3} lg={2} className="sidebar-col">
        <Nav className="flex-column sidebar-nav sticky-top shadow-sm p-3 rounded bg-light">
          {/* ... محتويات القائمة الجانبية ... */}
          <div className="sidebar-header mb-3 text-center">
            <i className="bi bi-person-workspace fs-1"></i>
            <h5 className="mt-2 mb-0">{user?.name || 'لوحة تحكم الأدمن'}</h5>
            <small className="text-muted">{user?.email}</small>
          </div>
          <hr />
          <NavLink to="/admin/pending" className="nav-link" end>
            <i className="bi bi-clock-history me-2"></i>
            <span>العقارات المعلقة</span>
          </NavLink>
          <NavLink to="/admin/users" className="nav-link">
            <i className="bi bi-people-fill me-2"></i>
            <span>إدارة المستخدمين</span>
          </NavLink>
          <NavLink to="/admin/stats" className="nav-link">
            <i className="bi bi-bar-chart-line-fill me-2"></i>
            <span>إحصائيات الموقع</span>
          </NavLink>
          <hr />
          <NavLink to="/" className="nav-link text-muted small">
            <i className="bi bi-arrow-left-square me-2"></i>
            <span>العودة للموقع</span>
          </NavLink>
          <Button
              variant="outline-danger"
              size="sm"
              className="mt-3 w-100 logout-btn-sidebar"
              onClick={() => logout && logout()}
          >
             <i className="bi bi-box-arrow-right me-2"></i>
             <span>تسجيل الخروج</span>
          </Button>
        </Nav>
      </Col>

      {/* منطقة المحتوى للأدمن */}
      <Col md={9} lg={10} className="main-content-col">
         {/* --- 2. استخدام المكون الداخلي هنا --- */}
         <AnimatedOutlet />
         {/* ------------------------------------ */}
      </Col>
    </Row>
  </Container>
  );
};

export default AdminDashboardLayout;