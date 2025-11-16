// src/components/widgets/EstoqueCriticoWidget.jsx
import React from 'react';

const widgetStyle = {
  backgroundColor: '#1e1e1e',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #333',
  flex: 1, // Para ocupar o espaço disponível
};

const titleStyle = {
  margin: '0 0 15px 0',
  fontSize: '1.2rem',
  color: '#ffc107', // Amarelo para alerta
};

const itemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: '1px solid #2a2a2a',
  padding: '8px 0',
};

const EstoqueCriticoWidget = ({ itens }) => {
  return (
    <div style={widgetStyle}>
      <h3 style={titleStyle}>Atenção: Estoque Crítico!</h3>
      {itens.length > 0? (
        <ul>
          {itens.map(item => (
            <li key={item.id} style={itemStyle}>
              <span>{item.nome}</span>
              <span style={{ color: '#ff4d4d' }}>
                {item.atual} / {item.minimo} {item.unidade}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum item em estado crítico.</p>
      )}
    </div>
  );
};

export default EstoqueCriticoWidget;