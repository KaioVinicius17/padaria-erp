// src/components/widgets/KPICard.jsx
import React from 'react';

const cardStyle = {
  backgroundColor: '#1e1e1e',
  padding: '20px',
  borderRadius: '8px',
  minWidth: '250px',
  border: '1px solid #333',
};

const titleStyle = {
  margin: 0,
  fontSize: '1rem',
  color: '#aaa',
};

const valueStyle = {
  margin: '10px 0',
  fontSize: '2.5rem',
  fontWeight: 'bold',
};

const comparisonStyle = {
  margin: 0,
  fontSize: '0.9rem',
  color: '#00b300', // Verde para positivo
};

const KPICard = ({ title, value, comparison }) => {
  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <p style={valueStyle}>{value}</p>
      <p style={comparisonStyle}>{comparison}</p>
    </div>
  );
};

export default KPICard;