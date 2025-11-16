// src/components/requisicoes/RequisicaoList.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import {
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import AdvancedTable from '../common/AdvancedTable';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
};

// Lógica de Ações (Menu)
const ActionsCell = ({ row, onEdit, onAprovar, onCancelar, onViewDetails }) => {
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

    const handleAprovar = () => {
        onAprovar(row.id);
        handleMenuClose();
    };

    const handleCancelar = () => {
        onCancelar(row.id, row.status);
        handleMenuClose();
    };

    const handleView = () => {
        onViewDetails(row.id);
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
            <MenuItem onClick={handleView}>
                <ListItemIcon><Eye size={20} /></ListItemIcon>
                Visualizar Documento
            </MenuItem>

            {row.status === 'Aberta' && (
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon><Edit size={20} /></ListItemIcon>
                    Editar Itens
                </MenuItem>
            )}
            {row.status === 'Aberta' && (
                <MenuItem onClick={handleAprovar} sx={{ color: 'success.main' }}>
                    <ListItemIcon sx={{ color: 'success.main' }}><CheckCircle size={20} /></ListItemIcon>
                    Aprovar
                </MenuItem>
            )}
            {(row.status === 'Aberta' || row.status === 'Aprovada') && (
                <MenuItem onClick={handleCancelar} sx={{ color: 'error.main' }}>
                    <ListItemIcon sx={{ color: 'error.main' }}><XCircle size={20} /></ListItemIcon>
                    {row.status === 'Aprovada' ? 'Rejeitar' : 'Cancelar'}
                </MenuItem>
            )}
        </Menu>
      </Box>
    );
};

ActionsCell.propTypes = {
    row: PropTypes.object.isRequired,
    onEdit: PropTypes.func.isRequired,
    onAprovar: PropTypes.func.isRequired,
    onCancelar: PropTypes.func.isRequired,
    onViewDetails: PropTypes.func.isRequired,
};

export default function RequisicaoList({ requisicoes, onEdit, onAprovar, onCancelar, onViewDetails, loading }) {

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 90,
      renderCell: (params) => `#${params.value}`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'Aberta' ? 'warning' :
            params.value === 'Aprovada' ? 'success' :
            'default'
          }
          size="small"
        />
      )
    },
    {
      field: 'total_itens',
      headerName: 'Itens',
      type: 'number',
      width: 100,
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'data_criacao',
      headerName: 'Data',
      width: 200,
      valueFormatter: (params) => formatDate(params.value)
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => <ActionsCell
                                row={params.row}
                                onEdit={onEdit}
                                onAprovar={onAprovar}
                                onCancelar={onCancelar}
                                onViewDetails={onViewDetails}
                                />,
    },
  ];

  return (
    <AdvancedTable
      rows={requisicoes}
      columns={columns}
      loading={loading}
    />
  );
}

RequisicaoList.propTypes = {
  requisicoes: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onAprovar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
