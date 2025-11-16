import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, 
    Autocomplete, Box, IconButton, Typography, Divider 
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

export default function OrdemProducaoForm({ open, onClose, onSaveSuccess }) {
  const [fichasTecnicas, setFichasTecnicas] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  
  const [descricao, setDescricao] = useState('');
  const [itens, setItens] = useState([{ ficha_tecnica_id: '', produto_final_id: '', quantidade_a_produzir: '', almoxarifado_destino_id: '' }]);

  useEffect(() => {
    if (open) {
      axios.get('http://localhost:3005/fichas-tecnicas').then(res => setFichasTecnicas(res.data));
      axios.get('http://localhost:3008/almoxarifados').then(res => setAlmoxarifados(res.data));
    }
  }, [open]);

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens];
    newItens[index][field] = value;
    setItens(newItens);
  };

  const handleAddItem = () => {
    setItens([...itens, { ficha_tecnica_id: '', produto_final_id: '', quantidade_a_produzir: '', almoxarifado_destino_id: '' }]);
  };
  
  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const payload = {
      descricao,
      itens: itens.map(item => ({
        ...item,
        quantidade_a_produzir: parseFloat(item.quantidade_a_produzir)
      }))
    };
    try {
      await axios.post('http://localhost:3005/ordens-producao', payload);
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao salvar ordem de produção:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Criar Nova Ordem de Produção</DialogTitle>
      <DialogContent>
        <TextField label="Descrição da Ordem (Ex: Produção de Sábado)" value={descricao} onChange={(e) => setDescricao(e.target.value)} fullWidth margin="normal" />
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Itens a Produzir</Typography>
        {itens.map((item, index) => {
          const selectedFicha = fichasTecnicas.find(f => f.id === item.ficha_tecnica_id) || null;
          return (
            <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Autocomplete
                options={fichasTecnicas}
                getOptionLabel={(option) => option.produto_final_nome}
                value={selectedFicha}
                onChange={(e, newValue) => {
                  handleItemChange(index, 'ficha_tecnica_id', newValue ? newValue.id : '');
                  handleItemChange(index, 'produto_final_id', newValue ? newValue.produto_final_id : '');
                }}
                renderInput={(params) => <TextField {...params} label="Produto com Ficha Técnica" />}
                sx={{ flex: 2 }}
              />
              <TextField label="Quantidade" type="number" value={item.quantidade_a_produzir} onChange={(e) => handleItemChange(index, 'quantidade_a_produzir', e.target.value)} sx={{ width: '120px' }} />
              <Autocomplete
                options={almoxarifados}
                getOptionLabel={(option) => option.nome}
                onChange={(e, newValue) => handleItemChange(index, 'almoxarifado_destino_id', newValue ? newValue.id : '')}
                renderInput={(params) => <TextField {...params} label="Almox. Destino" />}
                sx={{ flex: 1 }}
              />
              <IconButton onClick={() => handleRemoveItem(index)} color="error" disabled={itens.length === 1}><RemoveCircleOutlineIcon /></IconButton>
            </Box>
          );
        })}
        <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddItem}>Adicionar Produto</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Criar Ordem</Button>
      </DialogActions>
    </Dialog>
  );
}
