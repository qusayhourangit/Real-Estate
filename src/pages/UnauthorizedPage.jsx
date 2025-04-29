import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Button, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  // دالة للعودة للصفحة السابقة
  const goBack = () => {
    navigate(-1); // يعود خطوة واحدة في تاريخ التصفح
  };

  return (
    <Container className="text-center my-5 py-5">
      <Alert variant="danger" className="p-4 shadow-sm">
        <i className="bi bi-exclamation-octagon-fill display-1 text-danger mb-3"></i>
        <h1 className="mt-3">غير مصرح بالوصول</h1>
        <hr />
        <p className="lead text-muted mb-4">
          عذرًا، ليس لديك الصلاحيات اللازمة لعرض هذه الصفحة. <br />
          قد يكون السبب أنك تحاول الوصول إلى منطقة مخصصة للمدراء وأنت مستخدم عادي، أو أنك غير مسجل الدخول.
        </p>
        <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
          <Button variant="outline-secondary" onClick={goBack} className="mb-2 mb-sm-0">
             <i className="bi bi-arrow-left-circle me-2"></i> العودة للصفحة السابقة
          </Button>
          <Link to="/" className="btn btn-primary" style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
             <i className="bi bi-house-door-fill me-2"></i> العودة إلى الرئيسية
          </Link>
           {/* يمكنك إضافة زر تسجيل الدخول إذا كان المستخدم غير مسجل */}
           {/*
           <Link to="/login" className="btn btn-success">
              <i className="bi bi-box-arrow-in-right me-2"></i> تسجيل الدخول
            </Link>
           */}
        </div>
      </Alert>
    </Container>
  );
};

export default UnauthorizedPage;