import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserLocally } from '../../../redux/authSlice'; //  تأكد من المسار الصحيح
import api from '../../../API/api'; //  تأكد من المسار الصحيح
import 'bootstrap-icons/font/bootstrap-icons.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const ProfileSettings = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); //  حالة جديدة للبريد الإلكتروني
  const [currentPasswordForVerification, setCurrentPasswordForVerification] = useState(''); //  كلمة المرور الحالية للتحقق
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || ''); //  تهيئة البريد الإلكتروني
    }
  }, [user]);

  const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmNewPasswordVisibility = () => setShowConfirmNewPassword(!showConfirmNewPassword);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage({ type: '', text: '' });

  if (!user || !user.id) {
    setMessage({ type: 'danger', text: 'خطأ: لا يمكن تحديد المستخدم.' });
    return;
  }

  if (!name.trim()) {
    setMessage({ type: 'danger', text: 'الرجاء إدخال الاسم.' });
    return;
  }
  if (!email.trim()) {
      setMessage({ type: 'danger', text: 'الرجاء إدخال البريد الإلكتروني.' });
      return;
  }

  //  إذا قررت إزالة حقل كلمة المرور الحالية من النموذج، احذف هذا التحقق
  //  وإلا، إذا أبقيته كإجراء شكلي للمستخدم، يمكنك إبقاء التحقق ولكن لا ترسله للـ API
  if (!currentPasswordForVerification.trim() && (newPassword.trim() || confirmNewPassword.trim())) {
      setMessage({ type: 'danger', text: 'الرجاء إدخال كلمة المرور الحالية إذا كنت ترغب في تغيير كلمة المرور (للتحقق المحلي فقط إذا كان الـ API لا يتطلبها).' });
      // أو يمكنك إزالة هذا الشرط تمامًا إذا كان الحقل غير موجود
      // return; //  أو لا تقم بالإرجاع إذا كان مجرد إجراء شكلي
  }


  if (newPassword || confirmNewPassword) {
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'danger', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' });
      return;
    }
    if (newPassword.length > 0 && newPassword.length < 8) {
      setMessage({ type: 'danger', text: 'يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل إذا كنت تريد تغييرها.' });
      return;
    }
  }

  setLoading(true);

  const finalPayload = {
      new_name: name.trim(),
      new_email: email.trim(),
  };

  // أضف كلمة المرور الجديدة وتأكيدها فقط إذا تم إدخالهما بشكل صحيح
  if (newPassword.trim() && newPassword === confirmNewPassword) {
      finalPayload.password = newPassword; // كلمة المرور الجديدة
      finalPayload.password_confirmation = confirmNewPassword; // تأكيد كلمة المرور الجديدة
  }
  // لا يتم إرسال currentPasswordForVerification هنا لأن الـ API لا يتطلبه

  try {
    console.log("Sending payload to /user/update-profile:", finalPayload);
    const response = await api.patch(`/user/update-profile/${user.id}`, finalPayload);

    if (response.data && (response.data.success || response.status === 200 || response.status === 204)) {
      setMessage({ type: 'success', text: response.data.message || 'تم تحديث الملف الشخصي بنجاح.' });
      
      const updatedUserDataFromResponse = response.data.user; //  افترض أن الخادم قد يُرجع المستخدم المحدث
      const updatedLocalUser = {
          ...user, //  ابدأ ببيانات المستخدم الحالية في Redux
          name: name.trim(), //  قم بتحديث الاسم من النموذج
          email: email.trim(), //  قم بتحديث الإيميل من النموذج
      };

      // إذا أعاد الخادم بيانات مستخدم، ادمجها مع الأولوية لبيانات الخادم
      // هذا يضمن أن أي تحديثات أخرى قد تحدث في الخادم (مثل updated_at) تنعكس محليًا
      // وأن الاسم والإيميل المحدثين هما بالفعل ما تم حفظه.
      const finalUserToDispatch = updatedUserDataFromResponse 
                                  ? { ...updatedLocalUser, ...updatedUserDataFromResponse } 
                                  : updatedLocalUser;

      dispatch(updateUserLocally(finalUserToDispatch));

      if (newPassword.trim()) {
          setNewPassword('');
          setConfirmNewPassword('');
          // يمكنك أيضًا مسح currentPasswordForVerification إذا أردت
          // setCurrentPasswordForVerification('');
      }
      setShowNewPassword(false); 
      setShowConfirmNewPassword(false);

    } else {
      // ... (معالجة الخطأ المنطقي كما هي) ...
      let errorMessage = 'حدث خطأ أثناء تحديث الملف الشخصي.';
      if (response.data?.error && typeof response.data.error === 'object'){
         errorMessage = Object.values(response.data.error).flat().join(' ');
      } else if (response.data?.message) {
         errorMessage = response.data.message;
      }
      setMessage({ type: 'danger', text: errorMessage });
    }
  } catch (err) {
    // ... (معالجة الخطأ في catch كما هي) ...
    console.error("Error updating profile:", err.response?.data || err.message);
    let errorMessage = 'حدث خطأ أثناء تحديث الملف الشخصي.';
    if (err.response?.data) {
      const responseData = err.response.data;
      if (responseData.error && typeof responseData.error === 'object') {
        errorMessage = Object.values(responseData.error).flat().join(' ');
      } else if (responseData.message) {
        errorMessage = responseData.message;
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      }
    }
    setMessage({ type: 'danger', text: errorMessage });
  } finally {
    setLoading(false);
  }
};

  if (!isAuthenticated && !user) {
    return <Alert variant="warning">الرجاء تسجيل الدخول لعرض إعدادات الحساب.</Alert>;
  }

  return (
    <motion.div className="p-md-3" variants={containerVariants} initial="hidden" animate="visible" style={{ direction: 'rtl' }}>
      <motion.h2 className="mb-4 text-center text-md-end" variants={itemVariants}>إعدادات الحساب</motion.h2>

      <motion.div className="mb-5 p-4 border rounded bg-light shadow-sm" variants={itemVariants}>
        <h4 className="mb-3 border-bottom pb-2">تعديل الملف الشخصي</h4>
        <Form onSubmit={handleSubmit}>
          {/* الاسم */}
          <Form.Group as={Row} className="mb-3" controlId="formProfileName">
            <Form.Label column sm={3} className="text-md-end">الاسم</Form.Label>
            <Col sm={9}>
              <Form.Control
                type="text"
                placeholder="الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Col>
          </Form.Group>

          {/* البريد الإلكتروني */}
          <Form.Group as={Row} className="mb-3" controlId="formProfileEmail">
            <Form.Label column sm={3} className="text-md-end">البريد الإلكتروني</Form.Label>
            <Col sm={9}>
              <Form.Control
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Col>
          </Form.Group>
          
          {/* كلمة المرور الحالية (للتحقق) - مهمة أمنيًا */}
          <Form.Group as={Row} className="mb-3" controlId="formCurrentPasswordForVerification">
            <Form.Label column sm={3} className="text-md-end">كلمة المرور الحالية (للتحقق)</Form.Label>
            <Col sm={9}>
              <InputGroup>
                <Form.Control
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="كلمة المرور الحالية"
                  value={currentPasswordForVerification}
                  onChange={(e) => setCurrentPasswordForVerification(e.target.value)}
                  required //  اجعلها مطلوبة للتحقق
                />
                <InputGroup.Text onClick={toggleCurrentPasswordVisibility} style={{ cursor: 'pointer' }}>
                  <i className={`bi ${showCurrentPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </InputGroup.Text>
              </InputGroup>
            </Col>
          </Form.Group>

          <hr className="my-4" />
          <p className="text-muted">اترك حقول كلمة المرور الجديدة فارغة إذا كنت لا ترغب في تغييرها.</p>

          {/* كلمة المرور الجديدة */}
          <Form.Group as={Row} className="mb-3" controlId="formNewPassword">
            <Form.Label column sm={3} className="text-md-end">كلمة المرور الجديدة (اختياري)</Form.Label>
            <Col sm={9}>
              <InputGroup>
                <Form.Control
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="كلمة المرور الجديدة (8+ أحرف)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <InputGroup.Text onClick={toggleNewPasswordVisibility} style={{ cursor: 'pointer' }}>
                  <i className={`bi ${showNewPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </InputGroup.Text>
              </InputGroup>
            </Col>
          </Form.Group>

          {/* تأكيد كلمة المرور الجديدة */}
          <Form.Group as={Row} className="mb-3" controlId="formConfirmNewPassword">
            <Form.Label column sm={3} className="text-md-end">تأكيد كلمة المرور الجديدة</Form.Label>
            <Col sm={9}>
              <InputGroup>
                <Form.Control
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  placeholder="تأكيد كلمة المرور الجديدة"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                <InputGroup.Text onClick={toggleConfirmNewPasswordVisibility} style={{ cursor: 'pointer' }}>
                  <i className={`bi ${showConfirmNewPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </InputGroup.Text>
              </InputGroup>
            </Col>
          </Form.Group>

          {message.text && (
            <Alert variant={message.type} className="mt-3" onClose={() => setMessage({ type: '', text: '' })} dismissible>
              {message.text}
            </Alert>
          )}
          <div className="text-start mt-3">
            <Button variant="primary" type="submit" disabled={loading} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
              {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'حفظ التغييرات'}
            </Button>
          </div>
        </Form>
      </motion.div>
    </motion.div>
  );
};

export default ProfileSettings;