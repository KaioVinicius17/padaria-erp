// src/components/widgets/FaturamentoSemanalWidget.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const widgetStyle = {
  backgroundColor: '#1e1e1e',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #333',
  width: '100%',
  color: '#fff'
};

const FaturamentoSemanalWidget = ({ data }) => {
  // Adicionamos uma verificação para evitar erros se os dados ainda não chegaram
  if (!data || data.length === 0) {
    return <div style={widgetStyle}>Carregando dados do faturamento...</div>;
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#fff' } },
      title: { display: true, text: 'Faturamento nos Últimos 7 Dias', color: '#fff' },
    },
    scales: {
      x: { ticks: { color: '#fff' } },
      y: { ticks: { color: '#fff' } }
    }
  };

  const chartData = {
    labels: data.map(d => d.dia),
    // --- CÓDIGO CORRIGIDO ---
    // A propriedade 'datasets' precisa ser uma lista (array) de objetos.
    datasets: [
      {
        label: 'Faturamento (R$)',
        data: data.map(d => d.valor),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
    // -------------------------
  };

  return (
    <div style={widgetStyle}>
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default FaturamentoSemanalWidget;