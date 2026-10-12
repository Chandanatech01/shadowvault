import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon, title, description, route, color }) => {
  const navigate = useNavigate();

  return (
    <div
      className="p-4 rounded h-100"
      onClick={() => navigate(route)}
      style={{
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = '#30363d';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon */}
      <div
        className="d-flex align-items-center justify-content-center rounded mb-3"
        style={{ width: 52, height: 52, backgroundColor: `${color}22`, fontSize: '1.6rem' }}
      >
        {icon}
      </div>

      {/* Title */}
      <h5 className="mb-2" style={{ color: '#e6edf3', fontWeight: 600 }}>
        {title}
      </h5>

      {/* Description */}
      <p className="mb-3" style={{ color: '#8b949e', fontSize: '0.875rem', lineHeight: 1.6 }}>
        {description}
      </p>

      {/* Go button */}
      <span style={{ color: color, fontSize: '0.85rem', fontWeight: 600 }}>
        Open → 
      </span>
    </div>
  );
};

export default FeatureCard;
