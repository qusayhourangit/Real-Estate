import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice'; // افترض أن loginUser غير مستخدم هنا
import 'bootstrap-icons/font/bootstrap-icons.css';
import './NavBar.css'; // تأكد أن هذا الملف يحتوي على كل التنسيقات

function NavBar() {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // لا حاجة لدالة getUserRole إذا كان user من Redux يحتوي على role
  // const getUserRole = () => { ... };
  // const isAdmin = getUserRole() === 'admin';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100); // تأخير بسيط جداً للسماح بالـ render قبل إضافة الكلاس

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className={`navbar-wrapper container ${isLoaded ? 'loaded' : ''}`}>
      <div className="navbar-container">
        {/* الجزء الأيمن: الشعار */}
        <div className="logo-container">
          <Link to="/">
            <img
              src="/images/Logo1.png"
              alt="شعار الموقع"
              className="site-logo"
            />
          </Link>
        </div>

        {/* الجزء الأوسط: روابط التنقل */}
        <div className="nav-links">
          {/* زر PREMIUM يأخذ كلاس premium-btn و nav-link-item للأنيميشن */}
          <NavLink
            to="/premium" // تأكد من أن هذا المسار موجود في App.js
            className="premium-btn nav-link-item" // أضفنا nav-link-item
            title="اشترك كوكيل موثوق"
          >
            PREMIUM
          </NavLink>
          {/* الروابط الأخرى تأخذ كلاس nav-link و nav-link-item */}
          <NavLink to="/aboutus" className="nav-link nav-link-item">من نحن</NavLink>
          <NavLink to="/contactus" className="nav-link nav-link-item">التواصل معنا</NavLink>
          <NavLink to="/properties" className="nav-link nav-link-item">البحث عن عقار</NavLink>
          <NavLink to="/" className="nav-link nav-link-item" end>الرئيسية</NavLink>
        </div>

        {/* الجزء الأيسر: أزرار المستخدم */}
        <div className="user-actions">
          <div className="quick-icons">
            {isAuthenticated && (
              <>
                <Link to="/savedproperties" className="icon-btn" title="العقارات المحفوظة">
                  <i className="bi bi-bookmark-heart-fill"></i>
                </Link>
                <Link to="/addproperty" className="icon-btn" title="إضافة عقار">
                  <i className="bi bi-plus-circle-fill"></i>
                </Link>
                <Link
                  to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                  className="icon-btn"
                  title="لوحة التحكم"
                >
                  {user?.role === 'admin'
                    ? <i className="bi bi-person-workspace"></i>
                    : <i className="bi bi-speedometer2"></i>}
                </Link>
              </>
            )}
          </div>

          {/* أزرار الدخول/الخروج */}
          <div className="auth-buttons">
            {isAuthenticated ? (
              <>
                <button onClick={handleLogout} className="logout-btn">
                  <i className="bi bi-box-arrow-right me-1"></i> تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="login-btn">تسجيل الدخول</Link>
                <Link to="/register" className="register-btn">حساب جديد</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;