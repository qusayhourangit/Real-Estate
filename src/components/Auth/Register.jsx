import React, { useState, useEffect } from 'react';
import { Container, Alert, Form, Button, Card, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../API/api';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useDispatch } from 'react-redux'; // <-- 1. استيراد useDispatch
import { loginUser } from '../../redux/authSlice'; // <-- 2. استيراد loginUser

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
    .password-input-group .input-group-text {
    cursor: pointer;
    background-color: transparent;
    border-right: 0; 
    border-left: 1px solid #ced4da;
  }
  .password-input-group .form-control {
    border-left: 0;
    border-right: 1px solid #ced4da;
  }
  .password-input-group .form-control[dir="rtl"] {
    border-right: 0;
    border-left: 1px solid #ced4da;
  }
  .password-input-group .form-control[dir="rtl"] + .input-group-text {
    border-left: 0;
    border-right: 1px solid #ced4da; 
  }
 .password-input-group:hover .input-group-text {
    background-color:#e38e49;
    color:white;
    }
`;

const Register = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
   const dispatch = useDispatch(); // <-- 3. تهيئة dispatch
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState(''); 
    const [showPassword, setShowPassword] = useState(false);


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isRegistering }, // غيرت الاسم ليكون أوضح
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
      // --- خطوة 1: محاولة تسجيل الحساب الجديد ---
      console.log("Register.jsx: Attempting to register with data:", formData);
      const registrationResponse = await api.post('/register', formData);
      console.log("Register.jsx: Registration API response:", registrationResponse.data);

      if (registrationResponse.data && (registrationResponse.data.success || registrationResponse.status === 201 || registrationResponse.status === 200) ) {
        setRegistrationSuccessMessage('تم إنشاء الحساب بنجاح! جاري تسجيل دخولك...');
        
        // --- خطوة 2: محاولة تسجيل الدخول تلقائيًا ---
        const loginCredentials = {
          email: formData.email,
          password: formData.password
        };
        console.log("Register.jsx: Attempting auto-login with credentials:", loginCredentials);

        // استخدام loginUser thunk من Redux
        dispatch(loginUser(loginCredentials))
          .unwrap() // استخدام unwrap للحصول على النتيجة أو الخطأ مباشرة
          .then((loginResult) => {
            // loginResult هنا هو action.payload عند النجاح
            console.log("Register.jsx: Auto-login successful:", loginResult);
            // لا حاجة لرسالة نجاح هنا، سيتم التوجيه
            navigate('/'); // توجيه إلى الصفحة الرئيسية
          })
          .catch((loginError) => {
            // loginError هنا هو action.payload عند الفشل (الذي تم إرجاعه من rejectWithValue)
            console.error("Register.jsx: Auto-login failed after registration:", loginError);
            setServerError(`تم التسجيل بنجاح، ولكن فشل تسجيل الدخول التلقائي: ${loginError || 'يرجى تسجيل الدخول يدويًا.'}`);
            // يمكنك توجيه المستخدم لصفحة تسجيل الدخول مع رسالة
            setTimeout(() => { // تأخير بسيط لرؤية رسالة التسجيل
                navigate('/login', { state: { success: 'تم التسجيل بنجاح، يرجى تسجيل الدخول الآن.' } });
            }, 2000);
          });

      } else {
        // إذا لم تكن استجابة التسجيل ناجحة كما هو متوقع
        setServerError(registrationResponse.data?.message || 'فشل إنشاء الحساب، استجابة غير متوقعة من الخادم.');
      }

    } catch (err) {
      console.error("Register.jsx: Registration API error:", err.response?.data || err.message);
      setServerError(err.response?.data?.message || 'حدث خطأ أثناء التسجيل. الرجاء المحاولة مرة أخرى');
    }
  };
const togglePasswordVisibility = () => {
    setShowPassword(prevShowPassword => !prevShowPassword);
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
           {registrationSuccessMessage && !serverError && ( // عرض رسالة نجاح التسجيل فقط إذا لم يكن هناك خطأ
            <Alert variant="success" className="text-center">
              {registrationSuccessMessage}
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
              <Form.Control.Feedback type="invalid" className={errors.password ? 'd-block' : ''}> {/* d-block لإظهارها دائمًا */}
                {errors.password?.message}
              </Form.Control.Feedback>
              {!errors.password && ( // عرض التلميح فقط إذا لم يكن هناك خطأ
                <Form.Text className="text-muted">
                  يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل وتشمل حروف كبيرة وصغيرة وأرقام.
                </Form.Text>
              )}
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit"
                disabled={isRegistering} // استخدام isRegistering من formState
                className="py-2"
              >
                {isRegistering ? (
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