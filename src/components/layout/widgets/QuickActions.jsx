import { Card, Button, Stack } from 'react-bootstrap';

export default function QuickActions() {
  // الإجراءات السريعة (يمكن تعديلها حسب احتياجاتك)
  const quickActions = [
    {
      id: 1,
      title: 'إضافة عقار',
      icon: 'bi-plus-circle',
      variant: 'primary',
      link: '/dashboard/add-property'
    },
    {
      id: 2,
      title: 'تعديل عقار',
      icon: 'bi-pencil',
      variant: 'outline-primary',
      link: '/dashboard/properties'
    },
    {
      id: 3,
      title: 'تحميل تقرير',
      icon: 'bi-download',
      variant: 'outline-success',
      link: '#'
    },
    {
      id: 4,
      title: 'إعدادات الحساب',
      icon: 'bi-gear',
      variant: 'outline-secondary',
      link: '/dashboard/profile'
    }
  ];

  return (
    <Card className="shadow-sm h-100">
      <Card.Header className="bg-white border-bottom">
        <h5 className="mb-0">إجراءات سريعة</h5>
      </Card.Header>
      <Card.Body>
        <Stack gap={3}>
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              className="d-flex align-items-center justify-content-start py-2"
              href={action.link}
            >
              <i className={`bi ${action.icon} me-3 fs-5`}></i>
              {action.title}
            </Button>
          ))}
        </Stack>
      </Card.Body>
    </Card>
  );
}