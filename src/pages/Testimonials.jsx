import React, { useRef } from 'react'; // استيراد useRef
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { motion } from 'framer-motion'; // <-- 1. استيراد motion

// استيراد ملفات CSS الخاصة بـ Swiper (أساسيات + pagination)
import 'swiper/css';
// import 'swiper/css/navigation'; // لا نحتاج CSS التنقل الافتراضي الآن
import 'swiper/css/pagination';

import 'bootstrap-icons/font/bootstrap-icons.css';
import './Testimonials.css'; // تأكد من استيراد ملف CSS الخاص بك
// استيراد الأيقونات المطلوبة من react-icons
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// --- 2. تعريف Variants للأنيميشن ---
// Variant للحاوية (القسم) للتحكم في التتالي
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.2, // تأخير بين ظهور كل بطاقة رأي
      when: "beforeChildren"
    }
  }
};

// Variant لكل بطاقة رأي
const testimonialCardVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 30 }, // يبدأ أصغر قليلاً ومن الأسفل
  visible: {
    opacity: 1,
    scale: 1, // يعود للحجم الطبيعي
    y: 0,     // ينتقل لموقعه الأصلي
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 14
    }
  }
};
// -----------------------


// بيانات وهمية للآراء (يمكنك استبدالها ببيانات حقيقية لاحقًا)
const testimonialsData = [
  {
    id: 1,
    name: "أحمد الموسى",
    role: "مشتري سعيد",
    avatar: "/images/avatarman.png",
    stars: 5,
    quote: "كانت تجربة البحث عن منزل أحلامي سلسة وممتعة بفضل هذا الموقع الرائع. وجدت ما أبحث عنه بالضبط وبسعر مناسب جداً. شكراً لكم!"
  },
  {
    id: 2,
    name: "فاطمة الزهراء",
    role: "مستأجرة راضية",
    avatar: "/images/avatargirl.png",
    stars: 4,
    quote: "استأجرت شقة عبر الموقع وكانت عملية الحجز والتواصل مع المالك سهلة للغاية. الشقة كانت كما في الصور والوصف. خدمة ممتازة."
  },
  {
    id: 3,
    name: "خالد العلي",
    role: "مستثمر عقاري",
    avatar: "/images/avatarman.png",
    stars: 5,
    quote: "كمستثمر، أقدر التنوع الكبير في العقارات المعروضة وسهولة الوصول للمعلومات التفصيلية. الموقع ساعدني في اتخاذ قرارات استثمارية ناجحة."
  },
   {
    id: 4,
    name: "سارة المحمد",
    role: "بائعة عقار",
    avatar: "/images/avatargirl.png",
    stars: 5,
    quote: "عرضت عقاري للبيع على الموقع وتم بيعه خلال فترة قصيرة وبسعر جيد. أدوات إضافة العقار سهلة وفريق الدعم متعاون جداً."
  },
   {
    id: 5, // إضافة مثال آخر
    name: "عمر ياسين",
    role: "باحث عن مكتب",
    avatar: "/images/avatarman.png",
    stars: 4,
    quote: "الموقع سهل عليّ عملية البحث عن مكتب تجاري مناسب لشركتي الناشئة. الفلاتر المتقدمة مفيدة جداً."
  }
];

