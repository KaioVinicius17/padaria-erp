// src/components/requisicoes/RequisicaoForm.jsx
// (NOVO COMPONENTE: O modal de 2 etapas para Requisições)

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

// O novo serviço que criamos
const REQUISICOES_SERVICE_URL = 'http://localhost:3005';
const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

const steps = ['Detalhes da Requisição', 'Itens Requisitados'];

const initialState = {
  departamento: '',
  observacoes: '',
};

export default function RequisicaoForm({ 
    open, onClose, onSaveSuccess, onSaveRascunho, 
    requisicaoToEdit, produtos 
}) {
  
  // --- Estados do Formulário ---
  const [formData, setFormData] = useState(initialState);
  const [itens, setItens] = useState([]);
  
  // --- Estados de Controle ---
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [requisicaoId, setRequisicaoId] = useState(null); 
  
  // --- Estados dos Sub-formulários ---
  const [currentItem, setCurrentItem] = useState({ produto_id: '', nome: '', quantidade: 1 });

  // Carrega dados da requisição para edição
  useEffect(() => {
    if (open) {
      if (requisicaoToEdit) {
        // MODO EDIÇÃO
        setIsEditMode(true);
        setRequisicaoId(requisicaoToEdit.id);
        setLoading(true);
        
        axios.get(`${REQUISICOES_SERVICE_URL}/requisicoes/${requisicaoToEdit.id}`)
          .then(response => {
            const { requisicao, itens: itensDaReq } = response.data;
            setFormData({
              departamento: requisicao.departamento || '',
              observacoes: requisicao.observacoes || '',
            });
            setItens(itensDaReq.map(item => ({
                produto_id: item.produto_id,
                nome: item.nome,
                quantidade: item.quantidade
            })));
            setActiveStep(0);
          })
          .catch(err => {
            console.error("Erro ao carregar dados da requisição:", err);
            alert("Não foi possível carregar os dados desta requisição.");
            handleClose();
          })
          .finally(() => setLoading(false));

      } else {
        // MODO CRIAÇÃO
        setIsEditMode(false);
        setRequisicaoId(null);
        setFormData(initialState);
        setItens([]);
        setCurrentItem({ produto_id: '', nome: '', quantidade: 1 });
        setActiveStep(0);
      }
    }
  }, [open, requisicaoToEdit]); 

  // Limpa o formulário ao fechar
  const handleClose = () => {
    setActiveStep(0); 
    onClose();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // --- Lógica de Itens ---
  const handleItemChange = (e) => setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
  
  const handleItemSelectChange = (e, newValue) => {
    setCurrentItem({ 
      ...currentItem, 
      produto_id: newValue ? newValue.id : '',
      nome: newValue ? newValue.nome_item : '',
    });
  };
  
  const handleAddItem = () => {
    if (!currentItem.produto_id || !currentItem.quantidade) return;
    setItens(prev => [...prev, currentItem]);
    setCurrentItem({ produto_id: '', nome: '', quantidade: 1 });
  };
  
  const handleRemoveItem = (indexToRemove) => {
    setItens(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- Lógica do Stepper (Salvar e Seguir) ---
  const handleNext = async () => {
    // ETAPA 1 -> ETAPA 2 (Salvar Rascunho)
    if (activeStep === 0) {
      setLoading(true);
      try {
        if (!isEditMode) {
          // Cria o rascunho (POST)
          const response = await axios.post(`${REQUISICOES_SERVICE_URL}/requisicoes`, formData);
          setRequisicaoId(response.data.id); 
          setIsEditMode(true); 
          onSaveRascunho(); 
        } else {
          // Atualiza o rascunho (PUT) - Etapa 1
          const payload = { ...formData, itens: itens };
          await axios.put(`${REQUISICOES_SERVICE_URL}/requisicoes/${requisicaoId}`, payload);
          onSaveRascunho(); 
        }
        setActiveStep(1);
      } catch (error) {
        console.error("Erro ao salvar rascunho da requisição:", error);
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
       alert("Adicione pelo menos um item à requisição.");
       return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      itens: itens.map(i => ({ 
          produto_id: i.produto_id, 
          quantidade: i.quantidade
      })),
    };
    
    try {
      await axios.put(`${REQUISICOES_SERVICE_URL}/requisicoes/${requisicaoId}`, payload);
      onSaveSuccess(); // Esta função fecha o modal
      handleClose(); 
    } catch (error) {
      console.error("Erro ao salvar requisição:", error);
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
              <TextField 
                name="departamento" 
                label="Departamento (Ex: Cozinha, Atendimento)" 
                value={formData.departamento} 
                onChange={handleChange} 
                fullWidth 
                required
              />
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={3}>
              <TextField name="quantidade" label="Qtd. Solicitada" type="number" value={currentItem.quantidade} onChange={handleItemChange} size="small" fullWidth />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button onClick={handleAddItem} variant="outlined" fullWidth sx={{ height: '100%' }}>Adicionar</Button>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 1, mt: 1, minHeight: 150, maxHeight: 300, overflowY: 'auto' }}>
                <Table size="small">
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.quantidade}x {item.nome}</TableCell>
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
      <DialogTitle>{isEditMode ? `Editando Requisição (Aberta) - ID: ${requisicaoId}` : 'Nova Requisição de Compra'}</DialogTitle>
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

RequisicaoForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveSuccess: PropTypes.func.isRequired,
  onSaveRascunho: PropTypes.func.isRequired,
  requisicaoToEdit: PropTypes.object,
  produtos: PropTypes.array.isRequired,
};