import React from 'react';
import PropTypes from 'prop-types';
import { 
    Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, IconButton, Tooltip, Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
};

export default function OrdemProducaoList({ ordens, onView, onConclude }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordens.map((ordem) => (
            <TableRow hover key={ordem.id}>
              <TableCell>#{ordem.id}</TableCell>
              <TableCell>{ordem.descricao}</TableCell>
              <TableCell>{formatDate(ordem.data_producao)}</TableCell>
              <TableCell>
                <Chip 
                  label={ordem.status} 
                  color={ordem.status === 'Concluída' ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Ver Itens">
                  <IconButton onClick={() => onView(ordem)} color="inherit"><VisibilityIcon /></IconButton>
                </Tooltip>
                {ordem.status === 'Pendente' && (
                  <Tooltip title="Concluir Produção">
                    <IconButton onClick={() => onConclude(ordem.id)} color="success"><CheckCircleIcon /></IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

OrdemProducaoList.propTypes = {
  ordens: PropTypes.array.isRequired,
  onView: PropTypes.func.isRequired,
  onConclude: PropTypes.func.isRequired,
};
