import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios'; // لإرسال النموذج لاحقاً

import 'leaflet/dist/leaflet.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ContactUs.css'; // سننشئ هذا الملف

// إصلاح أيقونة Marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Schema لنموذج التواصل
const contactSchema = z.object({
  name: z.string().min(3, 'الرجاء إدخال اسم صحيح (3 أحرف على الأقل)'),
  email: z.string().email('الرجاء إدخال بريد إلكتروني صحيح'),
  subject: z.string().min(5, 'الرجاء إدخال موضوع للرسالة (5 أحرف على الأقل)'),
  message: z.string().min(10, 'الرجاء إدخال رسالتك (10 أحرف على الأقل)'),
});

// Variants للأنيميشن
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 } }
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 }, // تأثير انزلاق بسيط من اليسار
  visible: { opacity: 1, x: 0 }
};


const ContactUs = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' }); // لرسائل النجاح أو الخطأ

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' }
  });

  const officePosition = [33.5138, 36.2765]; // إحداثيات دمشق كمثال

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' }); // مسح الرسائل القديمة
    console.log("Contact form data:", data);

    try {
        // ****** استبدل '/api/contact' بنقطة النهاية الفعلية في الـ Backend ******
        // const response = await axios.post('/api/contact', data);
        // console.log("Server response:", response.data);

        // --- محاكاة نجاح الإرسال ---
        await new Promise(resolve => setTimeout(resolve, 1000));
        // -------------------------

        setSubmitStatus({ type: 'success', message: 'تم استلام رسالتك بنجاح! سنتواصل معك قريباً.' });
        reset(); // مسح حقول النموذج بعد الإرسال الناجح

    } catch (error) {
        console.error("Contact form error:", error);
        setSubmitStatus({ type: 'danger', message: 'حدث خطأ أثناء إرسال الرسالة. الرجاء المحاولة مرة أخرى.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="contact-us-page py-5"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
    >
      <Container dir='rtl'>
        <motion.div variants={sectionVariants} className="text-center mb-5">
          <h1 className="display-4 fw-bold page-title">تواصل معنا</h1>
          <p className="lead text-muted page-subtitle">نحن هنا لمساعدتك، لا تتردد في التواصل</p>
        </motion.div>

        <Row className="g-4 g-lg-5">
          {/* --- عمود نموذج التواصل --- */}
          <Col lg={7}>
            <motion.div variants={sectionVariants}>
              <h3 className="mb-4 section-header"><i className="bi bi-pencil-square text-primary me-2"></i> أرسل لنا رسالة</h3>
               {submitStatus.message && (
                 <Alert variant={submitStatus.type}>
                    {submitStatus.type === 'success' ? <i className="bi bi-check-circle-fill me-2"></i> : <i className="bi bi-exclamation-triangle-fill me-2"></i>}
                    {submitStatus.message}
                 </Alert>
                )}
              <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <motion.div variants={itemVariants}>
                  <Form.Group className="mb-3" controlId="contactName">
                    <Form.Label>الاسم الكامل</Form.Label>
                    <Form.Control type="text" {...register('name')} isInvalid={!!errors.name} placeholder="اسمك هنا" />
                    <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                  </Form.Group>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Form.Group className="mb-3" controlId="contactEmail">
                    <Form.Label>البريد الإلكتروني</Form.Label>
                    <Form.Control type="email" {...register('email')} isInvalid={!!errors.email} placeholder="example@mail.com"/>
                    <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                  </Form.Group>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Form.Group className="mb-3" controlId="contactSubject">
                    <Form.Label>الموضوع</Form.Label>
                    <Form.Control type="text" {...register('subject')} isInvalid={!!errors.subject} placeholder="موضوع الرسالة"/>
                    <Form.Control.Feedback type="invalid">{errors.subject?.message}</Form.Control.Feedback>
                  </Form.Group>
                 </motion.div>

                <motion.div variants={itemVariants}>
                  <Form.Group className="mb-3" controlId="contactMessage">
                    <Form.Label>رسالتك</Form.Label>
                    <Form.Control as="textarea" rows={5} {...register('message')} isInvalid={!!errors.message} placeholder="اكتب رسالتك هنا..."/>
                    <Form.Control.Feedback type="invalid">{errors.message?.message}</Form.Control.Feedback>
                  </Form.Group>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button variant="primary" type="submit" disabled={isSubmitting} className="submit-btn w-100">
                    {isSubmitting ? (
                      <> <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className='me-2'/> جاري الإرسال... </>
                    ) : (
                      <> <i className="bi bi-send-fill me-2"></i> إرسال الرسالة </>
                    )}
                  </Button>
                </motion.div>
              </Form>
            </motion.div>
          </Col>

          {/* --- عمود معلومات التواصل والخريطة --- */}
          <Col lg={5}>
            <motion.div variants={sectionVariants}>
               <h3 className="mb-4 section-header"><i className="bi bi-info-circle-fill text-primary me-2"></i> معلومات التواصل</h3>
               <ul className="contact-info-list list-unstyled mb-4">
                 <motion.li variants={itemVariants} className="d-flex align-items-start mb-3">
                    <i className="bi bi-geo-alt-fill contact-icon-main mt-1"></i>
                    <div>
                        <strong>العنوان:</strong><br/>
                        <span>دمشق، الجمهورية العربية السورية</span><br/>
                        {/* <small className="text-muted">(يمكن إضافة تفاصيل إضافية هنا)</small> */}
                    </div>
                 </motion.li>
                  <motion.li variants={itemVariants} className="d-flex align-items-start mb-3">
                    <i className="bi bi-telephone-fill contact-icon-main mt-1"></i>
                    <div>
                        <strong>الهاتف:</strong><br/>
                        {/* استخدام dir="ltr" للأرقام والروابط */}
                        <a href="tel:+963999810300" className="text-decoration-none text-secondary" dir="ltr">+963 999 810 300</a>
                    </div>
                 </motion.li>
                  <motion.li variants={itemVariants} className="d-flex align-items-start mb-3">
                    <i className="bi bi-envelope-fill contact-icon-main mt-1"></i>
                     <div>
                        <strong>البريد الإلكتروني:</strong><br/>
                        <a href="mailto:info@myhome.com" className="text-decoration-none text-secondary">info@myhome.com</a>
                    </div>
                  </motion.li>
                  <motion.li variants={itemVariants} className="d-flex align-items-start">
                    <i className="bi bi-clock-fill contact-icon-main mt-1"></i>
                     <div>
                        <strong>أوقات العمل:</strong><br/>
                        <span>السبت - الخميس: 9:00 صباحًا - 5:00 مساءً</span>
                    </div>
                  </motion.li>
               </ul>

               {/* قسم الخريطة (اختياري) */}
                <motion.div variants={itemVariants} className="map-wrapper-contact mt-4 shadow-sm rounded overflow-hidden">
                  <MapContainer center={officePosition} zoom={14} scrollWheelZoom={false} style={{ height: '250px', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <Marker position={officePosition}>
                      <Popup>موقع مكتبنا (مثال)</Popup>
                    </Marker>
                  </MapContainer>
                </motion.div>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </motion.div>
  );
};

export default ContactUs;