import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert , InputGroup } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../redux/authSlice'; // استيراد أكشن loginUser من السلايس
import { motion, AnimatePresence } from 'framer-motion';

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
  .password-input-group .input-group-text {
    cursor: pointer;
    background-color: transparent; /* أو أي لون خلفية تفضله */
    border-right: 0; /* لإزالة الحد المزدوج إذا كان الحقل dir="rtl" */
    border-left: 1px solid #ced4da; /* إضافة حد أيسر ليتناسب مع التصميم */
  }
    .input-group-text:hover {
    background-color:#e38e49;
    color:white;
    }

  .password-input-group .form-control {
    border-left: 0; /* لإزالة الحد المزدوج */
    border-right: 1px solid #ced4da;
  }
  /* تعديل بسيط لـ RTL إذا كان dir="rtl" على الـ Form.Control */
  .password-input-group .form-control[dir="rtl"] {
    border-right: 0;
    border-left: 1px solid #ced4da;
  }
  .password-input-group .form-control[dir="rtl"] + .input-group-text {
    border-left: 0;
    border-right: 1px solid #ced4da; 
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { error, loading, success } = useSelector((state) => state.auth); // قراءة حالة المصادقة من Redux
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
          setServerError(result.payload || 'فشل تسجيل الدخول');
        }
      })
      .catch((err) => {
        setServerError(err.message || 'حدث خطأ غير متوقع');
      });
  };
    const togglePasswordVisibility = () => {
    setShowPassword(prevShowPassword => !prevShowPassword);
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
          <AnimatePresence>
            {serverError && (
              <motion.div
                key="error-alert"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="d-flex justify-content-center mt-3"
              >
                <div style={{ maxWidth: '400px', width: '100%' }}>
                  <Alert
                    variant="danger"
                    className="shadow-sm border border-danger-subtle fw-semibold px-3"
                    style={{ direction: 'rtl' }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill ms-2"></i>
                        <span>{serverError}</span> 
                      </div>
                    </div>
                  </Alert>  </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
          {serverSuccess && (
  <motion.div
    key="success-alert"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="d-flex justify-content-center mt-3"
  >
    <div style={{ maxWidth: '400px', width: '100%' }}>
      <Alert
        variant="success"
        dismissible
        onClose={() => setServerSuccess('')}
        className="shadow-sm border border-success-subtle text-end fw-semibold"
        style={{ direction: 'rtl' }}
      >
        <div className="d-flex align-items-center">
          <i className="bi bi-check-circle-fill ms-2 text-success fs-5"></i>
          <span className="flex-grow-1">تم تسجيل الدخول بنجاح ✅</span>
        </div>
      </Alert>
    </div>
  </motion.div>
)}
          </AnimatePresence>

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
              <InputGroup className="password-input-group"> {/* <--- استخدام InputGroup */}
                <Form.Control
                  type={showPassword ? 'text' : 'password'} // <--- تغيير النوع ديناميكيًا
                  {...register('password')}
                  isInvalid={!!errors.password}
                  dir="rtl" // مهم لتوجيه النص داخل الحقل
                />
                <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i> {/* <--- أيقونة العين */}
                </InputGroup.Text>
              </InputGroup>
              <Form.Control.Feedback type="invalid" className={errors.password ? 'd-block' : ''}> {/* d-block لإظهارها دائمًا إذا كان هناك خطأ */}
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
                    <i className="bi bi-box-arrow-in-right me-4"></i> تسجيل الدخول
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
