// src/components/pedidos/PedidoDetails.jsx
// (ATUALIZADO: Remove fetch de fornecedor, usa props para 'almoxarifados' e 'fornecedores')

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Divider, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, 
  Paper, Grid, TableContainer, TableFooter
} from '@mui/material';
import PropTypes from 'prop-types';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PEDIDOS_SERVICE_URL = 'http://localhost:3006';
// (Removida a URL do fornecedor, não é mais necessário)

const formatCurrency = (value) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
};

// ==========================================================
// 1. RECEBE 'almoxarifados' e 'fornecedores' COMO PROPS
// ==========================================================
export default function PedidoDetails({ open, onClose, pedidoId, almoxarifados, fornecedores }) {
  const [pedido, setPedido] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (open && pedidoId) {
      setLoading(true);
      
      const fetchPedido = async () => {
        try {
          // 1. Busca APENAS o Pedido e os Itens
          const response = await axios.get(`${PEDIDOS_SERVICE_URL}/pedidos/${pedidoId}`);
          setPedido(response.data.pedido);
          setItens(response.data.itens);
          // (A busca de fornecedor foi removida - Erro 404)
        } catch (err) {
          console.error("Erro ao carregar detalhes do pedido:", err);
          alert("Não foi possível carregar os detalhes.");
        } finally {
          setLoading(false);
        }
      };
      
      fetchPedido();
    }
  }, [open, pedidoId]);

  const handleClose = () => {
    setPedido(null);
    setItens([]);
    onClose();
  };

  const handleDownloadPDF = () => {
    const input = document.getElementById('documento-para-imprimir-pedido');
    if (!input) return;
    setIsDownloading(true);

    html2canvas(input, { scale: 2 })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); 
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`pedido_de_compra_${pedidoId}.pdf`);
        setIsDownloading(false);
      })
      .catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("Não foi possível gerar o PDF.");
        setIsDownloading(false);
      });
  };

  // 2. Procura o fornecedor e almoxarifado nas listas recebidas
  const fornecedor = fornecedores.find(f => f.id === pedido?.fornecedor_id);
  const almoxarifado = almoxarifados.find(a => a.id === pedido?.almoxarifado_id);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Pedido de Compra #{pedidoId}
        </Typography>
      </DialogTitle>
      
      <DialogContent id="documento-para-imprimir-pedido">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          pedido && (
            <Box sx={{ mt: 2 }}>
              {/* Bloco de Informações */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Data do Pedido:</Typography>
                    <Typography variant="h6">{formatDate(pedido.data_criacao)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Typography variant="h6">{pedido.status}</Typography>
                  </Grid>
                  
                  <Grid item xs={12}> <Divider sx={{ my: 1 }} /> </Grid>

                  <Grid item xs={7}>
                    <Typography variant="body2" color="text.secondary">Fornecedor:</Typography>
                    {/* 3. Usa a variável 'fornecedor' encontrada */}
                    <Typography variant="h6">
                        {fornecedor?.nome_fantasia || fornecedor?.razao_social || 'N/A'}
                    </Typography>
                    <Typography variant="body1">{fornecedor?.cnpj}</Typography>
                    <Typography variant="body1">{fornecedor?.email}</Typography>
                    <Typography variant="body1">{fornecedor?.telefone}</Typography>
                  </Grid>
                  <Grid item xs={5}>
                    <Typography variant="body2" color="text.secondary">Entregar Em (Almoxarifado):</Typography>
                    {/* 4. Usa a variável 'almoxarifado' encontrada */}
                    <Typography variant="h6">
                        {almoxarifado?.nome || 'N/A'}
                    </Typography>
                  </Grid>

                  {pedido.observacoes && (
                    <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Observações:</Typography>
                        <Typography variant="body1">{pedido.observacoes}</Typography>
                    </Grid>
                  )}

                </Grid>
              </Paper>
              
              {/* Bloco de Itens */}
              <Typography variant="h6" gutterBottom>Itens do Pedido</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Qtd.</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Custo Unit.</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.produto_id}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell align="right">{item.quantidade}</TableCell>
                        <TableCell align="right">{formatCurrency(item.custo_unitario)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.quantidade * item.custo_unitario)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3} align="right">
                            <Typography variant="h6">Valor Total:</Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Typography variant="h6">{formatCurrency(pedido.valor_total)}</Typography>
                        </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Box>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
        <Button
          variant="contained"
          onClick={handleDownloadPDF}
          startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <FileDown size={20} />}
          disabled={loading || isDownloading}
        >
          {isDownloading ? 'Gerando PDF...' : 'Baixar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PedidoDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pedidoId: PropTypes.number,
  almoxarifados: PropTypes.array.isRequired, 
  fornecedores: PropTypes.array.isRequired, // 5. Adiciona propType
};