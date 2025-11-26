// src/pages/Categorias.jsx
// (CÓDIGO COMPLETO E CORRIGIDO)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, CircularProgress
} from '@mui/material';
import { Plus, Edit, Trash2, Package } from 'lucide-react'; 
import * as LucideIcons from 'lucide-react'; 

// --- IMPORTAÇÕES DOS COMPONENTES ---
// Nota: Certifique-se de que o arquivo existe em src/components/categorias/CategoriaForm.jsx
import CategoriaForm from '../components/produtos/CategoriaForm'; 
import ConfirmationDialog from '../components/common/ConfirmationDialog';

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

// Componente auxiliar para renderizar o ícone dinamicamente
// Se o nome do ícone não existir ou for inválido, renderiza 'Package'
const DynamicIcon = ({ name }) => {
    const IconComponent = (name && LucideIcons[name]) ? LucideIcons[name] : Package;
    return <IconComponent size={24} />;
};

export default function Categorias() {
  // --- Estados ---
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Controle do Modal de Formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState(null);
  
  // Controle do Diálogo de Confirmação (Exclusão)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // --- Funções de API ---
  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${PRODUTOS_SERVICE_URL}/categorias`);
      setCategorias(response.data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      // (Opcional: Mostrar um toast/alerta de erro aqui)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  // --- Handlers (Ações) ---

  const handleOpenForm = (cat = null) => {
    setCategoriaToEdit(cat);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setCategoriaToEdit(null);
    setIsFormOpen(false);
  };

  const handleSaveSuccess = () => {
    fetchCategorias(); // Recarrega a lista após salvar
    handleCloseForm();
  };
  
  const handleOpenDelete = (id) => {
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
      if (!idToDelete) return;
      try {
          await axios.delete(`${PRODUTOS_SERVICE_URL}/categorias/${idToDelete}`);
          fetchCategorias(); // Atualiza a lista
      } catch (error) {
          console.error("Erro ao deletar:", error);
          alert("Erro ao deletar categoria. Verifique se ela não possui produtos vinculados.");
      } finally {
          setIsConfirmOpen(false);
          setIdToDelete(null);
      }
  };

  return (
    <Box>
      {/* --- MODAIS E DIÁLOGOS --- */}
      <CategoriaForm 
        open={isFormOpen} 
        onClose={handleCloseForm} 
        onSaveSuccess={handleSaveSuccess} 
        categoriaToEdit={categoriaToEdit}
      />
      
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        message="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
      />

      {/* --- CABEÇALHO DA PÁGINA --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Gerenciar Categorias
            </Typography>
            <Typography variant="body1" color="text.secondary">
            Organize seus produtos em grupos.
            </Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<Plus />} 
            onClick={() => handleOpenForm()}
        >
            Nova Categoria
        </Button>
      </Box>

      {/* --- TABELA DE DADOS --- */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80, fontWeight: 'bold' }}>Ícone</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tipo Padrão</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Produtos Vinculados</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <CircularProgress />
                    </TableCell>
                </TableRow>
            ) : categorias.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">Nenhuma categoria cadastrada.</Typography>
                    </TableCell>
                </TableRow>
            ) : (
                categorias.map((cat) => (
                <TableRow key={cat.id} hover>
                    {/* Coluna de Ícone */}
                    <TableCell align="center">
                        <Box sx={{ 
                            color: 'primary.main', 
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: 'action.hover',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            mx: 'auto'
                        }}>
                            <DynamicIcon name={cat.icon} />
                        </Box>
                    </TableCell>
                    
                    <TableCell sx={{ fontWeight: 500, fontSize: '1rem' }}>
                        {cat.nome}
                    </TableCell>
                    
                    <TableCell>
                        {cat.tipo_item || <Typography variant="caption" color="text.secondary">Não definido</Typography>}
                    </TableCell>
                    
                    <TableCell align="center">
                        <Chip 
                            label={cat.produtos_vinculados || 0} 
                            size="small" 
                            variant="outlined" 
                        />
                    </TableCell>
                    
                    <TableCell>
                        <Chip 
                            label={cat.status} 
                            color={cat.status === 'Ativo' ? 'success' : 'default'} 
                            size="small" 
                        />
                    </TableCell>
                    
                    <TableCell align="right">
                        <IconButton onClick={() => handleOpenForm(cat)} color="primary" title="Editar">
                            <Edit size={18} />
                        </IconButton>
                        <IconButton onClick={() => handleOpenDelete(cat.id)} color="error" title="Excluir">
                            <Trash2 size={18} />
                        </IconButton>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}