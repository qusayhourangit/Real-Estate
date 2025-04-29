import React from 'react';
import Modal from 'react-bootstrap/Modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import AddPropertyForm from './AddPropertyForm';
import './AddPropertyModal.css'; // احتفظ بملف الـ CSS الخاص بالمودال أيضًا

function AddPropertyModal({ show, handleClose }) {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl" // يمكن تغيير الحجم إلى xl ليلائم المحتوى الأكبر
      centered
      dialogClassName="property-modal" // استخدم الكلاس الخاص بك للتنسيق
      backdrop="static" // يمنع الإغلاق عند النقر خارج المودال
      keyboard={false} // يمنع الإغلاق عند الضغط على زر Esc
    >
      {/* يمكنك إضافة رأس للمودال إذا أردت */}
       <Modal.Header closeButton>
         <Modal.Title>
            <i className="bi bi-house-add" style={{ marginLeft: '10px' }}></i>
            إضافة عقار جديد
        </Modal.Title>
       </Modal.Header>
      <Modal.Body className="p-0"> {/* إزالة الـ padding الافتراضي للجسم */}
        {/* تمرير دالة handleClose كـ onSubmissionSuccess ليتم إغلاق المودال عند النجاح */}
        <AddPropertyForm onSubmissionSuccess={handleClose} />
      </Modal.Body>
       {/* يمكنك إضافة تذييل للمودال إذا أردت */}
       {/* <Modal.Footer>
         <Button variant="secondary" onClick={handleClose}>
           إغلاق
         </Button>
       </Modal.Footer> */}
    </Modal>
  );
}

export default AddPropertyModal;