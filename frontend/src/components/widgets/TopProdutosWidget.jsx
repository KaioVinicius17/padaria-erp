// src/components/widgets/TopProdutosWidget.jsx
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
};

const itemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
};

const TopProdutosWidget = ({ produtos }) => {
  return (
    <div style={widgetStyle}>
      <h3 style={titleStyle}>Produtos Mais Vendidos (Hoje)</h3>
      {produtos.length > 0? (
        <ol style={{ paddingLeft: '20px' }}>
          {produtos.map(p => (
            <li key={p.id} style={itemStyle}>
              <span>{p.nome}</span>
              <span>{p.quantidade} un</span>
            </li>
          ))}
        </ol>
      ) : (
        <p>Nenhuma venda registrada hoje.</p>
      )}
    </div>
  );
};

export default TopProdutosWidget;