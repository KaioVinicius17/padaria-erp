// src/components/compras/PurchaseTable.jsx
// (Nova tabela de gerenciamento de compras com status e colapso)

import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
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
  CircularProgress
} from '@mui/material';
import { 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Archive,
  RotateCcw,
  AlertOctagon,
  FileText
} from 'lucide-react'; 

const COMPRAS_SERVICE_URL = 'http://localhost:3004';

// Define cor e ícone para cada status
const getStatusChip = (status) => {
  switch (status) {
    case 'Aberta':
      return { label: 'Aberta', color: 'info', icon: <FileText size={16} /> };
    case 'Finalizada':
      return { label: 'Finalizada', color: 'success', icon: <CheckCircle size={16} /> };
    case 'Cancelada':
      return { label: 'Cancelada', color: 'error', icon: <XCircle size={16} /> };
    default:
      return { label: status, color: 'default' };
  }
};

const formatCurrency = (value) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
};

// Componente da Linha
function Row(props) {
  const { compra, onEdit, onDelete, onFinalizar, onReabrir } = props;
  const [open, setOpen] = useState(false);
  const [itens, setItens] = useState([]);
  const [isLoadingItens, setIsLoadingItens] = useState(false);

  const statusChip = getStatusChip(compra.status);

  // Busca os itens da compra ao expandir
  const handleToggleCollapse = async () => {
    const newOpenState = !open;
    setOpen(newOpenState);

    if (newOpenState && itens.length === 0) {
      setIsLoadingItens(true);
      try {
        const response = await axios.get(`${COMPRAS_SERVICE_URL}/compras/${compra.id}/itens`);
        setItens(response.data);
      } catch (error) {
        console.error("Erro ao buscar itens da compra:", error);
      } finally {
        setIsLoadingItens(false);
      }
    }
  };

  // --- Menu de Ações (MoreVertical) ---
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEdit = () => { onEdit(compra); handleMenuClose(); };
  const handleDelete = () => { onDelete(compra.id); handleMenuClose(); };
  const handleFinalizar = () => { onFinalizar(compra.id); handleMenuClose(); };
  const handleReabrir = () => { onReabrir(compra.id); handleMenuClose(); };
  
  return (
    <Fragment>
      <TableRow 
        hover
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          opacity: compra.status === 'Cancelada' ? 0.6 : 1,
          backgroundColor: compra.status === 'Cancelada' ? 'action.hover' : 'transparent'
        }}
      >
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={handleToggleCollapse}>
            {open ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{compra.nome_fantasia}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {compra.id}</Typography>
        </TableCell>
        <TableCell>{compra.numero_nota || 'Avulsa'}</TableCell>
        <TableCell>{formatDate(compra.data_emissao)}</TableCell>
        <TableCell>
          <Chip
            icon={statusChip.icon}
            label={statusChip.label}
            color={statusChip.color}
            size="small"
          />
        </TableCell>
        <TableCell align="right">{formatCurrency(compra.valor_total)}</TableCell>
        <TableCell align="center">
          <IconButton aria-label="ações" onClick={handleMenuClick}>
            <MoreVertical size={20} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
            {compra.status === 'Aberta' && (
              <MenuItem onClick={handleFinalizar} sx={{ color: 'success.main' }}>
                <CheckCircle size={16} style={{ marginRight: 8 }} />
                Finalizar Entrada
              </MenuItem>
            )}
            {compra.status === 'Aberta' && (
              <MenuItem onClick={handleEdit}>
                <Edit size={16} style={{ marginRight: 8 }} />
                Editar (WIP)
              </MenuItem>
            )}
            {compra.status === 'Finalizada' && (
              <MenuItem onClick={handleReabrir} sx={{ color: 'info.main' }}>
                <RotateCcw size={16} style={{ marginRight: 8 }} />
                Reabrir (Estornar)
              </MenuItem>
            )}
            {compra.status !== 'Cancelada' && (
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <XCircle size={16} style={{ marginRight: 8 }} />
                Cancelar Compra
              </MenuItem>
            )}
          </Menu>
        </TableCell>
      </TableRow>

      {/* Linha Colapsável com Itens */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Itens da Compra
              </Typography>
              {isLoadingItens ? (
                <CircularProgress size={24} />
              ) : (
                <Table size="small" aria-label="itens da compra">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Qtd.</TableCell>
                      <TableCell align="right">Valor Unit.</TableCell>
                      <TableCell align="right">Total Item</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens.length > 0 ? itens.map((item) => (
                      <TableRow key={item.nome_item}>
                        <TableCell>{item.nome_item}</TableCell>
                        <TableCell align="right">{item.quantidade} {item.unidade_medida}</TableCell>
                        <TableCell align="right">{formatCurrency(item.valor_unitario)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.quantidade * item.valor_unitario)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4}>Nenhum item nesta compra.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

// ... (PropTypes) ...

// Componente da Tabela Principal
export default function PurchaseTable({ compras, onEdit, onDelete, onFinalizar, onReabrir }) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow sx={{ '& > th': { fontWeight: 'bold' } }}>
            <TableCell sx={{ width: '50px' }} /> {/* Colapso */}
            <TableCell>Fornecedor / ID</TableCell>
            <TableCell>Nº da Nota</TableCell>
            <TableCell>Data Entrada</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Valor Total</TableCell>
            <TableCell align="center" sx={{ width: '80px' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {compras.map((compra) => (
            <Row 
              key={compra.id} 
              compra={compra} 
              onEdit={onEdit} 
              onDelete={onDelete}
              onFinalizar={onFinalizar}
              onReabrir={onReabrir}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}