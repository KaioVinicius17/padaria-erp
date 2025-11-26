// src/pages/Transferencias.jsx
// (ATUALIZADO: Com "Empty State" quando não há transferências)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { MoveRight, ArrowRightLeft } from 'lucide-react';
import TransferenciaList from '../components/almoxarifados/TransferenciaList';
import TransferenciaForm from '../components/almoxarifados/TransferenciaForm'; 
import ConfirmationDialog from '../components/common/ConfirmationDialog';

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';
const ALMOXARIFADOS_SERVICE_URL = 'http://localhost:3008';

export default function Transferencias() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferenciaToEdit, setTransferenciaToEdit] = useState(null);
  
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [produtos, setProdutos] = useState([]);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Busca os dados para os MODAIS
    try {
      const [resAlmox, resProd] = await Promise.all([
        axios.get(`${ALMOXARIFADOS_SERVICE_URL}/almoxarifados`), 
        axios.get(`${PRODUTOS_SERVICE_URL}/produtos/gerenciamento`)
      ]);
      
      setAlmoxarifados(Array.isArray(resAlmox.data) ? resAlmox.data : []);
      setProdutos(Array.isArray(resProd.data) ? resProd.data : []);
    } catch (error) {
       console.error("Erro CRÍTICO ao buscar dados para o modal:", error);
       setAlmoxarifados([]);
       setProdutos([]);
    }

    // 2. Busca o HISTÓRICO
    try {
      const resHist = await axios.get(`${PRODUTOS_SERVICE_URL}/transferencias`);
      setHistorico(Array.isArray(resHist.data) ? resHist.data : []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      setHistorico([]); 
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    setTransferenciaToEdit(item);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setTransferenciaToEdit(null);
    setIsModalOpen(false);
  };

  const handleSaveRascunho = () => {
    fetchData(); 
  };
  const handleSaveSuccess = () => {
    fetchData();
    handleCloseModal();
  };

  // --- Lógica de Ações ---
  const openConfirmDialog = (action, payload, title, message) => {
    setConfirmAction(action);
    setConfirmPayload(payload);
    setConfirmTitle(title);
    setConfirmMessage(message);
    setIsConfirmOpen(true);
  };
  const handleFinalizar = (id) => {
    openConfirmDialog('finalizar', id, 'Finalizar Transferência?', 'Esta ação irá movimentar o estoque. Esta ação não pode ser desfeita.');
  };
  const handleCancelar = (id, status) => {
      if (status === 'Aberta') {
         openConfirmDialog('cancelar', id, 'Cancelar Transferência?', 'O rascunho será excluído.');
      } else {
         openConfirmDialog('cancelar', id, 'Estornar Transferência?', 'Esta ação irá estornar o estoque (devolver os itens à origem).');
      }
  };
  
  const handleCloseDeleteDialog = () => {
    setIsConfirmOpen(false);
  };
  
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    let url = '';
    
    switch (confirmAction) {
      case 'finalizar': 
        url = `${PRODUTOS_SERVICE_URL}/transferencias/${confirmPayload}/finalizar`; 
        break;
      case 'cancelar': 
        url = `${PRODUTOS_SERVICE_URL}/transferencias/${confirmPayload}/cancelar`; 
        break;
      default: 
        handleCloseDeleteDialog(); 
        return;
    }
    
    try {
      await axios.patch(url);
      fetchData();
    } catch (error) {
      console.error(`Erro ao ${confirmAction} transferência:`, error);
      alert(`Erro: ${error.response?.data?.message || error.message}`);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // ==========================================================
  // FUNÇÃO DE RENDERIZAÇÃO DO CONTEÚDO (Empty State)
  // ==========================================================
  const renderContent = () => {
    if (loading) {
      return (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Paper>
      );
    }

    if (historico.length === 0) {
      return (
        <Paper 
          sx={{ textAlign: 'center', p: 4, mt: 2, backgroundColor: 'action.hover' }}
          variant="outlined"
        >
          <ArrowRightLeft size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhuma transferência registrada
          </Typography>
          <Typography color="text.secondary">
            Clique em "Nova Transferência" para movimentar itens entre almoxarifados.
          </Typography>
        </Paper>
      );
    }

    return (
      <TransferenciaList 
          historico={historico}
          onEdit={handleOpenModal}
          onFinalizar={handleFinalizar}
          onCancelar={handleCancelar}
      />
    );
  };
  // ==========================================================

  return (
    <Box>
      <TransferenciaForm
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}
        onSaveRascunho={handleSaveRascunho}
        transferenciaToEdit={transferenciaToEdit}
        almoxarifados={almoxarifados}
        produtos={produtos}
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
            Transferências de Estoque
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crie, edite e finalize movimentações de estoque entre almoxarifados.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<MoveRight />} onClick={() => handleOpenModal()}>
          Nova Transferência
        </Button>
      </Box>

      {renderContent()}
      
    </Box>
  );
}