const Testimonials = () => {
  // إنشاء Refs للأزرار المخصصة
  const navigationPrevRef = useRef(null);
  const navigationNextRef = useRef(null);

  return (
    // --- 3. تطبيق Motion على القسم ---
    // أزلنا container من هنا لأنه موجود بالأسفل
    <motion.section
        className="testimonials-section py-5 bg-light container"
        dir="rtl"
        variants={containerVariants} // تطبيق variant الحاوية
        initial="hidden"
        whileInView="visible" // التحريك عند الدخول في مجال الرؤية
        viewport={{ once: true, amount: 0.1 }} // التشغيل مرة واحدة عند ظهور 10%
    >
      {/* إضافة container هنا */}
      <div className="container position-relative">
        {/* تحريك العنوان */}
        <motion.h2
            className="section-title text-center mb-5 fw-bold"
            // لا نحتاج لـ variants هنا، سنستخدم initial/animate مباشرة
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }} // يرث animate="visible" من الأب
        >
            ماذا يقول عملاؤنا؟
        </motion.h2>

        {/* --- أزرار التنقل المخصصة (تبقى كما هي) --- */}
        <button ref={navigationPrevRef} className="swiper-custom-nav-btn prev-btn shadow-sm">
          <FaChevronRight /> {/* السهم الأيمن للـ Prev في RTL */}
        </button>
        <button ref={navigationNextRef} className="swiper-custom-nav-btn next-btn shadow-sm">
          <FaChevronLeft /> {/* السهم الأيسر للـ Next في RTL */}
        </button>
        {/* ----------------------------------------- */}

        {/* --- حاوية Swiper (لا تحتاج لـ motion مباشرة) --- */}
        <Swiper
          // الوحدات المستخدمة
          modules={[Navigation, Pagination, Autoplay]}
          // إعدادات العرض
          spaceBetween={30}
          slidesPerView={1}
          // ربط التنقل المخصص
          navigation={{
            prevEl: navigationPrevRef.current,
            nextEl: navigationNextRef.current,
          }}
          // التهيئة لضمان الربط الصحيح مع Refs
          onBeforeInit={(swiper) => {
               // التأكد من أن العناصر موجودة قبل الربط
               if (navigationPrevRef.current) {
                   swiper.params.navigation.prevEl = navigationPrevRef.current;
               }
               if (navigationNextRef.current) {
                   swiper.params.navigation.nextEl = navigationNextRef.current;
               }
               // تحديث الـ swiper instance بعد تعديل الـ params
               swiper.navigation.update();
          }}
          // نقاط التنقل
          pagination={{ clickable: true }}
          // التشغيل التلقائي
          autoplay={{
             delay: 5500, // زيادة طفيفة في التأخير
             disableOnInteraction: true, // إيقاف التشغيل التلقائي عند تفاعل المستخدم
             pauseOnMouseEnter: true, // إيقاف التشغيل التلقائي عند مرور الماوس
           }}
          // تكرار السلايدات
          loop={true}
          // نقاط التوقف للشاشات المختلفة
          breakpoints={{
            // شاشات متوسطة (تابلت)
            768: {
              slidesPerView: 2,
              spaceBetween: 30 // تقليل المسافة قليلاً
            },
            // شاشات كبيرة (لابتوب)
            992: {
              slidesPerView: 3,
              spaceBetween: 30 // تقليل المسافة قليلاً
            }
          }}
          // فئة CSS مخصصة للسلايدر
          className="mySwiper"
        >
          {/* توليد السلايدات من البيانات */}
          {testimonialsData.map((testimonial) => (
            // --- 3. تطبيق Motion على كل سلايد ---
            <SwiperSlide key={testimonial.id} className="h-auto">
               {/* تطبيق Variants على العنصر الداخلي */}
               <motion.div variants={testimonialCardVariants} className="h-100">
                 {/* --- محتوى الكارد (يبقى كما هو) --- */}
                 <div className="testimonial-card card h-100 shadow-sm border-0">
                   <div className="card-body text-center d-flex flex-column p-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="testimonial-avatar rounded-circle mx-auto mb-3 shadow-sm"
                        loading="lazy"
                       />
                      <h5 className="card-title fw-semibold mb-1">{testimonial.name}</h5>
                      <p className="text-muted small mb-3">{testimonial.role}</p>
                      <div className="testimonial-stars mb-3 text-warning">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`bi ${i < testimonial.stars ? 'bi-star-fill' : 'bi-star'}`}></i>
                        ))}
                      </div>
                      <blockquote className="testimonial-quote mt-auto fst-italic text-secondary px-2">
                         <i className="bi bi-quote fs-4 me-2"></i>
                         {testimonial.quote}
                      </blockquote>
                   </div>
                 </div>
                  {/* --------------------------------- */}
               </motion.div>
             </SwiperSlide>
            // ------------------------------------
          ))}
          {/* لا حاجة لوضع عناصر الأزرار هنا لأنها خارج الـ Swiper الآن */}
        </Swiper>
      </div>
    </motion.section>
    // -----------------------------------------------------
  );
};

export default Testimonials;