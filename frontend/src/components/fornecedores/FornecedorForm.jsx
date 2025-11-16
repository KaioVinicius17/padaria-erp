// src/components/fornecedores/FornecedorForm.jsx
// (CORRIGIDO: Bug 'value.replace is not a function' nas máscaras)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl,
  Switch, FormControlLabel, Typography, Divider,
  InputAdornment, 
  CircularProgress
} from '@mui/material';
import PropTypes from 'prop-types';

const FORNECEDORES_SERVICE_URL = 'http://localhost:3001'; 

// ==========================================================
// 1. FUNÇÕES DE MÁSCARA "BLINDADAS" (A CORREÇÃO)
// ==========================================================
const maskCEP = (value) => {
  const strValue = String(value || ''); // Garante que é uma string
  if (!strValue) return "";
  return strValue
    .replace(/\D/g, '') 
    .replace(/(\d{5})(\d)/, '$1-$2') 
    .substring(0, 9); 
};

const maskTelefone = (value) => {
  const strValue = String(value || ''); // Garante que é uma string
  if (!strValue) return "";
  return strValue
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2') 
    .replace(/(\d{5})(\d)/, '$1-$2') 
    .substring(0, 15); 
};

const maskCpfCnpj = (value) => {
  const strValue = String(value || ''); // Garante que é uma string
  if (!strValue) return "";
  const v = strValue.replace(/\D/g, ''); // Esta é a linha 40
  if (v.length <= 11) { 
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else { 
    return v
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .substring(0, 18); 
  }
};
// ==========================================================


const initialState = {
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  telefone: '',
  email: '',
  status: true,
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: ''
};

export default function FornecedorForm({ open, onClose, onSaveSuccess, fornecedorToEdit }) {
  const [formData, setFormData] = useState(initialState);
  const [cepLoading, setCepLoading] = useState(false);

  // 2. useEffect ATUALIZADO para aplicar as máscaras
  useEffect(() => {
    if (open) {
      if (fornecedorToEdit) {
        setFormData({
          razao_social: fornecedorToEdit.razao_social || '',
          nome_fantasia: fornecedorToEdit.nome_fantasia || '',
          cnpj: maskCpfCnpj(fornecedorToEdit.cnpj || ''), // Aplica máscara
          telefone: maskTelefone(fornecedorToEdit.telefone || ''), // Aplica máscara
          email: fornecedorToEdit.email || '',
          status: fornecedorToEdit.status === 'Ativo' || fornecedorToEdit.status === true,
          cep: maskCEP(fornecedorToEdit.cep || ''), // Aplica máscara
          logradouro: fornecedorToEdit.logradouro || '',
          numero: fornecedorToEdit.numero || '',
          complemento: fornecedorToEdit.complemento || '',
          bairro: fornecedorToEdit.bairro || '',
          cidade: fornecedorToEdit.cidade || '',
          estado: fornecedorToEdit.estado || ''
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [fornecedorToEdit, open]);

  // 3. handleChange ATUALIZADO para aplicar as máscaras
  const handleChange = (e) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === 'cep') {
      maskedValue = maskCEP(value);
    } else if (name === 'telefone') {
      maskedValue = maskTelefone(value);
    } else if (name === 'cnpj') {
      maskedValue = maskCpfCnpj(value);
    }

    setFormData({ ...formData, [name]: maskedValue });
  };
  
  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  // 4. handleSubmit ATUALIZADO para LIMPAR as máscaras
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      status: formData.status ? 'Ativo' : 'Inativo',
      cnpj: String(formData.cnpj).replace(/\D/g, ''),
      telefone: String(formData.telefone).replace(/\D/g, ''),
      cep: String(formData.cep).replace(/\D/g, ''),
    };

    try {
      let response;
      if (fornecedorToEdit && fornecedorToEdit.id) { 
        response = await axios.put(`${FORNECEDORES_SERVICE_URL}/fornecedores/${fornecedorToEdit.id}`, payload);
      } else { 
        response = await axios.post(`${FORNECEDORES_SERVICE_URL}/fornecedores`, payload);
      }
      onSaveSuccess(response.data); 
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      alert(`Erro ao salvar: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, ''); 
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const data = response.data;
      if (data.erro) {
         alert('CEP não encontrado.');
      } else {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert("Erro ao buscar CEP. Verifique a conexão.");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{(fornecedorToEdit && fornecedorToEdit.id) ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Dados da Empresa</Typography>
            </Grid>
            <Grid item size={12} sm={8}>
              <TextField
                autoFocus
                name="razao_social"
                label="Razão Social"
                value={formData.razao_social}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item size={12} sm={4}>
              <TextField
                name="nome_fantasia"
                label="Nome Fantasia"
                value={formData.nome_fantasia}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} size={4}>
              <TextField
                name="cnpj"
                label="CNPJ"
                value={formData.cnpj}
                onChange={handleChange}
                fullWidth
                inputProps={{ maxLength: 18 }} 
              />
            </Grid>
            <Grid item xs={12} size={5}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} size={3}>
              <TextField
                name="telefone"
                label="Telefone"
                value={formData.telefone}
                onChange={handleChange}
                fullWidth
                inputProps={{ maxLength: 15 }} 
              />
            </Grid>

            <Grid item size={12} sx={{ mt: 2 }}>
              <Divider />
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Endereço</Typography>
            </Grid>
            <Grid item xs={12} size={3}>
              <TextField
                name="cep"
                label="CEP"
                value={formData.cep}
                onChange={handleChange}
                onBlur={handleCepBlur} 
                fullWidth
                inputProps={{ maxLength: 9 }} 
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {cepLoading && <CircularProgress size={20} />}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} size={7}>
              <TextField
                name="logradouro"
                label="Logradouro (Rua, Av.)"
                value={formData.logradouro}
                onChange={handleChange}
                fullWidth
                InputProps={{ readOnly: cepLoading }} 
              />
            </Grid>
            <Grid item xs={12} size={2}>
              <TextField
                name="numero"
                label="Número"
                value={formData.numero}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item size={12} sm={8}>
              <TextField
                name="complemento"
                label="Complemento (Sala, Bloco)"
                value={formData.complemento}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} size={4}>
              <TextField
                name="bairro"
                label="Bairro"
                value={formData.bairro}
                onChange={handleChange}
                fullWidth
                InputProps={{ readOnly: cepLoading }} 
              />
            </Grid>
            <Grid item xs={12} size={5}>
              <TextField
                name="cidade"
                label="Cidade"
                value={formData.cidade}
                onChange={handleChange}
                fullWidth
                InputProps={{ readOnly: cepLoading }} 
              />
            </Grid>
            <Grid item xs={12} size={3}>
              <TextField
                name="estado"
                label="Estado (UF)"
                value={formData.estado}
                onChange={handleChange}
                fullWidth
                inputProps={{ maxLength: 2 }}
                InputProps={{ readOnly: cepLoading }} 
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
                label={formData.status ? 'Fornecedor Ativo' : 'Fornecedor Inativo'}
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

FornecedorForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveSuccess: PropTypes.func.isRequired,
  fornecedorToEdit: PropTypes.object,
};