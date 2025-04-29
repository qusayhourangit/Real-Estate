import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../../../API/api';
import { useSelector } from 'react-redux';

const PendingProperties = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useSelector((state) => state.auth);

  const fetchPendingProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/admin/get-properties?page=${currentPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("API Response Data Structure:", response.data); // لتوضيح هيكل البيانات
      
      // التعديل 1: الوصول إلى البيانات بشكل صحيح
      const propertiesData = response.data?.data?.data || []; // مثال: response.data.data.data
      
      // التعديل 2: ترشيح العقارات المعلقة
      const filteredProperties = propertiesData.filter(
        property => property.status === 'pending'
      );
      
      setPendingProperties(filteredProperties);
      
      // التعديل 3: إعداد ترقيم الصفحات بشكل صحيح
      setTotalPages(response.data?.data?.totalPages || 1);
      
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("حدث خطأ أثناء جلب العقارات: " + (err.response?.data?.message || err.message));
      setPendingProperties([]);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage]);

  useEffect(() => {
    fetchPendingProperties();
  }, [fetchPendingProperties]);

  const handleApprove = (propertyId) => {
    if (window.confirm('هل أنت متأكد من الموافقة على هذا العقار؟')) {
      const approvedProperty = pendingProperties.find(p => p.id === propertyId);
      const approvedProperties = JSON.parse(localStorage.getItem('approvedProperties') || '[]');

      localStorage.setItem(
        'approvedProperties',
        JSON.stringify([...approvedProperties, approvedProperty])
      );

      setPendingProperties(prev => prev.filter(p => p.id !== propertyId));
      alert('تمت الموافقة على العقار بنجاح');
    }
  };

  const handleReject = (propertyId) => {
    const reason = prompt('الرجاء إدخال سبب الرفض:');
    if (reason) {
      const rejectedProperty = pendingProperties.find(p => p.id === propertyId);
      const rejectedProperties = JSON.parse(localStorage.getItem('rejectedProperties') || '[]');

      localStorage.setItem(
        'rejectedProperties',
        JSON.stringify([...rejectedProperties, { ...rejectedProperty, reason }])
      );

      setPendingProperties(prev => prev.filter(p => p.id !== propertyId));
      alert('تم رفض العقار بنجاح');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">جاري تحميل العقارات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <div className="mt-2">
            <Button variant="primary" onClick={fetchPendingProperties}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              إعادة المحاولة
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      <motion.h2
        className="mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        العقارات المعلقة للمراجعة
      </motion.h2>

      {pendingProperties.length === 0 && !loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            لا توجد عقارات معلقة حالياً
          </Alert>
        </motion.div>
      ) : (
        <>
          <Table striped bordered hover responsive className="mt-3">
            <thead>
              <tr>
                <th>#</th>
                <th>العنوان</th>
                <th>الوصف</th>
                <th>السعر</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pendingProperties.map((property, index) => (
                <motion.tr
                key={property.id} // التعديل 4: استخدام id فريد
                initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>{index + 1}</td>
                  <td>{property.title || 'بدون عنوان'}</td>
                  <td>{property.description || 'بدون وصف'}</td>
                  <td>{property.price ? `${property.price} ليرة سورية` : 'غير محدد'}</td>
                  <td>
                    <Badge bg={property.purpose === 'rent' ? 'info' : 'warning'}>
                      {property.purpose === 'rent' ? 'إيجار' : 'بيع'}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg="warning">قيد المراجعة</Badge>
                  </td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleApprove(property.id)}
                    >
                      <i className="bi bi-check-lg"></i> موافقة
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(property.id)}
                    >
                      <i className="bi bi-x-lg"></i> رفض
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </Table>

      {/* التعديل 5: تصحيح ترقيم الصفحات */}
      {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default PendingProperties;