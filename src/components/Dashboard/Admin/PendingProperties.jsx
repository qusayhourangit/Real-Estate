import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap'; // Pagination لم يتم استيرادها هنا لأنك تستخدم ul/li
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../../../API/api';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { propertyStatusChanged } from '../../../redux/authSlice';

const PendingProperties = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // العدد المفضل للعناصر في كل صفحة
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchPendingProperties = useCallback(async (pageToFetch = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      // --- إرسال itemsPerPage كـ per_page في الطلب ---
      const response = await api.get(`/admin/get-properties?page=${pageToFetch}&status=pending&per_page=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // --- هام جداً: تحقق من بنية الاستجابة في الـ Console ---
      console.log("Full API Response (Pending Properties):", JSON.stringify(response.data, null, 2));

      const apiResponseObject = response.data; // الكائن الأساسي من response.data

      let extractedProperties = [];
      // --- محاولة استخلاص مصفوفة العقارات ---
      // عدّل هذه المسارات إذا لزم الأمر بناءً على مخرجات الـ console.log أعلاه
      if (apiResponseObject && typeof apiResponseObject === 'object') {
        if (Array.isArray(apiResponseObject.data)) {
            extractedProperties = apiResponseObject.data;
            console.log("Properties extracted from: apiResponseObject.data");
        } else if (apiResponseObject.data && Array.isArray(apiResponseObject.data.data)) { // للـ Laravel pagination الشائع response.data.data
            extractedProperties = apiResponseObject.data.data;
            console.log("Properties extracted from: apiResponseObject.data.data (Laravel style)");
        } else if (Array.isArray(apiResponseObject.items)) {
            extractedProperties = apiResponseObject.items;
            console.log("Properties extracted from: apiResponseObject.items");
        } else if (Array.isArray(apiResponseObject.properties)) {
            extractedProperties = apiResponseObject.properties;
            console.log("Properties extracted from: apiResponseObject.properties");
        } else if (Array.isArray(apiResponseObject)) {
            extractedProperties = apiResponseObject;
            console.log("Properties extracted from: apiResponseObject (as direct array)");
        } else {
            console.warn("Could not find a known array path for properties in apiResponseObject.");
        }
      } else if (Array.isArray(apiResponseObject)) {
          extractedProperties = apiResponseObject;
          console.log("Properties extracted from: apiResponseObject (as direct array, outer check)");
      } else {
          console.warn("apiResponseObject is not an object or array.");
      }
      
      console.log("Extracted properties count:", extractedProperties.length);
      if (extractedProperties.length > 0) {
          console.log("First extracted property (structure check):", JSON.stringify(extractedProperties[0], null, 2));
      }

      if (!Array.isArray(extractedProperties)) {
          console.error("Critical: `extractedProperties` is NOT an array. Defaulting to empty. Value:", extractedProperties);
          extractedProperties = [];
      }
      setPendingProperties(extractedProperties);

      // --- استخلاص معلومات ترقيم الصفحات ---
      const metaSource = apiResponseObject?.meta || apiResponseObject?.data || apiResponseObject || {}; // جرب apiResponseObject.data إذا كانت معلومات الترقيم هناك
      
      const lastPageFromAPI = parseInt(metaSource.last_page, 10);
      const perPageFromAPI = parseInt(metaSource.per_page, 10);
      const totalItemsFromAPI = parseInt(metaSource.total, 10);

      let finalTotalPages = 1;
      if (lastPageFromAPI && lastPageFromAPI > 0) {
        finalTotalPages = lastPageFromAPI;
      } else if (totalItemsFromAPI > 0 && perPageFromAPI > 0) {
        finalTotalPages = Math.ceil(totalItemsFromAPI / perPageFromAPI);
      }
      
      setTotalPages(finalTotalPages > 0 ? finalTotalPages : 1);
      
      if (perPageFromAPI && perPageFromAPI > 0) {
          setItemsPerPage(perPageFromAPI); // تحديث itemsPerPage بما أرجعه الـ API
      }

      console.log("Pagination details: totalPages set to:", finalTotalPages, "itemsPerPage set to:", perPageFromAPI || itemsPerPage, "API last_page:", metaSource.last_page, "API per_page:", metaSource.per_page, "API total:", metaSource.total);

    } catch (err) {
      console.error("Error details fetching pending:", err.response?.data || err.message || err);
      setError("حدث خطأ تقني في جلب العقارات المعلقة: " + (err.response?.data?.message || err.message));
      setPendingProperties([]);
      setTotalPages(1); // إعادة التعيين عند الخطأ
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, itemsPerPage]);

  useEffect(() => {
    if (token) {
      fetchPendingProperties(currentPage);
    } else {
      setLoading(false);
      setError("غير مصرح لك بالوصول. الرجاء تسجيل الدخول كمدير.");
    }
  }, [currentPage, token, fetchPendingProperties]);


  const handleApprove = async (propertyId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذا العقار؟')) return;
    try {
      await api.patch(
        `/admin/accept-pending-property/${propertyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('تمت الموافقة بنجاح');
      // التحقق إذا كانت هذه آخر معاملة في الصفحة الحالية (و ليست الصفحة الأولى)
      if (pendingProperties.length === 1 && currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1); // سينتج عنه استدعاء fetchPendingProperties
      } else {
        fetchPendingProperties(currentPage); // إعادة جلب البيانات لنفس الصفحة
      }
      dispatch(propertyStatusChanged());
    } catch (err) {
      console.error("خطأ في الموافقة:", err.response?.data || err.message);
      toast.error(`فشل في الموافقة: ${err.response?.data?.message || 'حدث خطأ غير متوقع'}`);
    }
  };

  const handleReject = async (propertyId, userId) => {
    if (!userId) {
      toast.error("خطأ: معرف المستخدم غير متوفر للعقار.", { position: 'top-left', rtl: true });
      return;
    }
    const reason = prompt('الرجاء إدخال سبب الرفض (إلزامي):');
    if (!reason || reason.trim() === '') {
      toast.warn("يجب إدخال سبب الرفض.", { position: 'top-left', rtl: true });
      return;
    }
    try {
      await api.patch(
        `/admin/denied-property/${userId}/${propertyId}`,
        { reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('تم رفض العقار');
      if (pendingProperties.length === 1 && currentPage > 1) {
        setCurrentPage(prevPage => prevPage - 1);
      } else {
        fetchPendingProperties(currentPage);
      }
      dispatch(propertyStatusChanged());
    } catch (err) {
      console.error("خطأ في الرفض:", err.response?.data || err.message);
      toast.error(`فشل في الرفض: ${err.response?.data?.message || 'حدث خطأ غير متوقع'}`);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };
  
  // --- لعرض أرقام الصفحات مع نقاط (...) ---
  const getPaginationItems = () => {
    const pageNeighbours = 1; // عدد الصفحات المجاورة للصفحة الحالية من كل جهة
    const totalNumbers = (pageNeighbours * 2) + 3; // أرقام البداية والنهاية ونقاط ...
    const totalBlocks = totalNumbers + 2; // مع السابق والتالي

    if (totalPages <= totalBlocks) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const startPage = Math.max(2, currentPage - pageNeighbours);
    const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);

    pages.push(1); // دائماً أظهر الصفحة الأولى

    if (startPage > 2) {
        pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    if (endPage < totalPages - 1) {
        pages.push('...');
    }

    pages.push(totalPages); // دائماً أظهر الصفحة الأخيرة
    return pages;
  };


  if (loading && pendingProperties.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">جاري تحميل العقارات المعلقة...</p>
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
            <Button variant="primary" size="sm" onClick={() => fetchPendingProperties(currentPage)}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              إعادة المحاولة
            </Button>
          </div>
        </Alert>
      </div>
    );
  }
  
  // --- إضافة console.log هنا للتحقق من القيم قبل العرض ---
  console.log("Render check: loading=", loading, "error=", error, "pendingProperties.length=", pendingProperties.length, "totalPages=", totalPages);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-lg-4 p-md-3 p-2"
    >
      <motion.h2 className="mb-4" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>العقارات المعلقة للمراجعة</motion.h2>

      {!loading && !error && pendingProperties.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            لا توجد عقارات معلقة للمراجعة حالياً.
          </Alert>
        </motion.div>
      ) : (
        <>
          <Table striped bordered hover responsive className="mt-3 shadow-sm align-middle">
            <thead className='table-light'>
              <tr>
                <th>#</th>
                <th>العنوان</th>
                <th>الوصف</th>
                <th>السعر</th>
                <th>النوع</th>
                <th>الغرض</th>
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
                  style={{ verticalAlign: 'middle' }}
                >
                  <td>{ (currentPage - 1) * itemsPerPage + index + 1 }</td>
                  <td>{property.title || 'N/A'}</td>
                  <td style={{ maxWidth: '250px' }} className='text-truncate'>{property.description || 'N/A'}</td>
                  <td>{property.price ? `${Number(property.price).toLocaleString()} ل.س` : 'N/A'}</td>
                  <td>
                    <Badge pill bg={property.type === 'house' ? 'info' : (property.type === 'commercial' ? 'warning' : (property.type === 'land' ? 'success' : 'secondary'))}>
                      {property.type === 'house' ? 'سكني' : (property.type === 'commercial' ? 'تجاري' : (property.type === 'land' ? 'أرض' :property.type || 'N/A'))}
                    </Badge>
                  </td>
                  <td>
                    <Badge pill bg={property.purpose === 'rent' ? 'success' : 'danger'}>
                      {property.purpose === 'rent' ? 'إيجار' : (property.purpose === 'sale' ? 'بيع' : property.purpose || 'N/A')}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-1 mb-1 mb-lg-0 action-btn" // أضفت كلاس مشترك للأزرار إذا أردت تنسيقها
                      onClick={() => navigate(`/properties/${property.id}`)}
                      title="عرض التفاصيل"
                    >
                      <i className="bi bi-eye-fill"></i>
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-1 mb-1 mb-lg-0 action-btn"
                      onClick={() => handleApprove(property.id)}
                      title="موافقة"
                    >
                      <i className="bi bi-check-lg"></i> <span className="d-none d-md-inline">موافقة</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="mb-1 mb-lg-0 action-btn" // كلاس مشترك
                      onClick={() => handleReject(property.id, property.user_id)}
                      title="رفض"
                    >
                      <i className="bi bi-x-lg"></i> <span className="d-none d-md-inline">رفض</span>
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </Table>

          {/* --- Pagination UI (باستخدام ul/li كما في كودك الأصلي مع تحسين بسيط) --- */}
          {totalPages > 1 && !loading && (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="Page navigation">
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} aria-label="Previous">
                      <span aria-hidden="true">&laquo;</span>
                    </button>
                  </li>
                  {getPaginationItems().map((page, index) => (
                    page === '...' ? (
                        <li key={`ellipsis-${index}`} className="page-item disabled">
                            <span className="page-link">...</span>
                        </li>
                    ) : (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(page)}>
                                {page}
                            </button>
                        </li>
                    )
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} aria-label="Next">
                      <span aria-hidden="true">&raquo;</span>
                    </button>
                  </li>
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