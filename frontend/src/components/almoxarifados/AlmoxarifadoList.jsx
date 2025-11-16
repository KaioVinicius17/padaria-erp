// src/components/almoxarifado/AlmoxarifadoList.jsx
// (ATUALIZADO: Com coluna 'Status' e estilo de linha)

import * as React from 'react';
import PropTypes from 'prop-types';
import { 
    Box, Table, TableBody, TableCell, TableContainer, TableHead, 
    TablePagination, TableRow, Paper, IconButton, Menu, MenuItem, 
    ListItemIcon, Chip 
} from '@mui/material';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';

const headCells = [
  { id: 'nome', numeric: false, label: 'Nome' },
  { id: 'descricao', numeric: false, label: 'Descrição' },
  { id: 'status', numeric: false, label: 'Status' },
  { id: 'actions', numeric: true, label: 'Ações' },
];

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

export default function AlmoxarifadoList({ almoxarifados, onEdit, onDelete }) {
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

  const handleDelete = () => {
    onDelete(selectedItem.id);
    handleClose();
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ==========================================================
  // CORREÇÃO: "Blindando" o .slice()
  // ==========================================================
  const visibleRows = React.useMemo(() =>
    (almoxarifados || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [almoxarifados, page, rowsPerPage],
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
                  // ==========================================================
                  // APLICA ESTILO CINZA PARA INATIVOS
                  // ==========================================================
                  sx={{ 
                    opacity: row.status === 'Inativo' ? 0.6 : 1,
                    backgroundColor: row.status === 'Inativo' ? 'action.hover' : 'transparent'
                  }}
                >
                  <TableCell>{row.nome}</TableCell>
                  <TableCell>{row.descricao}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status}
                      color={row.status === 'Ativo' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
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
          count={almoxarifados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
        />
      </Paper>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><Edit size={20} /></ListItemIcon>
          Editar
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><Trash2 size={20} /></ListItemIcon>
          Excluir
        </MenuItem>
      </Menu>
    </Box>
  );
}

AlmoxarifadoList.propTypes = {
  almoxarifados: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};