// src/pages/PosicaoEstoque.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Button, Paper
} from '@mui/material';
import { MoveRight } from 'lucide-react';
import TransferenciaForm from '../components/almoxarifados/TransferenciaForm';
import AdvancedTable from '../components/common/AdvancedTable';

const PRODUTOS_SERVICE_URL = 'http://localhost:3003';

export default function PosicaoEstoque() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [estoque, setEstoque] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resEstoque, resAlmox, resProd] = await Promise.all([
        axios.get(`${PRODUTOS_SERVICE_URL}/estoque/detalhado`), 
        axios.get(`${PRODUTOS_SERVICE_URL}/almoxarifados`),
        axios.get(`${PRODUTOS_SERVICE_URL}/produtos/gerenciamento`)
      ]);
      
      setEstoque(resEstoque.data.map((item, index) => ({ ...item, id: index }))); // Adiciona um ID único
      setAlmoxarifados(resAlmox.data);
      setProdutos(resProd.data);
    } catch (error) {
      console.error("Erro ao buscar dados de almoxarifado:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveSuccess = () => {
    handleCloseModal();
    fetchData(); // Atualiza a tabela
  };

  const columns = [
    {
      field: 'nome_item',
      headerName: 'Produto',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'nome_almoxarifado',
      headerName: 'Almoxarifado',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'quantidade',
      headerName: 'Quantidade',
      type: 'number',
      width: 180,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (params) => `${params.row.quantidade} ${params.row.unidade_medida}`,
    }
  ];

  return (
    <Box>
      <TransferenciaForm
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}
        almoxarifados={almoxarifados}
        produtos={produtos}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Posição de Estoque
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie o saldo e transfira itens entre locais.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<MoveRight />} onClick={handleOpenModal}>
          Nova Transferência
        </Button>
      </Box>

      <AdvancedTable
        rows={estoque}
        columns={columns}
        loading={loading}
      />
    </Box>
  );
}
