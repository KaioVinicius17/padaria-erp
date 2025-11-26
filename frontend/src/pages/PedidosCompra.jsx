// src/pages/PedidosCompra.jsx
// (ATUALIZADO: Com "Empty State")

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { ClipboardCheck } from 'lucide-react'; // Ícone reutilizado
import PedidoList from '../components/pedidos/PedidoList';
import PedidoForm from '../components/pedidos/PedidoForm'; 
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import PedidoDetails from '../components/pedidos/PedidoDetails';

const PEDIDOS_SERVICE_URL = 'http://localhost:3006';
const PRODUTOS_SERVICE_URL = 'http://localhost:3003';
const FORNECEDORES_SERVICE_URL = 'http://localhost:3001';
const ALMOXARIFADOS_SERVICE_URL = 'http://localhost:3008';

export default function PedidosCompra() {
  const location = useLocation();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pedidoToEdit, setPedidoToEdit] = useState(null);
  const [requisicaoParaConverter, setRequisicaoParaConverter] = useState(location.state?.requisicao || null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [pedidoToView, setPedidoToView] = useState(null);

  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      let pedidosData = [];
      let produtosData = [];
      let fornecedoresData = [];
      let almoxarifadosData = [];

      try {
        const [resProd, resForn, resAlmox] = await Promise.all([
          axios.get(`${PRODUTOS_SERVICE_URL}/produtos/gerenciamento`),
          axios.get(`${FORNECEDORES_SERVICE_URL}/fornecedores`),
          axios.get(`${ALMOXARIFADOS_SERVICE_URL}/almoxarifados`),
        ]);
        produtosData = resProd.data || [];
        fornecedoresData = resForn.data || [];
        almoxarifadosData = resAlmox.data || [];
      } catch (error) {
        console.error("Erro CRÍTICO ao buscar dados para o modal:", error);
        // Não bloqueia a página, mas avisa se necessário
      }

      try {
        const resPed = await axios.get(`${PEDIDOS_SERVICE_URL}/pedidos`);
        pedidosData = resPed.data || [];
      } catch (error) {
        console.error("Erro ao buscar histórico de pedidos:", error);
        pedidosData = [];
      }
      
      setPedidos(pedidosData);
      setProdutos(produtosData);
      setFornecedores(fornecedoresData);
      setAlmoxarifados(almoxarifadosData);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (requisicaoParaConverter) {
      setIsFormOpen(true);
    }
  }, [requisicaoParaConverter]);

  const handleOpenForm = (item = null) => {
    setPedidoToEdit(item);
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setPedidoToEdit(null);
    setIsFormOpen(false);
    if (requisicaoParaConverter) {
        navigate(location.pathname, { replace: true }); 
        setRequisicaoParaConverter(null);
    }
  };
  const handleSaveRascunho = () => {
    fetchData(); 
  };
  const handleSaveSuccess = () => {
    fetchData();
    handleCloseForm();
  };

  const handleOpenDetails = (id) => {
    setPedidoToView(id);
    setIsDetailsOpen(true);
  };
  const handleCloseDetails = () => {
    setPedidoToView(null);
    setIsDetailsOpen(false);
  };

  const openConfirmDialog = (action, payload, title, message) => {
    setConfirmAction(action);
    setConfirmPayload(payload);
    setConfirmTitle(title);
    setConfirmMessage(message);
    setIsConfirmOpen(true);
  };
  
  const handleSend = (id) => {
    openConfirmDialog('enviar', id, 'Marcar como Enviado?', 'O status do pedido mudará para "Enviado".');
  };
  const handleConfirmar = (id) => {
    openConfirmDialog('confirmar', id, 'Confirmar Pedido?', 'O status do pedido mudará para "Confirmado".');
  };
  const handleCancel = (id, status) => {
     openConfirmDialog('cancelar', id, 'Cancelar Pedido?', 'Esta ação não pode ser desfeita.');
  };
  
  const handleCloseDeleteDialog = () => {
    setIsConfirmOpen(false);
  };
  
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    let url = '';
    
    switch (confirmAction) {
      case 'enviar': 
        url = `${PEDIDOS_SERVICE_URL}/pedidos/${confirmPayload}/enviar`; 
        break;
      case 'confirmar': 
        url = `${PEDIDOS_SERVICE_URL}/pedidos/${confirmPayload}/confirmar`; 
        break;
      case 'cancelar': 
        url = `${PEDIDOS_SERVICE_URL}/pedidos/${confirmPayload}/cancelar`; 
        break;
      default: 
        handleCloseDeleteDialog(); 
        return;
    }
    
    try {
      await axios.patch(url);
      fetchData();
    } catch (error) {
      console.error(`Erro ao ${confirmAction} pedido:`, error);
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

    if (pedidos.length === 0) {
      return (
        <Paper 
          sx={{ textAlign: 'center', p: 4, mt: 2, backgroundColor: 'action.hover' }}
          variant="outlined"
        >
          <ClipboardCheck size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhum pedido de compra registrado
          </Typography>
          <Typography color="text.secondary">
            Clique em "Novo Pedido" para iniciar um processo de compra.
          </Typography>
        </Paper>
      );
    }

    return (
      <PedidoList 
          pedidos={pedidos}
          onEdit={handleOpenForm}
          onSend={handleSend}
          onCancel={handleCancel}
          onViewDetails={handleOpenDetails}
          onConfirmar={handleConfirmar}
      />
    );
  };
  // ==========================================================

  return (
    <Box>
      <PedidoForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSaveSuccess={handleSaveSuccess}
        onSaveRascunho={handleSaveRascunho}
        pedidoToEdit={pedidoToEdit}
        requisicaoParaConverter={requisicaoParaConverter}
        produtos={produtos}
        fornecedores={fornecedores}
        almoxarifados={almoxarifados}
      />
      
      <PedidoDetails
        open={isDetailsOpen}
        onClose={handleCloseDetails}
        pedidoId={pedidoToView}
        almoxarifados={almoxarifados} 
        fornecedores={fornecedores}
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
            Pedidos de Compra
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crie e gerencie os pedidos enviados aos fornecedores.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<ClipboardCheck />} onClick={() => handleOpenForm()}>
          Novo Pedido
        </Button>
      </Box>

      {renderContent()}
    </Box>
  );
}