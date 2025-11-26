// src/pages/Almoxarifados.jsx
// (ATUALIZADO: Com "Empty State" quando não há registros)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, CircularProgress,
  TextField, InputAdornment
} from '@mui/material';
import { Plus, Search, Warehouse } from 'lucide-react'; // 1. Importar ícone
import AlmoxarifadoForm from '../components/almoxarifados/AlmoxarifadoForm';
import AlmoxarifadoList from '../components/almoxarifados/AlmoxarifadoList';
import ConfirmationDialog from '../components/common/ConfirmationDialog';

const ALMOXARIFADOS_SERVICE_URL = 'http://localhost:3008';

export default function Almoxarifados() {
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [filteredAlmoxarifados, setFilteredAlmoxarifados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ALMOXARIFADOS_SERVICE_URL}/almoxarifados/gerenciamento`);
      setAlmoxarifados(response.data);
      setFilteredAlmoxarifados(response.data);
    } catch (error) {
      console.error("Erro ao buscar almoxarifados:", error);
      setAlmoxarifados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtro
  useEffect(() => {
    if (!filterText) {
      setFilteredAlmoxarifados(almoxarifados);
      return;
    }
    const lowerCaseFilter = filterText.toLowerCase();
    setFilteredAlmoxarifados(
      (almoxarifados || []).filter((a) => 
        a.nome.toLowerCase().includes(lowerCaseFilter)
      )
    );
  }, [filterText, almoxarifados]);

  const handleOpenModal = (item = null) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setItemToEdit(null);
    setIsModalOpen(false);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchData();
  };
  
  const handleOpenDeleteDialog = (id) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setItemToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
        await axios.delete(`${ALMOXARIFADOS_SERVICE_URL}/almoxarifados/${itemToDelete}`);
        fetchData();
    } catch (error) {
         alert(`Erro ao excluir: ${error.response?.data?.message || error.message}`);
    } finally {
        handleCloseDeleteDialog();
    }
  };

  // ==========================================================
  // 2. FUNÇÃO DE RENDERIZAÇÃO (Lógica do Empty State)
  // ==========================================================
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (almoxarifados.length === 0) {
      return (
        <Paper 
          sx={{ textAlign: 'center', p: 4, mt: 2, backgroundColor: 'action.hover' }}
          variant="outlined"
        >
          <Warehouse size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhum almoxarifado cadastrado
          </Typography>
          <Typography color="text.secondary">
            Clique em "Novo Almoxarifado" para cadastrar o seu primeiro local de estoque.
          </Typography>
        </Paper>
      );
    }

    return (
      <>
        {/* Campo de Busca */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar por nome..."
            InputProps={{
              startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>),
            }}
          />
        </Paper>
        
        {/* Tabela de Locais */}
        <AlmoxarifadoList
          almoxarifados={filteredAlmoxarifados}
          onEdit={handleOpenModal}
          onDelete={handleOpenDeleteDialog}
        />
      </>
    );
  };
  // ==========================================================

  return (
    <Box>
      <AlmoxarifadoForm
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}
        almoxarifadoToEdit={itemToEdit}
      />
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este almoxarifado? Esta ação não pode ser desfeita."
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Cadastro de Almoxarifados
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crie e gerencie os locais de estoque.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenModal()}>
          Novo Almoxarifado
        </Button>
      </Box>

      {/* 3. Renderiza o conteúdo condicional */}
      {renderContent()}
      
    </Box>
  );
}