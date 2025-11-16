import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography,
    CircularProgress,
    Box,
    IconButton
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return parseFloat(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
};

export default function OrdemProducaoDetalhesModal({ open, onClose, ordem }) {
  const [detalhes, setDetalhes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ordem) {
      setLoading(true);
      axios.get(`http://localhost:3005/ordens-producao/${ordem.id}/detalhes`)
        .then(res => {
          setDetalhes(res.data);
        })
        .catch(err => {
          console.error("Erro ao buscar detalhes da ordem:", err);
          setDetalhes([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, ordem]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Detalhes da Ordem de Produção #{ordem?.id}
        <IconButton onClick={handlePrint} color="primary" aria-label="print">
          <PrintIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box className="printable-area">
            <Typography variant="h5" gutterBottom>
                {ordem?.descricao || 'Ordem de Produção'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Data: {ordem?.data_producao ? new Date(ordem.data_producao).toLocaleDateString('pt-BR') : 'N/A'}
            </Typography>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
              detalhes.map((produto, idx) => (
                <Box key={idx} sx={{ mt: 3 }}>
                  {/* --- LINHA ATUALIZADA --- */}
                  <Typography variant="h6" component="h3" gutterBottom>
                    Produzir: {formatNumber(produto.quantidade_a_produzir)} {produto.tipo_producao === 'Quilo' ? 'Kg de' : 'un de'} {produto.produto_final_nome}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{fontWeight: 'bold'}}>Ingrediente Necessário</TableCell>
                          <TableCell align="right" sx={{fontWeight: 'bold'}}>Quantidade Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {produto.ingredientes.map((ing, i) => (
                          <TableRow key={i}>
                            <TableCell>{ing.nome_item}</TableCell>
                            <TableCell align="right">{`${formatNumber(ing.quantidade_necessaria)} ${ing.unidade_medida}`}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>

      {/* Estilos para Impressão */}
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 20mm; }
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .MuiDialogActions-root, .MuiDialogTitle-root button { display: none !important; }
        `}
      </style>
    </Dialog>
  );
}
