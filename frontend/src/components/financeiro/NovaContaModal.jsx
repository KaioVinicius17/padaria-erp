import React, { useState } from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Box
} from '@mui/material';
import { NumericFormat } from 'react-number-format';

// Reutilizando o componente de Input de Moeda do seu projeto
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

export default function NovaContaModal({ open, onClose, onSaveSuccess }) {
    const [formData, setFormData] = useState({
        nome_conta: '',
        banco: '',
        tipo_conta: 'Conta Corrente',
        saldo_inicial: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                saldo_inicial: parseFloat(formData.saldo_inicial || 0)
            };
            await axios.post('http://localhost:3007/contas-bancarias', payload);
            alert('Conta criada com sucesso!');
            setFormData({ nome_conta: '', banco: '', tipo_conta: 'Conta Corrente', saldo_inicial: '' });
            onSaveSuccess(); // Atualiza a lista na tela principal
            onClose();
        } catch (error) {
            console.error("Erro ao criar conta:", error);
            alert('Erro ao criar conta. Verifique os dados.');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Nova Conta Bancária</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Nome da Conta (ex: Banco X - Principal)"
                        name="nome_conta"
                        value={formData.nome_conta}
                        onChange={handleChange}
                        fullWidth
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Instituição / Banco"
                            name="banco"
                            value={formData.banco}
                            onChange={handleChange}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                name="tipo_conta"
                                value={formData.tipo_conta}
                                label="Tipo"
                                onChange={handleChange}
                            >
                                <MenuItem value="Conta Corrente">Conta Corrente</MenuItem>
                                <MenuItem value="Poupança">Poupança</MenuItem>
                                <MenuItem value="Carteira">Carteira</MenuItem>
                                <MenuItem value="Cofre">Cofre</MenuItem>
                                <MenuItem value="Caixa">Caixa</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <TextField
                        label="Saldo Inicial"
                        name="saldo_inicial"
                        value={formData.saldo_inicial}
                        onChange={handleChange}
                        InputProps={{ inputComponent: CurrencyInput }}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained" color="primary">Criar Conta</Button>
            </DialogActions>
        </Dialog>
    );
}