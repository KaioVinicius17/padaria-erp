// src/pages/Requisicoes.jsx
// (ATUALIZADO: Com "Empty State")

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { FileText } from 'lucide-react'; // Ícone reutilizado
import RequisicaoList from '../components/requisicoes/RequisicaoList';
import RequisicaoForm from '../components/requisicoes/RequisicaoForm'; 
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import RequisicaoDetails from '../components/requisicoes/RequisicaoDetails';

const REQUISICOES_SERVICE_URL = 'http://localhost:3005';
const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

export default function Requisicoes() {
  const [requisicoes, setRequisicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [requisicaoToEdit, setRequisicaoToEdit] = useState(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [requisicaoToView, setRequisicaoToView] = useState(null);

  const [produtos, setProdutos] = useState([]);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resReq, resProd] = await Promise.all([
        axios.get(`${REQUISICOES_SERVICE_URL}/requisicoes`),
        axios.get(`${PRODUTOS_SERVICE_URL}/produtos/gerenciamento`)
      ]);
      
      setRequisicoes(resReq.data);
      setProdutos(resProd.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setRequisicoes([]); 
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (item = null) => {
    setRequisicaoToEdit(item);
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setRequisicaoToEdit(null);
    setIsFormOpen(false);
  };
  const handleSaveRascunho = () => {
    fetchData(); 
  };
  const handleSaveSuccess = () => {
    fetchData();
    handleCloseForm();
  };

  const handleOpenDetails = (id) => {
    setRequisicaoToView(id);
    setIsDetailsOpen(true);
  };
  const handleCloseDetails = () => {
    setRequisicaoToView(null);
    setIsDetailsOpen(false);
  };

  const openConfirmDialog = (action, payload, title, message) => {
    setConfirmAction(action);
    setConfirmPayload(payload);
    setConfirmTitle(title);
    setConfirmMessage(message);
    setIsConfirmOpen(true);
  };
  const handleAprovar = (id) => {
    openConfirmDialog('aprovar', id, 'Aprovar Requisição?', 'Esta ação libera a requisição para se tornar um Pedido de Compra.');
  };
  const handleCancelar = (id, status) => {
      if (status === 'Aberta') {
         openConfirmDialog('cancelar', id, 'Cancelar Requisição?', 'O rascunho será excluído (marcado como cancelado).');
      } else {
         openConfirmDialog('cancelar', id, 'Rejeitar Requisição?', 'A requisição aprovada será marcada como "Cancelada".');
      }
  };
  
  const handleCloseDeleteDialog = () => {
    setIsConfirmOpen(false);
  };
  
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    let url = '';
    
    switch (confirmAction) {
      case 'aprovar': 
        url = `${REQUISICOES_SERVICE_URL}/requisicoes/${confirmPayload}/aprovar`; 
        break;
      case 'cancelar': 
        url = `${REQUISICOES_SERVICE_URL}/requisicoes/${confirmPayload}/cancelar`; 
        break;
      default: 
        handleCloseDeleteDialog(); 
        return;
    }
    
    try {
      await axios.patch(url);
      fetchData();
    } catch (error) {
      console.error(`Erro ao ${confirmAction} requisição:`, error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // ==========================================================
  // FUNÇÃO DE RENDERIZAÇÃO (Empty State)
  // ==========================================================
  const renderContent = () => {
    if (loading) {
      return (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Paper>
      );
    }

    if (requisicoes.length === 0) {
      return (
        <Paper 
          sx={{ textAlign: 'center', p: 4, mt: 2, backgroundColor: 'action.hover' }}
          variant="outlined"
        >
          <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhuma requisição encontrada
          </Typography>
          <Typography color="text.secondary">
            Clique em "Nova Requisição" para solicitar materiais.
          </Typography>
        </Paper>
      );
    }

    return (
      <RequisicaoList 
          requisicoes={requisicoes}
          onEdit={handleOpenForm}
          onAprovar={handleAprovar}
          onCancelar={handleCancelar}
          onViewDetails={handleOpenDetails}
      />
    );
  };
  // ==========================================================

  return (
    <Box>
      <RequisicaoForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSaveSuccess={handleSaveSuccess}
        onSaveRascunho={handleSaveRascunho}
        requisicaoToEdit={requisicaoToEdit}
        produtos={produtos}
      />
      
      <RequisicaoDetails
        open={isDetailsOpen}
        onClose={handleCloseDetails}
        requisicaoId={requisicaoToView}
      />

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmAction}
        title={confirmTitle}
        message={confirmMessage}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Requisições de Compra
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Solicite itens ao setor de compras e acompanhe a aprovação.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<FileText />} onClick={() => handleOpenForm()}>
          Nova Requisição
        </Button>
      </Box>

      {renderContent()}
    </Box>
  );
}