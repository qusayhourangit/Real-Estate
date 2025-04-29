import { Card } from 'react-bootstrap';

export default function StatsCard({ title, value, icon, color }) {
  return (
    <Card className="stats-card border-0 shadow-sm" style={{ borderLeftColor: color }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="text-muted mb-2">{title}</h6>
            <h3 className="mb-0">{value}</h3>
          </div>
          <div 
            className="icon-wrapper rounded-circle d-flex align-items-center justify-content-center"
            style={{ backgroundColor: color + '20', color: color }}
          >
            <i className={`bi bi-${icon} fs-4`}></i>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}