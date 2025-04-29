import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Home.css'; // تأكد من استيراد ملف CSS
import CountUp from 'react-countup';
import BestChoices from './BestChoices';
import SavedProperties from './SavedProperties';
import FeaturesSection from './FeaturesSection';
import Footer from './Footer';
import Testimonials from './Testimonials';
import { motion } from 'framer-motion';

// --- Variants (لأنيميشن الدخول - تبقى كما هي) ---
const heroWrapperVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } } };
const rightContentVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut", delay: 0.1 } } };
const imageVariants = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut", delay: 0.2 } } };
const statsVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: 0.4 } } };
// -------------------------------------------------


const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPurpose, setSearchPurpose] = useState('any'); // 'any', 'sale', 'rent'
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('البحث عن:', { location: searchTerm, purpose: searchPurpose });
    navigate('/properties', {
      state: {
        initialLocation: searchTerm.trim(),
        initialPurpose: searchPurpose,
      }
    });
  };

  return (
    <>
      <motion.section
        className="hero-wrapper container-fluid container"
        dir="rtl"
        initial="hidden"
        animate="visible"
        variants={heroWrapperVariants}
      >
        <div className="paddings innerWidth d-flex justify-content-between align-items-center hero-container">
          {/* الجانب الأيمن (المحتوى) */}
          <motion.div
            className="hero-right-content"
            variants={rightContentVariants}
          >
            {/* العنوان والوصف */}
            <div className="hero-title position-relative mb-4">
              <div className="orange-circle position-absolute"></div>
              <h1 className="fw-bold display-4 mb-3">
                اكتشف <br />
                العقار <br />
                الأكثر ملاءمة
              </h1>
            </div>
            <div className="hero-des mb-4">
              <p className="fs-5 text-black-50">ابحث عن مجموعة متنوعة من العقارات التي تناسبك تمامًا</p>
              <p className="fs-5 text-black-50">انسَ كل الصعوبات في العثور على سكن لك</p>
            </div>

            {/* --- نموذج البحث المدمج --- */}
            <motion.form onSubmit={handleSearch} className="search-section mb-5" variants={rightContentVariants}>
              {/* --- الحاوية المدمجة --- */}
              <div className="integrated-search-container shadow-sm">
                {/* --- أزرار تحديد الغرض (داخل الحاوية) --- */}
                <div className="purpose-selector-integrated">
                  <button
                    type="button"
                    className={`purpose-btn-integrated ${searchPurpose === 'any' ? 'active' : ''}`}
                    onClick={() => setSearchPurpose('any')}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    className={`purpose-btn-integrated ${searchPurpose === 'sale' ? 'active' : ''}`}
                    onClick={() => setSearchPurpose('sale')}
                  >
                    للبيع
                  </button>
                  <button
                    type="button"
                    className={`purpose-btn-integrated ${searchPurpose === 'rent' ? 'active' : ''}`}
                    onClick={() => setSearchPurpose('rent')}
                  >
                    للإيجار
                  </button>
                </div>
                {/* --- فاصل بسيط (اختياري) --- */}
                <div className="search-separator"></div>
                {/* --- حقل إدخال الموقع --- */}
                <input
                  type="text"
                  className="form-control search-input-integrated border-0 flex-grow-1" // flex-grow-1 ليأخذ المساحة المتبقية
                  placeholder="أدخل الموقع المطلوب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* --- زر البحث النهائي --- */}
                <button
                  type="submit"
                  className="search-button-integrated btn btn-primary fw-bold border-0"
                  title="بحث"
                >
                  <i class="bi bi-geo-alt-fill"></i>
                </button>
              </div>
              {/* --- نهاية الحاوية المدمجة --- */}
            </motion.form>
            {/* -------------------------- */}

            {/* الإحصائيات */}
            <motion.div
              className="stats-container d-flex justify-content-between"
              variants={statsVariants}
            >
              {/* ... عناصر الإحصائيات (تبقى كما هي) ... */}
              <div className="stat-item text-center">
                <span className="stat-number d-block fw-bold fs-2 text-primary"><span className='text-danger fw-bold'>+</span> <CountUp className='fw-bold' start={8800} end={9000} duration={4} /></span>
                <span className="stat-label text-black-50 ">عقار مميز</span>
              </div>
              <div className="stat-item text-center">
                <span className="stat-number d-block fw-bold fs-2 text-primary"><span className='text-danger fw-bold'>+</span> <CountUp className='fw-bold' start={150} end={200} duration={4} /></span>
                <span className="stat-label text-black-50 ">عميل سعيد</span>
              </div>
              <div className="stat-item text-center">
                <span className="stat-number d-block fw-bold fs-2 text-primary"><span className='text-danger fw-bold'>+</span> <CountUp className='fw-bold' start={3000} end={6000} duration={4} /></span>
                <span className="stat-label text-black-50">محل تجاري</span>
              </div>
            </motion.div>
          </motion.div> {/* نهاية hero-right-content */}

          {/* الجانب الأيسر (الصورة) */}
          <motion.div className="hero-left-image" variants={imageVariants}>
            <div className="image-container rounded-pill-bottom overflow-hidden border border-4 border-light">
              <img src="/images/home1.jpg" alt="عقار" className="img-fluid h-100 w-100 object-fit-cover" loading="lazy" />
            </div>
          </motion.div>

        </div> {/* نهاية hero-container */}
      </motion.section>

      {/* باقي مكونات الصفحة */}
      <BestChoices />
      <Testimonials />
      <SavedProperties />
      <FeaturesSection />
      <Footer />
    </>
  );
};

export default Home;