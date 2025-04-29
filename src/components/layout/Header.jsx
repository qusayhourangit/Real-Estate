import { Dropdown } from 'react-bootstrap';

export default function Header() {
  return (
    <header className="header bg-white shadow-sm p-3 d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <h5 className="mb-0">مرحباً، محمد!</h5>
      </div>
      
      <div className="d-flex align-items-center">
        <button className="btn btn-light me-2 position-relative">
          <Bell size={20} />
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            3
          </span>
        </button>
        
        <Dropdown>
          <Dropdown.Toggle variant="light" id="dropdown-user">
            <PersonCircle size={20} className="me-2" />
            حسابي
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item href="/dashboard/profile">الملف الشخصي</Dropdown.Item>
            <Dropdown.Item href="#">الإعدادات</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item href="/logout">تسجيل الخروج</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}