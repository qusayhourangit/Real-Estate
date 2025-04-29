import { Card, ListGroup, Badge } from 'react-bootstrap';

export default function RecentActivity() {
  // بيانات النشاطات الحديثة (يمكن استبدالها ببيانات حقيقية من API)
  const activities = [
    {
      id: 1,
      type: 'new_property',
      message: 'تمت إضافة عقار جديد في المزة',
      time: 'منذ ساعتين',
      read: false
    },
    {
      id: 2,
      type: 'message',
      message: 'لديك رسالة جديدة من أحمد علي',
      time: 'منذ 5 ساعات',
      read: false
    },
    {
      id: 3,
      type: 'sold',
      message: 'تم بيع عقار في كفرسوسة',
      time: 'منذ يوم',
      read: true
    },
    {
      id: 4,
      type: 'update',
      message: 'تم تحديث معلومات عقارك في دمشق القديمة',
      time: 'منذ 3 أيام',
      read: true
    }
  ];

  // أيقونات لكل نوع نشاط
  const activityIcons = {
    new_property: 'bi-house-add',
    message: 'bi-envelope',
    sold: 'bi-currency-dollar',
    update: 'bi-pencil-square'
  };

  // ألوان البادجات حسب نوع النشاط
  const badgeColors = {
    new_property: 'primary',
    message: 'warning',
    sold: 'success',
    update: 'info'
  };

  return (
    <Card className="shadow-sm h-100">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">النشاطات الحديثة</h5>
          <button className="btn btn-sm btn-outline-primary">عرض الكل</button>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {activities.map((activity) => (
            <ListGroup.Item 
              key={activity.id} 
              className={`border-0 py-3 px-4 ${!activity.read ? 'bg-light' : ''}`}
            >
              <div className="d-flex align-items-start">
                <div className={`icon-holder rounded-circle me-3 ${activity.read ? 'text-muted' : 'text-primary'}`}>
                  <i className={`bi ${activityIcons[activity.type]} fs-5`}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between">
                    <p className={`mb-1 ${!activity.read ? 'fw-bold' : ''}`}>
                      {activity.message}
                    </p>
                    {!activity.read && (
                      <Badge pill bg="danger" className="ms-2">
                        جديد
                      </Badge>
                    )}
                  </div>
                  <small className="text-muted">
                    <i className="bi bi-clock me-1"></i>
                    {activity.time}
                  </small>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}