// src/components/almoxarifado/TransferenciaList.jsx
// (ATUALIZADO: Com menu de ações '...', status e estilo)

import * as React from 'react';
import PropTypes from 'prop-types';
import { 
    Box, Table, TableBody, TableCell, TableContainer, TableHead, 
    TablePagination, TableRow, Paper, IconButton, Menu, MenuItem, 
    ListItemIcon, Chip, Typography 
} from '@mui/material';
import { MoreVertical, Edit, Trash2, CheckCircle } from 'lucide-react';

const headCells = [
  { id: 'status', numeric: false, label: 'Status' },
  { id: 'origem', numeric: false, label: 'Origem' },
  { id: 'destino', numeric: false, label: 'Destino' },
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

export default function TransferenciaList({ historico, onEdit, onFinalizar, onCancelar }) {
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

  const handleFinalizar = () => {
    onFinalizar(selectedItem.id);
    handleClose();
  };
  
  const handleCancelar = () => {
    onCancelar(selectedItem.id, selectedItem.status);
    handleClose();
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = React.useMemo(() =>
    historico.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [historico, page, rowsPerPage],
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
                  <TableCell>
                    <Chip 
                      label={row.status}
                      color={
                        row.status === 'Aberta' ? 'warning' :
                        row.status === 'Finalizada' ? 'success' :
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.almoxarifado_origem}</TableCell>
                  <TableCell>{row.almoxarifado_destino}</TableCell>
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
          count={historico.length}
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
        {selectedItem?.status === 'Aberta' && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon><Edit size={20} /></ListItemIcon>
            Editar
          </MenuItem>
        )}
        {selectedItem?.status === 'Aberta' && (
          <MenuItem onClick={handleFinalizar} sx={{ color: 'success.main' }}>
            <ListItemIcon sx={{ color: 'success.main' }}><CheckCircle size={20} /></ListItemIcon>
            Finalizar
          </MenuItem>
        )}
        {(selectedItem?.status === 'Aberta' || selectedItem?.status === 'Finalizada') && (
            <MenuItem onClick={handleCancelar} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}><Trash2 size={20} /></ListItemIcon>
            {selectedItem?.status === 'Finalizada' ? 'Estornar' : 'Cancelar'}
            </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

TransferenciaList.propTypes = {
  historico: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onFinalizar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};