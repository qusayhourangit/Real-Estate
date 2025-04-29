import React, { useState, useEffect, useCallback , useRef } from 'react';
import { Table, Button, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../../../API/api';
import { useSelector } from 'react-redux';

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useSelector((state) => state.auth);
  const fetchController = useRef(null);

  // تحسين fetchUsers باستخدام useCallback
  const fetchUsers = useCallback(async (currentSearchTerm) => {
    try {
      if (fetchController.current) {
        fetchController.current.abort();
      }
      fetchController.current = new AbortController();
      
      setLoading(true);
      setError(null);

      const response = await api.get(`/admin/get-users?search=${currentSearchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: fetchController.current.signal
      });

      // التعديل الرئيسي هنا: التأكد من أن البيانات مصفوفة
      const usersData = Array.isArray(response.data?.data) ? response.data.data : [];
      setUsers(usersData);

    } catch (err) {
      if (!err.name === 'AbortError') {
        setError("حدث خطأ أثناء جلب قائمة المستخدمين.");
        console.error("Error fetching users:", err);
      }
    } finally {
      setLoading(false);
      fetchController.current = null;
    }
  }, [token]); // إزالة users.length من التبعيات

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
      if (fetchController.current) {
        fetchController.current.abort();
      }
    };
  }, [searchTerm, fetchUsers]);

  const handleToggleBlock = async (userId, currentStatus) => {
    const action = currentStatus === 'active' ? 'حظر' : 'إلغاء حظر';
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    
    if (!window.confirm(`هل أنت متأكد من ${action} المستخدم #${userId}؟`)) return;

    try {
      await api.patch(`/admin/users/${userId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
    } catch (err) {
      alert(`حدث خطأ أثناء ${action} المستخدم: ${err.message}`);
    }
  };

  // دوال مساعدة
  const getStatusBadgeVariant = (status) => status === 'active' ? 'success' : 'danger';
  const getStatusText = (status) => status === 'active' ? 'نشط' : 'محظور';
  const getToggleButtonVariant = (status) => status === 'active' ? 'danger' : 'success';

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">جاري تحميل المستخدمين...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-4">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          إدارة المستخدمين
        </motion.h2>
        
        <Form.Control
          type="search"
          placeholder="ابحث بالاسم أو البريد الإلكتروني..."
          className="w-50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {users.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا يوجد مستخدمون مسجلون"}
          </Alert>
        </motion.div>
      ) : (
        <motion.div variants={listContainerVariants} initial="hidden" animate="visible">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <motion.tr key={user.id} variants={listItemVariants}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <Badge bg={user.role === 'admin' ? 'primary' : 'secondary'}>
                      {user.role === 'admin' ? 'أدمن' : 'مستخدم'}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={getStatusBadgeVariant(user.status)}>
                      {getStatusText(user.status)}
                    </Badge>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('ar-SY')}</td>
                  <td>
                    {user.role !== 'admin' && (
                      <Button
                        variant={getToggleButtonVariant(user.status)}
                        size="sm"
                        onClick={() => handleToggleBlock(user.id, user.status)}
                      >
                        <i className={`bi ${user.status === 'active' ? 'bi-slash-circle' : 'bi-check-circle'}`}></i>
                        {' '}
                        {user.status === 'active' ? 'حظر' : 'تفعيل'}
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </Table>
        </motion.div>
      )}
    </div>
  );
};

export default ManageUsers;