import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, Card, CardContent,
    TextField, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { format } from 'date-fns';

export default function HistoricoMovimentacoes() {
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [filtro, setFiltro] = useState('');

    useEffect(() => {
        carregarMovimentacoes();
    }, []);

    const carregarMovimentacoes = () => {
        axios.get('http://localhost:3007/movimentacoes')
            .then(res => setMovimentacoes(res.data))
            .catch(err => console.error("Erro ao carregar histórico:", err));
    };

    // Função para filtrar na tela (busca simples)
    const dadosFiltrados = movimentacoes.filter(m => 
        m.descricao.toLowerCase().includes(filtro.toLowerCase()) ||
        (m.conta && m.conta.toLowerCase().includes(filtro.toLowerCase()))
    );

    // Helpers de visualização
    const getIcon = (tipo) => {
        if (tipo === 'Entrada') return <ArrowCircleUpIcon color="success" />;
        if (tipo === 'Saída') return <ArrowCircleDownIcon color="error" />;
        return <SyncAltIcon color="primary" />;
    };

    const getCorValor = (tipo) => {
        if (tipo === 'Entrada') return 'success.main';
        if (tipo === 'Saída') return 'error.main';
        return 'primary.main'; // Transferência neutra ou azul
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptLongIcon sx={{ fontSize: 32, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Extrato Geral de Movimentações
                    </Typography>
                </Box>
                <TextField 
                    size="small"
                    placeholder="Buscar movimentação..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 300 }}
                />
            </Box>

            <Card elevation={2}>
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Conta / Fluxo</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Valor</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dadosFiltrados.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            Nenhuma movimentação encontrada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dadosFiltrados.map((mov, index) => (
                                        <TableRow key={`${mov.origem_dado}-${mov.id}`} hover>
                                            <TableCell>
                                                {mov.data ? format(new Date(mov.data), 'dd/MM/yyyy') : '-'}
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    {mov.data ? format(new Date(mov.data), 'HH:mm') : ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {getIcon(mov.tipo)}
                                                    <Typography variant="body2">{mov.tipo}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{mov.descricao}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {mov.conta || 'Não informado'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight="bold" color={getCorValor(mov.tipo)}>
                                                    {mov.tipo === 'Saída' ? '-' : ''} {formatarMoeda(mov.valor)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={mov.status} 
                                                    size="small" 
                                                    color="default" 
                                                    variant="outlined" 
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}