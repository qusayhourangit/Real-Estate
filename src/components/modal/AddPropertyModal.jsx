import React from 'react';
import Modal from 'react-bootstrap/Modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import AddPropertyForm from './AddPropertyForm'; // تأكد من أن المسار صحيح
import './AddPropertyModal.css'; // تأكد من أن المسار صحيح

function AddPropertyModal({ show, handleClose }) {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl" // حجم كبير جدًا مناسب للمحتوى
      centered
      dialogClassName="property-modal" // كلاس مخصص إذا احتجت لتنسيقات إضافية
      backdrop="static" // يمنع الإغلاق بالنقر خارج المودال
      keyboard={false} // يمنع الإغلاق بزر Esc
      scrollable={true} // يسمح بالتمرير داخل المودال إذا كان المحتوى أطول من الشاشة
    >
       <Modal.Header closeButton>
         <Modal.Title as="h5"> {/* استخدام h5 لحجم عنوان مناسب */}
            <i className="bi bi-house-add me-2"></i> {/* تعديل لـ me-2 بدلاً من style */}
            إضافة عقار جديد
        </Modal.Title>
       </Modal.Header>
      <Modal.Body className="p-0"> {/* إزالة الحشو الافتراضي */}
        {/* تمرير دالة handleClose ليتم استدعاؤها عند نجاح الإضافة لإغلاق المودال */}
        {/* يتم استدعاء onSubmissionSuccess فقط عند الإضافة الناجحة وليس التعديل */}
        <AddPropertyForm onSubmissionSuccess={handleClose} />
      </Modal.Body>
       {/* يمكن إزالة التذييل إذا لم تكن هناك حاجة لأزرار إضافية هنا */}
       {/*
       <Modal.Footer>
         <Button variant="secondary" onClick={handleClose}>
           إغلاق
         </Button>
       </Modal.Footer>
       */}
    </Modal>
  );
}

export default AddPropertyModal;