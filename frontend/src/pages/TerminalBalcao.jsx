// src/pages/TerminalBalcao.jsx
// (TESTE COM LARGURA FIXA 70% / 30%)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Alert, 
  CircularProgress
} from '@mui/material';
import { Search, Trash2, Plus, Minus } from 'lucide-react'; 

// --- URLs dos Serviços ---
const PRODUTOS_SERVICE_URL = 'http://localhost:3003';
const COMANDA_SERVICE_URL = 'http://localhost:3006';
const PRINT_SERVICE_URL = 'http://localhost:9000';

// Função para formatar moeda
const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function TerminalBalcao() {
  const [produtos, setProdutos] = useState([]); 
  const [filtro, setFiltro] = useState(''); 
  const [comandaItens, setComandaItens] = useState([]);
  const [comandaTotal, setComandaTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastComandaId, setLastComandaId] = useState(null); 

  // Busca produtos
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const response = await axios.get(`${PRODUTOS_SERVICE_URL}/produtos`);
        const produtosDeBalcao = response.data.filter(p => 
          p.tipo_item === 'Produto Final' 
        );
        setProdutos(produtosDeBalcao);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };
    fetchProdutos();
  }, []);

  // Recalcula total
  useEffect(() => {
    const novoTotal = comandaItens.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);
    setComandaTotal(novoTotal);
  }, [comandaItens]);

  // Adiciona um item à comanda
  const handleAddItem = (produto) => {
    setLastComandaId(null); 
    setComandaItens(prevItens => {
      const itemExistente = prevItens.find(item => item.id === produto.id);
      if (itemExistente) {
        return prevItens.map(item =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      } else {
        return [...prevItens, { ...produto, quantidade: 1 }];
      }
    });
  };

  // Altera a quantidade
  const handleChangeQuantidade = (produtoId, acao) => {
    setComandaItens(prevItens => {
      const itemExistente = prevItens.find(item => item.id === produtoId);
      if (!itemExistente) return prevItens;

      if (acao === 'incrementar') {
        return prevItens.map(item =>
          item.id === produtoId ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      
      if (acao === 'decrementar') {
        if (itemExistente.quantidade === 1) {
          return prevItens.filter(item => item.id !== produtoId);
        }
        return prevItens.map(item =>
          item.id === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item
        );
      }
      
      if (acao === 'remover') {
        return prevItens.filter(item => item.id !== produtoId);
      }
      return prevItens;
    });
  };
  
  // Finaliza e Salva a Comanda
  const handleFinalizarComanda = async () => {
    if (comandaItens.length === 0) return;

    setLoading(true);
    setLastComandaId(null);
    
    const payloadItens = comandaItens.map(item => ({
      produto_id: item.id,
      quantidade: item.quantidade,
      valor_unitario_momento: item.preco_venda
    }));

    try {
      // 1. Salva a comanda no banco
      const response = await axios.post(`${COMANDA_SERVICE_URL}/comandas`, { itens: payloadItens });
      const comandaId = response.data.comanda_id;

      // 2. TENTA IMPRIMIR (NOVO PASSO)
      try {
        await axios.post(`${PRINT_SERVICE_URL}/print-comanda`, {
            comanda_id: comandaId,
            itens: comandaItens, // Passa os itens com nome
            total: comandaTotal
        });
      } catch (printError) {
        // Se a impressão falhar, não cancela a venda, apenas avisa.
        console.error("Falha ao imprimir:", printError);
        alert("Comanda salva, mas falha ao imprimir! Verifique o serviço de impressão.");
      }
      
      // 3. Limpa a tela
      setLastComandaId(comandaId);
      setComandaItens([]); 
      setFiltro(''); 

    } catch (error) {
      console.error("Erro ao criar comanda:", error);
      alert(`Erro: ${error.response?.data?.message || 'Não foi possível criar a comanda.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtra os produtos
  const produtosFiltrados = produtos.filter(p =>
    p.nome_item.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    // Layout principal com Flexbox e altura total
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 64px)', // 64px é a altura da sua Toolbar no MainLayout
      width: '100%' 
    }}>

        {/* COLUNA DA ESQUERDA (Produtos) - 70% */}
        <Box 
          sx={{
            width: '70%', // <-- LARGURA FIXA (PORCENTAGEM)
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 3, // Padding interno
            borderRight: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Lançar Itens na Comanda</Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar pão, salgado, bolo..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><Search size={20} /></InputAdornment>),
            }}
            sx={{ mb: 2 }}
          />
          {/* Lista de Produtos rolável */}
          <Box sx={{ overflowY: 'auto', flexGrow: 1, p: 0.5 }}>
            <Grid container spacing={2}> 
              {produtosFiltrados.map(produto => (
                <Grid item xs={6} sm={4} md={3} key={produto.id}> {/* 4 colunas de cards */}
                  <Paper 
                    elevation={1}
                    onClick={() => handleAddItem(produto)}
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      '&:hover': { backgroundColor: 'action.hover' },
                      height: '100px', 
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{produto.nome_item}</Typography>
                    <Typography variant="body2" color="text.secondary">{formatCurrency(produto.preco_venda)}</Typography>
                  </Paper>
                </Grid>
              ))}
              {produtosFiltrados.length === 0 && filtro.length > 0 && (
                  <Typography sx={{ p: 2, color: 'text.secondary' }}>
                  Nenhum produto encontrado para "{filtro}".
                  </Typography>
              )}
            </Grid>
          </Box>
        </Box>
        
        {/* COLUNA DA DIREITA (Comanda) - 30% */}
        <Box 
          sx={{
            width: '30%', // <-- LARGURA FIXA (PORCENTAGEM)
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'action.hover',
            p: 3 // Padding interno
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Comanda Atual</Typography>
          
          {lastComandaId && (
            <Alert severity="success" sx={{ mb: 2, fontSize: '1.1rem', justifyContent: 'center' }}>
              Comanda Gerada: <strong>#{lastComandaId}</strong>
            </Alert>
          )}

          {/* Lista de Itens */}
          <List sx={{ overflowY: 'auto', flexGrow: 1, backgroundColor: 'background.paper', borderRadius: 1, p: 1 }}>
            {comandaItens.map(item => (
              <ListItem key={item.id} divider>
                <ListItemText 
                  primary={item.nome_item}
                  secondary={formatCurrency(item.preco_venda * item.quantidade)}
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton size="small" onClick={() => handleChangeQuantidade(item.id, 'decrementar')}>
                    <Minus size={18} />
                  </IconButton>
                  <Typography sx={{ mx: 1, fontWeight: 500, minWidth: '20px', textAlign: 'center' }}>{item.quantidade}</Typography>
                  <IconButton size="small" onClick={() => handleChangeQuantidade(item.id, 'incrementar')}>
                    <Plus size={18} />
                  </IconButton>
                  <IconButton size="small" color="error" sx={{ ml: 1 }} onClick={() => handleChangeQuantidade(item.id, 'remover')}>
                    <Trash2 size={18} />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
            {comandaItens.length === 0 && !lastComandaId && (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                Adicione produtos...
              </Typography>
            )}
          </List>
          
          {/* Rodapé da Comanda */}
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total:</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatCurrency(comandaTotal)}</Typography>
            </Box>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary" 
              size="large"
              disabled={loading || comandaItens.length === 0}
              onClick={handleFinalizarComanda}
              sx={{ py: 1.5, fontSize: '1.1rem' }}
            >
              {loading ? <CircularProgress size={26} color="inherit" /> : `Gerar Comanda`}
            </Button>
          </Box>
        </Box>

      </Box>
  );
}