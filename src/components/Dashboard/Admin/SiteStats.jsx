import React, { useState, useEffect, useContext } from 'react';
import { Row, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion'; // استيراد motion
import 'bootstrap-icons/font/bootstrap-icons.css';
import StatCard from './StatCard';
import api from '../../../API/api';
import { useSelector } from 'react-redux';

// import './DashboardAdmin.css'; // CSS للكروت يُفترض أن يكون مستوردًا

// --- استيراد أو تعريف StatCard المحسن هنا ---
// import StatCard from './StatCard'; // إذا كان في ملف منفصل
// أو الصق كود StatCard و getStatStyle و statCardVariant هنا

// --- تعريف Variant للحاوية (Row) لتتالي الكروت ---
const statsContainerVariant = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1, // تأخير بسيط بين الكروت
            when: "beforeChildren"
        }
    }
};
// --------------------------------------------


const SiteStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // ****** استبدل بـ API Call حقيقي ******
        

        // --- محاكاة بيانات ---
        const dummyData = {
          totalProperties: 150, pendingProperties: 3, approvedProperties: 147,
          propertiesForSale: 90, propertiesForRent: 57, totalUsers: 85,
          activeUsers: 84, blockedUsers: 1, recentSignups: 5,
        };
        await new Promise(resolve => setTimeout(resolve, 700));
        setStats(dummyData);
        // --- نهاية المحاكاة ---
      } catch (err) {
        console.error("Error fetching site stats:", err);
        setError("حدث خطأ أثناء جلب الإحصائيات.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []); // لا نحتاج token كاعتمادية إذا لم يتغير

  if (loading && !stats) { // إظهار Spinner فقط أثناء التحميل الأولي
    return <div className="text-center py-5"><Spinner animation="grow" variant="danger" /></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <motion.h2
        className="mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        إحصائيات الموقع
      </motion.h2>

      {stats && (
        // تطبيق motion و variants على الصف الرئيسي للكروت
        <motion.div
          className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4" // تحديد الأعمدة للشاشات المختلفة
          variants={statsContainerVariant}
          initial="hidden"
          animate="visible" // التحريك فور تحميل البيانات
        >
           {/* استخدام Object.entries لتوليد الكروت بشكل ديناميكي */}
           {Object.entries(stats).map(([key, value]) => {
                // تحديد عنوان مناسب بناءً على المفتاح
                let title = key; // عنوان افتراضي
                switch (key) {
                    case 'totalProperties': title = 'إجمالي العقارات'; break;
                    case 'pendingProperties': title = 'عقارات معلقة'; break;
                    case 'approvedProperties': title = 'عقارات معروضة'; break;
                    case 'propertiesForSale': title = 'عقارات للبيع'; break;
                    case 'propertiesForRent': title = 'عقارات للإيجار'; break;
                    case 'totalUsers': title = 'إجمالي المستخدمين'; break;
                    case 'activeUsers': title = 'مستخدمون نشطون'; break;
                    case 'blockedUsers': title = 'مستخدمون محظورون'; break;
                    case 'recentSignups': title = 'تسجيلات جديدة (7 أيام)'; break;
                    // أضف حالات أخرى إذا لزم الأمر
                }
                return (
                   <StatCard key={key} title={title} value={value} statKey={key} />
               );
           })}

           {/* --- الطريقة القديمة (إذا فضلتها) --- */}
          {/*
          <StatCard title="إجمالي العقارات" value={stats.totalProperties} statKey="totalProperties" />
          <StatCard title="عقارات معلقة" value={stats.pendingProperties} statKey="pendingProperties" />
          <StatCard title="عقارات معروضة" value={stats.approvedProperties} statKey="approvedProperties" />
          <StatCard title="عقارات للبيع" value={stats.propertiesForSale} statKey="propertiesForSale" />
          <StatCard title="عقارات للإيجار" value={stats.propertiesForRent} statKey="propertiesForRent" />
          <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} statKey="totalUsers" />
          <StatCard title="مستخدمون نشطون" value={stats.activeUsers} statKey="activeUsers" />
          <StatCard title="مستخدمون محظورون" value={stats.blockedUsers} statKey="blockedUsers" />
          <StatCard title="تسجيلات جديدة (7 أيام)" value={stats.recentSignups} statKey="recentSignups" />
          */}

        </motion.div>
      )}
    </div>
  );
};


// --- الصق كود StatCard و getStatStyle و statCardVariant هنا إذا لم يكن في ملف منفصل ---

export default SiteStats;