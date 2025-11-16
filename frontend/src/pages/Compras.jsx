// src/pages/Compras.jsx
// (ATUALIZADO com o novo botão "Entrada via XML")

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PurchaseTable from '../components/compras/PurchaseTable';
import PurchaseForm from '../components/compras/PurchaseForm';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
// 1. IMPORTAR O NOVO MODAL (que vamos criar no Passo 2)
import ImportXmlModal from '../components/compras/ImportXmlModal'; 
import ProductForm from '../components/produtos/ProductForm';
import { 
  Box, Typography, Button, TextField, InputAdornment, 
  CircularProgress, Paper, ButtonGroup // 2. Importar ButtonGroup
} from '@mui/material';
import { Plus, Search, ShoppingCart, Upload } from 'lucide-react'; // 3. Importar ícone Upload

const COMPRAS_SERVICE_URL = 'http://localhost:3004';

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [filteredCompras, setFilteredCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false); // Modal Manual
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false); // 4. Estado para o novo modal
  const [compraToEdit, setCompraToEdit] = useState(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchCompras = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${COMPRAS_SERVICE_URL}/compras`);
      setCompras(response.data);
      setFilteredCompras(response.data);
    } catch (error) {
      console.error("Erro ao buscar compras:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  // Filtro de busca local
  useEffect(() => {
    if (!filterText) {
      setFilteredCompras(compras);
      return;
    }
    const lowerCaseFilter = filterText.toLowerCase();
    const filtrados = compras.filter((c) =>
      c.nome_fantasia?.toLowerCase().includes(lowerCaseFilter) ||
      (c.numero_nota && c.numero_nota.toLowerCase().includes(lowerCaseFilter))
    );
    setFilteredCompras(filtrados);
  }, [filterText, compras]);

  // --- Handlers para o Formulário MANUAL ---
  const handleOpenForm = (compra = null) => {
    setCompraToEdit(compra);
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCompraToEdit(null);
  };

  // --- 5. Handlers para o Formulário XML ---
  const handleOpenXmlModal = () => {
    setIsXmlModalOpen(true);
  };
  const handleCloseXmlModal = () => {
    setIsXmlModalOpen(false);
  };

  // Esta função será chamada pelo modal XML
  // Ela recebe os dados PRÉ-PREENCHIDOS do XML e abre o formulário manual
  const handleXmlDataParsed = (dadosDaCompra) => {
    handleCloseXmlModal();
    setCompraToEdit(dadosDaCompra); // Pré-preenche o formulário
    setIsFormOpen(true); // Abre o formulário de 3 etapas
  };

  // ==========================================================
  // CORREÇÃO: Lógica de salvamento dividida
  // ==========================================================

  // 1. Chamado no "Salvar e Seguir" (Etapas 1 e 2)
  //    APENAS atualiza a tabela, NÃO fecha o modal.
  const handleRascunhoSuccess = () => {
    fetchCompras();
  };

  // 2. Chamado no "Salvar" final (Etapa 3)
  //    Atualiza a tabela E fecha o modal.
  const handleFormSuccess = () => {
    fetchCompras();
    handleCloseForm();
  };
  // ==========================================================

  // --- Lógica de Ações de Status (Finalizar, Cancelar, Reabrir) ---
  const openConfirmDialog = (action, payload, title, message) => {
    setConfirmAction(action);
    setConfirmPayload(payload);
    setConfirmTitle(title);
    setConfirmMessage(message);
    setIsConfirmOpen(true);
  };
  const handleFinalizar = (compraId) => {
    openConfirmDialog('finalizar', compraId, 'Finalizar Entrada?', 'Esta ação dará entrada no estoque e lançará os pagamentos no financeiro. Deseja continuar?');
  };
  const handleCancelar = (compraId) => {
    openConfirmDialog('cancelar', compraId, 'Cancelar Compra?', 'Esta ação mudará o status para "Cancelada" e estornará o estoque/financeiro (se já tiver sido finalizada). Deseja continuar?');
  };
  const handleReabrir = (compraId) => {
    openConfirmDialog('reabrir', compraId, 'Reabrir Compra?', 'Esta ação estornará o estoque e o financeiro (se finalizada), e voltará a compra para o status "Aberta". Deseja continuar?');
  };
  const handleCloseDeleteDialog = () => {
    setIsConfirmOpen(false);
    // ... (resetar states)
  };
  const handleConfirmDelete = async () => {
    if (!confirmAction) return;
    let url = '';
    switch (confirmAction) {
      case 'finalizar': url = `${COMPRAS_SERVICE_URL}/compras/${confirmPayload}/finalizar`; break;
      case 'cancelar': url = `${COMPRAS_SERVICE_URL}/compras/${confirmPayload}/cancelar`; break;
      case 'reabrir': url = `${COMPRAS_SERVICE_URL}/compras/${confirmPayload}/reabrir`; break;
      default: handleCloseDeleteDialog(); return;
    }
    try {
      await axios.patch(url);
      fetchCompras();
    } catch (error) {
      console.error(`Erro ao ${confirmAction} compra:`, error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // Renderiza a Tabela ou o "Empty State"
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (compras.length === 0) {
      return (
        <Paper 
          sx={{ textAlign: 'center', p: 4, mt: 3, backgroundColor: 'action.hover' }}
          variant="outlined"
        >
          <ShoppingCart size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhuma compra registrada
          </Typography>
          <Typography color="text.secondary">
            Clique em "Registrar Nova Compra" ou "Entrada via XML" para dar entrada em uma nota.
          </Typography>
        </Paper>
      );
    }
    return (
      <React.Fragment>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar por Fornecedor ou Nº da Nota..."
            InputProps={{
              startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>),
            }}
          />
        </Box>
        <PurchaseTable
          compras={filteredCompras}
          onDelete={handleCancelar}
          onEdit={handleOpenForm} // Ação de Edição agora usa o formulário
          onFinalizar={handleFinalizar}
          onReabrir={handleReabrir}
        />
      </React.Fragment>
    );
  };

  return (
    <Box>
      {/* Modal 1: Formulário Manual (3 etapas) */}
      <PurchaseForm 
        open={isFormOpen} 
        onClose={handleCloseForm} 
        onSaveSuccess={handleFormSuccess}    // Salva e Fecha
        onSaveRascunho={handleRascunhoSuccess} // Apenas Salva
        purchaseToEdit={compraToEdit}
      />
      {/* 6. Modal 2: Upload de XML */}
      <ImportXmlModal
        open={isXmlModalOpen}
        onClose={handleCloseXmlModal}
        onSuccess={handleXmlDataParsed} // Quando o XML for lido
      />
      
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title={confirmTitle}
        message={confirmMessage}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Gestão de Compras
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie a entrada de notas fiscais e lançamentos de compra.
          </Typography>
        </Box>
        
        {/* ==========================================================
            7. BOTÕES ATUALIZADOS (Dois botões)
           ========================================================== */}
        <ButtonGroup variant="contained" aria-label="Grupo de botões de registro">
          <Button 
            startIcon={<Upload />}
            onClick={handleOpenXmlModal}
          >
            Entrada via XML
          </Button>
          <Button 
            startIcon={<Plus />}
            onClick={() => handleOpenForm()}
          >
            Registrar Nova Compra (Manual)
          </Button>
        </ButtonGroup>
        {/* ========================================================== */}
        {/* ==========================================================
          ADICIONE ESTE MODAL AQUI
          (Ele será controlado de dentro do PurchaseForm)
         ========================================================== */}
        <ProductForm 
          open={false} // O PurchaseForm controlará isso
          onClose={() => {}}
          onSaveSuccess={() => {}}
        />

      </Box>

      {renderContent()}
    </Box>
  );
}