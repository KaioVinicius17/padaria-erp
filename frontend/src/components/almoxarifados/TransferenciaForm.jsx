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

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

const steps = ['Origem/Destino', 'Itens da Transferência'];

const initialState = {
  almoxarifado_origem_id: '',
  almoxarifado_destino_id: '',
  observacoes: '',
};

export default function TransferenciaForm({ 
    open, onClose, onSaveSuccess, onSaveRascunho, 
    transferenciaToEdit, almoxarifados, produtos 
}) {
  
  // --- Estados do Formulário ---
  const [formData, setFormData] = useState(initialState);
  const [itens, setItens] = useState([]);
  
  // --- Estados de Controle ---
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [transferenciaId, setTransferenciaId] = useState(null); 
  
  // --- Estados dos Sub-formulários ---
  const [currentItem, setCurrentItem] = useState({ produto_id: '', nome: '', quantidade: 1 });

  // Carrega dados da transferência para edição
  useEffect(() => {
    if (open) {
      if (transferenciaToEdit) {
        // MODO EDIÇÃO
        setIsEditMode(true);
        setTransferenciaId(transferenciaToEdit.id);
        setLoading(true);
        
        // Busca os dados completos (incluindo itens)
        axios.get(`${PRODUTOS_SERVICE_URL}/transferencias/${transferenciaToEdit.id}`)
          .then(response => {
            const { transferencia, itens: itensDaTransf } = response.data;
            setFormData({
              almoxarifado_origem_id: transferencia.almoxarifado_origem_id || '',
              almoxarifado_destino_id: transferencia.almoxarifado_destino_id || '',
              observacoes: transferencia.observacoes || '',
            });
            setItens(itensDaTransf.map(item => ({
                produto_id: item.produto_id,
                nome: item.nome,
                quantidade: item.quantidade
            })));
            setActiveStep(0);
          })
          .catch(err => {
            console.error("Erro ao carregar dados da transferência:", err);
            alert("Não foi possível carregar os dados desta transferência.");
            handleClose();
          })
          .finally(() => setLoading(false));

      } else {
        // MODO CRIAÇÃO
        setIsEditMode(false);
        setTransferenciaId(null);
        setFormData(initialState);
        setItens([]);
        setCurrentItem({ produto_id: '', nome: '', quantidade: 1 });
        setActiveStep(0);
      }
    }
  }, [open, transferenciaToEdit]); 

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
      if (!formData.almoxarifado_origem_id || !formData.almoxarifado_destino_id) {
        alert("Origem e Destino são obrigatórios.");
        return;
      }
      
      setLoading(true);
      try {
        if (!isEditMode) {
          // Cria o rascunho (POST)
          const response = await axios.post(`${PRODUTOS_SERVICE_URL}/transferencias`, formData);
          setTransferenciaId(response.data.id); 
          setIsEditMode(true); 
          onSaveRascunho(); 
        } else {
          // Atualiza o rascunho (PUT) - Etapa 1
          const payload = { ...formData, itens: itens };
          await axios.put(`${PRODUTOS_SERVICE_URL}/transferencias/${transferenciaId}`, payload);
          onSaveRascunho(); 
        }
        setActiveStep(1);
      } catch (error) {
        console.error("Erro ao salvar rascunho da transferência:", error);
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
       alert("Adicione pelo menos um item à transferência.");
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
      // O submit final é SEMPRE um PUT (pois o rascunho já foi criado)
      await axios.put(`${PRODUTOS_SERVICE_URL}/transferencias/${transferenciaId}`, payload);
      onSaveSuccess(); // Esta função fecha o modal
      handleClose(); 
    } catch (error) {
      console.error("Erro ao salvar transferência:", error);
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
            <Grid item xs={12} size={6}>
              <FormControl fullWidth required>
                <InputLabel>De (Origem)</InputLabel>
                <Select name="almoxarifado_origem_id" value={formData.almoxarifado_origem_id} label="De (Origem)" onChange={handleChange}>
                  {almoxarifados.map(a => <MenuItem key={a.id} value={a.id}>{a.nome || a.nome_almoxarifado}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} size={6}>
              <FormControl fullWidth required>
                <InputLabel>Para (Destino)</InputLabel>
                <Select name="almoxarifado_destino_id" value={formData.almoxarifado_destino_id} label="Para (Destino)" onChange={handleChange}>
                  {almoxarifados.map(a => <MenuItem key={a.id} value={a.id}>{a.nome || a.nome_almoxarifado}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item size={12}>
              <TextField name="observacoes" label="Observações (Opcional)" value={formData.observacoes} onChange={handleChange} fullWidth multiline rows={3}/>
            </Grid>
          </Grid>
        );
      
      // ETAPA 2: ITENS
      case 1:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} size={6}>
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
            <Grid item xs={12} size={3}>
              <TextField name="quantidade" label="Qtd." type="number" value={currentItem.quantidade} onChange={handleItemChange} size="small" fullWidth />
            </Grid>
            <Grid item xs={12} size={3}>
              <Button onClick={handleAddItem} variant="outlined" fullWidth sx={{ height: '100%' }}>Adicionar</Button>
            </Grid>
            <Grid item size={12}>
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
      <DialogTitle>{isEditMode ? `Editando Transferência (Aberta) - ID: ${transferenciaId}` : 'Nova Transferência'}</DialogTitle>
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

TransferenciaForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveSuccess: PropTypes.func.isRequired,
  onSaveRascunho: PropTypes.func.isRequired,
  transferenciaToEdit: PropTypes.object,
  almoxarifados: PropTypes.array.isRequired,
  produtos: PropTypes.array.isRequired,
};