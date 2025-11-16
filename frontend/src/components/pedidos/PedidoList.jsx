// src/components/pedidos/PedidoList.jsx
// (ATUALIZADO: Corrigido o nome da coluna do Fornecedor)

import * as React from 'react';
import PropTypes from 'prop-types';
import { 
    Box, Table, TableBody, TableCell, TableContainer, TableHead, 
    TablePagination, TableRow, Paper, IconButton, Menu, MenuItem, 
    ListItemIcon, Chip, Typography 
} from '@mui/material';
import { MoreVertical, Edit, Trash2, CheckCircle, Send, FileText } from 'lucide-react';

const headCells = [
  { id: 'id', numeric: false, label: 'ID' },
  { id: 'status', numeric: false, label: 'Status' },
  { id: 'fornecedor', numeric: false, label: 'Fornecedor' },
  { id: 'itens', numeric: true, label: 'Itens' },
  { id: 'valor_total', numeric: true, label: 'Valor Total' },
  { id: 'data_criacao', numeric: false, label: 'Data' },
  { id: 'actions', numeric: true, label: 'Ações' },
];

const formatCurrency = (value) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
};

function EnhancedTableHead() {
  return (
    <TableHead>
      <TableRow sx={{ '& > th': { fontWeight: 'bold' } }}>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} align={headCell.numeric ? 'right' : 'left'}>
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default function PedidoList({ pedidos, onEdit, onSend, onCancel, onViewDetails, onConfirmar }) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);

  const handleClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleEdit = () => {
    onEdit(selectedItem);
    handleClose();
  };

  const handleSend = () => {
    onSend(selectedItem.id);
    handleClose();
  };
  
  const handleCancel = () => {
    onCancel(selectedItem.id, selectedItem.status);
    handleClose();
  };
  
  const handleView = () => {
    onViewDetails(selectedItem.id);
    handleClose();
  };

  const handleConfirmar = () => {
    onConfirmar(selectedItem.id);
    handleClose();
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = React.useMemo(() =>
    (pedidos || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [pedidos, page, rowsPerPage],
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <EnhancedTableHead />
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow 
                  hover 
                  tabIndex={-1} 
                  key={row.id}
                  sx={{ 
                    opacity: row.status === 'Cancelado' ? 0.5 : 1,
                    backgroundColor: row.status === 'Cancelado' ? 'action.hover' : 'transparent'
                  }}
                >
                  <TableCell>#{row.id}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status}
                      color={
                        row.status === 'Aberta' ? 'warning' :
                        row.status === 'Enviado' ? 'info' :
                        row.status === 'Confirmado' ? 'success' :
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  {/* CORREÇÃO: Checa múltiplos nomes que o back-end pode enviar */}
                  <TableCell>{row.fornecedor_nome || row.nome_fantasia || `ID ${row.fornecedor_id}`}</TableCell>
                  <TableCell align="right">{row.total_itens}</TableCell>
                  <TableCell align="right">{formatCurrency(row.valor_total)}</TableCell>
                  <TableCell>{formatDate(row.data_criacao)}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => handleClick(e, row)}>
                      <MoreVertical size={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pedidos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
        />
      </Paper>
      
      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon><FileText size={20} /></ListItemIcon>
          Visualizar PDF
        </MenuItem>

        {selectedItem?.status === 'Aberta' && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon><Edit size={20} /></ListItemIcon>
            Editar Pedido
          </MenuItem>
        )}
        {selectedItem?.status === 'Aberta' && (
          <MenuItem onClick={handleSend} sx={{ color: 'info.main' }}>
            <ListItemIcon sx={{ color: 'info.main' }}><Send size={20} /></ListItemIcon>
            Marcar como Enviado
          </MenuItem>
        )}
         {selectedItem?.status === 'Enviado' && (
          <MenuItem onClick={handleConfirmar} sx={{ color: 'success.main' }}>
            <ListItemIcon sx={{ color: 'success.main' }}><CheckCircle size={20} /></ListItemIcon>
            Marcar como Confirmado
          </MenuItem>
        )}
        {(selectedItem?.status === 'Aberta' || selectedItem?.status === 'Enviado') && (
            <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}><Trash2 size={20} /></ListItemIcon>
            Cancelar Pedido
            </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

PedidoList.propTypes = {
  pedidos: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired, 
  onConfirmar: PropTypes.func.isRequired,   
};