import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogTitle, 
    TextField, 
    Button, 
    Autocomplete, 
    Box, 
    IconButton, 
    Typography, 
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

export default function FichaTecnicaForm({ open, onClose, onSaveSuccess, fichaToEdit }) {
  // Estados para popular os selects
  const [produtosFinaisDisponiveis, setProdutosFinaisDisponiveis] = useState([]);
  const [insumos, setInsumos] = useState([]);

  // Estados para os dados do formulário
  const [selectedProdutoFinal, setSelectedProdutoFinal] = useState(null);
  const [itensReceita, setItensReceita] = useState([{ insumo_id: '', quantidade_insumo: '' }]);
  const [descricao, setDescricao] = useState('');
  const [tipoProducao, setTipoProducao] = useState('Unidade'); // Novo estado

  const isEditing = !!fichaToEdit;

  useEffect(() => {
    if (open) {
      Promise.all([
        axios.get('http://localhost:3003/produtos'),
        axios.get('http://localhost:3005/fichas-tecnicas')
      ]).then(([produtosResponse, fichasResponse]) => {
        
        const todosProdutos = produtosResponse.data;
        const fichasExistentes = fichasResponse.data;

        const idsProdutosComFicha = fichasExistentes
            .filter(f => f.id !== (fichaToEdit ? fichaToEdit.id : null))
            .map(ficha => ficha.produto_final_id);

        const produtosSemFicha = todosProdutos.filter(p => 
            p.tipo_item === 'Produto Final' && !idsProdutosComFicha.includes(p.id)
        );
        
        setProdutosFinaisDisponiveis(produtosSemFicha);
        setInsumos(todosProdutos.filter(p => p.tipo_item === 'Matéria-Prima'));

      }).catch(err => console.error("Erro ao buscar dados para o formulário:", err));

      if (isEditing) {
          // Lógica para preencher o formulário em modo de edição será implementada aqui
      }
    }
  }, [open, fichaToEdit]);

  const handleItemChange = (index, field, value) => {
    const newItens = [...itensReceita];
    newItens[index][field] = value;
    setItensReceita(newItens);
  };

  const handleAddItem = () => {
    setItensReceita([...itensReceita, { insumo_id: '', quantidade_insumo: '' }]);
  };

  const handleRemoveItem = (index) => {
    setItensReceita(itensReceita.filter((_, i) => i !== index));
  };
  
  const clearForm = () => {
    setSelectedProdutoFinal(null);
    setDescricao('');
    setItensReceita([{ insumo_id: '', quantidade_insumo: '' }]);
    setTipoProducao('Unidade');
  };

  const handleSave = async () => {
    if (!selectedProdutoFinal) {
        alert('Por favor, selecione um Produto Final.');
        return;
    }
    const payload = {
      produto_final_id: selectedProdutoFinal.id,
      descricao: descricao,
      tipo_producao: tipoProducao,
      itens: itensReceita.map(item => ({
        insumo_id: item.insumo_id,
        quantidade_insumo: parseFloat(item.quantidade_insumo),
      })),
    };

    try {
      // Lógica para POST (criar) ou PUT (atualizar) virá aqui
      await axios.post('http://localhost:3005/fichas-tecnicas', payload);
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao salvar ficha técnica:", error);
      alert('Erro ao salvar. É possível que já exista uma ficha para este produto.');
    }
  };
  
  const handleClose = () => {
    clearForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {isEditing ? 'Editar Ficha Técnica' : 'Criar Nova Ficha Técnica'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="h6" sx={{ mt: 2 }}>Produto Final</Typography>
        <Autocomplete
          options={produtosFinaisDisponiveis}
          getOptionLabel={(option) => option.nome_item}
          value={selectedProdutoFinal}
          onChange={(event, newValue) => setSelectedProdutoFinal(newValue)}
          renderInput={(params) => <TextField {...params} label="Selecione um produto (que ainda não possui ficha)" margin="normal" />}
          disabled={isEditing}
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="tipo-producao-label">Tipo de Produção da Receita</InputLabel>
          <Select
            labelId="tipo-producao-label"
            value={tipoProducao}
            label="Tipo de Produção da Receita"
            onChange={(e) => setTipoProducao(e.target.value)}
          >
            <MenuItem value="Unidade">Por Unidade</MenuItem>
            <MenuItem value="Quilo">Por Quilo (kg)</MenuItem>
          </Select>
        </FormControl>
        
        <Divider sx={{ my: 2 }} />

        <Typography variant="h6">Ingredientes (para 1 {tipoProducao})</Typography>
        {itensReceita.map((item, index) => {
          const selectedInsumo = insumos.find(i => i.id === item.insumo_id) || null;
          return (
            <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Autocomplete
                options={insumos}
                getOptionLabel={(option) => option.nome_item}
                value={selectedInsumo}
                onChange={(event, newValue) => handleItemChange(index, 'insumo_id', newValue ? newValue.id : '')}
                renderInput={(params) => <TextField {...params} label="Insumo" />}
                sx={{ flexGrow: 1 }}
              />
              <TextField 
                label="Quantidade" 
                type="number"
                value={item.quantidade_insumo}
                onChange={(e) => handleItemChange(index, 'quantidade_insumo', e.target.value)}
                sx={{ width: '150px' }} 
              />
              <Typography sx={{ minWidth: '30px' }}>
                {selectedInsumo?.unidade_medida || ''}
              </Typography>
              <IconButton onClick={() => handleRemoveItem(index)} color="error" disabled={itensReceita.length === 1}>
                <RemoveCircleOutlineIcon />
              </IconButton>
            </Box>
          );
        })}
        <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddItem} sx={{ mt: 1 }}>
          Adicionar Ingrediente
        </Button>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Salvar Ficha Técnica</Button>
      </DialogActions>
    </Dialog>
  );
}
