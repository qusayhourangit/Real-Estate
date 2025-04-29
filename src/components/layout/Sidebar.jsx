import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: 'speedometer2', label: 'الرئيسية' },
    { path: '/dashboard/properties', icon: 'house', label: 'عقاراتي' },
    { path: '/dashboard/add-property', icon: 'plus-circle', label: 'إضافة عقار' },
    { path: '/dashboard/profile', icon: 'person', label: 'الملف الشخصي' },
  ];

  return (
    <div className="sidebar bg-light h-100 shadow">
      <div className="sidebar-header p-3 text-center border-bottom">
        <h5 className="mb-0">لوحة التحكم</h5>
      </div>
      <Nav className="flex-column p-3">
        {navItems.map((item) => (
          <Nav.Link
            as={Link}
            to={item.path}
            key={item.path}
            active={location.pathname === item.path}
            className="d-flex align-items-center py-3 px-3 rounded"
          >
            <i className={`bi bi-${item.icon} me-2`}></i>
            {item.label}
          </Nav.Link>
        ))}
        <Nav.Link className="d-flex align-items-center py-3 px-3 rounded text-danger">
          <i className="bi bi-box-arrow-left me-2"></i>
          تسجيل الخروج
        </Nav.Link>
      </Nav>
    </div>
  );
}