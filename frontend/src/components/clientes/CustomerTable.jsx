// src/components/clientes/CustomerTable.jsx
// (ATUALIZADO com lógica de Chip mais robusta)

import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Chip,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Edit, 
  Trash2,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'; 

// Componente da Linha
function Row(props) {
  const { cliente, onEdit, onDelete } = props;
  const [open, setOpen] = useState(false); // Estado do colapso

  // --- Menu de Ações ---
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleEdit = () => {
    onEdit(cliente);
    handleMenuClose();
  };
  const handleDelete = () => {
    onDelete(cliente.id);
    handleMenuClose();
  };
  // --- Fim do Menu ---

  const formatAddress = (c) => {
    if (!c.logradouro && !c.cidade && !c.cep) return 'Nenhum endereço cadastrado.';
    return `${c.logradouro || ''}, ${c.numero || 's/n'} - ${c.bairro || ''}. ${c.cidade || ''} - ${c.estado || ''}. CEP: ${c.cep || ''}`;
  };

  // ==========================================================
  // LÓGICA DO CHIP CORRIGIDA
  // ==========================================================
  const statusLabel = cliente.status || 'Indefinido'; // Trata valor NULL
  const statusColor = cliente.status === 'Ativo' ? 'success' : 'default';
  // ==========================================================

  return (
    <Fragment>
      <TableRow 
        hover
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          opacity: cliente.status === 'Inativo' ? 0.6 : 1,
          backgroundColor: cliente.status === 'Inativo' ? 'action.hover' : 'transparent'
        }}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{cliente.nome_completo}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {cliente.id}</Typography>
        </TableCell>
        <TableCell>{cliente.telefone || 'N/A'}</TableCell>
        <TableCell>{cliente.email || 'N/A'}</TableCell>
        <TableCell>
          <Chip
            label={statusLabel}
            color={statusColor}
            size="small"
          />
        </TableCell>
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

      {/* Linha Colapsável com Endereço */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Informações de Contato e Endereço
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><MapPin size={20} /></ListItemIcon>
                  <ListItemText primary="Endereço" secondary={formatAddress(cliente)} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Phone size={20} /></ListItemIcon>
                  <ListItemText primary="Telefone" secondary={cliente.telefone || 'Nenhum'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Mail size={20} /></ListItemIcon>
                  <ListItemText primary="Email" secondary={cliente.email || 'Nenhum'} />
                </ListItem>
              </List>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

Row.propTypes = {
  cliente: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// Componente da Tabela Principal
export default function CustomerTable({ clientes, onEdit, onDelete }) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow sx={{ '& > th': { fontWeight: 'bold' } }}>
            <TableCell sx={{ width: '50px' }} /> {/* Colapso */}
            <TableCell>Nome / ID</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center" sx={{ width: '80px' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clientes.map((cliente) => (
            <Row key={cliente.id} cliente={cliente} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

CustomerTable.propTypes = {
  clientes: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};