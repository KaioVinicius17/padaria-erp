// src/components/almoxarifado/AlmoxarifadoForm.jsx
// (ATUALIZADO: Adicionado campo 'Status')

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, FormControlLabel, Switch
} from '@mui/material';
import PropTypes from 'prop-types';

const ALMOXARIFADOS_SERVICE_URL = 'http://localhost:3008';

const initialState = {
  nome: '',
  descricao: '',
  status: true // Padrão é Ativo
};

export default function AlmoxarifadoForm({ open, onClose, onSaveSuccess, almoxarifadoToEdit }) {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (almoxarifadoToEdit) {
      setFormData({
        nome: almoxarifadoToEdit.nome || '',
        descricao: almoxarifadoToEdit.descricao || '',
        status: almoxarifadoToEdit.status === 'Ativo' // Converte string para booleano
      });
    } else {
      setFormData(initialState);
    }
  }, [almoxarifadoToEdit, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Converte booleano para string 'Ativo'/'Inativo'
    const payload = {
        ...formData,
        status: formData.status ? 'Ativo' : 'Inativo'
    };

    try {
      if (almoxarifadoToEdit) {
        await axios.put(`${ALMOXARIFADOS_SERVICE_URL}/almoxarifados/${almoxarifadoToEdit.id}`, payload);
      } else {
        await axios.post(`${ALMOXARIFADOS_SERVICE_URL}/almoxarifados`, payload);
      }
      onSaveSuccess();
      handleClose();
    } catch (error)
    {
      console.error("Erro ao salvar almoxarifado:", error);
      alert(`Erro ao salvar: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialState);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{almoxarifadoToEdit ? 'Editar Almoxarifado' : 'Novo Almoxarifado'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item size={12}>
              <TextField
                autoFocus
                name="nome"
                label="Nome do Almoxarifado"
                value={formData.nome}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item size={12}>
              <TextField
                name="descricao"
                label="Descrição (Opcional)"
                value={formData.descricao}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status}
                    onChange={handleSwitchChange}
                    name="status"
                    color="primary"
                  />
                }
                label={formData.status ? 'Almoxarifado Ativo' : 'Almoxarifado Inativo'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

AlmoxarifadoForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveSuccess: PropTypes.func.isRequired,
  almoxarifadoToEdit: PropTypes.object,
};