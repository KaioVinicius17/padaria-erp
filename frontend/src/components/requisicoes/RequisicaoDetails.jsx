// src/components/requisicoes/RequisicaoDetails.jsx
// (ATUALIZADO: Com funcionalidade de "Baixar PDF")

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Divider, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, 
  Paper, Grid, TableContainer
} from '@mui/material';
import PropTypes from 'prop-types';
import { FileDown } from 'lucide-react'; // 1. Importar ícone

// 2. Importar as bibliotecas de PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const REQUISICOES_SERVICE_URL = 'http://localhost:3005';

// Formata a data para o padrão brasileiro
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
};

export default function RequisicaoDetails({ open, onClose, requisicaoId }) {
  const [requisicao, setRequisicao] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // 3. Novo estado

  useEffect(() => {
    if (open && requisicaoId) {
      setLoading(true);
      axios.get(`${REQUISICOES_SERVICE_URL}/requisicoes/${requisicaoId}`)
        .then(response => {
          setRequisicao(response.data.requisicao);
          setItens(response.data.itens);
        })
        .catch(err => {
          console.error("Erro ao carregar detalhes da requisição:", err);
          alert("Não foi possível carregar os detalhes.");
        })
        .finally(() => setLoading(false));
    }
  }, [open, requisicaoId]);

  const handleClose = () => {
    setRequisicao(null);
    setItens([]);
    onClose();
  };

  // 4. NOVA FUNÇÃO: Gerar e Baixar o PDF
  const handleDownloadPDF = () => {
    const input = document.getElementById('documento-para-imprimir');
    if (!input) return;

    setIsDownloading(true);

    html2canvas(input, { scale: 2 }) // scale: 2 para melhor resolução
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        
        // Orientação 'p' (portrait/retrato), 'mm' (milímetros), 'a4' (tamanho)
        const pdf = new jsPDF('p', 'mm', 'a4'); 
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Adiciona a "foto" ao PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        // Salva o arquivo
        pdf.save(`requisicao_${requisicaoId}.pdf`);
        setIsDownloading(false);
      })
      .catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("Não foi possível gerar o PDF.");
        setIsDownloading(false);
      });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Detalhes da Requisição de Compra #{requisicaoId}
        </Typography>
      </DialogTitle>
      
      {/* 5. Adiciona o ID ao conteúdo que queremos imprimir */}
      <DialogContent id="documento-para-imprimir">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          requisicao && (
            <Box sx={{ mt: 2 }}>
              {/* Bloco de Informações */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Data da Solicitação:</Typography>
                    <Typography variant="h6">{formatDate(requisicao.data_criacao)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Typography variant="h6">{requisicao.status}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Departamento:</Typography>
                    <Typography variant="h6">{requisicao.departamento}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Solicitante:</Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                      (Funcionalidade futura)
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Bloco de Itens */}
              <Typography variant="h6" gutterBottom>Itens Solicitados</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantidade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.produto_id}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell align="right">{item.quantidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Bloco de Observações */}
              {requisicao.observacoes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Observações</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1">
                      {requisicao.observacoes}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
        {/* 6. NOVO BOTÃO DE DOWNLOAD */}
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

RequisicaoDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  requisicaoId: PropTypes.number,
};