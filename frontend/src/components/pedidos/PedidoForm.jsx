// src/components/pedidos/PedidoForm.jsx
// (ATUALIZADO: Adicionada a função 'formatCurrency' que faltava)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl,
  Typography, IconButton, Paper, Box, Divider,
  Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Autocomplete
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { NumericFormat } from 'react-number-format'; 

const PEDIDOS_SERVICE_URL = 'http://localhost:3006';
const ALMOXARIFADOS_SERVICE_URL = 'http://localhost:3008';
const FORNECEDORES_SERVICE_URL = 'http://localhost:3001';

// ==========================================================
// 1. ADICIONADA A FUNÇÃO QUE FALTAVA
// ==========================================================
const formatCurrency = (value) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
// ==========================================================


// Adaptador para o campo de moeda (modo calculadora)
const CurrencyInput = React.forwardRef(function CurrencyInput(props, ref) {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.floatValue, // Passa o número
          },
        });
      }}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      decimalScale={2}
    />
  );
});

const steps = ['Fornecedor e Entrega', 'Itens do Pedido'];

const initialState = {
  fornecedor_id: '',
  almoxarifado_id: '',
  observacoes: '',
  requisicao_id: null, // Para linkar com a requisição
};

export default function PedidoForm({ 
    open, onClose, onSaveSuccess, onSaveRascunho, 
    pedidoToEdit, produtos, fornecedores, almoxarifados,
    requisicaoParaConverter 
}) {
  
  // --- Estados do Formulário ---
  const [formData, setFormData] = useState(initialState);
  const [itens, setItens] = useState([]);
  
  // --- Estados de Controle ---
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pedidoId, setPedidoId] = useState(null); 
  
  // --- Estados dos Sub-formulários ---
  const [currentItem, setCurrentItem] = useState({ produto_id: '', nome: '', quantidade: 1, custo_unitario: 0 });

  // Carrega dados do pedido para edição OU para conversão
  useEffect(() => {
    if (open) {
      if (pedidoToEdit) {
        // MODO EDIÇÃO
        setIsEditMode(true);
        setPedidoId(pedidoToEdit.id);
        setLoading(true);
        
        axios.get(`${PEDIDOS_SERVICE_URL}/pedidos/${pedidoToEdit.id}`)
          .then(response => {
            const { pedido, itens: itensDoPed } = response.data;
            setFormData({
              fornecedor_id: pedido.fornecedor_id || '',
              almoxarifado_id: pedido.almoxarifado_id || '',
              observacoes: pedido.observacoes || '',
              requisicao_id: pedido.requisicao_id || null,
            });
            setItens(itensDoPed.map(item => ({
                produto_id: item.produto_id,
                nome: item.nome,
                quantidade: item.quantidade,
                custo_unitario: item.custo_unitario 
            })));
            setActiveStep(0);
          })
          .catch(err => {
            console.error("Erro ao carregar dados do pedido:", err);
            alert("Não foi possível carregar os dados deste pedido.");
            handleClose();
          })
          .finally(() => setLoading(false));

      } else if (requisicaoParaConverter) {
        // MODO CONVERSÃO
        setIsEditMode(false); 
        setPedidoId(null);
        setFormData({
            ...initialState,
            requisicao_id: requisicaoParaConverter.id, 
            observacoes: `Baseado na Requisição #${requisicaoParaConverter.id}`
        });
        setItens(requisicaoParaConverter.itens.map(item => ({
            produto_id: item.produto_id,
            nome: item.nome,
            quantidade: item.quantidade,
            custo_unitario: 0 
        })));
        setActiveStep(0); 

      } else {
        // MODO CRIAÇÃO MANUAL
        setIsEditMode(false);
        setPedidoId(null);
        setFormData(initialState);
        setItens([]);
        setCurrentItem({ produto_id: '', nome: '', quantidade: 1, custo_unitario: 0 });
        setActiveStep(0);
      }
    }
  }, [open, pedidoToEdit, requisicaoParaConverter]); 

  // Limpa o formulário ao fechar
  const handleClose = () => {
    setActiveStep(0); 
    onClose(); 
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // --- Lógica de Itens ---
  const handleItemChange = (name, value) => {
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleItemSelectChange = (e, newValue) => {
    const custoPadrao = newValue?.preco_custo || 0;
    
    setCurrentItem({ 
      ...currentItem, 
      produto_id: newValue ? newValue.id : '',
      nome: newValue ? newValue.nome_item : '',
      custo_unitario: custoPadrao
    });
  };

  const handleItemEdit = (index, field, value) => {
    setItens(prevItens =>
      prevItens.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };
  
  const handleAddItem = () => {
    if (!currentItem.produto_id || !currentItem.quantidade || currentItem.custo_unitario < 0) {
        alert("Produto, Quantidade e Custo Unitário (pode ser 0) são obrigatórios.");
        return;
    }
    setItens(prev => [...prev, currentItem]);
    setCurrentItem({ produto_id: '', nome: '', quantidade: 1, custo_unitario: 0 });
  };
  
  const handleRemoveItem = (indexToRemove) => {
    setItens(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- Lógica do Stepper (Salvar e Seguir) ---
  const handleNext = async () => {
    // ETAPA 1 -> ETAPA 2 (Salvar Rascunho)
    if (activeStep === 0) {
      if (!formData.fornecedor_id || !formData.almoxarifado_id) {
        alert("Fornecedor e Almoxarifado de Destino são obrigatórios.");
        return;
      }
      
      setLoading(true);
      try {
        if (!isEditMode) {
          const response = await axios.post(`${PEDIDOS_SERVICE_URL}/pedidos`, formData);
          setPedidoId(response.data.id); 
          setIsEditMode(true); 
          onSaveRascunho(); 
        } else {
          const payload = { ...formData, itens: itens };
          await axios.put(`${PEDIDOS_SERVICE_URL}/pedidos/${pedidoId}`, payload);
          onSaveRascunho(); 
        }
        setActiveStep(1);
      } catch (error) {
        console.error("Erro ao salvar rascunho do pedido:", error);
        alert(`Erro ao salvar rascunho: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // --- Lógica de Submissão Final (Salvar Itens) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (itens.length === 0) {
       alert("Adicione pelo menos um item ao pedido.");
       return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      itens: itens.map(i => ({ 
          produto_id: i.produto_id, 
          quantidade: i.quantidade,
          custo_unitario: i.custo_unitario || 0
      })),
    };
    
    try {
      await axios.put(`${PEDIDOS_SERVICE_URL}/pedidos/${pedidoId}`, payload);
      onSaveSuccess(); // Esta função fecha o modal
      handleClose(); 
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert(`Erro ao salvar: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Renderização do conteúdo da Etapa ---
  function getStepContent(step) {
    switch (step) {
      // ETAPA 1: CABEÇALHO
      case 0:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Fornecedor</InputLabel>
                <Select name="fornecedor_id" value={formData.fornecedor_id} label="Fornecedor" onChange={handleChange}>
                  {fornecedores.map(f => <MenuItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Entregar Em (Almoxarifado)</InputLabel>
                <Select name="almoxarifado_id" value={formData.almoxarifado_id} label="Entregar Em (Almoxarifado)" onChange={handleChange}>
                  {almoxarifados.map(a => <MenuItem key={a.id} value={a.id}>{a.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField name="observacoes" label="Observações (Opcional)" value={formData.observacoes} onChange={handleChange} fullWidth multiline rows={3}/>
            </Grid>
          </Grid>
        );
      
      // ETAPA 2: ITENS
      case 1:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Formulário de adicionar item */}
            <Grid item xs={12} sm={5}>
              <Autocomplete
                options={produtos}
                getOptionLabel={(option) => option.nome_item || ''}
                value={produtos.find(p => p.id === currentItem.produto_id) || null}
                onChange={handleItemSelectChange}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField {...params} label="Produto" size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField name="quantidade" label="Qtd." type="number" value={currentItem.quantidade} onChange={(e) => handleItemChange(e.target.name, e.target.value)} size="small" fullWidth />
            </Grid>
            <Grid item xs={12} sm={3}>
              <NumericFormat
                name="custo_unitario"
                label="Custo Unit."
                value={currentItem.custo_unitario}
                onValueChange={(values) => {
                  handleItemChange('custo_unitario', values.floatValue); 
                }}
                customInput={TextField}
                prefix="R$ "
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button onClick={handleAddItem} variant="outlined" fullWidth sx={{ height: '100%' }}>Adicionar</Button>
            </Grid>

            {/* Tabela de Itens Editável */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 1, mt: 1, minHeight: 150, maxHeight: 300, overflowY: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Qtd.</TableCell>
                      <TableCell align="right">Custo Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell align="right">
                          <TextField
                            name="quantidade"
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => handleItemEdit(index, 'quantidade', e.target.value)}
                            variant="standard"
                            size="small"
                            sx={{ width: '80px' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                           <NumericFormat
                            name="custo_unitario"
                            value={item.custo_unitario}
                            onValueChange={(values) => {
                              handleItemEdit(index, 'custo_unitario', values.floatValue);
                            }}
                            customInput={TextField}
                            prefix="R$ "
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={2}
                            variant="standard"
                            size="small"
                            sx={{ width: '120px' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {/* ESTA É A LINHA 372 */}
                          {formatCurrency(item.quantidade * item.custo_unitario)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}><Trash2 size={16} /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        );
      default:
        return 'Etapa desconhecida';
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? `Editando Pedido de Compra (Aberto) - ID: ${pedidoId}` : 'Novo Pedido de Compra'}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Carregando dados...</Typography>
          </Box>
        ) : (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>
            
            <Box>
              {getStepContent(activeStep)}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
        >
          Voltar
        </Button>
        
        {activeStep === steps.length - 1 ? (
          // Na última etapa, mostra o botão de Salvar
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
            {isEditMode ? 'Atualizar Itens' : 'Salvar Itens'}
          </Button>
        ) : (
          // Nas outras, mostra o botão Próximo (Salvar e Seguir)
          <Button variant="contained" color="primary" onClick={handleNext} disabled={loading}>
            {isEditMode ? 'Salvar e Continuar' : 'Salvar Rascunho e Continuar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

PedidoForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveSuccess: PropTypes.func.isRequired,
  onSaveRascunho: PropTypes.func.isRequired,
  pedidoToEdit: PropTypes.object,
  requisicaoParaConverter: PropTypes.object,
  produtos: PropTypes.array.isRequired,
  fornecedores: PropTypes.array.isRequired,
  almoxarifados: PropTypes.array.isRequired,
};