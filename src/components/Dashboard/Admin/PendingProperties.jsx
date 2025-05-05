import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../../../API/api'; // تأكد أن هذا هو المسار الصحيح لملف إعدادات api
import { useSelector, useDispatch } from 'react-redux'; // <-- استيراد useDispatch
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { propertyStatusChanged } from '../../../redux/authSlice'; // <-- تم التصحيح

const PendingProperties = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // قيمة افتراضية
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch(); // <-- تهيئة dispatch
  const navigate = useNavigate(); // <-- تعريف navigate

  const fetchPendingProperties = useCallback(async (page = currentPage) => { // جعل الصفحة بارامتر
    setLoading(true);
    setError(null);
    try {
      // استخدام الـ page القادمة للطلب
      const response = await api.get(`/admin/get-properties?page=${page}&status=pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const propertiesData = response.data?.data?.data || [];
      if (!Array.isArray(propertiesData)) throw new Error('Invalid data format from server');

      setPendingProperties(propertiesData);
      // التأكد من استخدام الاسم الصحيح لآخر صفحة من الـ API response
      const lastPage = responseData?.last_page || responseData?.meta?.last_page || 1;
      const perPage = responseData?.per_page || responseData?.meta?.per_page || 10;
      setTotalPages(lastPage);
      setItemsPerPage(perPage); // <-- تحديث الحالة هنا    } catch (err) {
      console.error("Error details fetching pending:", err.response?.data || err.message);
      setError("حدث خطأ تقني في جلب العقارات المعلقة: " + (err.response?.data?.message || err.message));
      setPendingProperties([]); // أفرغ القائمة عند الخطأ
    } finally {
      setLoading(false);
    }
  }, [token, currentPage]); // إعادة الجلب عند تغير التوكن أو الصفحة الحالية

  // جلب البيانات عند تحميل المكون أو تغير الصفحة
  useEffect(() => {
    if(token) { // تأكد من وجود التوكن قبل الجلب
        fetchPendingProperties(currentPage);
    } else {
        setLoading(false); // إذا لا يوجد توكن، لا يوجد بيانات للعرض
        setError("غير مصرح لك بالوصول. الرجاء تسجيل الدخول كمدير.");
    }
  }, [fetchPendingProperties, currentPage, token]); // إضافة token كاعتمادية


  const handleApprove = async (propertyId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذا العقار؟')) return;

    try {
      await api.patch(
        `/admin/accept-pending-property/${propertyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(Response)
      // تحديث القائمة المحلية
      const updatedProperties = pendingProperties.filter(p => p.id !== propertyId);
      setPendingProperties(updatedProperties);

      // إرسال إشارة لتحديث المكونات الأخرى
      dispatch(propertyStatusChanged()); // <-- إرسال الـ Action
      setTimeout(() => {
        fetchPendingProperties(currentPage);
    }, 300); // تأخير 300 ميلي ثانية (للاختبار فقط)
      toast.success('تمت الموافقة بنجاح', { /* ... toast options ... */ });

      // إعادة جلب البيانات للصفحة الحالية إذا أصبحت فارغة (بعد الحذف) ولم تكن هي الصفحة الأولى
      if (updatedProperties.length === 0 && currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1);
        // fetchPendingProperties(currentPage - 1); // أو يمكنك استدعاء الجلب مباشرة للصفحة السابقة
      } else if (updatedProperties.length === 0 && pendingProperties.length > 0) {
         // إذا كانت الصفحة الحالية هي الأخيرة وأصبحت فارغة، أعد جلبها لتظهر رسالة "لا يوجد"
         fetchPendingProperties(currentPage);
      }


    } catch (err) {
      console.error("خطأ في الموافقة:", err.response?.data || err.message);
      toast.error(`فشل في الموافقة: ${err.response?.data?.message || 'حدث خطأ غير متوقع'}`, { /* ... toast options ... */ });
    }
  };

  const handleReject = async (propertyId, userId) => {
    // تأكد من وجود userId قبل المتابعة
    if (!userId) {
        toast.error("خطأ: معرف المستخدم غير متوفر للعقار.", { position: 'top-left', rtl: true });
        return;
    }

    const reason = prompt('الرجاء إدخال سبب الرفض (إلزامي):');
    // التحقق إذا كان السبب فارغاً أو المستخدم ضغط Cancel
    if (!reason || reason.trim() === '') {
        toast.warn("يجب إدخال سبب الرفض.", { position: 'top-left', rtl: true });
        return;
    }

    try {
      await api.patch(
        // تأكد من صحة الـ Endpoint والبارامترات المطلوبة
        `/admin/denied-property/${userId}/${propertyId}`,
        { reason: reason.trim() }, // إرسال السبب في body الطلب
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // تحديث القائمة المحلية
      const updatedProperties = pendingProperties.filter(p => p.id !== propertyId);
      setPendingProperties(updatedProperties);

      // إرسال إشارة لتحديث المكونات الأخرى
      dispatch(propertyStatusChanged()); // <-- إرسال الـ Action

      toast.success('تم رفض العقار', { /* ... toast options ... */ });

      // نفس منطق إعادة الجلب عند إفراغ الصفحة
       if (updatedProperties.length === 0 && currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1);
      } else if (updatedProperties.length === 0 && pendingProperties.length > 0) {
         fetchPendingProperties(currentPage);
      }

    } catch (err) {
      console.error("خطأ في الرفض:", err.response?.data || err.message);
      toast.error(`فشل في الرفض: ${err.response?.data?.message || 'حدث خطأ غير متوقع'}`, { /* ... toast options ... */ });
    }
  };

  // --- دالة لتغيير الصفحة ---
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  // ------------------------

  // --- العرض (JSX) ---
  if (loading && pendingProperties.length === 0) { // عرض التحميل فقط إذا كانت القائمة فارغة
    return ( /* ... Spinner ... */
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">جاري تحميل العقارات المعلقة...</p>
      </div>
    );
  }

  if (error) {
    return ( /* ... Alert ... */
      <div className="p-4">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <div className="mt-2">
            <Button variant="primary" size="sm" onClick={() => fetchPendingProperties(currentPage)}>
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
      className="p-lg-4 p-md-3 p-2" // تعديل padding ليكون متجاوب
    >
      <motion.h2 /* ... */ >العقارات المعلقة للمراجعة</motion.h2>

      {/* --- رسالة عند عدم وجود عقارات --- */}
      {!loading && pendingProperties.length === 0 ? (
        <motion.div /* ... */ >
          <Alert variant="info">
             <i className="bi bi-info-circle me-2"></i>
             لا توجد عقارات معلقة للمراجعة في هذه الصفحة.
          </Alert>
        </motion.div>
      ) : (
        <>
          {/* --- الجدول --- */}
          <Table striped bordered hover responsive className="mt-3 shadow-sm align-middle">
            <thead className='table-light'>
              <tr>
                <th>#</th>
                <th>العنوان</th>
                <th>الوصف</th>
                <th>السعر</th>
                <th>النوع</th>
                <th>الغرض</th>
                 {/* يمكن إضافة اسم المستخدم الذي أضاف العقار */}
                 {/* <th>المستخدم</th> */}
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pendingProperties.map((property, index) => (
                <motion.tr
                  key={property.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ verticalAlign: 'middle' }} // لضمان محاذاة الأزرار عمودياً
                >
                  <td>{ (currentPage - 1) * itemsPerPage + index + 1 }</td>
                  <td>{property.title || 'N/A'}</td>
                  <td style={{ maxWidth: '250px' }} className='text-truncate'>{property.description || 'N/A'}</td>
                  <td>{property.price ? `${property.price.toLocaleString()} ل.س` : 'N/A'}</td>
                  <td>
                    <Badge pill bg={property.type === 'house' ? 'info' : 'secondary'}>
                      {property.type === 'house' ? 'سكني' : (property.type === 'commercial' ? 'تجاري' : property.type || 'N/A')}
                    </Badge>
                  </td>
                  <td>
                    <Badge pill bg={property.purpose === 'rent' ? 'success' : 'danger'}>
                      {property.purpose === 'rent' ? 'إيجار' : (property.purpose === 'sale' ? 'بيع' : property.purpose || 'N/A')}
                    </Badge>
                  </td>
                   {/* <td>{property.user?.name || 'N/A'}</td> */}
                  <td>
                    {/* إضافة زر لمعاينة التفاصيل */}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2 mb-1 mb-lg-0"
                      onClick={() => navigate(`/property/${property.id}`)} // افتراض أن هذا المسار يعرض التفاصيل
                      title="عرض التفاصيل"
                    >
                        <i className="bi bi-eye-fill"></i>
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2 mb-1 mb-lg-0" // إضافة هوامش لسهولة النقر
                      onClick={() => handleApprove(property.id)}
                    >
                      <i className="bi bi-check-lg"></i> <span className="d-none d-lg-inline">موافقة</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(property.id, property.user_id)} // <-- استخدام user_id من بيانات العقار
                    >
                      <i className="bi bi-x-lg"></i> <span className="d-none d-lg-inline">رفض</span>
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </Table>

          {/* --- Pagination --- */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="Page navigation">
                <ul className="pagination mb-0">
                  {/* زر السابق */}
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} aria-label="Previous">
                      <span aria-hidden="true">«</span>
                    </button>
                  </li>
                  {/* أرقام الصفحات */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                     // يمكن عرض عدد محدود من الأرقام إذا كان المجموع كبيراً
                     (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2) && (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(page)}>
                                {page}
                            </button>
                         </li>
                     ) || (
                         // عرض نقاط (...) إذا كان هناك فجوة
                         (Math.abs(page - currentPage) === 3) && (
                            <li key={`dots-${page}`} className="page-item disabled">
                                <span className="page-link">...</span>
                            </li>
                         )
                     )
                  ))}
                  {/* زر التالي */}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} aria-label="Next">
                      <span aria-hidden="true">»</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
          {/* ----------------- */}
        </>
      )}
    </motion.div>
  );
};

export default PendingProperties;