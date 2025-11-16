// src/components/fornecedores/FornecedorTable.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  IconButton,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  MoreVertical, 
  Edit, 
  Trash2
} from 'lucide-react';
import AdvancedTable from '../common/AdvancedTable'; // Importa a nova tabela

// Lógica de Ações (Menu)
const ActionsCell = ({ row, onEdit, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const handleMenuClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const handleEdit = () => {
      onEdit(row);
      handleMenuClose();
    };

    const handleDelete = () => {
      onDelete(row.id);
      handleMenuClose();
    };

    return (
      <Box>
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
      </Box>
    );
};

ActionsCell.propTypes = {
    row: PropTypes.object.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

// Componente da Tabela Principal
export default function FornecedorTable({ fornecedores, onEdit, onDelete, loading }) {

  const columns = [
    {
      field: 'razao_social',
      headerName: 'Razão Social',
      flex: 1, // Cresce para preencher o espaço
      minWidth: 200
    },
    {
      field: 'telefone',
      headerName: 'Telefone',
      width: 150
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const statusLabel = params.value || 'Indefinido';
        const statusColor = params.value === 'Ativo' ? 'success' : 'default';
        return <Chip label={statusLabel} color={statusColor} size="small" />;
      }
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => <ActionsCell row={params.row} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];

  return (
    <AdvancedTable
      rows={fornecedores}
      columns={columns}
      loading={loading}
    />
  );
}

FornecedorTable.propTypes = {
  fornecedores: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
