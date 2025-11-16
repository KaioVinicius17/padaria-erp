// src/pages/PDV.jsx
// (Layout de 2 Colunas + Leitor de Código de Barras e Comanda)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Grid, Paper, Typography, TextField, InputAdornment, Button,
  List, ListItem, ListItemText, IconButton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Backdrop
} from '@mui/material';
import { Search, Delete, AddCircle, RemoveCircle } from '@mui/icons-material';
import AbrirCaixaModal from '../components/caixa/AbrirCaixaModal';
import FecharCaixaModal from '../components/caixa/FecharCaixaModal';

// --- URLs dos Serviços ---
const PRODUTOS_SERVICE_URL = 'http://localhost:3003';
const VENDAS_SERVICE_URL = 'http://localhost:3005';
const FINANCEIRO_SERVICE_URL = 'http://localhost:3007';
const COMANDA_SERVICE_URL = 'http://localhost:3006';

// Função para formatar moeda
const formatCurrency = (value) => {
  if (isNaN(value)) value = 0;
  return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function PDV() {
  // --- Estados de Dados ---
  const [produtos, setProdutos] = useState([]); // Lista de produtos vendáveis
  const [filtro, setFiltro] = useState(''); // Busca manual
  const [carrinho, setCarrinho] = useState([]);
  const [total, setTotal] = useState(0);

  // --- Estados de UI (Caixa e Pagamento) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valorRecebido, setValorRecebido] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState('');
  const valorRecebidoRef = useRef(null);
  
  const [caixaStatus, setCaixaStatus] = useState('carregando');
  const [isAbrirModalOpen, setIsAbrirModalOpen] = useState(false);
  const [isFecharModalOpen, setIsFecharModalOpen] = useState(false);
  const [sessaoId, setSessaoId] = useState(null);
  
  const [comandaIdInput, setComandaIdInput] = useState('');
  const [comandasScaneadas, setComandasScaneadas] = useState([]);
  
  // --- Refs para o Leitor de Código de Barras ---
  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef(null);
  
  // --- Funções de Carregamento ---
  const checkCaixaStatus = useCallback(async () => {
    setCaixaStatus('carregando'); 
    try {
      const response = await axios.get(`${FINANCEIRO_SERVICE_URL}/caixa/status`);
      if (response.data.status === 'Aberto') {
        setCaixaStatus('Aberto');
        setSessaoId(response.data.sessao.id);
        setIsAbrirModalOpen(false); 
      } else {
        setCaixaStatus('Fechado');
        setSessaoId(null);
        setIsAbrirModalOpen(true); 
      }
    } catch (error) {
      console.error("Erro ao verificar status do caixa:", error);
      setCaixaStatus('erro');
    }
  }, []); 
  
  useEffect(() => {
    checkCaixaStatus();
  }, [checkCaixaStatus]); 

  // Busca TODOS os produtos vendáveis (Revenda) ao carregar
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const response = await axios.get(`${PRODUTOS_SERVICE_URL}/produtos`);
        // Filtra para mostrar apenas 'Produto de Revenda'
        const produtosVendaveis = response.data.filter(p => 
          p.tipo_item === 'Produto de Revenda'
        );
        setProdutos(produtosVendaveis);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };
    fetchProdutos();
  }, []); // Roda ao carregar

  // Calcula total
  useEffect(() => {
    const novoTotal = carrinho.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);
    setTotal(novoTotal);
  }, [carrinho]);
  
  // --- Funções do Carrinho ---
  const handleAddItem = (produto) => {
    setCarrinho(prevCarrinho => {
      const itemExistente = prevCarrinho.find(item => item.id === produto.id);
      if (itemExistente) {
        return prevCarrinho.map(item =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      } else {
        return [...prevCarrinho, { ...produto, quantidade: 1 }];
      }
    });
  };

  const handleChangeQuantidade = (produtoId, acao) => {
    setCarrinho(prevCarrinho => {
      const itemExistente = prevCarrinho.find(item => item.id === produtoId);
      if (!itemExistente) return prevCarrinho;
      if (acao === 'incrementar') {
        return prevCarrinho.map(item =>
          item.id === produtoId ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      if (acao === 'decrementar') {
        if (itemExistente.quantidade === 1) {
          return prevCarrinho.filter(item => item.id !== produtoId);
        }
        return prevCarrinho.map(item =>
          item.id === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item
        );
      }
      if (acao === 'remover') {
        return prevCarrinho.filter(item => item.id !== produtoId);
      }
      return prevCarrinho;
    });
  };

  const handleLimparCarrinho = () => {
    setCarrinho([]);
    setComandasScaneadas([]);
    setTotal(0);
  };

  // --- Funções do Modal de Pagamento ---
  const handleOpenPaymentModal = (forma) => {
    if (carrinho.length === 0) return;
    setFormaPagamento(forma);
    if (forma === 'Dinheiro') {
      setValorRecebido(total); 
    }
    setIsModalOpen(true);
    if (forma === 'Dinheiro') {
      setTimeout(() => {
        valorRecebidoRef.current?.focus();
        valorRecebidoRef.current?.select();
      }, 100);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setValorRecebido(0);
    setFormaPagamento('');
  };

  const handleConfirmarVenda = async () => {
    const payload = {
      cliente_id: null,
      valor_total: total,
      forma_pagamento: formaPagamento,
      itens: carrinho
    };
    try {
      const vendaResponse = await axios.post(`${VENDAS_SERVICE_URL}/vendas`, payload);
      const vendaId = vendaResponse.data.venda_id;
      if (comandasScaneadas.length > 0) {
        console.log('Faturando comandas:', comandasScaneadas);
        const faturarPromises = comandasScaneadas.map(id =>
          axios.patch(`${COMANDA_SERVICE_URL}/comandas/${id}/faturar`, {
            venda_id: vendaId
          })
        );
        await Promise.all(faturarPromises);
      }
      alert("Venda registrada com sucesso!");
      handleLimparCarrinho();
      handleCloseModal(); 
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);
      alert(`Erro: ${error.response?.data?.message || 'Não foi possível registrar a venda.'}`);
    }
  };
  
  // --- Funções de Abertura e Fechamento de Caixa ---
  const handleCaixaAberto = (sessao) => {
    setCaixaStatus('Aberto');
    setSessaoId(sessao.id);
    setIsAbrirModalOpen(false);
  };

  const handleFecharCaixa = () => {
    setIsFecharModalOpen(true);
  };
  
  const handleCaixaFechado = () => {
    setIsFecharModalOpen(false); 
    setCaixaStatus('Fechado');    
    setSessaoId(null);
    handleLimparCarrinho();
  };

  // --- Função da Comanda ---
  const handleBuscarComanda = async () => {
    if (!comandaIdInput) return;
    const comandaId = comandaIdInput; 
    try {
      const response = await axios.get(`${COMANDA_SERVICE_URL}/comandas/${comandaId}`);
      const { comanda, itens } = response.data;
      if (comandasScaneadas.includes(comanda.id)) {
          alert('Esta comanda já foi adicionada ao carrinho.');
          setComandaIdInput('');
          return;
      }
      setCarrinho(prevCarrinho => {
        let novoCarrinho = [...prevCarrinho];
        for (const itemDaComanda of itens) {
          const itemExistente = novoCarrinho.find(cartItem => cartItem.id === itemDaComanda.produto_id);
          if (itemExistente) {
            novoCarrinho = novoCarrinho.map(cartItem =>
              cartItem.id === itemDaComanda.produto_id
                ? { ...cartItem, quantidade: cartItem.quantidade + itemDaComanda.quantidade }
                : cartItem
            );
          } else {
            novoCarrinho.push({
              id: itemDaComanda.produto_id,
              nome_item: itemDaComanda.nome_item,
              preco_venda: itemDaComanda.valor_unitario_momento,
              quantidade: itemDaComanda.quantidade,
            });
          }
        }
        return novoCarrinho;
      });
      setComandasScaneadas(prev => [...prev, comanda.id]);
      setComandaIdInput('');
    } catch (error) {
      console.error("Erro ao buscar comanda:", error);
      alert(`Erro: ${error.response?.data?.message || 'Não foi possível buscar a comanda.'}`);
    }
  };

  // --- Função chamada pelo leitor de código de barras ---
  const handleBarcodeScanned = useCallback(async (barcode) => {
    if (caixaStatus !== 'Aberto') return;

    console.log("Código de barras lido:", barcode);
    try {
      const response = await axios.get(`${PRODUTOS_SERVICE_URL}/produtos/barcode/${barcode}`);
      const produtoScaneado = response.data;

      // Adiciona o produto ao carrinho
      setCarrinho(prevCarrinho => {
        const itemExistente = prevCarrinho.find(item => item.id === produtoScaneado.id);
        if (itemExistente) {
          return prevCarrinho.map(item =>
            item.id === produtoScaneado.id ? { ...item, quantidade: item.quantidade + 1 } : item
          );
        } else {
          return [...prevCarrinho, { ...produtoScaneado, quantidade: 1 }];
        }
      });

    } catch (error) {
      console.error("Erro ao buscar por código de barras:", error);
    }
  }, [caixaStatus]); 

  // --- "Ouvinte" Global do Teclado (Leitor de Barras) ---
  useEffect(() => {
    
    const handleKeyDown = (event) => {
      if (isModalOpen || isAbrirModalOpen || isFecharModalOpen) return;
      if (event.target.tagName.toLowerCase() === 'input') return;

      if (event.key === 'Enter') {
        if (barcodeBuffer.current.length > 8 && /^[0-9]+$/.test(barcodeBuffer.current)) {
          event.preventDefault(); 
          handleBarcodeScanned(barcodeBuffer.current);
        }
        barcodeBuffer.current = ""; 
        return; 
      }

      if (event.key.length === 1) {
        barcodeBuffer.current += event.key;
      }

      if (barcodeTimer.current) {
        clearTimeout(barcodeTimer.current);
      }
      barcodeTimer.current = setTimeout(() => {
        barcodeBuffer.current = "";
      }, 100); 
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimer.current) {
        clearTimeout(barcodeTimer.current);
      }
    };
  }, [handleBarcodeScanned, isModalOpen, isAbrirModalOpen, isFecharModalOpen]);
  
  // --- Filtro de produtos (baseado na busca de texto) ---
  const produtosFiltrados = produtos.filter(p =>
    p.nome_item.toLowerCase().includes(filtro.toLowerCase())
  );

  // --- Renderização condicional (Loading/Erro) ---
  if (caixaStatus === 'carregando') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Verificando status do caixa...</Typography>
      </Box>
    );
  }
  if (caixaStatus === 'erro') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography color="error">Falha ao conectar com o serviço de caixa.</Typography>
      </Box>
    );
  }

  // --- Renderização principal (PDV) ---
  return (
    <Box sx={{ flexGrow: 1, position: 'relative' }}>
      
      {/* Modais (Abertura, Fechamento, Pagamento) */}
      <AbrirCaixaModal open={isAbrirModalOpen} onCaixaAberto={handleCaixaAberto} />
      <FecharCaixaModal
        open={isFecharModalOpen}
        onClose={() => setIsFecharModalOpen(false)}
        onCaixaFechado={handleCaixaFechado}
        sessaoId={sessaoId}
      />
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          Finalizar Venda - {formaPagamento}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="body1">Total da Venda</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(total)}
            </Typography>
          </Box>
          {formaPagamento === 'Dinheiro' && (
            <>
              <TextField
                inputRef={valorRecebidoRef} 
                label="Valor Recebido"
                type="number"
                fullWidth
                variant="outlined"
                value={valorRecebido || ''}
                onChange={(e) => setValorRecebido(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1">Troco</Typography>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(valorRecebido > total ? valorRecebido - total : 0)}
                </Typography>
              </Box>
            </>
          )}
          {(formaPagamento === 'Cartão' || formaPagamento === 'Pix') && (
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', my: 3 }}>
              Confirme o pagamento na máquina/app.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} fullWidth>Cancelar</Button>
          <Button 
            onClick={handleConfirmarVenda} 
            variant="contained" 
            color="success" 
            fullWidth
            disabled={formaPagamento === 'Dinheiro' && valorRecebido < total}
          >
            Confirmar Venda
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Backdrop (Trava de Caixa Fechado) */}
      {caixaStatus === 'Fechado' && (
        <Backdrop
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            position: 'absolute',
            borderRadius: 1,
            color: '#000', 
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          open={true}
        >
          {!isAbrirModalOpen && (
            <Button variant="contained" color="success" size="large" onClick={() => setIsAbrirModalOpen(true)}>
              Abrir Caixa
            </Button>
          )}
        </Backdrop>
      )}

      {/* Grid Principal do PDV (Layout de 2 Colunas) */}
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 64px)', width: '100%' }}>

        {/* COLUNA 1: Produtos (Esquerda) */}
        <Grid item xs={12} md={7}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            borderRight: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Produtos (Revenda)</Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar produto por nome..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>),
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ overflowY: 'auto', flexGrow: 1, p: 0.5 }}>
            <Grid container spacing={1}> 
              {produtosFiltrados.map(produto => (
                <Grid item xs={6} sm={4} key={produto.id}>
                  <Paper 
                    elevation={1}
                    onClick={() => handleAddItem(produto)}
                    sx={{ p: 1.5, textAlign: 'center', cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{produto.nome_item}</Typography>
                    <Typography variant="body2" color="text.secondary">{formatCurrency(produto.preco_venda)}</Typography>
                  </Paper>
                </Grid>
              ))}
              {produtosFiltrados.length === 0 && (
                   <Typography sx={{ p: 2, color: 'text.secondary' }}>
                    Nenhum produto de revenda encontrado.
                   </Typography>
              )}
            </Grid>
          </Box>
        </Grid>
        
        {/* COLUNA 2: Carrinho (Direita) */}
        <Grid item xs={12} md={5}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 3, 
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Carrinho</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" color="warning" size="small" onClick={handleLimparCarrinho} disabled={carrinho.length === 0}>
                Limpar
              </Button>
              <Button variant="outlined" color="error" size="small" onClick={handleFecharCaixa}>
                Fechar Caixa
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Buscar Comanda #"
              size="small"
              value={comandaIdInput}
              onChange={(e) => setComandaIdInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleBuscarComanda(); }}
              sx={{ flexGrow: 1 }}
            />
            <Button variant="contained" onClick={handleBuscarComanda}>
              Buscar
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <List sx={{ overflowY: 'auto', flexGrow: 1, backgroundColor: 'background.paper', borderRadius: 1 }}>
            {carrinho.map(item => (
              <ListItem key={item.id} divider>
                <ListItemText 
                  primary={item.nome_item}
                  secondary={formatCurrency(item.preco_venda * item.quantidade)}
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton size="small" onClick={() => handleChangeQuantidade(item.id, 'decrementar')}>
                    <RemoveCircle />
                  </IconButton>
                  <Typography sx={{ mx: 1, fontWeight: 500 }}>{item.quantidade}</Typography>
                  <IconButton size="small" onClick={() => handleChangeQuantidade(item.id, 'incrementar')}>
                    <AddCircle />
                  </IconButton>
                  <IconButton size="small" color="error" sx={{ ml: 1 }} onClick={() => handleChangeQuantidade(item.id, 'remover')}>
                    <Delete />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
            {carrinho.length === 0 && (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                Carrinho vazio
              </Typography>
            )}
          </List>
          
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total:</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatCurrency(total)}</Typography>
            </Box>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Button fullWidth variant="contained" color="success" disabled={carrinho.length === 0} onClick={() => handleOpenPaymentModal('Dinheiro')}>
                  Dinheiro
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button fullWidth variant="contained" color="primary" disabled={carrinho.length === 0} onClick={() => handleOpenPaymentModal('Cartão')}>
                  Cartão
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button fullWidth variant="contained" color="secondary" disabled={carrinho.length === 0} onClick={() => handleOpenPaymentModal('Pix')}>
                  Pix
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}