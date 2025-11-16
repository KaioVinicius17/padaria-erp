import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    TextField, FormControl, InputLabel, Select, MenuItem, Typography, Box
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale';
import { NumericFormat } from 'react-number-format';

const CurrencyInput = React.forwardRef(function CurrencyInput(props, ref) {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: { name: props.name, value: values.value },
        });
      }}
      thousandSeparator="." decimalSeparator="," prefix="R$ " valueIsNumericString
      decimalScale={2} fixedDecimalScale
    />
  );
});

export default function BaixaPagamentoModal({ open, onClose, onSaveSuccess, lancamento }) {
  const [contasBancarias, setContasBancarias] = useState([]);
  const [dataPagamento, setDataPagamento] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [valorPago, setValorPago] = useState('');

  useEffect(() => {
    if (open && lancamento) {
      axios.get('http://localhost:3007/contas-bancarias').then(res => setContasBancarias(res.data));
      // Inicializa os estados com os dados do lançamento
      setDataPagamento(new Date());
      setFormaPagamento(lancamento.forma_pagamento || 'Boleto');
      // Sugere o valor total no campo de valor pago, mas permite edição
      setValorPago(lancamento.valor);
    }
  }, [open, lancamento]);

  const handleSave = async () => {
    const payload = {
      data_pagamento: dataPagamento.toISOString().split('T')[0],
      forma_pagamento: formaPagamento,
      conta_bancaria_id: contaBancariaId,
      valor_pago: parseFloat(valorPago),
    };
    try {
      await axios.patch(`http://localhost:3007/lancamentos/${lancamento.id}/pagar`, payload);
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao dar baixa no pagamento:", error);
    }
  };
  
  const handleClose = () => {
    // Limpa os campos ao fechar
    setValorPago('');
    setContaBancariaId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Dar Baixa no Pagamento</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
          Despesa: <strong>{lancamento?.descricao}</strong>
        </Typography>

        {/* --- CAMPOS DE VALOR E DATA COM LAYOUT CORRIGIDO --- */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
                label="Valor Original"
                value={lancamento?.valor || ''}
                InputProps={{ 
                    inputComponent: CurrencyInput,
                    readOnly: true, // Apenas para visualização
                }}
                fullWidth
                variant="outlined"
            />
            <TextField
                label="Valor Pago"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                name="valor_pago"
                InputProps={{ inputComponent: CurrencyInput }}
                fullWidth
                variant="outlined"
            />
        </Box>

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <DatePicker
            label="Data do Pagamento"
            value={dataPagamento}
            onChange={setDataPagamento}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
        </LocalizationProvider>

        <FormControl fullWidth margin="normal">
          <InputLabel>Forma de Pagamento</InputLabel>
          <Select value={formaPagamento} label="Forma de Pagamento" onChange={(e) => setFormaPagamento(e.target.value)}>
            <MenuItem value="Boleto">Boleto</MenuItem>
            <MenuItem value="Pix">Pix</MenuItem>
            <MenuItem value="Dinheiro">Dinheiro</MenuItem>
            <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
            <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
            <MenuItem value="Transferência">Transferência</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Conta de Saída</InputLabel>
          <Select value={contaBancariaId} label="Conta de Saída" onChange={(e) => setContaBancariaId(e.target.value)}>
            {contasBancarias.map(conta => (
              <MenuItem key={conta.id} value={conta.id}>{conta.nome_conta}</MenuItem>
            ))}
          </Select>
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Confirmar Pagamento</Button>
      </DialogActions>
    </Dialog>
  );
}
