// src/components/requisicoes/RequisicaoList.jsx
// (ATUALIZADO: Adicionado botão "Visualizar")

import * as React from 'react';
import PropTypes from 'prop-types';
import { 
    Box, Table, TableBody, TableCell, TableContainer, TableHead, 
    TablePagination, TableRow, Paper, IconButton, Menu, MenuItem, 
    ListItemIcon, Chip, Typography 
} from '@mui/material';
import { MoreVertical, Edit, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react'; // 1. Ícone Eye

const headCells = [
  { id: 'id', numeric: false, label: 'ID' },
  { id: 'status', numeric: false, label: 'Status' },
  { id: 'itens', numeric: true, label: 'Itens' },
  { id: 'data_criacao', numeric: false, label: 'Data' },
  { id: 'actions', numeric: true, label: 'Ações' },
];

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

// 2. RECEBE A NOVA PROP
export default function RequisicaoList({ requisicoes, onEdit, onAprovar, onCancelar, onViewDetails }) {
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

  const handleAprovar = () => {
    onAprovar(selectedItem.id);
    handleClose();
  };
  
  const handleCancelar = () => {
    onCancelar(selectedItem.id, selectedItem.status);
    handleClose();
  };
  
  // 3. HANDLER para o novo botão
  const handleView = () => {
    onViewDetails(selectedItem.id);
    handleClose();
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = React.useMemo(() =>
    (requisicoes || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [requisicoes, page, rowsPerPage],
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
                    opacity: row.status === 'Cancelada' ? 0.5 : 1,
                    backgroundColor: row.status === 'Cancelada' ? 'action.hover' : 'transparent'
                  }}
                >
                  <TableCell>#{row.id}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status}
                      color={
                        row.status === 'Aberta' ? 'warning' :
                        row.status === 'Aprovada' ? 'success' :
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{row.total_itens}</TableCell>
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
          count={requisicoes.length}
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
        {/* 4. NOVO BOTÃO DE MENU */}
        <MenuItem onClick={handleView}>
          <ListItemIcon><Eye size={20} /></ListItemIcon>
          Visualizar Documento
        </MenuItem>

        {selectedItem?.status === 'Aberta' && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon><Edit size={20} /></ListItemIcon>
            Editar Itens
          </MenuItem>
        )}
        {selectedItem?.status === 'Aberta' && (
          <MenuItem onClick={handleAprovar} sx={{ color: 'success.main' }}>
            <ListItemIcon sx={{ color: 'success.main' }}><CheckCircle size={20} /></ListItemIcon>
            Aprovar
          </MenuItem>
        )}
        {(selectedItem?.status === 'Aberta' || selectedItem?.status === 'Aprovada') && (
            <MenuItem onClick={handleCancelar} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}><XCircle size={20} /></ListItemIcon>
            {selectedItem?.status === 'Aprovada' ? 'Rejeitar' : 'Cancelar'}
            </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

RequisicaoList.propTypes = {
  requisicoes: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onAprovar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired, // 5. NOVA PROP
};