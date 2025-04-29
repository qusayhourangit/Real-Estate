import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';


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
  


  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
      e.preventDefault();
      setProfileMessage({ type: '', text: '' });
      if (!name.trim()) { setProfileMessage({ type: 'danger', text: 'الرجاء إدخال الاسم.' }); return; }
      setLoadingProfile(true);
      try {
          if(updateUserProfile) {
              const result = await updateUserProfile({ name });
              if (result.success) setProfileMessage({ type: 'success', text: 'تم تحديث الاسم بنجاح.' });
              else setProfileMessage({ type: 'danger', text: result.error || 'حدث خطأ.'});
          } else throw new Error("Update function not available");
      } catch (err) { console.error("Error updating profile:", err); setProfileMessage({ type: 'danger', text: 'حدث خطأ أثناء تحديث الاسم.' }); }
      finally { setLoadingProfile(false); }
  };
  const handlePasswordChange = async (e) => {
      e.preventDefault();
      setPasswordMessage({ type: '', text: '' });
      if (!currentPassword || !newPassword || !confirmPassword) { setPasswordMessage({ type: 'danger', text: 'الرجاء ملء جميع حقول كلمة المرور.' }); return; }
      if (newPassword !== confirmPassword) { setPasswordMessage({ type: 'danger', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' }); return; }
      if (newPassword.length < 6) { setPasswordMessage({ type: 'danger', text: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.' }); return; }
      setLoadingPassword(true);
      try {
           if (changeUserPassword) {
               const result = await changeUserPassword({ currentPassword, newPassword });
               if (result.success) {
                   setPasswordMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح.' });
                   setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
               } else setPasswordMessage({ type: 'danger', text: result.error || 'حدث خطأ.'});
           } else throw new Error("Change password function not available");
      } catch (err) { console.error("Error changing password:", err); setPasswordMessage({ type: 'danger', text: err.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور.' }); }
      finally { setLoadingPassword(false); }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.h2 className="mb-4" variants={itemVariants}>إعدادات الحساب</motion.h2>

      {/* قسم تعديل الملف الشخصي */}
      <motion.div className="mb-5 p-4 border rounded bg-light shadow-sm" variants={itemVariants}>
        <h4 className="mb-3 border-bottom pb-2">تعديل المعلومات الشخصية</h4>
        <Form onSubmit={handleProfileUpdate}>
          <Form.Group as={Row} className="mb-3" controlId="formProfileName">
            <Form.Label column sm={3}>الاسم</Form.Label>
            <Col sm={9}><Form.Control type="text" placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} required /></Col>
          </Form.Group>
           <Form.Group as={Row} className="mb-3" controlId="formProfileEmail">
            <Form.Label column sm={3}>البريد الإلكتروني</Form.Label>
            <Col sm={9}><Form.Control type="email" value={user?.email || ''} readOnly disabled /></Col>
          </Form.Group>
          {profileMessage.text && <Alert variant={profileMessage.type} className="mt-3">{profileMessage.text}</Alert>}
          <div className="text-end">
            <Button variant="primary" type="submit" disabled={loadingProfile} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
              {loadingProfile ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'حفظ تغييرات الاسم'}
            </Button>
          </div>
        </Form>
      </motion.div>

      {/* قسم تغيير كلمة المرور */}
      <motion.div className="p-4 border rounded bg-light shadow-sm" variants={itemVariants}>
        <h4 className="mb-3 border-bottom pb-2">تغيير كلمة المرور</h4>
        <Form onSubmit={handlePasswordChange}>
          <Form.Group as={Row} className="mb-3" controlId="formCurrentPassword">
            <Form.Label column sm={3}>كلمة المرور الحالية</Form.Label>
            <Col sm={9}><Form.Control type="password" placeholder="كلمة المرور الحالية" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3" controlId="formNewPassword">
            <Form.Label column sm={3}>كلمة المرور الجديدة</Form.Label>
            <Col sm={9}><Form.Control type="password" placeholder="كلمة المرور الجديدة (6+ أحرف)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3" controlId="formConfirmPassword">
            <Form.Label column sm={3}>تأكيد كلمة المرور</Form.Label>
            <Col sm={9}><Form.Control type="password" placeholder="تأكيد كلمة المرور الجديدة" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></Col>
          </Form.Group>
           {passwordMessage.text && <Alert variant={passwordMessage.type} className="mt-3">{passwordMessage.text}</Alert>}
          <div className="text-end">
            <Button variant="primary" type="submit" disabled={loadingPassword} style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}>
              {loadingPassword ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'تغيير كلمة المرور'}
            </Button>
          </div>
        </Form>
      </motion.div>
    </motion.div>
  );
};

export default ProfileSettings;