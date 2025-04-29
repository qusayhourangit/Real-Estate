import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate , Navigate} from 'react-router-dom';
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

const SavedProperties = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const fetchSavedProperties = useCallback(async () => {
    if (!user?.id) {
      setError('يجب تسجيل الدخول لعرض العقارات المحفوظة.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/user/show-saved-property', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        }
      });
      
      console.log('API Response:', response); // للتحقق من هيكل البيانات
      
      // الحل الأكثر أماناً:
      const data = response.data?.data || response.data || [];
      setSavedProperties(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل العقارات المحفوظة.');
      setSavedProperties([]); // إعادة تعيين إلى مصفوفة فارغة عند الخطأ
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    fetchSavedProperties();
  }, [fetchSavedProperties]);

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
        <h2>العقارات المحفوظة</h2>
      </motion.div>

      {savedProperties.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i> لم تقم بحفظ أي عقارات بعد.
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
              {savedProperties.map((property, index) => (
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
                      onClick={() => navigate(`/property/${property.id}`)}
                      title="عرض التفاصيل"
                    >
                      <i className="bi bi-eye"></i>
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
export default SavedProperties;