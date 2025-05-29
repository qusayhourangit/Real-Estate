// components/admin/SubscriptionRequests.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import api from '../../../API/api'; // تأكد من أن هذا هو المسار الصحيح لملف api.js الخاص بك
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import arSA from 'date-fns/locale/ar-SA';
import CountdownTimer from './CountdownTimer'; //  <-- تأكد من المسار الصحيح لمكون العد التنازلي

const SubscriptionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector(state => state.auth);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('admin/premium-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.requests || response.data.data || response.data || []);
      console.log("طلبات الاشتراك المستلمة (Admin):", response.data);
    } catch (err) {
      console.error("Error fetching subscription requests (Admin):", err);
      setError(err.response?.data?.message || err.message || "فشل في جلب طلبات الاشتراك");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRequests();
    }
  }, [token]);

  const handleShowDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  const handleSubscriptionExpire = (requestId) => {
    console.log(`Subscription expired for request ID: ${requestId}`);
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: 'expired' } : req
      )
    );
  };

  const handleApproveRequest = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    setError(null);
    try {
      const response = await api.patch(`admin/accept-premium-request/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Response from approve request:", response.data);
      alert(response.data.message || 'تم قبول الطلب بنجاح!');
      fetchRequests();
    } catch (err) {
      console.error("Error approving request:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "فشل في قبول الطلب");
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    setError(null);
    try {
      const response = await api.patch(`admin/denied-premium-request/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Response from reject request:", response.data);
      alert(response.data.message || 'تم رفض الطلب بنجاح!');
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "فشل في رفض الطلب");
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const getPlanLabel = (planId) => {
    const labels = {
      basic: "الأساسية", standard: "الأساسية", pro: "الاحترافية",
      gold: "الذهبية", golden: "الذهبية",
    };
    return labels[planId?.toLowerCase()] || planId;
  };

  const getDurationLabel = (duration) => {
    const labels = {
      month: "شهري", quarter: "ربع سنوي", 'three month': "ربع سنوي", year: "سنوي",
    };
    return labels[duration?.toLowerCase()] || duration;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">جاري تحميل طلبات الاشتراك...</p>
      </div>
    );
  }

  if (error && requests.length === 0) {
    return <Alert variant="danger">خطأ: {error}</Alert>;
  }

  return (
    <div>
      <h2 className="mb-4">طلبات الاشتراك المميز</h2>
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>خطأ: {error}</Alert>}

      {requests.length === 0 && !loading ? (
        <Alert variant="info">لا توجد طلبات اشتراك حالية.</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>اسم المستخدم</th>
              <th>الخطة</th>
              <th>المدة</th>
              <th>تاريخ الطلب</th>
              <th>الحالة</th>
              <th>الوقت المتبقي</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => (
              <tr key={req.id}>
                <td>{index + 1}</td>
                <td>{req.user_details?.name || req.user?.name || req.name}</td>
                <td>
                  <Badge bg={req.plan?.toLowerCase() === 'pro' ? 'primary' : req.plan?.toLowerCase() === 'gold' || req.plan?.toLowerCase() === 'golden' ? 'warning text-dark' : 'secondary'}>
                    {getPlanLabel(req.plan)}
                  </Badge>
                </td>
                <td>{getDurationLabel(req.duration)}</td>
                <td>
                  {req.created_at ? format(new Date(req.created_at), 'Pp', { locale: arSA }) : 'غير متوفر'}
                </td>
                <td>
                  <Badge bg={req.status === 'pending' ? 'info' : req.status === 'accepted' || req.status === 'approved' ? 'success' : req.status === 'expired' ? 'secondary' : (req.status === 'rejected' || req.status === 'denied' ? 'danger' : 'dark')}>
                    {req.status === 'pending' ? 'معلق' 
                     : req.status === 'accepted' || req.status === 'approved' ? 'مقبول' 
                     : req.status === 'expired' ? 'منتهي الصلاحية'
                     : (req.status === 'rejected' || req.status === 'denied') ? 'مرفوض' 
                     : req.status}
                  </Badge>
                </td>
                <td>
                  {(req.status === 'accepted' || req.status === 'approved') && req.end_date ? (
                    <CountdownTimer 
                        targetDate={req.end_date} 
                        onExpire={() => handleSubscriptionExpire(req.id)} 
                    />
                  ) : req.status === 'expired' ? (
                    <Badge bg="dark" className="p-2">منتهي</Badge>
                  ) : (
                    <Badge bg="light" text="dark" className="p-2">-</Badge>
                  )}
                </td>
                <td>
                  <Button variant="outline-info" size="sm" className="me-1 mb-1" onClick={() => handleShowDetails(req)} disabled={actionLoading[req.id]}>
                    <i className="bi bi-eye-fill"></i>
                  </Button>
                  {req.status === 'pending' && (
                    <>
                      <Button 
                        variant="success" size="sm" className="me-1 mb-1" 
                        onClick={() => handleApproveRequest(req.id)}
                        disabled={actionLoading[req.id]}
                      >
                        {actionLoading[req.id] ? <Spinner as="span" animation="border" size="sm" className="me-1" /> : <i className="bi bi-check-lg"></i>}
                      </Button>
                      <Button 
                        variant="danger" size="sm" className="mb-1"
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={actionLoading[req.id]}
                      >
                        {actionLoading[req.id] ? <Spinner as="span" animation="border" size="sm" className="me-1" /> : <i className="bi bi-x-lg"></i>}
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} centered size="lg" dir="rtl">
        <Modal.Header closeButton>
          <Modal.Title>تفاصيل طلب الاشتراك</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <p><strong>اسم المستخدم:</strong> {selectedRequest.user_details?.name || selectedRequest.user?.name || selectedRequest.name}</p>
              <p><strong>البريد الإلكتروني للمستخدم:</strong> {selectedRequest.user_details?.email || selectedRequest.user?.email || 'غير متوفر'}</p>
              <hr/>
              <p><strong>اسم المكتب:</strong> {selectedRequest.office_name || 'لم يحدد'}</p>
              <p><strong>عنوان المكتب:</strong> {selectedRequest.office_location || 'لم يحدد'}</p>
              <p><strong>رقم الهاتف:</strong> {selectedRequest.phone}</p>
              <p><strong>نبذة (About):</strong> {selectedRequest.about || 'لا يوجد'}</p>
              <hr/>
              <p><strong>الخطة المطلوبة:</strong> {getPlanLabel(selectedRequest.plan)}</p>
              <p><strong>مدة الاشتراك:</strong> {getDurationLabel(selectedRequest.duration)}</p>
              <p><strong>تاريخ الطلب:</strong> {selectedRequest.created_at ? format(new Date(selectedRequest.created_at), 'PPPPp', { locale: arSA }) : 'غير متوفر'}</p>
              {(selectedRequest.status === 'accepted' || selectedRequest.status === 'approved') && selectedRequest.start_date && (
                 <p><strong>تاريخ بدء الاشتراك:</strong> {format(new Date(selectedRequest.start_date), 'PPPPp', { locale: arSA })}</p>
              )}
              {(selectedRequest.status === 'accepted' || selectedRequest.status === 'approved') && selectedRequest.end_date && (
                <p><strong>تاريخ انتهاء الاشتراك:</strong> {format(new Date(selectedRequest.end_date), 'PPPPp', { locale: arSA })}</p>
              )}
               {(selectedRequest.status === 'accepted' || selectedRequest.status === 'approved') && selectedRequest.end_date && (
                <p><strong>الوقت المتبقي:</strong> <CountdownTimer targetDate={selectedRequest.end_date} /></p>
              )}
              <p><strong>الحالة الحالية:</strong> <Badge bg={selectedRequest.status === 'pending' ? 'info' : selectedRequest.status === 'accepted' || selectedRequest.status === 'approved' ? 'success' : selectedRequest.status === 'expired' ? 'secondary' : (selectedRequest.status === 'rejected' || selectedRequest.status === 'denied' ? 'danger' : 'dark')}>
                    {selectedRequest.status === 'pending' ? 'معلق' 
                     : selectedRequest.status === 'accepted' || selectedRequest.status === 'approved' ? 'مقبول' 
                     : selectedRequest.status === 'expired' ? 'منتهي الصلاحية'
                     : (selectedRequest.status === 'rejected' || selectedRequest.status === 'denied') ? 'مرفوض' 
                     : selectedRequest.status}
                  </Badge></p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetailsModal}>إغلاق</Button>
           {selectedRequest && selectedRequest.status === 'pending' && (
            <>
              <Button 
                variant="success" 
                onClick={() => { handleApproveRequest(selectedRequest.id); handleCloseDetailsModal(); }}
                disabled={actionLoading[selectedRequest.id]}
              >
                {actionLoading[selectedRequest.id] ? <Spinner as="span" animation="border" size="sm" className="me-1" /> : <i className="bi bi-check-lg"></i>}
                 قبول
              </Button>
              <Button 
                variant="danger" 
                onClick={() => { handleRejectRequest(selectedRequest.id); handleCloseDetailsModal();}}
                disabled={actionLoading[selectedRequest.id]}
              >
                 {actionLoading[selectedRequest.id] ? <Spinner as="span" animation="border" size="sm" className="me-1" /> : <i className="bi bi-x-lg"></i>}
                 رفض
              </Button>
            </>
           )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SubscriptionRequests;