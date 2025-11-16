// src/pages/Clientes.jsx
// (ATUALIZADO com novo layout de Tabela, Busca e Empty State)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerTable from '../components/clientes/CustomerTable'; // <-- USA A NOVA TABELA
import CustomerForm from '../components/clientes/CustomerForm';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { 
  Box, Typography, Button, TextField, InputAdornment, 
  CircularProgress, Paper 
} from '@mui/material';
import { Plus, Search, Users } from 'lucide-react'; // <-- Ícones

const CLIENTES_SERVICE_URL = 'http://localhost:3002';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      // Rota GET agora busca todos (ativos e inativos)
      const response = await axios.get(`${CLIENTES_SERVICE_URL}/clientes`);
      setClientes(response.data);
      setFilteredClientes(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Filtro de busca local
  useEffect(() => {
    if (!filterText) {
      setFilteredClientes(clientes);
      return;
    }
    const lowerCaseFilter = filterText.toLowerCase();
    const filtrados = clientes.filter((cli) =>
      cli.nome_completo?.toLowerCase().includes(lowerCaseFilter) ||
      cli.cpf_cnpj?.toLowerCase().includes(lowerCaseFilter) ||
      cli.email?.toLowerCase().includes(lowerCaseFilter)
    );
    setFilteredClientes(filtrados);
  }, [filterText, clientes]);

  const handleOpenDeleteDialog = (id) => {
    setCustomerToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setCustomerToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${CLIENTES_SERVICE_URL}/clientes/${customerToDelete}`);
      fetchClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleOpenForm = (customer = null) => {
    setCustomerToEdit(customer);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCustomerToEdit(null);
  };

  const handleSaveSuccess = () => {
    fetchClientes();
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

    if (clientes.length === 0) {
      return (
        <Paper 
          sx={{ textAlign: 'center', p: 4, mt: 3, backgroundColor: 'action.hover' }}
          variant="outlined"
        >
          <Users size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Nenhum cliente cadastrado
          </Typography>
          <Typography color="text.secondary">
            Clique em "Adicionar Cliente" acima para cadastrar um novo registro.
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
            placeholder="Buscar cliente por nome, CPF/CNPJ ou email..."
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
        <CustomerTable
          clientes={filteredClientes}
          onDelete={handleOpenDeleteDialog}
          onEdit={handleOpenForm}
        />
      </React.Fragment>
    );
  };

  return (
    <Box>
      <CustomerForm 
        open={isFormOpen} 
        onClose={handleCloseForm}
        onSaveSuccess={handleSaveSuccess}
        customerToEdit={customerToEdit}
      />
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este cliente?"
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Clientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie sua base de clientes e informações de contato.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenForm()}>
          Adicionar Cliente
        </Button>
      </Box>

      {renderContent()}
    </Box>
  );
}