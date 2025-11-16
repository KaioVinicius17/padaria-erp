// src/pages/Transferencias.jsx
// (ATUALIZADO: Com o novo fluxo de 2 etapas e a função 'onSaveRascunho')

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { MoveRight } from 'lucide-react';
import TransferenciaList from '../components/almoxarifados/TransferenciaList';
import TransferenciaForm from '../components/almoxarifados/TransferenciaForm'; 
import ConfirmationDialog from '../components/common/ConfirmationDialog'; // (Necessário para as ações)

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';
const ALMOXARIFADOS_SERVICE_URL = 'http://localhost:3008';

export default function Transferencias() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Estados para o novo fluxo ---
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
    try {
      // Separa as chamadas para que o erro 500 não quebre os dropdowns
      
      // 1. Busca os dados para os MODAIS
      try {
        const [resAlmox, resProd] = await Promise.all([
          axios.get(`${ALMOXARIFADOS_SERVICE_URL}/almoxarifados`), // Busca ATIVOS
          axios.get(`${PRODUTOS_SERVICE_URL}/produtos/gerenciamento`)
        ]);
        setAlmoxarifados(Array.isArray(resAlmox.data) ? resAlmox.data : []);
        setProdutos(Array.isArray(resProd.data) ? resProd.data : []);
      } catch (error) {
         console.error("Erro CRÍTICO ao buscar dados para o modal (Almox/Prod):", error);
         setAlmoxarifados([]);
         setProdutos([]);
      }

      // 2. Busca o HISTÓRICO
      try {
        // (A rota GET /transferencias é a do back-end novo que enviei)
        const resHist = await axios.get(`${PRODUTOS_SERVICE_URL}/transferencias`);
        setHistorico(Array.isArray(resHist.data) ? resHist.data : []);
      } catch (error) {
        console.error("Erro ao buscar HISTÓRICO de transferências:", error);
        setHistorico([]); 
      }
      
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setHistorico([]); 
      setAlmoxarifados([]);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
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

  // ==========================================================
  // 1. CORREÇÃO: Função 'handleSaveRascunho' que estava faltando
  // ==========================================================
  // Chamado nas Etapas 1 e 2 (Salvar e Seguir)
  // Apenas atualiza a lista, NÃO fecha o modal.
  const handleSaveRascunho = () => {
    fetchData();
  };

  // Chamado na Etapa 2 (Salvar Final)
  // Atualiza a lista E fecha o modal.
  const handleSaveSuccess = () => {
    fetchData();
    handleCloseModal();
  };
  // ==========================================================


  // --- Lógica de Ações de Status (Finalizar, Cancelar) ---
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
    setConfirmAction(null);
    setConfirmPayload(null);
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


  return (
    <Box>
      {/* ==========================================================
          2. CORREÇÃO: Passando as props corretas para o Form
         ========================================================== */}
      <TransferenciaForm
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}    // Para o botão final "Salvar Itens"
        onSaveRascunho={handleSaveRascunho} // <-- A PROP QUE FALTAVA
        transferenciaToEdit={transferenciaToEdit}
        // Passa os dropdowns para o modal
        almoxarifados={almoxarifados}
        produtos={produtos}
      />
      {/* ========================================================== */}
      
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

      {loading ? (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      ) : (
        <TransferenciaList 
            historico={historico}
            onEdit={handleOpenModal}
            onFinalizar={handleFinalizar}
            onCancelar={handleCancelar}
        />
      )}
    </Box>
  );
}