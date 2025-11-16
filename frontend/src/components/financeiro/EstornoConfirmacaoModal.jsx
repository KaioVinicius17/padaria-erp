// src/components/financeiro/EstornoConfirmacaoModal.jsx
import React from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

export default function EstornoConfirmacaoModal({ open, onClose, onConfirmSuccess, lancamento }) {
  
  const handleConfirm = async () => {
    if (!lancamento) return;

    try {
      await axios.patch(`http://localhost:3007/lancamentos/${lancamento.id}/estornar`);
      onConfirmSuccess(); // Fecha o modal e atualiza a lista
    } catch (error) {
      console.error("Erro ao estornar lançamento:", error);
      // Opcional: Adicionar um feedback de erro (Snackbar/Alert)
      onClose(); // Fecha o modal mesmo se der erro
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar Estorno</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tem certeza que deseja estornar o lançamento:
          <br />
          <strong>{lancamento?.descricao}</strong> (Valor: R$ {lancamento?.valor})?
          <br /><br />
          Esta ação não pode ser desfeita. O lançamento voltará ao status "Pendente".
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Confirmar Estorno
        </Button>
      </DialogActions>
    </Dialog>
  );
}