// src/components/clientes/CustomerForm.jsx
// (ATUALIZADO com máscaras de CEP, Telefone e CPF/CNPJ)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl,
  Switch, FormControlLabel, Typography, Divider,
  InputAdornment, 
  CircularProgress
} from '@mui/material';

// 1. IMPORTAR O 'react-imask'
import { IMaskInput } from 'react-imask';

const CLIENTES_SERVICE_URL = 'http://localhost:3002';

// ==========================================================
// 2. ADAPTADORES DE MÁSCARA (React-IMask + Material-UI)
// ==========================================================
// Adaptador para CEP (00000-000)
const CepMask = React.forwardRef(function CepMask(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="00000-000"
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

// Adaptador para Telefone (00) 00000-0000
const TelefoneMask = React.forwardRef(function TelefoneMask(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="(00) 00000-0000"
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

// Adaptador para CPF/CNPJ (Dinâmico)
const CpfCnpjMask = React.forwardRef(function CpfCnpjMask(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask={[
        { mask: '000.000.000-00', maxLength: 11 }, // CPF
        { mask: '00.000.000/0000-00' } // CNPJ (maxLength 14)
      ]}
      inputRef={ref}
      // 'unmask' é crucial. Ele envia SÓ OS NÚMEROS para o 'onChange'
      unmask={true} 
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});
// ==========================================================

const initialState = {
  nome_completo: '',
  cpf_cnpj: '',
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

export default function CustomerForm({ open, onClose, onSaveSuccess, customerToEdit }) {
  const [formData, setFormData] = useState(initialState);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        nome_completo: customerToEdit.nome_completo || '',
        cpf_cnpj: customerToEdit.cpf_cnpj || '',
        telefone: customerToEdit.telefone || '',
        email: customerToEdit.email || '',
        status: customerToEdit.status === 'Ativo',
        cep: customerToEdit.cep || '',
        logradouro: customerToEdit.logradouro || '',
        numero: customerToEdit.numero || '',
        complemento: customerToEdit.complemento || '',
        bairro: customerToEdit.bairro || '',
        cidade: customerToEdit.cidade || '',
        estado: customerToEdit.estado || ''
      });
    } else {
      setFormData(initialState);
    }
  }, [customerToEdit, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSwitchChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // O 'unmask=true' nos adaptadores já limpa os dados
    const payload = {
      ...formData,
      status: formData.status ? 'Ativo' : 'Inativo'
    };

    try {
      if (customerToEdit) {
        await axios.put(`${CLIENTES_SERVICE_URL}/clientes/${customerToEdit.id}`, payload);
      } else {
        await axios.post(`${CLIENTES_SERVICE_URL}/clientes`, payload);
      }
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert(`Erro ao salvar: ${error.response?.data?.message || error.message}`);
    }
  };

  // ==========================================================
  // 3. ATUALIZAÇÃO NO 'handleCepBlur'
  // ==========================================================
  const handleCepBlur = async (e) => {
    // O valor já vem limpo (sem máscara) do 'onAccept' do IMaskInput
    const cep = e.target.value; 

    if (cep.length !== 8) {
      return; // Não faz nada se o CEP não tiver 8 dígitos
    }

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
  // ==========================================================

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{customerToEdit ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            
            {/* --- Dados Pessoais --- */}
            <Grid item size={12}>
              <Typography variant="h6" gutterBottom>Dados Pessoais</Typography>
            </Grid>
            <Grid item xs={12} size={8}>
              <TextField
                autoFocus
                name="nome_completo"
                label="Nome Completo / Razão Social"
                value={formData.nome_completo}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} size={4}>
              {/* ==========================================================
                  4. APLICA A MÁSCARA DE CPF/CNPJ
                  ========================================================== */}
              <TextField
                name="cpf_cnpj"
                label="CPF / CNPJ"
                value={formData.cpf_cnpj}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputComponent: CpfCnpjMask,
                }}
              />
            </Grid>
            <Grid item xs={12} size={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} size={6}>
              {/* ==========================================================
                  5. APLICA A MÁSCARA DE TELEFONE
                  ========================================================== */}
              <TextField
                name="telefone"
                label="Telefone"
                value={formData.telefone}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputComponent: TelefoneMask,
                }}
              />
            </Grid>

            {/* --- Endereço --- */}
            <Grid item size={12} sx={{ mt: 2 }}>
              <Divider />
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Endereço</Typography>
            </Grid>
            <Grid item xs={12} size={2}>
              {/* ==========================================================
                  6. APLICA A MÁSCARA DE CEP E O LOADING
                  ========================================================== */}
              <TextField
                name="cep"
                label="CEP"
                value={formData.cep}
                onChange={handleChange}
                onBlur={handleCepBlur} 
                fullWidth
                InputProps={{
                  inputComponent: CepMask, // Máscara
                  endAdornment: (
                    <InputAdornment position="end">
                      {cepLoading && <CircularProgress size={20} />}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} size={8}>
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
                label="Complemento (Apto, Bloco)"
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
            
            {/* --- Status --- */}
           
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
                label={formData.status ? 'Cliente Ativo' : 'Cliente Inativo'}
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