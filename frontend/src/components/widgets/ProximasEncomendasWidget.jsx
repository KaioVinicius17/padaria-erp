// src/components/widgets/ProximasEncomendasWidget.jsx
import React from 'react';

const widgetStyle = {
  backgroundColor: '#1e1e1e',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #333',
  flex: 1,
};

const titleStyle = {
  margin: '0 0 15px 0',
  fontSize: '1.2rem',
  color: '#17a2b8', // Azul para informação
};

const itemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: '1px solid #2a2a2a',
  padding: '8px 0',
};

const ProximasEncomendasWidget = ({ encomendas }) => {
  return (
    <div style={widgetStyle}>
      <h3 style={titleStyle}>Próximas Encomendas</h3>
      {encomendas.length > 0? (
        <ul>
          {encomendas.map(enc => (
            <li key={enc.id} style={itemStyle}>
              <span><strong>{enc.horario}</strong> - {enc.cliente}</span>
              <span>{enc.produto}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma encomenda para hoje.</p>
      )}
    </div>
  );
};

export default ProximasEncomendasWidget;