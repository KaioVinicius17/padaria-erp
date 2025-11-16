// src/pages/Produtos.jsx
// (ATUALIZADO com "Empty State" quando não há produtos)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductTable from '../components/produtos/ProductTable';
import ProductForm from '../components/produtos/ProductForm';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { 
  Box, Typography, Button, TextField, InputAdornment, 
  Paper, // 1. Importar Paper
  CircularProgress // 2. Importar CircularProgress
} from '@mui/material';
import { Plus, Search, Package } from 'lucide-react'; // 3. Importar o ícone Inbox

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

const Produtos = () => {
  const [produtos, setProdutos] = useState([]); 
  const [filteredProdutos, setFilteredProdutos] = useState([]); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [filterText, setFilterText] = useState('');
  
  // 4. Novo estado de Loading
  const [loading, setLoading] = useState(true);

  const fetchProdutos = async () => {
    setLoading(true); // Começa a carregar
    try {
      const response = await axios.get(`${PRODUTOS_SERVICE_URL}/produtos/gerenciamento`);
      setProdutos(response.data);
      setFilteredProdutos(response.data); 
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false); // Termina de carregar
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  // Filtro de busca local
  useEffect(() => {
    if (!filterText) {
      setFilteredProdutos(produtos);
      return;
    }
    const lowerCaseFilter = filterText.toLowerCase();
    const filtrados = produtos.filter((produto) => {
      return (
        produto.nome_item.toLowerCase().includes(lowerCaseFilter) ||
        produto.id.toString().includes(lowerCaseFilter)
      );
    });
    setFilteredProdutos(filtrados);
  }, [filterText, produtos]);


  const handleOpenDeleteDialog = (productId) => {
    setProductToDelete(productId);
    setIsConfirmOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setProductToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${PRODUTOS_SERVICE_URL}/produtos/${productToDelete}`);
      fetchProdutos(); 
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleOpenForm = (product = null) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setProductToEdit(null);
  };

  const handleSaveSuccess = () => {
    fetchProdutos();
    handleCloseForm();
  };

  // 5. Função para renderizar o conteúdo principal (Tabela ou Vazio)
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (produtos.length === 0) {
      // ==========================================================
      // LÓGICA DO "EMPTY STATE" (Quando não há produtos)
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
          <Package size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhum produto cadastrado
          </Typography>
          <Typography color="text.secondary">
            Clique em "Adicionar Produto" acima para cadastrar um novo registro.
          </Typography>
        </Paper>
      );
    }
    
    // ==========================================================
    // LÓGICA PADRÃO (Quando HÁ produtos)
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
            placeholder="Buscar produto por nome ou ID..."
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
        <ProductTable
          produtos={filteredProdutos}
          onDelete={handleOpenDeleteDialog}
          onEdit={handleOpenForm}
        />
      </React.Fragment>
    );
  };

  return (
    <Box>
      <ProductForm 
        open={isFormOpen} 
        onClose={handleCloseForm}
        onSaveSuccess={handleSaveSuccess}
        productToEdit={productToEdit}
      />
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este item? Esta ação removerá o produto e seu histórico de testes."
      />

      {/* Cabeçalho com Título e Botão */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Produtos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie seu inventário, matérias-primas e produtos acabados.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Plus />}
          onClick={() => handleOpenForm()}
        >
          Adicionar Produto
        </Button>
      </Box>

      {/* 6. Renderiza o conteúdo (Tabela ou "Empty State") */}
      {renderContent()}
    </Box>
  );
};

export default Produtos;