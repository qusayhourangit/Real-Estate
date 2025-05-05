import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/authSlice'; // استيراد أكشن loginUser من السلايس

const loginSchema = z.object({
  email: z.string()
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .min(5, 'يجب أن يكون البريد الإلكتروني 5 أحرف على الأقل')
    .max(100, 'يجب أن لا يتجاوز البريد الإلكتروني 100 حرف'),
  password: z.string()
    .min(6, 'يجب أن تكون كلمة المرور 6 أحرف على الأقل')
    .max(50, 'يجب أن لا تتجاوز كلمة المرور 50 حرف')
});

const customStyles = `
  .btn-primary, .bg-primary { background-color: #e38e49 !important; border-color: #e38e49 !important; }
  .card-header { background-color: #e38e49 !important; }
  .alert-primary { background-color: rgba(72, 166, 167, 0.2) !important; border-color: rgba(72, 166, 167, 0.3) !important; color: #e38e49 !important; }
  .card { direction: rtl; }
  .form-control, .form-select { text-align: right; }
  .form-label i { margin-left: 8px; }
`;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { error, loading, success } = useSelector((state) => state.auth); // قراءة حالة المصادقة من Redux
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
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
    setServerSuccess('');
  
    dispatch(loginUser(formData))
      .then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          setServerSuccess('تم تسجيل الدخول بنجاح');
          navigate('/');
        } else {
          const errorMessage = result.payload || 'فشل تسجيل الدخول';
  
          // التحقق من إذا كان المستخدم محظور
          if (
            typeof errorMessage === 'string' &&
            errorMessage.toLowerCase().includes('banned')
          ) {
            setServerError('تم حظر حسابك. الرجاء التواصل مع الإدارة.');
          } else {
            setServerError(errorMessage); // اظهر الرسالة الحقيقية من الـ API
          }
        }
      })
      .catch((err) => {
        setServerError(err.message || 'حدث خطأ غير متوقع');
      });
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="w-100 shadow-lg" style={{ maxWidth: '500px' }}>
        <Card.Header className="text-white text-center py-3">
          <h4 className="mb-0">
            <i className="bi bi-box-arrow-in-right me-2"></i>تسجيل الدخول
          </h4>
        </Card.Header>
        <Card.Body className="p-4">
          {serverError && (
            <Alert variant="danger" className="text-center" dismissible onClose={() => setServerError('')}>
              {serverError}
            </Alert>
          )}

          {serverSuccess && (
            <Alert variant="success" className="text-center">
              {serverSuccess}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3" controlId="email">
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

            <Form.Group className="mb-4" controlId="password">
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
            </Form.Group>

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting || loading} // تعطيل الزر أثناء التحميل
                className="py-2"
              >
                {isSubmitting || loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i> تسجيل الدخول
                  </>
                )}
              </Button>
            </div>

            <div className="text-center mt-4">
              <span className="text-muted">ليس لديك حساب؟ </span>
              <Link to="/register" className="text-decoration-none">
                <i className="bi bi-person-plus me-1"></i> اضغط هنا للتسجيل
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
