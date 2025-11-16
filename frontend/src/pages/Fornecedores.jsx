// src/pages/Fornecedores.jsx
// (ATUALIZADO com novo layout de Tabela, Busca e Empty State)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FornecedorTable from '../components/fornecedores/FornecedorTable'; // <-- USA A NOVA TABELA
import FornecedorForm from '../components/fornecedores/FornecedorForm';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { 
  Box, Typography, Button, TextField, InputAdornment, 
  CircularProgress, Paper 
} from '@mui/material';
import { Plus, Search, Building } from 'lucide-react'; // <-- Ícones

// Defina a porta correta do seu serviço de fornecedores
const FORNECEDORES_SERVICE_URL = 'http://localhost:3001';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [filteredFornecedores, setFilteredFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fornecedorToEdit, setFornecedorToEdit] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState(null);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      // Rota GET agora busca todos (ativos e inativos)
      const response = await axios.get(`${FORNECEDORES_SERVICE_URL}/fornecedores`);
      setFornecedores(response.data);
      setFilteredFornecedores(response.data);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  // Filtro de busca local
  useEffect(() => {
    if (!filterText) {
      setFilteredFornecedores(fornecedores);
      return;
    }
    const lowerCaseFilter = filterText.toLowerCase();
    const filtrados = fornecedores.filter((f) =>
      f.razao_social?.toLowerCase().includes(lowerCaseFilter) ||
      f.nome_fantasia?.toLowerCase().includes(lowerCaseFilter) ||
      f.cnpj?.toLowerCase().includes(lowerCaseFilter)
    );
    setFilteredFornecedores(filtrados);
  }, [filterText, fornecedores]);

  const handleOpenDeleteDialog = (id) => {
    setFornecedorToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setFornecedorToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${FORNECEDORES_SERVICE_URL}/fornecedores/${fornecedorToDelete}`);
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleOpenForm = (fornecedor = null) => {
    setFornecedorToEdit(fornecedor);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFornecedorToEdit(null);
  };

  const handleSaveSuccess = () => {
    fetchFornecedores();
    handleCloseForm();
  };

  // Renderiza a Tabela ou o "Empty State"
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (fornecedores.length === 0) {
      return (
        <Paper 
          sx={{ textAlign: 'center', p: 4, mt: 3, backgroundColor: 'action.hover' }}
          variant="outlined"
        >
          <Building size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhum fornecedor cadastrado
          </Typography>
          <Typography color="text.secondary">
            Clique em "Adicionar Fornecedor" acima para cadastrar um novo registro.
          </Typography>
        </Paper>
      );
    }
    
    return (
      <React.Fragment>
        {/* Barra de Busca */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {/* Renderiza a Tabela */}
        <FornecedorTable
          fornecedores={filteredFornecedores}
          onDelete={handleOpenDeleteDialog}
          onEdit={handleOpenForm}
        />
      </React.Fragment>
    );
  };

  return (
    <Box>
      <FornecedorForm 
        open={isFormOpen} 
        onClose={handleCloseForm}
        onSaveSuccess={handleSaveSuccess}
        fornecedorToEdit={fornecedorToEdit}
      />
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este fornecedor?"
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Fornecedores
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie seus fornecedores e parceiros comerciais.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenForm()}>
          Adicionar Fornecedor
        </Button>
      </Box>

      {renderContent()}
    </Box>
  );
}