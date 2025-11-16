// src/pages/ContasAReceber.jsx (Arquivo que você forneceu, agora completo)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// Nossos novos componentes
import ContasAReceberList from '../components/financeiro/ContasAReceberList';
import LancamentoReceitaAvulsaForm from '../components/financeiro/LancamentoReceitaAvulsaForm';
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

  // Handlers unificados para fechar modais e atualizar lista
  const handleCloseAndRefresh = () => {
    setIsAvulsoFormOpen(false);
    setIsBaixaModalOpen(false);
    setIsEditModalOpen(false);
    setIsEstornoModalOpen(false);
    setLancamentoSelecionado(null);
    fetchContas();
  };

  // Handlers para abrir cada modal
  const handleOpenAvulsoForm = () => setIsAvulsoFormOpen(true);
  
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
      {/* Modais */}
      <LancamentoReceitaAvulsaForm
        open={isAvulsoFormOpen}
        onClose={() => setIsAvulsoFormOpen(false)}
        onSaveSuccess={handleCloseAndRefresh}
      />
      <BaixaRecebimentoModal
        open={isBaixaModalOpen}
        onClose={() => setIsBaixaModalOpen(false)}
        onSaveSuccess={handleCloseAndRefresh}
        lancamento={lancamentoSelecionado}
      />
      
      {/* Modais Reutilizados */}
      <EditarLancamentoModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={handleCloseAndRefresh}
        lancamento={lancamentoSelecionado}
      />
      <EstornoConfirmacaoModal
        open={isEstornoModalOpen}
        onClose={() => setIsEstornoModalOpen(false)}
        onConfirmSuccess={handleCloseAndRefresh}
        lancamento={lancamentoSelecionado}
      />

      {/* Conteúdo da Página */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Contas a Receber
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAvulsoForm}>
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