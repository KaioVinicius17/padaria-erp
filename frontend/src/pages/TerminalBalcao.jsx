// src/pages/TerminalBalcao.jsx
// (ATUALIZADO: Usa os ícones reais das categorias vindos do banco)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Card,
  CardActionArea,
  CardContent,
  Button,
  IconButton,
  Divider,
  Chip,
  Avatar,
  Drawer,
  useMediaQuery,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  X,
  Package // Ícone padrão de fallback
} from 'lucide-react';

// 1. IMPORTA TODOS OS ÍCONES PARA RENDERIZAÇÃO DINÂMICA
import * as LucideIcons from 'lucide-react';

// URL do serviço de produtos
const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

// 2. COMPONENTE PARA RENDERIZAR ÍCONE PELO NOME
const DynamicIcon = ({ name, size = 18 }) => {
    // Tenta pegar o ícone pelo nome (ex: 'Coffee', 'Pizza')
    // Se não existir, usa 'Package' como padrão
    const IconComponent = (name && LucideIcons[name]) ? LucideIcons[name] : Package;
    return <IconComponent size={size} />;
};

export default function TerminalBalcao() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // --- ESTADOS ---
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('all');
  
  // Controle do Drawer (Mobile)
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartExpanded, setIsCartExpanded] = useState(true); 

  // --- BUSCAR DADOS DA API ---
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resProd, resCat] = await Promise.all([
                // Busca produtos ATIVOS
                axios.get(`${PRODUTOS_SERVICE_URL}/produtos`),
                // Busca todas as categorias
                axios.get(`${PRODUTOS_SERVICE_URL}/categorias`)
            ]);
            setProdutos(resProd.data || []);
            setCategorias(resCat.data || []);
        } catch (error) {
            console.error("Erro ao carregar dados do PDV:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // --- LÓGICA DO CARRINHO ---
  const adicionarAoCarrinho = (produto) => {
    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => item.id === produto.id);
      if (itemExistente) {
        return prev.map((item) =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      // Normaliza os dados para o carrinho
      return [...prev, { 
          id: produto.id,
          nome: produto.nome_item, 
          preco: parseFloat(produto.preco_venda),
          quantidade: 1 
      }];
    });
  };

  const removerDoCarrinho = (id) => {
    setCarrinho((prev) => prev.filter((item) => item.id !== id));
  };

  const atualizarQuantidade = (id, delta) => {
    setCarrinho((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const novaQtd = item.quantidade + delta;
          return novaQtd > 0 ? { ...item, quantidade: novaQtd } : item;
        }
        return item;
      });
    });
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  const calcularQtdItens = () => {
      return carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  };

  const handleFinalizarVenda = () => {
    if (carrinho.length === 0) return;
    alert(`Venda finalizada! Total: R$ ${calcularTotal().toFixed(2)}`);
    // Futuro: Aqui chamaremos o endpoint de Vendas
    setCarrinho([]);
    setIsCartOpen(false);
  };
  
  const toggleCartSize = () => {
      setIsCartExpanded(!isCartExpanded);
  };

  // --- FILTROS ---
  const produtosFiltrados = produtos.filter((produto) => {
    const matchSearch = produto.nome_item.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (produto.codigo_barras && produto.codigo_barras.includes(searchTerm));
    
    // Filtra pelo ID da categoria (se não for 'all')
    const matchCategory = categoriaSelecionada === 'all' || produto.categoria_id === categoriaSelecionada;
    
    return matchSearch && matchCategory;
  });

  // --- COMPONENTE DE CONTEÚDO DO CARRINHO ---
  const CartContent = ({ isDrawer = false }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ 
          p: 2, 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: isDrawer ? 'pointer' : 'default'
      }}
      onClick={isDrawer ? toggleCartSize : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart size={20} />
          <Typography variant="h6" fontWeight="bold">
            Comanda Atual
          </Typography>
          {!isCartExpanded && isDrawer && (
              <Chip label={`${calcularQtdItens()} itens`} size="small" sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }} />
          )}
        </Box>
        
        {isDrawer && (
            <Box>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleCartSize(); }} sx={{ color: 'inherit', mr: 1 }}>
                    {isCartExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                </IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setIsCartOpen(false); }} sx={{ color: 'inherit' }}>
                    <X size={24} />
                </IconButton>
            </Box>
        )}
      </Box>

      {/* Lista */}
      {(isCartExpanded || !isDrawer) && (
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {carrinho.length === 0 ? (
          <Box sx={{ 
              height: '100%', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', opacity: 0.5, minHeight: 200
          }}>
              <ShoppingCart size={64} strokeWidth={1} />
              <Typography variant="body1" sx={{ mt: 2 }}>Carrinho vazio</Typography>
          </Box>
        ) : (
          carrinho.map((item) => (
            <Box 
              key={item.id} 
              sx={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  mb: 2, pb: 2, borderBottom: '1px dashed', borderColor: 'divider'
              }}
            >
              <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: isMobile ? 120 : 160 }}>
                      {item.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                      Un. R$ {item.preco.toFixed(2).replace('.', ',')}
                  </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'action.hover', borderRadius: 50, px: 0.5 }}>
                  <IconButton size="small" onClick={() => atualizarQuantidade(item.id, -1)} sx={{ p: 0.5 }}>
                      <Minus size={14} />
                  </IconButton>
                  <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 20, textAlign: 'center' }}>
                      {item.quantidade}
                  </Typography>
                  <IconButton size="small" onClick={() => atualizarQuantidade(item.id, 1)} sx={{ p: 0.5 }}>
                      <Plus size={14} />
                  </IconButton>
              </Box>

              <Box sx={{ textAlign: 'right', minWidth: 60, ml: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                      R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                  </Typography>
                  <IconButton size="small" color="error" onClick={() => removerDoCarrinho(item.id)} sx={{ p: 0.5 }}>
                      <Trash2 size={14} />
                  </IconButton>
              </Box>
            </Box>
          ))
        )}
      </Box>
      )}

      {/* Footer */}
      {(isCartExpanded || !isDrawer) && (
      <Box sx={{ p: 3, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography fontWeight="bold">R$ {calcularTotal().toFixed(2).replace('.', ',')}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">Total</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                  R$ {calcularTotal().toFixed(2).replace('.', ',')}
              </Typography>
          </Box>

          <Button 
              variant="contained" 
              size="large" 
              fullWidth 
              onClick={handleFinalizarVenda}
              disabled={carrinho.length === 0}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.15)' }}
          >
              Finalizar Venda
          </Button>
      </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ 
        height: isMobile ? 'calc(100vh - 130px)' : 'calc(100vh - 100px)', 
        display: 'flex', gap: 3, position: 'relative'
    }}>
      
      {/* --- LADO ESQUERDO: PRODUTOS --- */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', pb: isMobile ? 8 : 0 }}>
        
        {/* Barra de Busca */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 2 }}>
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="text.primary">
              Terminal de Vendas
            </Typography>
            {!isMobile && (
                <Typography variant="body2" color="text.secondary">
                Selecione os itens ou use o leitor de código de barras
                </Typography>
            )}
          </Box>
          <TextField
            placeholder="Buscar produto (Nome ou EAN)..."
            variant="outlined"
            size="small"
            fullWidth={isMobile}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: isMobile ? '100%' : 300, bgcolor: 'background.paper', borderRadius: 1 }}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><Search size={20} color="gray" /></InputAdornment>),
            }}
          />
        </Box>

        {/* Categorias (Do Banco de Dados) */}
        <Box sx={{ display: 'flex', gap: 1, pb: 1, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          <Chip
             label="Todos"
             icon={<ShoppingBag size={18} />}
             clickable
             color={categoriaSelecionada === 'all' ? 'primary' : 'default'}
             variant={categoriaSelecionada === 'all' ? 'filled' : 'outlined'}
             onClick={() => setCategoriaSelecionada('all')}
             sx={{ px: 1, fontWeight: 500, height: 36, borderRadius: '12px', flexShrink: 0 }}
          />
          {categorias.map((cat) => (
            <Chip
              key={cat.id}
              // 3. USA O ÍCONE DEFINIDO NO BANCO DE DADOS
              icon={<DynamicIcon name={cat.icon} size={18} />}
              label={cat.nome}
              clickable
              color={categoriaSelecionada === cat.id ? 'primary' : 'default'}
              variant={categoriaSelecionada === cat.id ? 'filled' : 'outlined'}
              onClick={() => setCategoriaSelecionada(cat.id)}
              sx={{ px: 1, fontWeight: 500, height: 36, borderRadius: '12px', flexShrink: 0 }}
            />
          ))}
        </Box>

        {/* Grid de Produtos */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', pt: 5 }}><CircularProgress /></Box>
          ) : (
            <Grid container spacing={2}>
                {produtosFiltrados.map((produto) => (
                <Grid item xs={6} sm={4} md={4} lg={3} key={produto.id}>
                    <Card 
                    sx={{ 
                        height: '100%', display: 'flex', flexDirection: 'column',
                        borderRadius: 3, border: '1px solid', borderColor: 'divider',
                        boxShadow: 'none', transition: '0.2s', cursor: 'pointer',
                        position: 'relative', overflow: 'visible',
                        '&:active': { transform: 'scale(0.98)' }, 
                        '&:hover': { borderColor: 'primary.main', transform: !isMobile && 'translateY(-4px)' }
                    }}
                    onClick={() => adicionarAoCarrinho(produto)}
                    >
                    <CardContent sx={{ p: 2, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        
                        {/* Ícone do Card: Tenta usar o ícone da categoria se disponível, senão Utensils */}
                        <Avatar variant="rounded" sx={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64, bgcolor: 'primary.light', color: 'primary.main', mb: 1.5 }}>
                            {(() => {
                                const cat = categorias.find(c => c.id === produto.categoria_id);
                                return <DynamicIcon name={cat ? cat.icon : 'Utensils'} size={isMobile ? 24 : 32} />;
                            })()}
                        </Avatar>

                        <Typography variant={isMobile ? "body2" : "subtitle1"} fontWeight="bold" noWrap sx={{ width: '100%' }} title={produto.nome_item}>
                            {produto.nome_item}
                        </Typography>
                        <Typography variant="body1" color="primary.main" fontWeight="bold">
                            R$ {parseFloat(produto.preco_venda).toFixed(2).replace('.', ',')}
                        </Typography>
                    </CardContent>
                    
                    {carrinho.find(i => i.id === produto.id) && (
                        <Box sx={{
                            position: 'absolute', top: -8, right: -8,
                            bgcolor: 'secondary.main', color: 'white',
                            width: 24, height: 24, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 'bold', boxShadow: 2, zIndex: 2
                        }}>
                            {carrinho.find(i => i.id === produto.id).quantidade}
                        </Box>
                    )}
                    </Card>
                </Grid>
                ))}
                {produtosFiltrados.length === 0 && (
                <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', mt: 5, opacity: 0.6 }}>
                        <Typography variant="h6">Nenhum produto encontrado.</Typography>
                    </Box>
                </Grid>
                )}
            </Grid>
          )}
        </Box>
      </Box>

      {/* --- LADO DIREITO: CARRINHO (Desktop) --- */}
      {!isMobile && (
        <Paper elevation={0} sx={{ width: 380, borderLeft: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', height: '100%' }}>
           <CartContent />
        </Paper>
      )}

      {/* --- DRAWER (Mobile) --- */}
      {isMobile && (
        <>
            <Drawer
                anchor="bottom"
                open={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                PaperProps={{
                    sx: { 
                        height: isCartExpanded ? '85vh' : 'auto',
                        borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        transition: 'height 0.3s ease-in-out'
                    }
                }}
            >
                <CartContent isDrawer={true} />
            </Drawer>
            <Paper 
                elevation={10}
                sx={{ 
                    position: 'fixed', bottom: 0, left: 0, right: 0, 
                    p: 2, bgcolor: 'background.paper', zIndex: 1200,
                    borderTop: '1px solid', borderColor: 'divider',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    ml: { sm: `240px` } 
                }}
            >
                <Box>
                    <Typography variant="caption" color="text.secondary">Total ( {calcularQtdItens()} itens )</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                        R$ {calcularTotal().toFixed(2).replace('.', ',')}
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    onClick={() => { setIsCartOpen(true); setIsCartExpanded(true); }}
                    startIcon={<ShoppingCart />}
                    sx={{ borderRadius: 8, px: 3 }}
                >
                    Ver Carrinho
                </Button>
            </Paper>
        </>
      )}
    </Box>
  );
}