import React, { useState, useEffect } from 'react';
import { Container, Alert, Form, Button, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../API/api';
import 'bootstrap-icons/font/bootstrap-icons.css';

const registerSchema = z.object({
  name: z.string()
    .min(3, 'يجب أن يكون الاسم 3 أحرف على الأقل')
    .max(50, 'يجب أن لا يتجاوز الاسم 50 حرف'),
  email: z.string()
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .min(5, 'يجب أن يكون البريد الإلكتروني 5 أحرف على الأقل')
    .max(100, 'يجب أن لا يتجاوز البريد الإلكتروني 100 حرف'),
  password: z.string()
    .min(6, 'يجب أن تكون كلمة المرور 6 أحرف على الأقل')
    .max(50, 'يجب أن لا تتجاوز كلمة المرور 50 حرف')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل')
});

const customStyles = `
  .btn-primary, .bg-primary {
    background-color: #e38e49 !important;
    border-color: #e38e49 !important;
  }
  .card-header {
    background-color: #e38e49 !important;
  }
  .alert-primary {
    background-color: rgba(72, 166, 167, 0.2) !important;
    border-color: rgba(72, 166, 167, 0.3) !important;
    color: #e38e49 !important;
  }
  .card {
    direction: rtl;
  }
  .form-control, .form-select {
    text-align: right;
  }
  .form-label i {
    margin-left: 8px;
  }
`;

const Register = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  const onSubmit = async (formData) => {
    setServerError('');
    
    try {
      const response = await api.post('/register', formData);
      navigate('/login', { 
        state: { success: 'تم التسجيل بنجاح! الرجاء تسجيل الدخول' } 
      });
    } catch (err) {
      setServerError(err.response?.data?.message || 'حدث خطأ أثناء التسجيل. الرجاء المحاولة مرة أخرى');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="w-100 shadow-lg" style={{ maxWidth: '500px' }}>
        <Card.Header className="text-white text-center py-3">
          <h4 className="mb-0">
            <i className="bi bi-person-plus me-2"></i>إنشاء حساب جديد
          </h4>
        </Card.Header>
        <Card.Body className="p-4">
          {serverError && (
            <Alert variant="danger" className="text-center" dismissible onClose={() => setServerError('')}>
              {serverError}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <i className="bi bi-person"></i> الاسم الكامل
              </Form.Label>
              <Form.Control
                type="text"
                {...register('name')}
                isInvalid={!!errors.name}
                dir="rtl"
              />
              <Form.Control.Feedback type="invalid">
                {errors.name?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <i className="bi bi-envelope"></i> البريد الإلكتروني
              </Form.Label>
              <Form.Control
                type="email"
                {...register('email')}
                isInvalid={!!errors.email}
                dir="rtl"
              />
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="d-flex align-items-center">
                <i className="bi bi-lock"></i> كلمة المرور
              </Form.Label>
              <Form.Control
                type="password"
                {...register('password')}
                isInvalid={!!errors.password}
                dir="rtl"
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
              {!errors.password && (
                <Form.Text className="text-muted">
                  يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل وتشمل حروف كبيرة وصغيرة وأرقام
                </Form.Text>
              )}
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting}
                className="py-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2"></i> تسجيل
                  </>
                )}
              </Button>
            </div>

            <div className="text-center mt-4">
              <span className="text-muted">لديك حساب بالفعل؟ </span>
              <Link to="/login" className="text-decoration-none">
                <i className="bi bi-box-arrow-in-right me-1"></i> تسجيل الدخول
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;