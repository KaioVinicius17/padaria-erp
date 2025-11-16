// src/components/produtos/CategoriaTable.jsx
// (CORRIGIDO: Linha separadora da tabela restaurada)

import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  Typography 
} from '@mui/material';
import { MoreVertical, Edit, Trash2 } from 'lucide-react'; 

function Row(props) {
  const { categoria, onEdit, onDelete } = props;

  // --- Menu de Ações (MoreVertical) ---
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleEdit = () => {
    onEdit(categoria);
    handleMenuClose();
  };
  const handleDelete = () => {
    onDelete(categoria.id);
    handleMenuClose();
  };
  // --- Fim do Menu de Ações ---

  return (
    <Fragment>
      {/* ==========================================================
          CORREÇÃO AQUI: Removido '& > *': { borderBottom: 'unset' }
          ========================================================== */}
      <TableRow 
        hover
        sx={{ 
          opacity: categoria.status === 'Inativo' ? 0.6 : 1,
        }}
      >
        <TableCell component="th" scope="row">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{categoria.nome}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {categoria.id}</Typography>
        </TableCell>

        <TableCell>
          <Chip
            label={categoria.status}
            color={categoria.status === 'Ativo' ? 'success' : 'default'}
            size="small"
          />
        </TableCell>
        <TableCell align="right">{categoria.produtos_vinculados}</TableCell>
        <TableCell align="center">
          <IconButton
            aria-label="ações"
            onClick={handleMenuClick}
          >
            <MoreVertical size={20} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEdit}>
              <Edit size={16} style={{ marginRight: 8 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Trash2 size={16} style={{ marginRight: 8 }} />
              Excluir
            </MenuItem>
          </Menu>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

Row.propTypes = {
  categoria: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// Componente da Tabela Principal
export default function CategoriaTable({ categorias, onEdit, onDelete }) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="tabela de categorias">
        <TableHead>
          <TableRow sx={{ '& > th': { fontWeight: 'bold' } }}>
            <TableCell>Nome</TableCell>
            <TableCell sx={{ width: '120px' }}>Status</TableCell>
            <TableCell align="right" sx={{ width: '200px' }}>Produtos Vinculados</TableCell>
            <TableCell align="center" sx={{ width: '80px' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categorias.map((cat) => (
            <Row key={cat.id} categoria={cat} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

CategoriaTable.propTypes = {
  categorias: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};