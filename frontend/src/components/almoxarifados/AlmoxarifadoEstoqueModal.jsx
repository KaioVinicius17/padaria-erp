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
        Box
    } from '@mui/material';

    const formatNumber = (value) => {
        if (value === null || value === undefined) return '0';
        return parseFloat(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
    };

    export default function AlmoxarifadoEstoqueModal({ open, onClose, almoxarifado }) {
      const [estoque, setEstoque] = useState([]);
      const [loading, setLoading] = useState(false);

      useEffect(() => {
        if (open && almoxarifado) {
          setLoading(true);
          axios.get(`http://localhost:3008/almoxarifados/${almoxarifado.id}/estoque`)
            .then(res => {
              setEstoque(res.data);
            })
            .catch(err => {
              console.error("Erro ao buscar estoque:", err);
              setEstoque([]);
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }, [open, almoxarifado]);

      return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
          <DialogTitle>
            Estoque do Almoxarifado: <Typography component="span" variant="h6" color="primary">{almoxarifado?.nome}</Typography>
          </DialogTitle>
          <DialogContent>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Saldo Atual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estoque.length > 0 ? estoque.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.nome_item}</TableCell>
                        <TableCell align="right">{`${formatNumber(item.quantidade)} ${item.unidade_medida}`}</TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={2} align="center">Nenhum produto com saldo neste almoxarifado.</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Fechar</Button>
          </DialogActions>
        </Dialog>
      );
    }
    