// src/pages/Categorias.jsx
// (ATUALIZADO com "Empty State" quando não há categorias)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Button, TextField, InputAdornment, 
  CircularProgress,
  Paper // 1. Importar Paper
} from '@mui/material';
import { Plus, Search, LayoutGrid } from 'lucide-react'; // 2. Importar Inbox
import CategoriaForm from '../components/produtos/CategoriaForm';
import CategoriaTable from '../components/produtos/CategoriaTable'; 
import ConfirmationDialog from '../components/common/ConfirmationDialog';

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [filteredCategorias, setFilteredCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState(null);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${PRODUTOS_SERVICE_URL}/categorias`);
      setCategorias(response.data);
      setFilteredCategorias(response.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  // Filtro de busca local
  useEffect(() => {
    if (!filterText) {
      setFilteredCategorias(categorias);
      return;
    }
    const lowerCaseFilter = filterText.toLowerCase();
    const filtrados = categorias.filter((cat) =>
      cat.nome.toLowerCase().includes(lowerCaseFilter)
    );
    setFilteredCategorias(filtrados);
  }, [filterText, categorias]);

  const handleOpenForm = (categoria = null) => {
    setCategoriaToEdit(categoria);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCategoriaToEdit(null);
  };

  const handleSaveSuccess = () => {
    fetchCategorias();
    handleCloseForm();
  };

  const handleOpenDeleteDialog = (id) => {
    setCategoriaToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setCategoriaToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${PRODUTOS_SERVICE_URL}/categorias/${categoriaToDelete}`);
      fetchCategorias();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // 3. Função para renderizar o conteúdo (Tabela ou Vazio)
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (categorias.length === 0) {
      // ==========================================================
      // LÓGICA DO "EMPTY STATE" (Quando não há categorias)
      // ==========================================================
      return (
        <Paper 
          sx={{ 
            textAlign: 'center', 
            p: 4, 
            mt: 3, 
            backgroundColor: 'action.hover' 
          }}
          variant="outlined"
        >
          <LayoutGrid size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhuma categoria cadastrada
          </Typography>
          <Typography color="text.secondary">
            Clique em "Nova Categoria" acima para cadastrar um novo registro.
          </Typography>
        </Paper>
      );
    }
    
    // ==========================================================
    // LÓGICA PADRÃO (Quando HÁ categorias)
    // ==========================================================
    return (
      <React.Fragment>
        {/* Barra de Busca */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Buscar categoria por nome..."
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
        <CategoriaTable
          categorias={filteredCategorias}
          onDelete={handleOpenDeleteDialog}
          onEdit={handleOpenForm}
        />
      </React.Fragment>
    );
  };

  return (
    <Box>
      <CategoriaForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSaveSuccess={handleSaveSuccess}
        categoriaToEdit={categoriaToEdit}
      />
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta categoria? Os produtos vinculados a ela não serão excluídos, apenas desvinculados."
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Categorias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crie e organize as categorias para seus produtos, matérias-primas e itens de revenda.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenForm()}>
          Nova Categoria
        </Button>
      </Box>

      {/* 4. Renderiza o conteúdo (Tabela ou "Empty State") */}
      {renderContent()}
    </Box>
  );
}