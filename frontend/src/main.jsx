// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 1. Definição da nossa nova paleta de cores
const bakeryTheme = createTheme({
  palette: {
    mode: 'light', // Mudamos para o tema claro
    primary: {
      main: '#8d6e63', // Um tom de marrom café, quente e profissional
      light: '#be9c91',
      dark: '#5f4339',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5', // Um cinza bem claro para o fundo geral
      paper: '#ffffff',   // Branco para os cards e tabelas
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Aplicando o novo tema */}
    <ThemeProvider theme={bakeryTheme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);