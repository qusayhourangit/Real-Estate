// src/components/Dashboard/User/MyProperties.js (أو المسار الصحيح لديك)
import React from'react';
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import api from '../../../API/api'; // <-- تأكد من صحة هذا المسار
import { useSelector } from 'react-redux';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

// -- دوال مساعدة خارج المكون ---
const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'مقبول';
      case 'pending': return 'قيد المراجعة';
      case 'rejected': return 'مرفوض';
      default: return status || 'غير معروف';
    }
  };
// ---------------------------

const MyProperties = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const navigate = useNavigate();

  const getToken = () => user?.token || localStorage.getItem('token');
  const userDashboardPath = '/user/my-properties'; // <-- تأكد أن هذا المسار صحيح لوجهتك بعد التعديل/الحذف

  // --- التحقق من المصادقة ---
  useEffect(() => {
      if (!isAuthenticated || !getToken()) {
          console.log("MyProperties: User not authenticated, redirecting to login.");
          navigate('/login', { replace: true });
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.token]); // الاعتماد على التوكن لضمان التحديث عند تغيره

  // --- جلب العقارات ---
  useEffect(() => {
    const fetchMyProperties = async () => {
      const token = getToken();
      if (!isAuthenticated || !token || !user?.id) {
        setLoading(false);
        setMyProperties([]);
        return; // توقف إذا لم يكن مصادقاً
      }

      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching properties page ${pageNumber}`);
        // تأكد من أن هذا الـ endpoint صحيح لجلب *كل* عقارات المستخدم (مع ترقيم الصفحات)
        const response = await api.get(`/user/get-property`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pageNumber }
        });
        console.log("MyProperties API Response:", response.data);

        // التعامل المرن مع بنية الاستجابة
        const propertiesData = response.data?.data?.data || response.data?.data || response.data;

        if (Array.isArray(propertiesData)) {
            setMyProperties(propertiesData);
        } else {
            console.error("MyProperties: Received non-array data:", propertiesData);
            setError("خطأ في تنسيق بيانات العقارات المستلمة.");
            setMyProperties([]);
        }
      } catch (err) {
        console.error("MyProperties: Error fetching properties:", err.response?.data || err.message || err);
        setError(`حدث خطأ أثناء تحميل العقارات. (${err.response?.data?.message || err.message})`);
        setMyProperties([]);
      } finally {
        setLoading(false);
      }
    };

     if (isAuthenticated && getToken() && user?.id) {
        fetchMyProperties();
     } else {
        setLoading(false);
        setMyProperties([]);
     }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, user?.id, isAuthenticated]); // أعد الجلب إذا تغير المستخدم أو الصفحة

  // --- التعامل مع التعديل (تمرير الحالة) ---
  const handleEdit = (property) => {
    console.log("MyProperties: handleEdit triggered for property:", property);
    if (property && property.id) {
      console.log("MyProperties: Navigating to edit page with state:", { propertyToEdit: property });
      // تأكد أن المسار المستهدف هو الصحيح لنموذج الإضافة/التعديل
      navigate(`/addproperty/${property.id}`, { state: { propertyToEdit: property } });
    } else {
      console.error("MyProperties: Invalid property data passed to handleEdit:", property);
      alert("بيانات العقار غير صالحة للتعديل.");
    }
  };

  // --- التعامل مع الحذف ---
  const handleDelete = async (propertyId) => {
    const token = getToken();
    if (!token) {
      alert("يرجى تسجيل الدخول للمتابعة."); navigate('/login'); return;
    }
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا العقار؟')) return;
    try {
      await api.delete(`/user/deleteProperty/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyProperties((prev) => prev.filter((p) => p.id !== propertyId));
      alert('تم حذف العقار بنجاح.');
    } catch (err) {
      console.error("MyProperties: Error deleting property:", err.response?.data || err.message);
      alert(`حدث خطأ أثناء محاولة حذف العقار. (${err.response?.data?.message || err.message})`);
    }
  };

  // --- العرض ---

  if (!isAuthenticated || !getToken()) {
    // يفضل عدم عرض شيء أثناء انتظار إعادة التوجيه
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#d6762e' }} />
        <p>جاري تحميل عقاراتك...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-4 text-center">
        {error}
      </Alert>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="container mt-4">
      <motion.div variants={itemVariants} className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <h2>عقاراتي المضافة</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/addproperty')} // مسار إضافة عقار جديد
          style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}
          className="mb-2 mb-md-0"
        >
          <i className="bi bi-plus-circle-fill me-2"></i> إضافة عقار جديد
        </Button>
      </motion.div>

      {!loading && !error && myProperties.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Alert variant="info" className="text-center">
            <i className="bi bi-info-circle me-2"></i> لم تقم بإضافة أي عقارات بعد.
          </Alert>
        </motion.div>
      ) : !loading && myProperties.length > 0 ? (
        <motion.div variants={itemVariants}>
          <Table striped bordered hover responsive size="sm" className="property-table">
            <thead className="table-light">
              <tr>
                <th>#</th><th>العنوان</th><th>الحالة</th><th>الغرض</th><th>السعر</th><th>تاريخ الإضافة</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {myProperties.map((property, index) => (
                <tr key={property.id || `prop-${index}`}>
                  <td>{index + 1 + (pageNumber - 1) * 10}</td>
                  <td>{property.title || 'N/A'}</td>
                  <td><Badge pill bg={getStatusBadgeVariant(property.status)} className="status-badge">{getStatusText(property.status)}</Badge></td>
                  <td>{property.purpose === 'rent' ? 'إيجار' : 'بيع'}</td>
                  <td>{ (property.price !== null && property.price !== undefined) ? Number(property.price).toLocaleString('ar-SY') + ' ل.س' : 'N/A'}</td>
                  <td>{property.created_at ? new Date(property.created_at).toLocaleDateString('ar-SY') : 'N/A'}</td>
                  <td>
                    <Button
                      variant="outline-primary" size="sm" className="me-2 mb-1 mb-md-0 action-button"
                      onClick={() => handleEdit(property)} title="تعديل"
                      disabled={!property || !property.id} // تعطيل إذا كانت البيانات غير صالحة
                    > <i className="bi bi-pencil-square"></i> </Button>
                    <Button
                      variant="outline-danger" size="sm" className="action-button"
                      onClick={() => handleDelete(property.id)} title="حذف"
                      disabled={!property || !property.id} // تعطيل إذا كانت البيانات غير صالحة
                    > <i className="bi bi-trash3-fill"></i> </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {/* أضف مكون ترقيم الصفحات هنا إذا كنت تستخدمه */}
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default MyProperties;