import React from 'react';
import { Link } from 'react-router-dom'; // إذا كنت تستخدم react-router-dom
import './NotFoundPage.css'; // سننشئ هذا الملف للـ CSS

function NotFoundPage() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="not-found-title">
          <span>4</span>
          <span className="not-found-zero-icon">👻</span> {/* أو أي أيقونة أخرى تفضلها */}
          <span>4</span>
        </h1>
        <h2 className="not-found-subtitle">عفواً، الصفحة غير موجودة!</h2>
        <p className="not-found-message">
          الصفحة التي تبحث عنها قد تكون حُذفت، أو تغير اسمها، أو أنها غير متاحة مؤقتاً.
        </p>
        <Link to="/" className="not-found-link">
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;