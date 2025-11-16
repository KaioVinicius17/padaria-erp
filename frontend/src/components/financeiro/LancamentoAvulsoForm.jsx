import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete, Box, Divider, Typography
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
          target: {
            name: props.name,
            value: values.value,
          },
        });
      }}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      valueIsNumericString
      decimalScale={2}
      fixedDecimalScale
    />
  );
});

export default function LancamentoAvulsoForm({ open, onClose, onSaveSuccess }) {
  const [planoDeContas, setPlanoDeContas] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_vencimento: null,
    plano_de_contas_id: null,
    fornecedor_id: null,
    forma_pagamento: 'Boleto',
    condicao_pagamento: 'À vista',
    parcelas: 1
  });

  useEffect(() => {
    if (open) {
      axios.get('http://localhost:3007/plano-de-contas')
        .then(res => {
          setPlanoDeContas(res.data.filter(c => c.tipo === 'Despesa'));
        });
      axios.get('http://localhost:3001/fornecedores')
        .then(res => {
          setFornecedores(res.data);
        });
    }
  }, [open]);

  const clearForm = () => {
    setFormData({
        descricao: '',
        valor: '',
        data_vencimento: null,
        plano_de_contas_id: null,
        fornecedor_id: null,
        forma_pagamento: 'Boleto',
        condicao_pagamento: 'À vista',
        parcelas: 1
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleFieldChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload = {
        ...formData,
        tipo: 'Saída',
        valor: parseFloat(formData.valor),
        plano_de_contas_id: formData.plano_de_contas_id ? formData.plano_de_contas_id.id : null,
        fornecedor_id: formData.fornecedor_id ? formData.fornecedor_id.id : null,
    };
    try {
      await axios.post('http://localhost:3007/lancamentos', payload);
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao salvar lançamento avulso:", error);
    }
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Lançar Despesa Avulsa</DialogTitle>
      <DialogContent>
        <TextField 
          autoFocus
          name="descricao" 
          label="Descrição da Despesa" 
          value={formData.descricao} 
          onChange={handleFieldChange} 
          fullWidth 
          margin="normal" 
        />
        
        <Autocomplete
          options={planoDeContas}
          getOptionLabel={(option) => option.descricao}
          value={formData.plano_de_contas_id}
          onChange={(event, newValue) => handleChange('plano_de_contas_id', newValue)}
          renderInput={(params) => <TextField {...params} label="Plano de Contas" margin="normal" />}
        />

        <Autocomplete
          options={fornecedores}
          getOptionLabel={(option) => option.nome_fantasia}
          value={formData.fornecedor_id}
          onChange={(event, newValue) => handleChange('fornecedor_id', newValue)}
          renderInput={(params) => <TextField {...params} label="Fornecedor (Opcional)" margin="normal" />}
        />
        
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Detalhes do Pagamento</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth margin="none" size="small">
                <InputLabel>Forma de Pagamento</InputLabel>
                <Select name="forma_pagamento" value={formData.forma_pagamento} label="Forma de Pagamento" onChange={handleFieldChange}>
                    <MenuItem value="Boleto">Boleto</MenuItem>
                    <MenuItem value="Pix">Pix</MenuItem>
                    <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth margin="none" size="small">
                <InputLabel>Condição</InputLabel>
                <Select name="condicao_pagamento" value={formData.condicao_pagamento} label="Condição" onChange={handleFieldChange}>
                    <MenuItem value="À vista">À vista</MenuItem>
                    <MenuItem value="Parcelado">Parcelado</MenuItem>
                </Select>
            </FormControl>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            <TextField 
              label="Valor Total" 
              value={formData.valor} 
              onChange={handleFieldChange} 
              name="valor" 
              InputProps={{ inputComponent: CurrencyInput }} 
              fullWidth 
              size="small" 
            />
            
            {formData.condicao_pagamento === 'Parcelado' && (
                <TextField 
                  label="Parcelas" 
                  name="parcelas" 
                  type="number" 
                  value={formData.parcelas} 
                  onChange={handleFieldChange} 
                  size="small" 
                  sx={{ width: '120px' }} 
                />
            )}
            
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker 
                label="1º Vencimento" 
                value={formData.data_vencimento} 
                onChange={(newValue) => handleChange('data_vencimento', newValue)} 
                slotProps={{ textField: { size: 'small', fullWidth: true } }} 
              />
            </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Salvar Despesa</Button>
      </DialogActions>
    </Dialog>
  );
}
