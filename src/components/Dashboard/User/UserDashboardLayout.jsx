import React from 'react';
import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';

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

const UserDashboardLayout = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container fluid className="dashboard-container my-4" dir="rtl">
      <Row>
        <Col md={3} lg={2} className="sidebar-col">
          <Nav className="flex-column sidebar-nav sticky-top shadow-sm p-3 rounded bg-light">
            <div className="sidebar-header mb-3 text-center">
              <i className="bi bi-person-circle fs-1 text-primary"></i>
              <h5 className="mt-2 mb-0">{user?.name || 'ملف المستخدم'}</h5>
              <small className="text-muted">{user?.email}</small>
            </div>
            <hr />
            <NavLink to="/dashboard/saved" className="nav-link" end>
              <i className="bi bi-heart-fill me-2"></i>
              <span>العقارات المحفوظة</span>
            </NavLink>
            <NavLink to="/dashboard/my-properties" className="nav-link">
              <i className="bi bi-building me-2"></i>
              <span>عقاراتي</span>
            </NavLink>
            <NavLink to="/dashboard/settings" className="nav-link">
              <i className="bi bi-gear-fill me-2"></i>
              <span>إعدادات الحساب</span>
            </NavLink>
            <hr />
            <NavLink to="/" className="nav-link text-muted small">
              <i className="bi bi-arrow-left-square me-2"></i>
              <span>العودة للرئيسية</span>
            </NavLink>
          </Nav>
        </Col>
        <Col md={9} lg={10} className="main-content-col">
           <AnimatedOutlet />
        </Col>
      </Row>
    </Container>
  );
};

export default UserDashboardLayout;
