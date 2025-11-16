import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FichaTecnicaForm from './FichaTecnicaForm';
import FichaTecnicaList from './FichaTecnicaList';
import ConfirmationDialog from '../common/ConfirmationDialog'; // Importe o diálogo de confirmação

export default function FichasTecnicas() {
  const [fichas, setFichas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fichaToEdit, setFichaToEdit] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fichaToDelete, setFichaToDelete] = useState(null);

  const fetchFichasTecnicas = async () => {
    try {
      const response = await axios.get('http://localhost:3005/fichas-tecnicas');
      setFichas(response.data);
    } catch (error) {
      console.error("Erro ao buscar fichas técnicas:", error);
    }
  };

  useEffect(() => {
    fetchFichasTecnicas();
  }, []);
  
  const handleOpenForm = (ficha = null) => {
    setFichaToEdit(ficha);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setFichaToEdit(null);
    setIsFormOpen(false);
  };

  const handleSaveSuccess = () => {
    handleCloseForm();
    fetchFichasTecnicas();
  };
  
  const handleOpenDeleteDialog = (id) => {
    setFichaToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setFichaToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
        // Chamada para a API de exclusão agora está ativa
        await axios.delete(`http://localhost:3005/fichas-tecnicas/${fichaToDelete}`);
        fetchFichasTecnicas(); // Atualiza a lista após deletar
    } catch (error) {
        console.error("Erro ao excluir ficha técnica:", error);
    } finally {
        handleCloseDeleteDialog();
    }
  }

  return (
    <Box>
      <FichaTecnicaForm 
        open={isFormOpen} 
        onClose={handleCloseForm} 
        onSaveSuccess={handleSaveSuccess}
        fichaToEdit={fichaToEdit}
      />
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta ficha técnica? Esta ação não pode ser desfeita."
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Gerenciar Fichas Técnicas
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
          Criar Nova Ficha
        </Button>
      </Box>

      <FichaTecnicaList 
        fichas={fichas}
        onEdit={handleOpenForm}
        onDelete={handleOpenDeleteDialog} // Passa a função para abrir o diálogo
      />
    </Box>
  );
}
