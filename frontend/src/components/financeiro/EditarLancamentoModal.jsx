// src/components/financeiro/EditarLancamentoModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, InputLabel, FormControl, Grid
} from '@mui/material';

export default function EditarLancamentoModal({ open, onClose, onSaveSuccess, lancamento }) {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
    plano_de_contas_id: ''
  });
  const [planosDeConta, setPlanosDeConta] = useState([]);

  // 1. Busca os planos de conta para o dropdown
  useEffect(() => {
    const fetchPlanosDeConta = async () => {
      try {
        const response = await axios.get('http://localhost:3007/plano-de-contas');
        setPlanosDeConta(response.data);
      } catch (error) {
        console.error("Erro ao buscar planos de conta:", error);
      }
    };
    if (open) {
      fetchPlanosDeConta();
    }
  }, [open]);

  // 2. Preenche o formulário quando o lançamento é selecionado
  useEffect(() => {
    if (lancamento) {
      setFormData({
        descricao: lancamento.descricao,
        valor: lancamento.valor,
        // Formata a data para YYYY-MM-DD (padrão do input date)
        data_vencimento: new Date(lancamento.data_vencimento).toISOString().split('T')[0],
        // Precisamos do ID do plano de contas, não da descrição.
        // Seu GET /lancamentos/pagar precisa retornar o plano_de_contas_id também.
        // Vou assumir que você tem o 'plano_de_contas_id' no objeto 'lancamento'.
        // Se não tiver, ajuste a query no backend.
        plano_de_contas_id: lancamento.plano_de_contas_id || '' 
      });
    }
  }, [lancamento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3007/lancamentos/${lancamento.id}`, formData);
      onSaveSuccess(); // Fecha o modal e atualiza a lista
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      // Adicionar feedback de erro para o usuário
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Lançamento</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="descricao"
                label="Descrição"
                value={formData.descricao}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="valor"
                label="Valor"
                type="number"
                value={formData.valor}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="data_vencimento"
                label="Data de Vencimento"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.data_vencimento}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Plano de Contas</InputLabel>
                <Select
                  name="plano_de_contas_id"
                  value={formData.plano_de_contas_id}
                  label="Plano de Contas"
                  onChange={handleChange}
                >
                  {planosDeConta.map((plano) => (
                    <MenuItem key={plano.id} value={plano.id}>
                      {plano.descricao}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">Salvar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}