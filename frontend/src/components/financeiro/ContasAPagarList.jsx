// Em ContasAPagarList.jsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Ícone de "check"
import Stack from '@mui/material/Stack'; // <-- 1. IMPORTE O STACK
import UndoIcon from '@mui/icons-material/Undo';

// 2. RECEBA A NOVA PROP 'onEditarLancamento'
export default function ContasAPagarList({ contas, onMarcarComoPago, onEditarLancamento, onEstornarLancamento }) {
  
  // Função para formatar a data (exemplo)
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  // Função para formatar valor (exemplo)
  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Descrição</TableCell>
            <TableCell>Fornecedor</TableCell>
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
              <TableCell>{conta.fornecedor_nome || 'Diversos'}</TableCell>
              <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
              <TableCell>{formatCurrency(conta.valor)}</TableCell>
              <TableCell>
                <Chip 
                  label={conta.status}
                  color={conta.status === 'Pago' ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>
              
              {/* 3. LÓGICA CONDICIONAL DE AÇÕES */}
              <TableCell>
                {conta.status === 'Pendente' ? (
                  // Se estiver PENDENTE, mostra Editar e Pagar
                  <Stack direction="row" spacing={0}>
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => onEditarLancamento(conta)}
                      title="Editar Lançamento"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="success" 
                      size="small"
                      onClick={() => onMarcarComoPago(conta)} 
                      title="Marcar como Pago"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  // Se estiver PAGO, mostra Estornar
                  <IconButton 
                    color="error" 
                    size="small"
                    onClick={() => onEstornarLancamento(conta)} // 4. CHAMA A FUNÇÃO DE ESTORNO
                    title="Estornar Pagamento"
                  >
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