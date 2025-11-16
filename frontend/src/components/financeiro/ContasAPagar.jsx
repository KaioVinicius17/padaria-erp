import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContasAPagarList from './ContasAPagarList';
import BaixaPagamentoModal from './BaixaPagamentoModal';
import LancamentoAvulsoForm from './LancamentoAvulsoForm';
import EstornoConfirmacaoModal from '../components/financeiro/EstornoConfirmacaoModal';

export default function ContasAPagar() {
  const [contas, setContas] = useState([]);
  const [isBaixaModalOpen, setIsBaixaModalOpen] = useState(false);
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState(null);
  
  // Estados para o formulário de lançamento avulso
  const [isAvulsoFormOpen, setIsAvulsoFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lancamentoParaEditar, setLancamentoParaEditar] = useState(null);

  // 2. ESTADOS PARA O MODAL DE ESTORNO
  const [isEstornoModalOpen, setIsEstornoModalOpen] = useState(false);
  const [lancamentoParaEstornar, setLancamentoParaEstornar] = useState(null);

  const fetchContas = async () => {
    try {
      const response = await axios.get('http://localhost:3007/lancamentos/pagar');
      setContas(response.data);
    } catch (error) {
      console.error("Erro ao buscar contas a pagar:", error);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const handleOpenEditModal = (conta) => {
    setLancamentoParaEditar(conta);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setLancamentoParaEditar(null);
    setIsEditModalOpen(false);
  };
  
  const handleSaveEdit = () => {
    handleCloseEditModal();
    fetchContas(); // Atualiza a lista após salvar
  };

  const handleOpenBaixaModal = (conta) => {
    setLancamentoSelecionado(conta);
    setIsBaixaModalOpen(true);
  };

  const handleCloseBaixaModal = () => {
    setLancamentoSelecionado(null);
    setIsBaixaModalOpen(false);
  };
  
  const handleSaveBaixa = () => {
    handleCloseBaixaModal();
    fetchContas(); // Atualiza a lista
  };

  // Funções para controlar o novo formulário
  const handleOpenAvulsoForm = () => {
    setIsAvulsoFormOpen(true);
  };

  const handleCloseAvulsoForm = () => {
    setIsAvulsoFormOpen(false);
  };

  const handleSaveAvulso = () => {
    handleCloseAvulsoForm();
    fetchContas(); // Atualiza a lista após salvar
  };

  // 3. HANDLERS PARA O MODAL DE ESTORNO
  const handleOpenEstornoModal = (conta) => {
    setLancamentoParaEstornar(conta);
    setIsEstornoModalOpen(true);
  };

  const handleCloseEstornoModal = () => {
    setLancamentoParaEstornar(null);
    setIsEstornoModalOpen(false);
  };

  const handleEstornoSuccess = () => {
    handleCloseEstornoModal();
    fetchContas(); // Atualiza a lista
  };

  return (
    <Box>
      <BaixaPagamentoModal
        open={isBaixaModalOpen}
        onClose={handleCloseBaixaModal}
        onSaveSuccess={handleSaveBaixa}
        lancamento={lancamentoSelecionado}
      />
      
      <LancamentoAvulsoForm
        open={isAvulsoFormOpen}
        onClose={handleCloseAvulsoForm}
        onSaveSuccess={handleSaveAvulso}
      />

      <EstornoConfirmacaoModal
        open={isEstornoModalOpen}
        onClose={handleCloseEstornoModal}
        onConfirmSuccess={handleEstornoSuccess}
        lancamento={lancamentoParaEstornar}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Gerenciar Contas a Pagar
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAvulsoForm}>
          Lançar Despesa Avulsa
        </Button>
      </Box>
      
      <ContasAPagarList 
        contas={contas}
        onMarcarComoPago={handleOpenBaixaModal}
        onEditarLancamento={handleOpenEditModal}
        onEstornarLancamento={handleOpenEstornoModal} // 5. PASSAR A NOVA PROP
      />
    </Box>
  );
}
