// src/components/categorias/CategoriaForm.jsx
// (ATUALIZADO: Seleção inteligente de ícone baseada no nome)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, FormControlLabel, Switch,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import IconSelector from '../common/IconSelector'; 

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

const initialState = {
  nome: '',
  tipo_item: '',
  status: true,
  icon: 'Package' // Padrão
};

// --- LÓGICA DE INTELIGÊNCIA DE ÍCONES ---
// Mapeia palavras-chave (em português) para nomes de ícones (em inglês/Lucide)
const getSuggestedIcon = (name) => {
    const n = name.toLowerCase();

    // Padaria e Massas
    if (n.includes('pão') || n.includes('pao') || n.includes('padaria')) return 'Croissant';
    if (n.includes('bolo') || n.includes('torta') || n.includes('confeitaria')) return 'Cake';
    if (n.includes('pizza')) return 'Pizza';
    if (n.includes('salgado') || n.includes('lanche') || n.includes('hamburguer')) return 'Sandwich';
    if (n.includes('massa') || n.includes('macarr')) return 'Utensils';
    
    // Bebidas
    if (n.includes('café') || n.includes('cafe')) return 'Coffee';
    if (n.includes('cerveja') || n.includes('chopp')) return 'Beer';
    if (n.includes('vinho')) return 'Wine';
    if (n.includes('drink') || n.includes('coquetel')) return 'Martini';
    if (n.includes('suco') || n.includes('refrigerante') || n.includes('bebida')) return 'GlassWater';
    if (n.includes('leite')) return 'Milk';

    // Ingredientes e Outros
    if (n.includes('carne') || n.includes('churrasco')) return 'Beef';
    if (n.includes('fruta') || n.includes('legume') || n.includes('horti')) return 'Apple';
    if (n.includes('doce') || n.includes('sobremesa')) return 'IceCream'; // Ou 'Candy'
    if (n.includes('peixe') || n.includes('frutos do mar')) return 'Fish';
    if (n.includes('sorvete') || n.includes('açaí')) return 'IceCream2';
    
    // Utilitários
    if (n.includes('embalagem') || n.includes('caixa')) return 'Box';
    if (n.includes('limpeza')) return 'SprayCan';
    if (n.includes('diverso') || n.includes('outros')) return 'LayoutGrid';

    return null; // Não encontrou sugestão
};

export default function CategoriaForm({ open, onClose, onSaveSuccess, categoriaToEdit }) {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoriaToEdit) {
      setFormData({
        nome: categoriaToEdit.nome || '',
        tipo_item: categoriaToEdit.tipo_item || '',
        status: categoriaToEdit.status === 'Ativo',
        icon: categoriaToEdit.icon || 'Package'
      });
    } else {
      setFormData(initialState);
    }
  }, [categoriaToEdit, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let newFormData = { ...formData, [name]: value };

    // SE O USUÁRIO ESTIVER DIGITANDO O NOME, TENTA SUGERIR UM ÍCONE
    if (name === 'nome') {
        const suggested = getSuggestedIcon(value);
        if (suggested) {
            newFormData.icon = suggested;
        }
    }

    setFormData(newFormData);
  };
  
  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  // Handler manual (caso o usuário queira escolher outro ícone)
  const handleIconSelect = (iconName) => {
      setFormData({ ...formData, icon: iconName });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
        ...formData,
        status: formData.status ? 'Ativo' : 'Inativo'
    };

    try {
      if (categoriaToEdit) {
        await axios.put(`${PRODUTOS_SERVICE_URL}/categorias/${categoriaToEdit.id}`, payload);
      } else {
        await axios.post(`${PRODUTOS_SERVICE_URL}/categorias`, payload);
      }
      onSaveSuccess();
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      alert("Erro ao salvar categoria.");
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
      <DialogTitle>{categoriaToEdit ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            
            {/* Componente de Seleção de Ícone */}
            <Grid item xs={12}>
                <IconSelector 
                    selectedIcon={formData.icon} 
                    onSelect={handleIconSelect} 
                />
            </Grid>

            <Grid item xs={12}>
              <TextField
                autoFocus
                name="nome"
                label="Nome da Categoria"
                value={formData.nome}
                onChange={handleChange} // Aqui acontece a mágica da sugestão
                fullWidth
                required
                helperText="Tente digitar 'Pão', 'Bebida', 'Pizza' para ver o ícone mudar automaticamente."
              />
            </Grid>
            
            <Grid item xs={12}>
                <FormControl fullWidth>
                    <InputLabel>Tipo Padrão (Opcional)</InputLabel>
                    <Select
                        name="tipo_item"
                        value={formData.tipo_item}
                        label="Tipo Padrão (Opcional)"
                        onChange={handleChange}
                    >
                        <MenuItem value=""><em>Nenhum</em></MenuItem>
                        <MenuItem value="Produto Final">Produto Final</MenuItem>
                        <MenuItem value="Produto de Revenda">Produto de Revenda</MenuItem>
                        <MenuItem value="Matéria-Prima">Matéria-Prima</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

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
                label={formData.status ? 'Ativo' : 'Inativo'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading}>Salvar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}