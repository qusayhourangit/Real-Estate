import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { motion } from 'framer-motion'; // <-- 1. استيراد motion
import 'bootstrap-icons/font/bootstrap-icons.css'; // تأكد من استيراد أيقونات Bootstrap إذا كنت تستخدمها
import './Footer.css';

// --- 2. تعريف Variants للأنيميشن ---
// Variant للحاوية الرئيسية (الفوتر) للتحكم في التتالي
const footerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2, // تأخير بسيط قبل بدء أول قسم
      staggerChildren: 0.25, // التأخير بين كل قسم
      when: "beforeChildren"
    }
  }
};

// Variant لكل قسم في الفوتر (انزلاق للأعلى + تلاشي)
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Variant لروابط التواصل الاجتماعي (تأثير دوران وتلاشي بسيط)
const socialIconVariants = {
    hidden: { opacity: 0, rotate: -45, scale: 0.5 },
    visible: {
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 150, damping: 10 }
    }
};

// Variant لحقوق النشر (ظهور تدريجي فقط)
const copyrightVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, delay: 0.5 } } // تأخير إضافي
};
// -----------------------


const Footer = () => {
  return (
    // --- 3. تطبيق Motion على الفوتر ---
    <motion.footer
        className="site-footer"
        variants={footerContainerVariants} // تطبيق variant الحاوية
        initial="hidden"
        whileInView="visible" // التحريك عند الدخول في مجال الرؤية
        viewport={{ once: true, amount: 0.1 }} // التشغيل مرة واحدة
    >
      <div className="container">
        <div className="footer-grid">

          {/* القسم الأول: عن الموقع */}
          <motion.div className="footer-section about-section" variants={sectionVariants}>
            <div className="logo-wrapper footer-title">
              <motion.img // تحريك الشعار أيضاً
                src="/images/Logo1.png"
                alt="شعار الموقع"
                className="footer-logo"
                width={100}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </div>
            <p className="footer-description">
              منصة عقارية متكاملة تساعدك في العثور على العقار المثالي سواء للبيع أو الإيجار بسهولة وأمان.
            </p>
            {/* --- تطبيق motion على حاوية الأيقونات وتتاليها --- */}
            <motion.div
                className="social-links"
                variants={{ // variants بسيطة للتتالي داخل هذا القسم
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.1 } }
                }}
                // يرث initial/animate من الأب
            >
              <motion.i className="bi bi-facebook social-icon" variants={socialIconVariants}></motion.i>
              {/* لاستخدام bootstrap icons تحتاج لـ motion.i */}
              <motion.i className="bi bi-twitter-x social-icon" variants={socialIconVariants}></motion.i>
              <motion.i className="bi bi-linkedin social-icon" variants={socialIconVariants}></motion.i>
              <motion.i className="bi bi-whatsapp social-icon" variants={socialIconVariants}></motion.i>
              <motion.i className="bi bi-instagram social-icon" variants={socialIconVariants}></motion.i>
            </motion.div>
            {/* -------------------------------------------------- */}
          </motion.div>

          {/* القسم الثاني: روابط سريعة */}
          <motion.div className="footer-section links-section" variants={sectionVariants}>
            <h3 className="footer-title">روابط سريعة</h3>
            <ul className="footer-links">
              {/* يمكنك إضافة تأثير بسيط على كل رابط إذا أردت */}
              <li><Link to="/">الرئيسية</Link></li>
              <li><Link to="/properties">تصفح العقارات</Link></li>
              <li><Link to="/dashboard/saved">المحفوظات</Link></li> {/* مسار الداشبورد للمحفوظات */}
              <li><Link to="/addproperty">إضافة عقار</Link></li> {/* توحيد المسار */}
            </ul>
          </motion.div>

          {/* القسم الثالث: معلومات التواصل */}
          <motion.div className="footer-section contact-section" variants={sectionVariants}>
            <h3 className="footer-title">تواصل معنا</h3>
            <ul className="contact-info">
              {/* يمكنك إضافة تأثير بسيط على كل عنصر تواصل */}
              <li>
                <FaMapMarkerAlt className="contact-icon" />
                <span>دمشق ، الجمهورية العربية السورية</span>
              </li>
              <li>
                <FaPhoneAlt className="contact-icon" />
                <span>+963 999 810 300</span>
              </li>
              <li>
                <FaEnvelope className="contact-icon" />
                <span>info@myhome.com</span>
              </li>
            </ul>
          </motion.div>
        </div> {/* نهاية footer-grid */}

        {/* حقوق النشر */}
        <motion.div className="copyright-section" variants={copyrightVariants}>
          <p>© {new Date().getFullYear()} عقارك. جميع الحقوق محفوظة.</p>
        </motion.div>
      </div> {/* نهاية container */}
    </motion.footer>
    // -----------------------------------------------------
  );
};

export default Footer;
