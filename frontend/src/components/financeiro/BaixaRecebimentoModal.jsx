// src/components/financeiro/BaixaRecebimentoModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, InputLabel, FormControl, Grid
} from '@mui/material';

export default function BaixaRecebimentoModal({ open, onClose, onSaveSuccess, lancamento }) {
  const [formData, setFormData] = useState({
    valor_pago: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'Dinheiro',
    conta_bancaria_id: ''
  });
  const [contasBancarias, setContasBancarias] = useState([]);

  useEffect(() => {
    if (lancamento) {
      setFormData(prev => ({ ...prev, valor_pago: lancamento.valor }));
    }
  }, [lancamento]);

  useEffect(() => {
    const fetchContasBancarias = async () => {
      if (open) {
        try {
          const response = await axios.get('http://localhost:3007/contas-bancarias');
          setContasBancarias(response.data);
          if (response.data.length > 0) {
            setFormData(prev => ({ ...prev, conta_bancaria_id: response.data[0].id }));
          }
        } catch (error) {
          console.error("Erro ao buscar contas bancárias:", error);
        }
      }
    };
    fetchContasBancarias();
  }, [open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lancamento) return;
    
    try {
      await axios.patch(`http://localhost:3007/lancamentos/${lancamento.id}/receber`, formData);
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao dar baixa no recebimento:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar Recebimento</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField name="valor_pago" label="Valor Recebido" type="number" value={formData.valor_pago} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={6}>
              <TextField name="data_pagamento" label="Data de Recebimento" type="date" InputLabelProps={{ shrink: true }} value={formData.data_pagamento} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Forma de Recebimento</InputLabel>
                <Select name="forma_pagamento" value={formData.forma_pagamento} label="Forma de Recebimento" onChange={handleChange}>
                  <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                  <MenuItem value="Pix">Pix</MenuItem>
                  <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
                  <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Depositar em</InputLabel>
                <Select name="conta_bancaria_id" value={formData.conta_bancaria_id} label="Depositar em" onChange={handleChange}>
                  {contasBancarias.map((conta) => (
                    <MenuItem key={conta.id} value={conta.id}>
                      {conta.nome_conta}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">Confirmar Recebimento</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}