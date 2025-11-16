// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import KPICard from '../components/widgets/KPICard';
import EstoqueCriticoWidget from '../components/widgets/EstoqueCriticoWidget';
import ProximasEncomendasWidget from '../components/widgets/ProximasEncomendasWidget';
import FaturamentoSemanalWidget from '../components/widgets/FaturamentoSemanalWidget';
import TopProdutosWidget from '../components/widgets/TopProdutosWidget';

const kpiGridStyle = {
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
  marginBottom: '20px',
};

const operationalGridStyle = {
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
  marginBottom: '20px',
};

const Dashboard = () => {
  const [vendasHoje, setVendasHoje] = useState('Carregando...');
  const [estoqueCritico, setEstoqueCritico] = useState([]);
  const [proximasEncomendas, setProximasEncomendas] = useState([]);
  const [faturamentoSemanal, setFaturamentoSemanal] = useState([]);
  const [topProdutos, setTopProdutos] = useState([]);

  useEffect(() => {
    // Simulação da busca de dados para todos os widgets
    axios.get('https://jsonplaceholder.typicode.com/posts/1')
      .then(response => {
        const valorSimulado = (Math.random() * 2000 + 1000).toFixed(2);
        setVendasHoje(`R$ ${valorSimulado}`);

        // Dados simulados para cada widget:
        const estoqueSimulado = [
          { nome: "Farinha", quantidade: 2, unidade: "kg" },
          { nome: "Fermento", quantidade: 0.5, unidade: "kg" },
        ];
        setEstoqueCritico(estoqueSimulado);

        const encomendasSimuladas = [
          { cliente: "Maria", produto: "Pão francês", quantidade: 20, entrega: "10:30" },
          { cliente: "João", produto: "Bolo", quantidade: 2, entrega: "16:00" },
        ];
        setProximasEncomendas(encomendasSimuladas);

        const faturamentoSimulado = [
          { dia: 'Seg', valor: 1200 },
          { dia: 'Ter', valor: 1400 },
          { dia: 'Qua', valor: 1350 },
          { dia: 'Qui', valor: 1800 },
          { dia: 'Sex', valor: 2100 },
          { dia: 'Sáb', valor: 2450 },
          { dia: 'Dom', valor: 2000 },
        ];
        setFaturamentoSemanal(faturamentoSimulado);

        const topProdutosSimulado = [
          { nome: "Pão Francês", vendas: 220 },
          { nome: "Bolo de Cenoura", vendas: 73 },
          { nome: "Pão de Queijo", vendas: 41 },
        ];
        setTopProdutos(topProdutosSimulado);
      })
      .catch(error => {
        console.error("Erro ao buscar dados do dashboard:", error);
        setVendasHoje('Erro!');
        setEstoqueCritico([]);
        setProximasEncomendas([]);
        setFaturamentoSemanal([]);
        setTopProdutos([]);
      });
  }, []); // Correto: array de dependências vazio

  return (
    <div>
      <h1>Painel de Controle</h1>
      <div style={kpiGridStyle}>
        <KPICard title="Vendas do Dia" value={vendasHoje} comparison="+15% vs. ontem" />
        <KPICard title="Ticket Médio" value="R$ 25,40" comparison="▲ Acima da média" />
        <KPICard title="Transações do Dia" value="73 vendas" comparison=" " />
      </div>
      <div style={operationalGridStyle}>
        <EstoqueCriticoWidget itens={estoqueCritico} />
        <ProximasEncomendasWidget encomendas={proximasEncomendas} />
        <TopProdutosWidget produtos={topProdutos} />
      </div>
      <FaturamentoSemanalWidget data={faturamentoSemanal} />
    </div>
  );
};

export default Dashboard;
