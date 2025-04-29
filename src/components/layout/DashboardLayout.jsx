import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import './dashboard.css';

export default function DashboardLayout() {
  return (
    <Container fluid className="dashboard-container px-0">
      <Row className="g-0">
        {/* Sidebar */}
        <Col md={3} lg={2} className="sidebar-col">
          <Sidebar />
        </Col>

        {/* Main Content */}
        <Col md={9} lg={10} className="main-col">
          <Header />
          <div className="content-wrapper p-4">
            <Outlet />
          </div>
        </Col>
      </Row>
    </Container>
  );
}