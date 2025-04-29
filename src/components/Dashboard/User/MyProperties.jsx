import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import api from '../../../API/api';
import { useSelector } from 'react-redux';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const MyProperties = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
 
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const fetchMyProperties = useCallback(async () => {
    if (!user?.id) {
      setError('يجب تسجيل الدخول لعرض عقاراتك.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/user/get-property', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        }
      });
      
      // تأكد أن البيانات مصفوفة
      const data = response.data?.data || response.data || [];
      setMyProperties(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل عقاراتك.');
      setMyProperties([]); // إعادة تعيين إلى مصفوفة فارغة في حالة الخطأ
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyProperties();
  }, [fetchMyProperties]);

  const handleEdit = (propertyId) => {
    navigate(`/edit-property/${propertyId}`);
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا العقار؟')) return;
    try {
      await api.delete(`/user/delete-property/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        }
      });
      setMyProperties(prev => prev.filter(p => p.id !== propertyId));
      alert('تم حذف العقار بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء محاولة حذف العقار.');
    }
  };

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
      default: return 'غير معروف';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: '#d6762e' }} />
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="d-flex justify-content-between align-items-center mb-4">
        <h2>عقاراتي المضافة</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/addproperty')}
          style={{ backgroundColor: '#d6762e', borderColor: '#d6762e' }}
        >
          <i className="bi bi-plus-circle-fill me-2"></i> إضافة عقار جديد
        </Button>
      </motion.div>

      {myProperties.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i> لم تقم بإضافة أي عقارات بعد.
          </Alert>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>الغرض</th>
                <th>السعر</th>
                <th>تاريخ الإضافة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {myProperties.map((property, index) => (
                <tr key={property.id}>
                  <td>{index + 1}</td>
                  <td>{property.title}</td>
                  <td>
                    <Badge bg={getStatusBadgeVariant(property.status)}>
                      {getStatusText(property.status)}
                    </Badge>
                  </td>
                  <td>{property.purpose === 'rent' ? 'إيجار' : 'بيع'}</td>
                  <td>{property.price?.toLocaleString('ar-SY')} ل.س</td>
                  <td>{new Date(property.created_at).toLocaleDateString('ar-SY')}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2 mb-1 mb-md-0"
                      onClick={() => handleEdit(property.id)}
                      title="تعديل"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(property.id)}
                      title="حذف"
                    >
                      <i className="bi bi-trash3-fill"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MyProperties;
