// src/pages/Almoxarifados.jsx
// (ATUALIZADO: Busca de 'gerenciamento' e passa props corretas)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, CircularProgress,
  TextField, InputAdornment
} from '@mui/material';
import { Plus, Search } from 'lucide-react';
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
      // CORREÇÃO: Busca da rota de gerenciamento
      const response = await axios.get(`${ALMOXARIFADOS_SERVICE_URL}/almoxarifados/gerenciamento`);
      setAlmoxarifados(response.data);
      setFilteredAlmoxarifados(response.data);
    } catch (error) {
      console.error("Erro ao buscar almoxarifados:", error);
      setAlmoxarifados([]); // Garante que é um array
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
      (almoxarifados || []).filter((a) => // "Blinda" o filtro
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


      <Box sx={{ mb: 3 }}>
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
      </Box>
    
      {/* Tabela de Locais */}
      {loading ? (
        <CircularProgress />
      ) : (
        <AlmoxarifadoList
          almoxarifados={filteredAlmoxarifados}
          onEdit={handleOpenModal}
          onDelete={handleOpenDeleteDialog}
        />
      )}
    </Box>
  );
}