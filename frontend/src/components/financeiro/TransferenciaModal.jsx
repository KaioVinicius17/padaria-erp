import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Box, Typography, Alert
} from '@mui/material';
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
            thousandSeparator="."
            decimalSeparator=","
            prefix="R$ "
            valueIsNumericString
            decimalScale={2}
            fixedDecimalScale
        />
    );
});

export default function TransferenciaModal({ open, onClose, onSaveSuccess }) {
    const [contas, setContas] = useState([]);
    const [formData, setFormData] = useState({
        conta_origem_id: '',
        conta_destino_id: '',
        valor: '',
        observacao: ''
    });
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (open) {
            axios.get('http://localhost:3007/contas-bancarias')
                .then(res => setContas(res.data))
                .catch(err => console.error("Erro ao carregar contas", err));
        }
    }, [open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErro(''); // Limpa erro ao digitar
    };

    const handleTransfer = async () => {
        if (formData.conta_origem_id === formData.conta_destino_id) {
            setErro("A conta de origem e destino não podem ser iguais.");
            return;
        }
        if (!formData.valor || parseFloat(formData.valor) <= 0) {
            setErro("Informe um valor válido.");
            return;
        }

        try {
            const payload = {
                ...formData,
                valor: parseFloat(formData.valor)
            };
            await axios.post('http://localhost:3007/transferencias', payload);
            alert('Transferência realizada com sucesso!');
            setFormData({ conta_origem_id: '', conta_destino_id: '', valor: '', observacao: '' });
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error("Erro na transferência:", error);
            const msg = error.response?.data?.message || 'Erro ao processar transferência.';
            setErro(msg);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Nova Transferência</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {erro && <Alert severity="error">{erro}</Alert>}

                    <FormControl fullWidth>
                        <InputLabel>Conta de Origem (Sai Dinheiro)</InputLabel>
                        <Select
                            name="conta_origem_id"
                            value={formData.conta_origem_id}
                            label="Conta de Origem (Sai Dinheiro)"
                            onChange={handleChange}
                        >
                            {contas.map(conta => (
                                <MenuItem key={conta.id} value={conta.id}>
                                    {conta.nome_conta} (Saldo: R$ {parseFloat(conta.saldo).toFixed(2)})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Conta de Destino (Entra Dinheiro)</InputLabel>
                        <Select
                            name="conta_destino_id"
                            value={formData.conta_destino_id}
                            label="Conta de Destino (Entra Dinheiro)"
                            onChange={handleChange}
                        >
                            {contas.map(conta => (
                                <MenuItem key={conta.id} value={conta.id}>
                                    {conta.nome_conta} - {conta.banco}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Valor da Transferência"
                        name="valor"
                        value={formData.valor}
                        onChange={handleChange}
                        InputProps={{ inputComponent: CurrencyInput }}
                        fullWidth
                    />

                    <TextField
                        label="Observação (Opcional)"
                        name="observacao"
                        value={formData.observacao}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleTransfer} variant="contained" color="success">Confirmar Transferência</Button>
            </DialogActions>
        </Dialog>
    );
}