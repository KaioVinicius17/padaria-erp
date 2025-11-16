// src/pages/ContasAReceber.jsx (COMPLETO E ATUALIZADO)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// Nossos componentes
import ContasAReceberList from '../components/financeiro/ContasAReceberList';
// IMPORTAÇÃO ATUALIZADA: Usando o novo componente
import ModalLancarReceita from '../components/financeiro/ModalLancarReceita';
import BaixaRecebimentoModal from '../components/financeiro/BaixaRecebimentoModal';

// Componentes REUTILIZADOS
import EditarLancamentoModal from '../components/financeiro/EditarLancamentoModal';
import EstornoConfirmacaoModal from '../components/financeiro/EstornoConfirmacaoModal';

export default function ContasAReceber() {
  const [contas, setContas] = useState([]);
  const [isAvulsoFormOpen, setIsAvulsoFormOpen] = useState(false);
  const [isBaixaModalOpen, setIsBaixaModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEstornoModalOpen, setIsEstornoModalOpen] = useState(false);
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState(null);

  const fetchContas = async () => {
    try {
      const response = await axios.get('http://localhost:3007/lancamentos/receber');
      setContas(response.data);
    } catch (error) {
      console.error("Erro ao buscar contas a receber:", error);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const handleCloseAndRefresh = () => {
    setIsAvulsoFormOpen(false);
    setIsBaixaModalOpen(false);
    setIsEditModalOpen(false);
    setIsEstornoModalOpen(false);
    setLancamentoSelecionado(null);
    fetchContas();
  };

  const handleOpenAvulsoForm = () => {
    setIsAvulsoFormOpen(true);
  };
  
  const handleOpenBaixaModal = (conta) => {
    setLancamentoSelecionado(conta);
    setIsBaixaModalOpen(true);
  };
  
  const handleOpenEditModal = (conta) => {
    setLancamentoSelecionado(conta);
    setIsEditModalOpen(true);
  };
  
  const handleOpenEstornoModal = (conta) => {
    setLancamentoSelecionado(conta);
    setIsEstornoModalOpen(true);
  };

  return (
    <Box>
      {/* ============================================================
        SEÇÃO DE MODAIS
        ============================================================
      */}

      {/* MODAL 1: Lançar Receita Avulsa (O novo componente) */}
      <ModalLancarReceita
        open={isAvulsoFormOpen}
        onClose={() => setIsAvulsoFormOpen(false)} // Apenas fecha
        onSaveSuccess={handleCloseAndRefresh}      // Salva, fecha e atualiza
      />
      
      {/* MODAL 2: Baixa de Recebimento */}
      <BaixaRecebimentoModal
        open={isBaixaModalOpen}
        onClose={() => setIsBaixaModalOpen(false)}
        onSaveSuccess={handleCloseAndRefresh}
        lancamento={lancamentoSelecionado}
      />
      
      {/* MODAL 3: Editar Lançamento (Reutilizado) */}
      <EditarLancamentoModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={handleCloseAndRefresh}
        lancamento={lancamentoSelecionado}
      />
      
      {/* MODAL 4: Estornar Lançamento (Reutilizado) */}
      <EstornoConfirmacaoModal
        open={isEstornoModalOpen}
        onClose={() => setIsEstornoModalOpen(false)}
        onConfirmSuccess={handleCloseAndRefresh}
        lancamento={lancamentoSelecionado}
      />

      {/* ============================================================
        CONTEÚDO DA PÁGINA
        ============================================================
      */}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Contas a Receber
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleOpenAvulsoForm}
        >
          Lançar Receita Avulsa
        </Button>
      </Box>
      
      <ContasAReceberList 
        contas={contas}
        onMarcarComoRecebido={handleOpenBaixaModal}
        onEditarLancamento={handleOpenEditModal}
        onEstornarLancamento={handleOpenEstornoModal}
      />
    </Box>
  );
}