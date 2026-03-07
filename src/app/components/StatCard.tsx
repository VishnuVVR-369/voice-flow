import React from 'react';

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  accentColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accentColor }) => {
  return (
    <article className="stat-card">
      <div className="stat-card-head">
        <span className="stat-icon" style={{ color: accentColor }}>{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <p className="stat-value">{value}</p>
      <div className="stat-accent" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
    </article>
  );
};

export default StatCard;
