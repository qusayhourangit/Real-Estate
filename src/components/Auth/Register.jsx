import React, { useState, useEffect } from 'react';
import { Container, Alert, Form, Button, Card, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../API/api';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../redux/authSlice';

// 1. تحديث Zod Schema
const registerSchema = z.object({
  name: z.string()
    .min(2, 'يجب أن يكون الاسم حرفين على الأقل')
    .max(100, 'يجب أن لا يتجاوز الاسم 100 حرف'),
  email: z.string()
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .max(100, 'يجب أن لا يتجاوز البريد الإلكتروني 100 حرف'),
  password: z.string()
    .min(8, 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'),
  password_confirmation: z.string() //  حقل جديد
    .min(8, 'يجب أن تكون كلمة مرور التأكيد 8 أحرف على الأقل'), //  يمكنك إضافة قواعد مشابهة لكلمة المرور
})
  .refine((data) => data.password === data.password_confirmation, { //  التحقق من تطابق كلمتي المرور
    message: "كلمة المرور غير متطابقة .",
    path: ["password_confirmation"], //  عرض الخطأ تحت حقل تأكيد كلمة المرور
  });
const translateErrorMessage = (msg) => {
  switch (msg.toLowerCase()) {
    case "the email has already been taken.":
      return "البريد الإلكتروني مسجل مسبقاً.";
    case "the password confirmation does not match.":
      return "كلمة المرور غير متطابقة .";
    case "the email must be a valid email address.":
      return "صيغة البريد الإلكتروني غير صحيحة.";
    case "the password must be at least 8 characters.":
      return "يجب أن تكون كلمة المرور 8 أحرف على الأقل.";
    case "the name must be at least 2 characters.":
      return "يجب أن يكون الاسم حرفين على الأقل.";
    default:
      return msg;
  }
};
const customStyles = `
.btn-primary, .bg-primary { background-color: #e38e49 !important; border-color: #e38e49 !important; }
 .card-header { background-color: #e38e49 !important; } 
 .alert-primary { background-color: rgba(72, 166, 167, 0.2) !important; border-color: rgba(72, 166, 167, 0.3) !important; color: #e38e49 !important; } 
 .card { direction: rtl; } .form-control, 
 .form-select { text-align: right; } 
 .form-label i { margin-left: 8px; } 
 .password-input-group 
 .input-group-text { cursor: pointer; background-color: transparent; border-right: 0;  border-left: 1px solid #ced4da; } 
 .password-input-group
  .form-control { border-left: 0; border-right: 1px solid #ced4da; }
   .password-input-group 
   .form-control[dir="rtl"] { border-right: 0; border-left: 1px solid #ced4da; }
    .password-input-group .form-control[dir="rtl"] + 
    .input-group-text { border-left: 0; border-right: 1px solid #ced4da;  } 
   .input-group-text:hover {
    background-color:#e38e49;
    color:white;
    }`;

const Register = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const dispatch = useDispatch();
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // حالة جديدة لحقل التأكيد


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isRegistering },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { // 3. تحديث القيم الافتراضية
      name: '',
      email: '',
      password: '',
      password_confirmation: '' //  إضافة القيمة الافتراضية
    }
  });

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  // دالة onSubmit تبقى كما هي تقريبًا، لأن formData سيحتوي على password_confirmation
  
