// AdminDashboardLayout.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './DashboardAdmin.css';
import { useSelector, useDispatch } from 'react-redux'; // useDispatch مضافة
import { logout as logoutAction } from '../../../redux/authSlice'; // افترض أن لديك action بهذا الاسم

// ... (pageVariants, pageTransition, AnimatedOutlet تبقى كما هي) ...
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.4 };

const AnimatedOutlet = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="main-content-wrapper"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <div className="main-content p-3 border rounded shadow-sm bg-white">
          <Outlet />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};


const AdminDashboardLayout = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch(); // للحصول على دالة dispatch
    const location = useLocation();

    const handleLogout = () => {
      dispatch(logoutAction()); // استدعاء action الخروج من Redux
      // التوجيه لصفحة تسجيل الدخول أو الرئيسية بعد الخروج
      // navigate('/login'); // إذا كنت تستخدم useNavigate هنا
    };


    if (!isAuthenticated && !window.location.pathname.includes('/login')) {
     return <Navigate to="/login" replace />;
   }
   if (isAuthenticated && user?.role !== 'admin') {
     console.warn("Access denied: User is not an admin.");
     return <Navigate to="/unauthorized" replace />; // صفحة مخصصة لغير المصرح لهم
   }

  return (
    <Container fluid className="dashboard-container my-4" dir='rtl'>
    <Row>
      <Col md={3} lg={2} className="sidebar-col">
        <Nav className="flex-column sidebar-nav sticky-top shadow-sm p-3 rounded bg-light">
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
          {/* ================== الرابط الجديد هنا ================== */}
          <NavLink to="/admin/subscription-requests" className="nav-link">
            <i className="bi bi-person-check-fill me-2"></i>
            <span>طلبات الاشتراك</span>
          </NavLink>
          {/* ====================================================== */}
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

             <span> العودة للموقع </span>
          </NavLink>
          <Button
              variant="outline-danger"
              size="sm"
              className="mt-3 w-100 logout-btn-sidebar"
              onClick={handleLogout} //  استخدام دالة handleLogout
          >
             <i className="bi bi-box-arrow-right me-2"></i>
             <span>تسجيل الخروج</span>
          </Button>
        </Nav>
      </Col>

      <Col md={9} lg={10} className="main-content-col">
         <AnimatedOutlet />
      </Col>
    </Row>
  </Container>
  );
};

export default AdminDashboardLayout;