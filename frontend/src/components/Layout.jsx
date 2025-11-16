// src/components/Layout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const sidebarStyle = {
  width: '250px',
  backgroundColor: '#1a1a1a',
  padding: '20px',
  height: '100vh',
  position: 'fixed',
  color: 'white'
};

const contentStyle = {
  marginLeft: '270px', // 250px da sidebar + 20px de margem
  padding: '20px',
  width: 'calc(100% - 270px)'
};

const Layout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <aside style={sidebarStyle}>
        <h2>Padaria ERP</h2>
        <nav>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li style={{ padding: '10px 0' }}>Dashboard</li>
            <li style={{ padding: '10px 0' }}>Produtos</li>
            <li style={{ padding: '10px 0' }}>Fornecedores</li>
            <li style={{ padding: '10px 0' }}>Clientes</li>
            <li style={{ padding: '10px 0' }}>Compras</li>
            <li style={{ padding: '10px 0' }}>Produção</li>
            <li style={{ padding: '10px 0' }}>Encomendas</li>
            <li style={{ padding: '10px 0' }}>Financeiro</li>
          </ul>
        </nav>
      </aside>
      <main style={contentStyle}>
        <Outlet /> {/* É aqui que as nossas páginas serão renderizadas */}
      </main>
    </div>
  );
};

export default Layout;