const onSubmit = async (formData) => {
  console.log("--- onSubmit triggered in Register.jsx ---");
  console.log("Form Data to be sent:", formData);

  setServerError('');
  setRegistrationSuccessMessage('');

  try {
    const response = await api.post('/register', formData);
    console.log("✅ Register response:", response);

    const data = response.data;

    if (response.status === 201 || (data && (data.success || data.status === 'success'))) {
      setRegistrationSuccessMessage('تم إنشاء الحساب بنجاح! جاري تسجيل دخولك...');

      const loginCredentials = {
        email: formData.email,
        password: formData.password,
      };

      dispatch(loginUser(loginCredentials))
        .unwrap()
        .then(() => {
          navigate('/');
        })
        .catch((loginError) => {
          setServerError(`تم التسجيل، ولكن فشل تسجيل الدخول التلقائي: ${loginError?.message || loginError || 'يرجى تسجيل الدخول يدويًا.'}`);
          setTimeout(() => {
            navigate('/login', {
              state: { successMessage: 'تم التسجيل بنجاح، يرجى تسجيل الدخول الآن.' },
            });
          }, 3000);
        });

    } else {
      let errorMessage = 'حدث خطأ غير متوقع أثناء إنشاء الحساب.';
      if (data && data.error && typeof data.error === 'object') {
        const messages = Object.values(data.error).flat();
        const translated = messages.map(translateErrorMessage);
        errorMessage = translated.join(' ');
      } else if (data && data.message) {
        errorMessage = data.message;
      }
      console.warn("Registration logical error (non-4xx/5xx response):", data);
      setServerError(errorMessage);
    }

  } catch (err) {
    console.error("❌ Error during registration (catch block):", err);

    if (err.response && err.response.data) {
      const responseData = err.response.data;
      let serverErrorMessage = 'فشل إنشاء الحساب، يرجى المحاولة لاحقًا.';

      if (responseData.error && typeof responseData.error === 'object') {
        const errorMessages = [];
        for (const key in responseData.error) {
          if (Array.isArray(responseData.error[key])) {
            responseData.error[key].forEach(msg => {
              errorMessages.push(translateErrorMessage(msg));
            });
          }
        }
        if (errorMessages.length > 0) {
          serverErrorMessage = errorMessages.join(' ');
        } else if (responseData.message) {
          serverErrorMessage = responseData.message;
        }

      } else if (responseData.message && typeof responseData.message === 'string') {
        serverErrorMessage = responseData.message;
      } else if (typeof responseData === 'string') {
        serverErrorMessage = responseData;
      }

      setServerError(serverErrorMessage);

    } else if (err.request) {
      setServerError('فشل الاتصال بالخادم. الرجاء التحقق من اتصالك بالإنترنت.');
    } else {
      setServerError('حدث خطأ غير متوقع أثناء إعداد الطلب.');
    }
  }
};
  const togglePasswordVisibility = () => {
    setShowPassword(prevShowPassword => !prevShowPassword);
  };

  const toggleConfirmPasswordVisibility = () => { //  دالة جديدة لحقل التأكيد
    setShowConfirmPassword(prevShowConfirmPassword => !prevShowConfirmPassword);
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
            <Alert variant="danger" className="text-center"  onClose={() => setServerError('')}>
              {serverError}
            </Alert>
          )}
          {registrationSuccessMessage && !serverError && (
            <Alert variant="success" className="text-center">
              {registrationSuccessMessage}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* حقل الاسم */}
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

            {/* حقل البريد الإلكتروني */}
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

            {/* حقل كلمة المرور */}
            <Form.Group className="mb-3"> {/* تم تغيير mb-4 إلى mb-3 */}
              <Form.Label className="d-flex align-items-center">
                <i className="bi bi-lock"></i> كلمة المرور
              </Form.Label>
              <InputGroup className="password-input-group">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  isInvalid={!!errors.password}
                  dir="rtl"
                />
                <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </InputGroup.Text>
              </InputGroup>
              <Form.Control.Feedback type="invalid" className={errors.password ? 'd-block' : ''}>
                {errors.password?.message}
              </Form.Control.Feedback>
              {/* يمكنك إبقاء التلميح أو تعديله إذا أردت */}
              {!errors.password && (
                <Form.Text className="text-muted">
                  يجب أن تكون كلمة المرور 8 أحرف على الأقل.
                </Form.Text>
              )}
            </Form.Group>

            {/* 2. إضافة حقل تأكيد كلمة المرور في JSX */}
            <Form.Group className="mb-4">
              <Form.Label className="d-flex align-items-center">
                <i className="bi bi-shield-lock"></i> تأكيد كلمة المرور
              </Form.Label>
              <InputGroup className="password-input-group">
                <Form.Control
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('password_confirmation')}
                  isInvalid={!!errors.password_confirmation}
                  dir="rtl"
                />
                <InputGroup.Text onClick={toggleConfirmPasswordVisibility} style={{ cursor: 'pointer' }}>
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </InputGroup.Text>
              </InputGroup>
              <Form.Control.Feedback type="invalid" className={errors.password_confirmation ? 'd-block' : ''}>
                {errors.password_confirmation?.message}
              </Form.Control.Feedback>
            </Form.Group>


            <div className="d-grid gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isRegistering}
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