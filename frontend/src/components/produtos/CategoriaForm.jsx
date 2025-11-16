// src/components/produtos/CategoriaForm.jsx
// (ATUALIZADO com Switch de Status)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, FormControlLabel, Switch
} from '@mui/material';

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

export default function CategoriaForm({ open, onClose, onSaveSuccess, categoriaToEdit }) {
  const [formData, setFormData] = useState({ nome: '', tipo_item: '', status: true });

  useEffect(() => {
    if (categoriaToEdit) {
      setFormData({
        nome: categoriaToEdit.nome || '',
        tipo_item: categoriaToEdit.tipo_item || '',
        status: categoriaToEdit.status === 'Ativo' // Converte string para booleano
      });
    } else {
      setFormData({ nome: '', tipo_item: '', status: true }); // Limpa ao abrir para "Novo"
    }
  }, [categoriaToEdit, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      status: formData.status ? 'Ativo' : 'Inativo' // Converte booleano para string
    };

    try {
      if (categoriaToEdit) {
        await axios.put(`${PRODUTOS_SERVICE_URL}/categorias/${categoriaToEdit.id}`, payload);
      } else {
        await axios.post(`${PRODUTOS_SERVICE_URL}/categorias`, payload);
      }
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{categoriaToEdit ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item size={12}>
              <TextField
                autoFocus
                name="nome"
                label="Nome da Categoria"
                value={formData.nome}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item  size={12}>
              <TextField
                name="tipo_item"
                label="Tipo Padrão (Opcional)"
                helperText="Ex: Produto Final, Produto de Revenda"
                value={formData.tipo_item}
                onChange={handleChange}
                fullWidth
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
                label={formData.status ? 'Categoria Ativa' : 'Categoria Inativa'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">Salvar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}