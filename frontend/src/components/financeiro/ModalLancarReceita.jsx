// src/components/financeiro/ModalLancarReceita.jsx
// (NOVO COMPONENTE, BASEADO NA SUA IMAGEM DE REFERÊNCIA)

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Imports do Material-UI
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Collapse,
  Link,
  Divider,
  Box
} from '@mui/material';

// Estado inicial do formulário
const initialState = {
  descricao: '',
  valor: '',
  data_vencimento: new Date().toISOString().split('T')[0], // Mapeado de 'Competência'
  plano_de_contas_id: '', // Mapeado de 'Categoria'
  cliente_id: '',         // Mapeado de 'Fornecedor' (adaptado)
  condicao_pagamento: 'À vista',
  parcelas: 1,
  observacao: '',
  tipo: 'Entrada'
};

export default function ModalLancarReceita({ open, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState(initialState);
  const [planosDeConta, setPlanosDeConta] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showOptions, setShowOptions] = useState(false);

  // Efeito para buscar dados dos dropdowns (clientes e planos de conta)
  useEffect(() => {
    if (open) {
      const fetchDropdowns = async () => {
        try {
          const [resClientes, resPlanos] = await Promise.all([
            axios.get('http://localhost:3007/clientes'),
            axios.get('http://localhost:3007/plano-de-contas')
          ]);

          setClientes(resClientes.data);
          
          const planosReceita = resPlanos.data.filter(p => p.tipo === 'Entrada');
          setPlanosDeConta(planosReceita.length > 0 ? planosReceita : resPlanos.data);

        } catch (error) {
          console.error("Erro ao buscar dados do formulário:", error);
        }
      };
      fetchDropdowns();
    }
  }, [open]);

  // Atualiza o estado do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reseta parcelas se voltar para "À vista"
    if (name === 'condicao_pagamento' && value === 'À vista') {
      setFormData(prev => ({ ...prev, parcelas: 1 }));
    }
  };

  // Função para fechar e limpar o modal
  const handleClose = () => {
    onClose();
    // Pequeno delay para a animação de fechar antes de limpar o estado
    setTimeout(() => {
      setFormData(initialState);
      setShowOptions(false);
    }, 300);
  };

  // Envia os dados para a API ao salvar
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // A API /lancamentos já tem a lógica de parcelamento (que pegamos do seu index.js)
      await axios.post('http://localhost:3007/lancamentos', formData);
      onSaveSuccess(); // Avisa a página 'pai' para recarregar a lista
      handleClose(); // Fecha e limpa o modal
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      {/* Usamos o "Lançar Receita" em vez de "Nova saída" */}
      <DialogTitle>Lançar Receita Avulsa</DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          
          {/* Layout Principal em Duas Colunas (como na referência) */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            
            {/* Coluna da Esquerda */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="descricao"
                label="Descrição"
                value={formData.descricao}
                onChange={handleChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Cliente</InputLabel>
                <Select
                  name="cliente_id"
                  value={formData.cliente_id}
                  label="Cliente"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Nenhum (Avulso)</em></MenuItem>
                  {clientes.map((cliente) => (
                    <MenuItem key={cliente.id} value={cliente.id}>
                      {cliente.nome_razao_social}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Plano de Contas (Categoria)</InputLabel>
                <Select
                  name="plano_de_contas_id"
                  value={formData.plano_de_contas_id}
                  label="Plano de Contas (Categoria)"
                  onChange={handleChange}
                  required
                >
                  {planosDeConta.map((plano) => (
                    <MenuItem key={plano.id} value={plano.id}>
                      {plano.descricao}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Coluna da Direita */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="data_vencimento"
                label="Data de Vencimento (Competência)"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.data_vencimento}
                onChange={handleChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                name="valor"
                label="Valor"
                type="number"
                value={formData.valor}
                onChange={handleChange}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>

          {/* Seção Condição de Pagamento (como na referência) */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Condição de pagamento
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Parcelamento</InputLabel>
                <Select
                  name="condicao_pagamento"
                  value={formData.condicao_pagamento}
                  label="Parcelamento"
                  onChange={handleChange}
                >
                  <MenuItem value="À vista">À vista</MenuItem>
                  <MenuItem value="Parcelado">Parcelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="parcelas"
                label="Nº de Parcelas"
                type="number"
                value={formData.parcelas}
                onChange={handleChange}
                fullWidth
                // Desabilitado se for "À vista"
                disabled={formData.condicao_pagamento === 'À vista'}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          </Grid>

          {/* Seção "Mais opções" (como na referência) */}
          <Box sx={{ mt: 2 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? 'Menos opções' : 'Mais opções'}
            </Link>
            <Collapse in={showOptions} sx={{ mt: 1 }}>
              <TextField
                name="observacao"
                label="Observação"
                value={formData.observacao}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Collapse>
          </Box>
          
        </DialogContent>
        
        <DialogActions>
          {/* Botões Salvar (como na referência) */}
          <Button onClick={handleClose} color="secondary">Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">Salvar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}