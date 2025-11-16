// src/components/caixa/FecharCaixaModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, InputAdornment, Typography,
  CircularProgress, Box, Divider
} from '@mui/material';

const FINANCEIRO_SERVICE_URL = 'http://localhost:3007';

// Helper
const formatCurrency = (value) => {
  if (isNaN(value)) value = 0;
  return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function FecharCaixaModal({ open, onClose, onCaixaFechado, sessaoId }) {
  const [step, setStep] = useState('contagem'); // 'contagem' -> 'resumo'
  const [valorContado, setValorContado] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState(null); // Para guardar o resultado do fechamento

  const handleFecharCaixa = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${FINANCEIRO_SERVICE_URL}/caixa/fechar`, {
        sessao_id: sessaoId,
        valor_fechamento_contado: valorContado
      });
      
      setResumo(response.data.fechamento); // Salva o resumo
      setStep('resumo'); // Muda para a tela de resumo

    } catch (err) {
      console.error("Erro ao fechar caixa:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Falha ao fechar o caixa.');
    } finally {
      setLoading(false);
    }
  };

  // Reseta o estado ao fechar
  const handleClose = () => {
    setStep('contagem');
    setValorContado(0);
    setLoading(false);
    setError('');
    setResumo(null);
    onClose(); // Chama a função do 'pai' (PDV.jsx)
  };

  // Função chamada ao fechar o resumo final
  const handleCloseSummary = () => {
    handleClose();
    onCaixaFechado(); // Avisa o PDV que o caixa foi fechado
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      {step === 'contagem' && (
        <>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Fechar Caixa (Sessão: {sessaoId})</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Informe o valor total (em dinheiro e outros meios) contado na gaveta para realizar o fechamento.
            </Typography>
            <TextField
              autoFocus
              required
              label="Valor Total Contado"
              type="number"
              value={valorContado || ''}
              onChange={(e) => setValorContado(parseFloat(e.target.value) || 0)}
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
            <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
            <Button 
              onClick={handleFecharCaixa} 
              variant="contained" 
              color="error"
              disabled={loading || valorContado < 0}
            >
              {loading ? <CircularProgress size={24} /> : 'Confirmar Fechamento'}
            </Button>
          </DialogActions>
        </>
      )}

      {step === 'resumo' && resumo && (
        <>
          <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Caixa Fechado</DialogTitle>
          <DialogContent>
            <Typography variant="h6" align="center" sx={{ mb: 2 }}>Resumo do Fechamento</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Suprimento (Abertura):</Typography>
              <Typography sx={{ fontWeight: 500 }}>{formatCurrency(resumo.valor_abertura)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Total de Vendas:</Typography>
              <Typography sx={{ fontWeight: 500 }}>{formatCurrency(resumo.valor_total_vendas)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Sangrias (Retiradas):</Typography>
              <Typography sx={{ fontWeight: 500 }}>{formatCurrency(resumo.valor_total_sangrias)}</Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Total Calculado (Sistema):</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatCurrency(resumo.valor_calculado)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Total Contado (Operador):</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatCurrency(resumo.valor_fechamento_contado)}</Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="h6">Diferença (Quebra)</Typography>
              <Typography 
                variant="h4" 
                sx={{ fontWeight: 'bold' }}
                color={resumo.diferenca < 0 ? 'error' : 'success.main'}
              >
                {formatCurrency(resumo.diferenca)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleCloseSummary} 
              variant="contained" 
              color="primary"
              fullWidth
            >
              OK, Entendido
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}