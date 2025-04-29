import React from 'react';
import { motion } from 'framer-motion'; // <-- 1. استيراد motion
import 'bootstrap-icons/font/bootstrap-icons.css'; // تأكد من استيراد الأيقونات
import "./FeaturesSection.css"
// --- 2. تعريف Variants ---
// Variant للحاوية (القسم أو الصف) للتحكم في التتالي
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1, // تأخير بسيط قبل بدء أول عنصر
      staggerChildren: 0.2, // التأخير بين كل بطاقة
      when: "beforeChildren"
    }
  }
};

// Variant لكل بطاقة ميزة
const featureCardVariants = {
  hidden: { opacity: 0, y: 50 }, // يبدأ من الأسفل قليلاً ومخفي
  visible: {
    opacity: 1,
    y: 0, // ينتقل لموقعه الأصلي
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 13,
      // أو
      // duration: 0.7, ease: "easeOut"
    }
  }
};
// -----------------------

const FeaturesSection = () => {
  const features = [
    {
      icon: 'bi bi-search',
      title: 'بحث متقدم',
      description: 'أدوات بحث ذكية مع فلاتر متعددة للعثور على ما يناسبك بدقة.'
    },
    {
      icon: 'bi bi-shield-check',
      title: 'عقارات موثوقة',
      description: 'نحرص على التحقق من صحة البيانات لضمان تجربة آمنة وموثوقة.'
    },
    {
      icon: 'bi bi-headset',
      title: 'دعم فني متميز',
      description: 'فريق دعم متخصص جاهز لمساعدتك والإجابة على استفساراتك بسرعة وكفاءة.'
    }
  ];

  return (
    // --- 3. تطبيق Motion على القسم ---
    <motion.section
        className="features py-5"
        // لا نحتاج لـ variants هنا، سنطبقها على الصف
        initial="hidden"
        whileInView="visible" // التحريك عند الدخول في مجال الرؤية
        viewport={{ once: true, amount: 0.2 }} // التشغيل مرة واحدة
    >
      <div className="container">
        {/* تحريك العنوان بشكل منفصل */}
        <motion.h2
            className="section-title text-center mb-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }} // تأخير بسيط للعنوان
        >
            لماذا تختارنا؟
        </motion.h2>

        {/* --- 3. تطبيق Motion على الصف الذي يحتوي البطاقات --- */}
        <motion.div
            className="row"
            variants={containerVariants} // تطبيق variant التتالي
            // يرث initial و whileInView من القسم الأب
        >
          {features.map((feature, index) => (
            // --- 3. تطبيق Motion على كل عمود (بطاقة) ---
            <motion.div
                className="col-md-4 mb-4"
                key={index}
                variants={featureCardVariants} // تطبيق variant البطاقة
            >
              {/* --- محتوى البطاقة يبقى كما هو --- */}
              <div className="feature-card text-center p-4 h-100 shadow-sm rounded"> {/* إضافة shadow و rounded */}
                <motion.i
                    className={`${feature.icon} feature-icon display-4 text-primary mb-3`} // تعديل حجم ولون الأيقونة
                    // أنيميشن بسيط للأيقونة نفسها (اختياري)
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.2, type: 'spring', stiffness: 150 }} // تأخير إضافي للأيقونة
                ></motion.i>
                <h3 className="mt-3 fs-4 fw-semibold">{feature.title}</h3> {/* تعديل حجم الخط */}
                <p className="text-muted px-2">{feature.description}</p> {/* إضافة padding أفقي للوصف */}
              </div>
              {/* ----------------------------------- */}
            </motion.div>
            // ---------------------------------------
          ))}
        </motion.div>
        {/* ------------------------------------------------ */}
      </div>
    </motion.section>
    // -----------------------------------------------------
  );
};

export default FeaturesSection;