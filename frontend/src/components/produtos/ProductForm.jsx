// src/components/produtos/ProductForm.jsx
// (CORRIGIDO: Lógica do handleSubmit para diferenciar POST e PUT)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl,
  InputAdornment,
  Switch, 
  FormControlLabel 
} from '@mui/material';
import PropTypes from 'prop-types'; // Import PropTypes

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

const initialState = {
  nome_item: '',
  tipo_item: 'Produto Final',
  unidade_medida: 'un',
  preco_venda: '',
  preco_custo: '',
  custo_medio: '',
  estoque_minimo: '',
  estoque_maximo: '',
  categoria_id: '',
  codigo_barras: '',
  status: true // Padrão Ativo
};

export default function ProductForm({ open, onClose, onSaveSuccess, productToEdit }) {
  const [formData, setFormData] = useState(initialState);
  const [categorias, setCategorias] = useState([]); 

  // Busca as categorias para preencher o dropdown
  useEffect(() => {
    if (open) { 
      const fetchCategorias = async () => {
        try {
          const response = await axios.get(`${PRODUTOS_SERVICE_URL}/categorias`);
          setCategorias(response.data);
        } catch (error) {
          console.error("Erro ao buscar categorias:", error);
        }
      };
      fetchCategorias();
    }
  }, [open]);

  // Preenche o formulário se estiver editando ou pré-preenchendo
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        nome_item: productToEdit.nome_item || '',
        tipo_item: productToEdit.tipo_item || 'Produto Final',
        unidade_medida: productToEdit.unidade_medida || 'un',
        preco_venda: productToEdit.preco_venda || '',
        preco_custo: productToEdit.preco_custo || '',
        custo_medio: productToEdit.custo_medio || '',
        estoque_minimo: productToEdit.estoque_minimo || '',
        estoque_maximo: productToEdit.estoque_maximo || '', 
        categoria_id: productToEdit.categoria_id || '',
        codigo_barras: productToEdit.codigo_barras || '',
        // Garante que o status (booleano) seja lido corretamente
        status: productToEdit.status === 'Ativo' || productToEdit.status === true
      });
    } else {
      setFormData(initialState); // Limpa ao abrir para "Novo"
    }
  }, [productToEdit, open]);

  // Handler para campos de texto e select
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Handler específico para o Switch
  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  // ==========================================================
  // CORREÇÃO: handleSubmit agora verifica 'productToEdit.id'
  // ==========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      preco_venda: formData.preco_venda || null,
      preco_custo: formData.preco_custo || null,
      custo_medio: formData.custo_medio || null,
      estoque_minimo: formData.estoque_minimo || null,
      estoque_maximo: formData.estoque_maximo || null,
      categoria_id: formData.categoria_id || null,
      codigo_barras: formData.codigo_barras || null,
      status: formData.status ? 'Ativo' : 'Inativo'
    };

    try {
      let response;
      // Se 'productToEdit' existe E ele tem um 'id', então é uma ATUALIZAÇÃO (PUT)
      if (productToEdit && productToEdit.id) {
        response = await axios.put(`${PRODUTOS_SERVICE_URL}/produtos/${productToEdit.id}`, payload);
      } else {
        // Senão, é uma CRIAÇÃO (POST), mesmo que 'productToEdit' tenha dados do XML
        response = await axios.post(`${PRODUTOS_SERVICE_URL}/produtos`, payload);
      }
      onSaveSuccess(response.data); // Passa o produto salvo de volta
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      if (error.response) {
        alert(`Erro ao salvar: ${error.response.data.message || error.message}`);
      } else {
        alert(`Erro de rede: ${error.message}`);
      }
    }
  };
  // ==========================================================

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{(productToEdit && productToEdit.id) ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            
            {/* Linha 1: Nome do Item (100%) */}
            <Grid item size={12}>
              <TextField
                autoFocus
                name="nome_item"
                label="Nome do Item"
                value={formData.nome_item}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            {/* Linha 2: Código de Barras (100%) */}
            <Grid item size={12}>
              <TextField
                name="codigo_barras"
                label="Código de Barras (SKU)"
                value={formData.codigo_barras}
                onChange={handleChange}
                fullWidth
                helperText="Use o leitor aqui. Deixe em branco se for 'Produto Final' (pesado/unid.)"
              />
            </Grid>
            
            {/* Linha 3: Tipo (50%) e Categoria (50%) */}
            <Grid item xs={12} size={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Item</InputLabel>
                <Select
                  name="tipo_item"
                  value={formData.tipo_item}
                  label="Tipo de Item"
                  onChange={handleChange}
                >
                  <MenuItem value="Produto Final">Produto Final</MenuItem>
                  <MenuItem value="Produto de Revenda">Produto de Revenda</MenuItem>
                  <MenuItem value="Matéria-Prima">Matéria-Prima</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} size={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoria</InputLabel>
                <Select
                  name="categoria_id"
                  value={formData.categoria_id}
                  label="Categoria"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Nenhuma</em></MenuItem>
                  {categorias.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Linha 4: Custo (50%) e Venda (50%) */}
            <Grid item xs={12} size={6}>
              <TextField
                name="preco_custo"
                label="Preço de Custo"
                type="number"
                value={formData.preco_custo}
                onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} size={6}>
              <TextField
                name="preco_venda"
                label="Preço de Venda"
                type="number"
                value={formData.preco_venda}
                onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                fullWidth
              />
            </Grid>

            {/* Linha 5: Estoque Mínimo (50%) e Máximo (50%) */}
            <Grid item xs={12} size={6}>
              <TextField
                name="estoque_minimo"
                label="Estoque Mínimo"
                type="number"
                value={formData.estoque_minimo}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} size={6}>
              <TextField
                name="estoque_maximo"
                label="Estoque Máximo"
                type="number"
                value={formData.estoque_maximo || ''}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Linha 6: Unidade de Medida (100%) */}
            <Grid item size={12}>
              <FormControl fullWidth required>
                <InputLabel>Unidade de Medida</InputLabel>
                <Select
                  name="unidade_medida"
                  value={formData.unidade_medida}
                  label="Unidade de Medida"
                  onChange={handleChange}
                >
                  <MenuItem value="un">un (Unidade)</MenuItem>
                  <MenuItem value="kg">kg (Quilograma)</MenuItem>
                  <MenuItem value="g">g (Grama)</MenuItem>
                  <MenuItem value="L">L (Litro)</MenuItem>
                  <MenuItem value="ml">ml (Mililitro)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Linha 7: Status (Switch 100%) */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status}
                    onChange={handleSwitchChange}
                    name="status"
                    color="primary"
                  />
                }
                label={formData.status ? 'Produto Ativo' : 'Produto Inativo'}
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

ProductForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveSuccess: PropTypes.func.isRequired,
  productToEdit: PropTypes.object,
};