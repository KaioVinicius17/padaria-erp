// src/components/financeiro/ContasAReceberList.jsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';

export default function ContasAReceberList({ 
  contas, 
  onMarcarComoRecebido, 
  onEditarLancamento,
  onEstornarLancamento 
}) {
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const formatCurrency = (value) => parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Descrição</TableCell>
            <TableCell>Cliente</TableCell> {/* <-- NOVA COLUNA */}
            <TableCell>Vencimento</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contas.map((conta) => (
            <TableRow key={conta.id}>
              <TableCell>{conta.descricao}</TableCell>
              {/* Se o cliente_nome for nulo/vazio, mostra 'Avulso' */}
              <TableCell>{conta.cliente_nome || 'Avulso'}</TableCell> {/* <-- NOVO DADO */}
              <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
              <TableCell>{formatCurrency(conta.valor)}</TableCell>
              <TableCell>
                <Chip 
                  label={conta.status}
                  color={conta.status === 'Recebido' ? 'success' : (conta.status === 'Pendente' ? 'warning' : 'default')}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {conta.status === 'Pendente' ? (
                  <Stack direction="row" spacing={0}>
                    <IconButton color="primary" size="small" onClick={() => onEditarLancamento(conta)} title="Editar Lançamento">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="success" size="small" onClick={() => onMarcarComoRecebido(conta)} title="Marcar como Recebido">
                      <CheckCircleIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  <IconButton color="error" size="small" onClick={() => onEstornarLancamento(conta)} title="Estornar Recebimento">
                    <UndoIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}