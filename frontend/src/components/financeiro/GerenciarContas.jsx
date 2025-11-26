import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Button, Card, CardContent, Grid, Divider, Chip 
} from '@mui/material';
import AddCardIcon from '@mui/icons-material/AddCard';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import NovaContaModal from './NovaContaModal';
import TransferenciaModal from './TransferenciaModal';

export default function GerenciarContas() {
    const [contas, setContas] = useState([]);
    const [modalContaOpen, setModalContaOpen] = useState(false);
    const [modalTransferenciaOpen, setModalTransferenciaOpen] = useState(false);

    const carregarContas = () => {
        axios.get('http://localhost:3007/contas-bancarias')
            .then(res => setContas(res.data))
            .catch(err => console.error("Erro ao buscar contas:", err));
    };

    useEffect(() => {
        carregarContas();
    }, []);

    // Calcula saldo total de todas as contas
    const saldoTotal = contas.reduce((acc, conta) => acc + parseFloat(conta.saldo), 0);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Contas Bancárias & Caixas
                </Typography>
                <Box>
                    <Button 
                        variant="outlined" 
                        startIcon={<SyncAltIcon />} 
                        sx={{ mr: 2 }}
                        onClick={() => setModalTransferenciaOpen(true)}
                    >
                        Transferência
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<AddCardIcon />}
                        onClick={() => setModalContaOpen(true)}
                    >
                        Nova Conta
                    </Button>
                </Box>
            </Box>

            {/* Resumo Geral */}
            <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">Saldo Geral Consolidado</Typography>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoTotal)}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Grid de Contas */}
            <Grid container spacing={3}>
                {contas.map((conta) => (
                    <Grid item xs={12} sm={6} md={4} key={conta.id}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="h6" component="div">
                                        {conta.nome_conta}
                                    </Typography>
                                    <Chip label={conta.tipo_conta} size="small" color="default" />
                                </Box>
                                <Typography color="text.secondary" gutterBottom>
                                    {conta.banco}
                                </Typography>
                                <Divider sx={{ my: 1.5 }} />
                                <Typography variant="h5" color={parseFloat(conta.saldo) >= 0 ? 'success.main' : 'error.main'}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(conta.saldo))}
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                    ID: {conta.id} • Atualizado agora
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modais */}
            <NovaContaModal 
                open={modalContaOpen} 
                onClose={() => setModalContaOpen(false)} 
                onSaveSuccess={carregarContas} 
            />
            
            <TransferenciaModal 
                open={modalTransferenciaOpen} 
                onClose={() => setModalTransferenciaOpen(false)} 
                onSaveSuccess={carregarContas} 
            />
        </Box>
    );
}