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
  AlertTriangle,
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'; 

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

// ==========================================================
// LÓGICA 2: TAGS DE SITUAÇÃO DE ESTOQUE (Corrigida)
// ==========================================================
const getSituacaoEstoque = (produto, saldoEspecifico = null) => {
  // Se um saldo específico (de um depósito) for passado, use-o.
  // Senão, use o saldo_total do produto.
  const saldo = parseFloat(saldoEspecifico !== null ? saldoEspecifico : produto.saldo_total);
  const min = parseFloat(produto.estoque_minimo) || 0;
  const max = parseFloat(produto.estoque_maximo) || 0;

  // Lógica exata que você pediu:
  if (saldo === 0) {
    return { 
      text: 'Sem estoque', 
      color: 'error', 
      icon: <XCircle size={16} /> 
    };
  }
  if (saldo > 0 && saldo < min) {
    return { 
      text: 'Estoque baixo', 
      color: 'warning', 
      icon: <AlertTriangle size={16} /> 
    };
  }
  // Se max não foi definido (ou é 0), qualquer saldo >= min é "na média"
  if (max === 0 && saldo >= min) {
    return { 
      text: 'Estoque na média', 
      color: 'success', 
      icon: <CheckCircle size={16} /> 
    };
  }
  if (saldo >= min && saldo < max) {
    return { 
      text: 'Estoque na média', 
      color: 'success', 
      icon: <CheckCircle size={16} /> 
    };
  }
  if (saldo >= max) {
    return { 
      text: 'Estoque máximo', 
      color: 'info', // 'info' (azul) como pedido
      icon: <Archive size={16} /> 
    };
  }
  
  // Fallback (ex: saldo negativo, embora não devesse acontecer)
  return { text: 'Indefinido', color: 'default', icon: <XCircle size={16} /> };
};
// ==========================================================


// Função para formatar moeda
const formatCurrency = (value) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Componente da Linha (com lógica de colapso)
function Row(props) {
  const { produto, onEdit, onDelete } = props;
  const [open, setOpen] = useState(false);
  const [depositos, setDepositos] = useState([]);
  const [isLoadingDepositos, setIsLoadingDepositos] = useState(false);

  const situacaoEstoque = getSituacaoEstoque(produto);

  // Busca os saldos por depósito ao expandir
  const handleToggleCollapse = async () => {
    const newOpenState = !open;
    setOpen(newOpenState);

    // Se estiver abrindo e os dados ainda não foram carregados
    if (newOpenState && depositos.length === 0) {
      setIsLoadingDepositos(true);
      try {
        const response = await axios.get(`${PRODUTOS_SERVICE_URL}/produtos/${produto.id}/estoque_almoxarifados`);
        setDepositos(response.data);
      } catch (error) {
        console.error("Erro ao buscar estoque por almoxarifado:", error);
      } finally {
        setIsLoadingDepositos(false);
      }
    }
  };

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
    onEdit(produto);
    handleMenuClose();
  };
  const handleDelete = () => {
    onDelete(produto.id);
    handleMenuClose();
  };
  // --- Fim do Menu de Ações ---

  return (
    <Fragment>
      {/* ==========================================================
          LÓGICA 1: Opacidade para produtos Inativos
          ========================================================== */}
      <TableRow 
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          opacity: produto.status === 'Inativo' ? 0.6 : 1,
          backgroundColor: produto.status === 'Inativo' ? 'action.hover' : 'transparent'
        }}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={handleToggleCollapse}
          >
            {open ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{produto.nome_item}</Typography>
          <Typography variant="caption" color="text.secondary">ID: {produto.id}</Typography>
        </TableCell>
        <TableCell>
          <Chip
            icon={situacaoEstoque.icon}
            label={situacaoEstoque.text}
            color={situacaoEstoque.color}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell align="right">{produto.saldo_total} {produto.unidade_medida}</TableCell>
        <TableCell>
          {/* ==========================================================
              LÓGICA 1: Chip de Status Ativo/Inativo
              ========================================================== */}
          <Chip
            label={produto.status}
            color={produto.status === 'Ativo' ? 'success' : 'default'} // 'default' (cinza) para Inativo
            size="small"
          />
        </TableCell>
        <TableCell align="right">{formatCurrency(produto.preco_venda)}</TableCell>
        <TableCell align="right">{formatCurrency(produto.custo_medio)}</TableCell>
        <TableCell align="center">
          <IconButton
            id={`actions-button-${produto.id}`}
            aria-controls={openMenu ? `actions-menu-${produto.id}` : undefined}
            aria-haspopup="true"
            aria-expanded={openMenu ? 'true' : undefined}
            onClick={handleMenuClick}
          >
            <MoreVertical size={20} />
          </IconButton>
          <Menu
            id={`actions-menu-${produto.id}`}
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': `actions-button-${produto.id}`,
            }}
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

      {/* Linha Colapsável */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Saldo por Depósito
              </Typography>
              {isLoadingDepositos ? (
                <CircularProgress size={24} />
              ) : (
                <Table size="small" aria-label="saldos por depósito">
                  <TableHead>
                    <TableRow>
                      <TableCell>Depósito/Almoxarifado</TableCell>
                      <TableCell>Situação</TableCell>
                      <TableCell align="right">Saldo Atual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {depositos.length > 0 ? depositos.map((deposito) => {
                      const situacaoDeposito = getSituacaoEstoque(
                        produto, // Passa o produto (para min/max)
                        deposito.quantidade // Passa o saldo específico
                      );
                      return (
                        <TableRow key={deposito.nome_almoxarifado}>
                          <TableCell>{deposito.nome_almoxarifado}</TableCell>
                          <TableCell>
                            <Chip
                              icon={situacaoDeposito.icon}
                              label={situacaoDeposito.text}
                              color={situacaoDeposito.color}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">{deposito.quantidade} {produto.unidade_medida}</TableCell>
                        </TableRow>
                      )
                    }) : (
                      <TableRow>
                        <TableCell colSpan={3}>Nenhum saldo encontrado nos depósitos.</TableCell>
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

Row.propTypes = {
  produto: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// Componente da Tabela Principal
export default function ProductTable({ produtos, onEdit, onDelete }) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow sx={{ '& > th': { fontWeight: 'bold' } }}>
            <TableCell sx={{ width: '50px' }} /> {/* Colapso */}
            <TableCell>Produto</TableCell>
            <TableCell>Situação do Estoque</TableCell>
            <TableCell align="right">Saldo Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Valor de Venda</TableCell>
            <TableCell align="right">Custo Médio</TableCell>
            <TableCell align="center" sx={{ width: '80px' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {produtos.map((produto) => (
            <Row key={produto.id} produto={produto} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

ProductTable.propTypes = {
  produtos: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};