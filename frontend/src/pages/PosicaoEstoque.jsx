// src/pages/PosicaoEstoque.jsx
// (Este é o seu antigo 'Almoxarifados.jsx', agora focado na posição)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Button, Paper, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import { MoveRight } from 'lucide-react';
import TransferenciaForm from '../components/almoxarifados/TransferenciaForm'; 

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
      
      setEstoque(resEstoque.data);
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Produto</TableCell>
              <TableCell>Almoxarifado</TableCell>
              <TableCell align="right">Quantidade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} align="center"><CircularProgress /></TableCell></TableRow>
            ) : (
              estoque.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.nome_item}</TableCell>
                  <TableCell>{item.nome_almoxarifado}</TableCell>
                  <TableCell align="right">{item.quantidade} {item.unidade_medida}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}