// src/App.jsx
// (ATUALIZADO com a nova estrutura de rotas /estoque/)

import React, { useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Fornecedores from './pages/Fornecedores';
import Clientes from './pages/Clientes';
import Compras from './pages/Compras';
import Producao from './pages/Producao';
import ContasAPagar from './pages/ContasAPagar';
import ContasAReceber from './pages/ContasAReceber';
import PlanoDeContas from './pages/PlanoDeContas';
import PDV from './pages/PDV';
import TerminalBalcao from './pages/TerminalBalcao';
import Categorias from './pages/Categorias';
import HistoricoMovimentacoes from './pages/HistoricoMovimentacoes';

// --- NOVOS IMPORTS ---
import Almoxarifados from './pages/Almoxarifados';   // A nova página CRUD
import PosicaoEstoque from './pages/PosicaoEstoque';
import Transferencias from './pages/Transferencias';
import PedidosCompra from './pages/PedidosCompra';   // Placeholder
import Requisicoes from './pages/Requisicoes';     // Placeholder

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

export const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

function App() {
  const [mode, setMode] = useState('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Paleta para o MODO CLARO
                primary: {
                  main: '#8d6e63',
                  contrastText: '#ffffff',
                },
                background: {
                  default: '#f5f5f5',
                  paper: '#ffffff',
                },
              }
            : {
                // Paleta para o MODO ESCURO
                primary: {
                  main: '#ffab00', 
                  contrastText: '#000000',
                },
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
              }),
        },
        typography: {
          fontFamily: [ 'Inter', 'sans-serif' ].join(','),
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/pdv" element={<PDV />} /> 
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="producao" element={<Producao />} />
            
            {/* --- ROTAS DE ESTOQUE (ATUALIZADAS) --- */}
            <Route path="estoque" element={<Navigate to="/estoque/posicao" replace />} />
            <Route path="estoque/produtos" element={<Produtos />} />
            <Route path="estoque/compras" element={<Compras />} />
            <Route path="estoque/almoxarifados" element={<Almoxarifados />} /> {/* Rota de CADASTRO */}
            <Route path="estoque/posicao" element={<PosicaoEstoque />} /> {/* Rota de RELATÓRIO */}
            <Route path="estoque/transferencias" element={<Transferencias />} />
            <Route path="estoque/pedidos" element={<PedidosCompra />} />
            <Route path="estoque/requisicoes" element={<Requisicoes />} />

            {/* Redirecionamentos (para rotas antigas) */}
            <Route path="produtos" element={<Navigate to="/estoque/produtos" replace />} />
            <Route path="compras" element={<Navigate to="/estoque/compras" replace />} />
            <Route path="almoxarifados" element={<Navigate to="/estoque/almoxarifados" replace />} />
            <Route path="categorias" element={<Navigate to="/estoque/categorias" replace />} /> {/* Rota antiga de Categorias */}
            <Route path="estoque/categorias" element={<Categorias />} /> {/* Nova rota */}

            {/* --- ROTAS DO FINANCEIRO --- */}
            <Route path="financeiro" element={<Navigate to="/financeiro/contas-a-pagar" replace />} />
            <Route path="financeiro/contas-a-pagar" element={<ContasAPagar />} />
            <Route path="financeiro/contas-a-receber" element={<ContasAReceber />} />
            <Route path="financeiro/plano-de-contas" element={<PlanoDeContas />} />
            <Route path="/financeiro/historico" element={<HistoricoMovimentacoes />} />
            
            <Route path="/terminal-balcao" element={<TerminalBalcao />} />

          </Route>
        </Routes>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;