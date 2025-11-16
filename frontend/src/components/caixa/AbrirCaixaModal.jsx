// src/components/caixa/AbrirCaixaModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';

// URL do serviço financeiro que tem as rotas do caixa
const FINANCEIRO_SERVICE_URL = 'http://localhost:3007';

export default function AbrirCaixaModal({ open, onCaixaAberto }) {
  const [valorAbertura, setValorAbertura] = useState(100.00); // Fundo de troco padrão
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAbrirCaixa = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${FINANCEIRO_SERVICE_URL}/caixa/abrir`, {
        valor_abertura: valorAbertura,
        // (Opcional) enviar o ID do usuário logado
        // usuario_id: 1 
      });
      
      // Se deu certo, avisa o componente 'pai' (PDV.jsx)
      onCaixaAberto(response.data.sessao); 

    } catch (err) {
      console.error("Erro ao abrir caixa:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Falha ao abrir o caixa.');
      setLoading(false);
    }
    // Não setamos loading false no sucesso, pois o modal vai fechar
  };

  return (
    // Note: O Dialog não tem a prop 'onClose'.
    // Isso é intencional, para FORÇAR o usuário a abrir o caixa.
    <Dialog open={open}>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Abertura de Caixa Obrigatória</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Nenhum caixa está aberto. Para iniciar as vendas,
          informe o valor do fundo de troco (suprimento) no caixa.
        </DialogContentText>
        <TextField
          autoFocus
          required
          label="Valor do Fundo de Troco"
          type="number"
          value={valorAbertura || ''}
          onChange={(e) => setValorAbertura(parseFloat(e.target.value) || 0)}
          InputProps={{
            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
          }}
          fullWidth
          variant="outlined"
        />
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleAbrirCaixa} 
          variant="contained" 
          color="primary"
          fullWidth
          disabled={loading || valorAbertura < 0}
        >
          {loading ? <CircularProgress size={24} /> : 'Abrir Caixa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}