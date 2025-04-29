import React from 'react';
import { Container, Row, Col, Image, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './AboutUs.css'; // تأكد من استيراد هذا الملف

// Variants للأنيميشن (تبقى كما هي)
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};
const teamMembers = [
    {
      id: 1,
      name: "قصي حوران",
      position: "مطور الواجهة الأمامية (Frontend)",
      // يمكنك استخدام صور placeholder أو صور حقيقية إذا توفرت
      avatar: "/images/avatar3.png" // مثال placeholder
      // avatar: "/images/qusai-avatar.jpg" // مثال لصورة حقيقية
    },
    {
      id: 2,
      name: "محمد براء كبول",
      position: "مطور الواجهة الخلفية (Backend)",
      avatar: "/images/avatarman.png" // مثال placeholder
       // avatar: "/images/baraa-avatar.jpg" // مثال لصورة حقيقية
    },]
const AboutUs = () => {
    
  return (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        className="about-us-page py-4"
    >
      <Container>
        {/* --- قسم العنوان والصورة --- */}
        <motion.section variants={sectionVariants} className="text-center mb-5">
          <h1 className="display-4 fw-bold page-title">من نحن</h1>
          <p className="lead text-muted page-subtitle">تعرف على رؤيتنا وقصتنا في عالم العقارات</p>
          <motion.div
              className="header-image-wrapper my-5 shadow-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
           >
             {/* استبدل بالصورة المناسبة */}
          </motion.div>
        </motion.section>

        {/* --- قسم الرؤية والرسالة --- */}
        <motion.section variants={sectionVariants} className="mb-5">
          <Row className="g-4 align-items-center">
            <Col md={6}>
              {/* العنوان مع الكلاس الأساسي */}
              <h2 className="section-header"><i className="bi bi-eye-fill text-primary me-2"></i> رؤيتنا</h2>
              <p className="text-secondary lh-lg">
                نسعى لنكون المنصة العقارية الرائدة والأكثر ثقة في سوريا، نقدم حلولاً مبتكرة تلبي تطلعات عملائنا وتساهم في تطوير السوق العقاري بأسلوب عصري وشفاف.
              </p>
            </Col>
            <Col md={6}>
               {/* العنوان مع الكلاس الأساسي */}
              <h2 className="section-header"><i className="bi bi-bullseye text-primary me-2"></i> رسالتنا</h2>
              <p className="text-secondary lh-lg">
                تسهيل عملية البحث عن العقارات وربط البائعين والمشترين والمستأجرين ببيئة آمنة وفعالة، مع توفير معلومات دقيقة ودعم مستمر لاتخاذ قرارات مستنيرة وتحقيق أفضل الصفقات.
              </p>
            </Col>
          </Row>
        </motion.section>

        {/* --- قسم قيمنا --- */}
        <motion.section variants={sectionVariants} className="values-section text-center mb-5 py-4 bg-light rounded shadow-sm">
           {/* العنوان مع الكلاس الأساسي */}
           <h2 className="section-header mb-4"><i className="bi bi-gem text-primary me-2"></i> قيمنا الأساسية</h2>
           <Row>
            <Col md={4} className="mb-3 mb-md-0">
                <motion.div variants={itemVariants}>
                    <i className="bi bi-shield-check display-5 text-primary mb-2"></i>
                    <h5 className='fw-semibold'>الموثوقية</h5>
                    <p className='small text-muted px-2'>نلتزم بالشفافية وتقديم بيانات دقيقة.</p>
                </motion.div>
            </Col>
             <Col md={4} className="mb-3 mb-md-0">
                 <motion.div variants={itemVariants}>
                    <i className="bi bi-lightbulb-fill display-5 text-primary mb-2"></i>
                    <h5 className='fw-semibold'>الابتكار</h5>
                    <p className='small text-muted px-2'>نبحث دائمًا عن طرق جديدة لتحسين خدماتنا.</p>
                 </motion.div>
             </Col>
              <Col md={4}>
                  <motion.div variants={itemVariants}>
                    <i className="bi bi-people-fill display-5 text-primary mb-2"></i>
                    <h5 className='fw-semibold'>العميل أولاً</h5>
                    <p className='small text-muted px-2'>نسعى لتحقيق رضا عملائنا وتلبية احتياجاتهم.</p>
                  </motion.div>
              </Col>
           </Row>
        </motion.section>

        {/* --- قسم الفريق --- */}
        <motion.section variants={sectionVariants}>
          {/* --- تعديل هنا: إضافة div لتوسيط العنوان والخط --- */}
          <div className="section-header-wrapper text-center mb-4">
             <h2 className="section-header team mb-0">تعرف على فريقنا</h2> {/* أزل text-center من هنا */}
          </div>
          {/* --------------------------------------------------- */}
          <Row className="justify-content-center g-4">
                {/* --- 3. استخدام map على مصفوفة teamMembers --- */}
                {teamMembers.map(member => (
                <Col md={4} lg={3} key={member.id}>
                    <motion.div variants={itemVariants}>
                        <Card className="text-center border-0 shadow-sm team-card h-100"> {/* إضافة h-100 */}
                        <Card.Img
                            variant="top"
                            src={member.avatar} // <-- استخدام avatar من البيانات
                            className="team-avatar mx-auto mt-3"
                            alt={member.name} // <-- إضافة alt text
                            loading="lazy"
                        />
                        <Card.Body className="d-flex flex-column"> {/* إضافة flex */}
                            <Card.Title className="fw-semibold">{member.name}</Card.Title> {/* <-- استخدام name */}
                            <Card.Text className="text-muted small mt-auto">{member.position}</Card.Text> {/* <-- استخدام position ودفعها للأسفل */}
                        </Card.Body>
                        </Card>
                    </motion.div>
                </Col>
                ))}
                {/* ------------------------------------------- */}
            </Row>
        </motion.section>

      </Container>
    </motion.div>
  );
};

export default AboutUs;