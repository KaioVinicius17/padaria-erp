import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OrdemProducaoForm from './OrdemProducaoForm';
import OrdemProducaoList from './OrdemProducaoList';
import OrdemProducaoDetalhesModal from './OrdemProducaoDetalhesModal';
import ConfirmationDialog from '../common/ConfirmationDialog';

export default function OrdensProducao() {
  const [ordens, setOrdens] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [ordemToConclude, setOrdemToConclude] = useState(null);

  const fetchOrdensProducao = async () => {
    try {
      const response = await axios.get('http://localhost:3005/ordens-producao');
      setOrdens(response.data);
    } catch (error) {
      console.error("Erro ao buscar ordens de produção:", error);
    }
  };

  useEffect(() => {
    fetchOrdensProducao();
  }, []);

  const handleSaveSuccess = () => {
    setIsFormOpen(false);
    fetchOrdensProducao();
  };

  const handleViewDetails = (ordem) => {
    setSelectedOrdem(ordem);
    setIsDetailsOpen(true);
  };

  const handleOpenConcludeDialog = (id) => {
    setOrdemToConclude(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmConclude = async () => {
    try {
      await axios.patch(`http://localhost:3005/ordens-producao/${ordemToConclude}/concluir`);
      fetchOrdensProducao();
    } catch (error) {
      console.error("Erro ao concluir ordem:", error);
    } finally {
      setIsConfirmOpen(false);
      setOrdemToConclude(null);
    }
  };

  return (
    <Box>
      <OrdemProducaoForm 
        open={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSaveSuccess={handleSaveSuccess}
      />
      <OrdemProducaoDetalhesModal
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        ordem={selectedOrdem}
      />
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmConclude}
        title="Concluir Produção"
        message="Tem certeza que deseja concluir esta ordem? Esta ação irá movimentar o estoque e não pode ser desfeita."
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Gerenciar Ordens de Produção
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setIsFormOpen(true)}>
          Nova Ordem de Produção
        </Button>
      </Box>

      <OrdemProducaoList 
        ordens={ordens}
        onView={handleViewDetails}
        onConclude={handleOpenConcludeDialog}
      />
    </Box>
  );
}
