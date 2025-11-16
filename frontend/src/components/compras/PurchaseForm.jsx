// src/components/compras/PurchaseForm.jsx
// (ATUALIZADO: Corrigido o DatePicker do "1º Vencimento")

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Select, MenuItem, InputLabel, FormControl,
  Typography, IconButton, Paper, InputAdornment, Box, Divider,
  Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableHead, TableRow, TableFooter,
  CircularProgress,
  Alert 
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { NumericFormat } from 'react-number-format';

// --- 1. IMPORTAR OS COMPONENTES DE DATA ---
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ptBR } from 'date-fns/locale'; 

import FornecedorForm from '../fornecedores/FornecedorForm';
import ProductForm from '../produtos/ProductForm';

// --- URLs dos Serviços ---
const COMPRAS_SERVICE_URL = 'http://localhost:3004';
const PRODUTOS_SERVICE_URL = 'http://localhost:3003';
const FINANCEIRO_SERVICE_URL = 'http://localhost:3007';
const FORNECEDORES_SERVICE_URL = 'http://localhost:3001'; 

const formatCurrency = (value) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDateToInput = (dateString) => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    const date = new Date(dateString + "T12:00:00Z");
    return date.toISOString().split('T')[0];
};

const steps = ['Informações da Compra', 'Itens da Nota', 'Detalhes Financeiros'];

const initialState = {
  fornecedor_id: '',
  numero_nota: '',
  almoxarifado_id: '',
  plano_de_contas_id: '',
  observacoes: '',
};

export default function PurchaseForm({ open, onClose, onSaveSuccess, onSaveRascunho, purchaseToEdit }) {
  // --- Estados do Formulário ---
  const [formData, setFormData] = useState(initialState);
  const [itens, setItens] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  
  // --- Estados de Controle ---
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [compraId, setCompraId] = useState(null); 
  const [xmlData, setXmlData] = useState(null); 
  
  // --- Listas para Dropdowns ---
  const [fornecedores, setFornecedores] = useState([]);
  const [produtos, setProdutos] = useState([]); 
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [planosDeConta, setPlanosDeConta] = useState([]);

  // --- Estados dos Sub-formulários ---
  const [currentItem, setCurrentItem] = useState({ produto_id: '', nome: '', quantidade: 1, custo_unitario: 0 });
  const [totalItens, setTotalItens] = useState(0);
  const [currentPagamento, setCurrentPagamento] = useState({ 
    valor: 0, 
    condicao: 'À vista', 
    formaPagamento: 'Boleto', 
    dataVencimento: new Date().toISOString().split('T')[0], 
    parcelas: 1 
  });
  const [totalPagamentos, setTotalPagamentos] = useState(0);

  // --- Estados para os Modais "Filhos" ---
  const [isFornecedorModalOpen, setIsFornecedorModalOpen] = useState(false);
  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [produtoParaPreencher, setProdutoParaPreencher] = useState(null);
  const [itemIndexToUpdate, setItemIndexToUpdate] = useState(null);
  const [fornecedorParaPreencher, setFornecedorParaPreencher] = useState(null);

  // Calcula totais
  useEffect(() => {
    const novoTotalItens = itens.reduce((acc, item) => acc + (parseFloat(item.quantidade) * parseFloat(item.custo_unitario || item.valor_unitario)), 0);
    setTotalItens(novoTotalItens);
  }, [itens]);

  useEffect(() => {
    const novoTotalPagamentos = pagamentos.reduce((acc, pgto) => acc + parseFloat(pgto.valor), 0);
    setTotalPagamentos(novoTotalPagamentos);
  }, [pagamentos]);


  // Busca dados dos dropdowns
  const fetchDropdownData = async () => {
    try {
      const [resForn, resProd, resAlmox, resPlanos] = await Promise.all([
        axios.get(`${FORNECEDORES_SERVICE_URL}/fornecedores`), 
        axios.get(`${PRODUTOS_SERVICE_URL}/produtos/gerenciamento`), 
        axios.get(`${PRODUTOS_SERVICE_URL}/almoxarifados`),
        axios.get(`${FINANCEIRO_SERVICE_URL}/plano-de-contas`)
      ]);
      setFornecedores(resForn.data);
      setProdutos(resProd.data);
      setAlmoxarifados(resAlmox.data || []);
      const planosSaida = resPlanos.data.filter(p => p.tipo === 'Despesa');
      if (planosSaida.length === 0) {
          console.warn('Nenhum Plano de Contas do tipo "Despesa" encontrado.');
      }
      setPlanosDeConta(planosSaida);
      return { fornecedores: resForn.data, produtos: resProd.data };
    } catch (error) {
      console.error("Erro ao carregar dados do formulário:", error);
      return { fornecedores: [], produtos: [] };
    }
  };
  
  // Carrega dados para Edição
  const loadEditData = async (compraId) => {
    try {
      const response = await axios.get(`${COMPRAS_SERVICE_URL}/compras/${compraId}`);
      const { compra, itens: itensDaCompra } = response.data;

      setFormData({
        fornecedor_id: compra.fornecedor_id || '',
        numero_nota: compra.numero_nota || '',
        almoxarifado_id: compra.almoxarifado_id || '',
        plano_de_contas_id: compra.plano_de_contas_id || '',
        observacoes: compra.observacoes || '',
      });
      
      setItens(itensDaCompra.map(item => ({
        produto_id: item.produto_id,
        nome: item.nome,
        quantidade: item.quantidade,
        custo_unitario: item.valor_unitario,
        casado: true
      })));
      
      setPagamentos(compra.dados_pagamento ? (typeof compra.dados_pagamento === 'string' ? JSON.parse(compra.dados_pagamento) : compra.dados_pagamento) : []);
      setActiveStep(0); 

    } catch (error) {
       console.error("Erro ao carregar dados da compra para edição:", error);
       alert("Não foi possível carregar os dados desta compra.");
       handleClose();
    }
  };

  // Carrega dados do XML (faz o "de-para")
  const loadXmlData = (xml, allFornecedores, allProdutos) => {
    const fornecedorEncontrado = allFornecedores.find(f => String(f.cnpj) === String(xml.xml_fornecedor_cnpj));
    
    const itensCasados = xml.itens.map(itemXML => {
      const prodEncontrado = allProdutos.find(p => p.codigo_barras === itemXML.ean);
      return {
        produto_id: prodEncontrado ? prodEncontrado.id : '',
        nome: itemXML.nome,
        ean: itemXML.ean,
        quantidade: itemXML.quantidade,
        custo_unitario: itemXML.custo_unitario,
        casado: !!prodEncontrado 
      };
    });
    
    setFormData({
      fornecedor_id: fornecedorEncontrado ? fornecedorEncontrado.id : '',
      numero_nota: xml.numero_nota || '',
      almoxarifado_id: xml.almoxarifado_id || '',
      plano_de_contas_id: xml.plano_de_contas_id || '',
      observacoes: xml.observacoes || '',
    });
    setItens(itensCasados);
    setPagamentos(xml.dados_pagamento || []);
    setActiveStep(0); 
    setXmlData(xml); 
  };

  // Lógica de Inicialização
  useEffect(() => {
    if (open) {
      setLoading(true);
      const runSetup = async () => {
        const { fornecedores: allFornecedores, produtos: allProdutos } = await fetchDropdownData();
        
        if (purchaseToEdit) {
          if (purchaseToEdit.id) {
            setIsEditMode(true);
            setCompraId(purchaseToEdit.id);
            await loadEditData(purchaseToEdit.id);
          } else {
            setIsEditMode(false);
            setCompraId(null);
            loadXmlData(purchaseToEdit, allFornecedores, allProdutos);
          }
        } else {
          setIsEditMode(false);
          setCompraId(null);
          setFormData(initialState);
          setItens([]);
          setPagamentos([]);
          setActiveStep(0);
        }
        setLoading(false);
      };
      runSetup();
    }
  }, [open, purchaseToEdit]);

  // Limpa o formulário ao fechar
  const handleClose = () => {
    setActiveStep(0); 
    setXmlData(null);
    onClose();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // --- Lógica de Itens ---
  const handleItemChange = (name, value) => {
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };
  const handleItemSelectChange = (e) => {
    const prodId = e.target.value;
    const prod = produtos.find(p => p.id === prodId);
    setCurrentItem({ 
      ...currentItem, 
      produto_id: prodId,
      nome: prod ? prod.nome_item : '',
      custo_unitario: prod ? (prod.preco_custo || 0) : 0
    });
  };
  const handleAddItem = () => {
    if (!currentItem.produto_id || !currentItem.quantidade || currentItem.custo_unitario < 0) return;
    const newItem = {...currentItem, valor_unitario: currentItem.custo_unitario };
    setItens(prev => [...prev, newItem]);
    setCurrentItem({ produto_id: '', nome: '', quantidade: 1, custo_unitario: 0 });
  };
  const handleRemoveItem = (indexToRemove) => {
    setItens(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  // --- Lógica de Pagamentos ---
  const handlePagamentoChange = (name, value) => {
    setCurrentPagamento(prev => ({ ...prev, [name]: value }));
  };
  const handlePagamentoSelectChange = (e) => {
     setCurrentPagamento(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleAddPagamento = () => {
    if (currentPagamento.valor <= 0) return;
    
    let novosPagamentos = [];
    if (currentPagamento.condicao === 'Parcelado' && currentPagamento.parcelas > 1) {
      const valorParcela = (currentPagamento.valor / currentPagamento.parcelas);
      let dataVencimento = new Date(currentPagamento.dataVencimento + "T12:00:00Z"); 
      
      for (let i = 0; i < currentPagamento.parcelas; i++) {
        if (i > 0) dataVencimento.setMonth(dataVencimento.getMonth() + 1);
        
        novosPagamentos.push({
          ...currentPagamento,
          valor: parseFloat(valorParcela.toFixed(2)), 
          dataVencimento: dataVencimento.toISOString().split('T')[0],
          parcelas: `${i + 1}/${currentPagamento.parcelas}` 
        });
      }
    } else {
      novosPagamentos.push({
        ...currentPagamento,
        valor: parseFloat(currentPagamento.valor),
        parcelas: '1/1'
      });
    }

    setPagamentos(prev => [...prev, ...novosPagamentos]);
    setCurrentPagamento({ valor: 0, condicao: 'À vista', formaPagamento: 'Boleto', dataVencimento: new Date().toISOString().split('T')[0], parcelas: 1 });
  };
  const handleRemovePagamento = (indexToRemove) => {
     setPagamentos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handlePagamentoEdit = (index, field, value) => {
    setPagamentos(prevPagamentos =>
      prevPagamentos.map((pgto, i) => {
        if (i === index) {
          return { ...pgto, [field]: value };
        }
        return pgto;
      })
    );
  };


  // --- Lógica do Stepper (FLUXO "SALVAR E SEGUIR") ---
  const handleNext = async () => {
    // ETAPA 1 -> ETAPA 2 (Salvar Rascunho)
    if (activeStep === 0) {
      if (!formData.fornecedor_id || !formData.almoxarifado_id) {
        alert("Fornecedor e Almoxarifado são obrigatórios.");
        return;
      }
      
      setLoading(true);
      try {
        if (!isEditMode) {
          const response = await axios.post(`${COMPRAS_SERVICE_URL}/compras`, formData);
          setCompraId(response.data.compra.id); 
          setIsEditMode(true); 
          onSaveRascunho(); 
        } else {
          const payload = {
            ...formData,
            itens: itens.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade, custo_unitario: (i.custo_unitario || i.valor_unitario) })),
            pagamentos: pagamentos,
            valor_total: totalItens,
          };
          await axios.put(`${COMPRAS_SERVICE_URL}/compras/${compraId}`, payload);
          onSaveRascunho(); 
        }
      } catch (error) {
        console.error("Erro ao salvar rascunho da compra:", error);
        alert(`Erro ao salvar rascunho: ${error.response?.data?.message || error.message}`);
        setLoading(false);
        return; 
      }
      setLoading(false);
      setActiveStep(1); 
    }
    
    // ETAPA 2 -> ETAPA 3 (Atualizar Itens)
    else if (activeStep === 1) {
      if (itens.length === 0) {
        alert("Adicione pelo menos um item à nota.");
        return;
      }
      const itemNaoCasado = itens.find(item => !item.produto_id && item.ean);
      if (itemNaoCasado) {
        alert(`O item "${itemNaoCasado.nome}" não foi vinculado a um produto do seu sistema. Por favor, selecione um produto para ele.`);
        return;
      }
      
      setLoading(true);
      const payload = {
        ...formData,
        itens: itens.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade, custo_unitario: (i.custo_unitario || i.valor_unitario) })),
        pagamentos: pagamentos,
        valor_total: totalItens,
      };

      try {
        await axios.put(`${COMPRAS_SERVICE_URL}/compras/${compraId}`, payload);
        onSaveRascunho(); 
        console.log('Itens da compra salvos.');

        if (pagamentos.length === 0) {
          setCurrentPagamento(prev => ({
            ...prev,
            valor: parseFloat(totalItens.toFixed(2)) 
          }));
        }
        
        setActiveStep(2);
      } catch (error) {
        console.error("Erro ao salvar itens da compra:", error);
        alert(`Erro ao salvar itens: ${error.response?.data?.message || error.message}`);
      }
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // --- Lógica de Submissão Final (Etapa 3) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (pagamentos.length === 0) {
       alert("Adicione pelo menos uma forma de pagamento.");
       return;
    }
    
    if (Math.abs(totalItens - totalPagamentos) > 0.01) {
      alert('Erro: O valor total dos itens (R$ ' + totalItens.toFixed(2) + ') não bate com o valor total dos pagamentos (R$ ' + totalPagamentos.toFixed(2) + ').');
      return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      itens: itens.map(i => ({ 
          produto_id: i.produto_id, 
          quantidade: i.quantidade, 
          custo_unitario: (i.custo_unitario || i.valor_unitario)
      })),
      pagamentos: pagamentos,
      valor_total: totalItens,
    };
    
    try {
      await axios.put(`${COMPRAS_SERVICE_URL}/compras/${compraId}`, payload);
      onSaveSuccess(); // Esta função fecha o modal
      handleClose(); 
    } catch (error) {
      console.error("Erro ao salvar compra:", error);
      alert(`Erro ao salvar: ${error.response?.data?.message || error.message}`);
    }
    setLoading(false);
  };

  // --- Handlers para "De-Para" (Modal-sobre-Modal) ---
  const handleOpenFornecedorModal = () => {
    if (xmlData) {
      setFornecedorParaPreencher({
        razao_social: xmlData.xml_fornecedor_razao || '',
        nome_fantasia: xmlData.xml_fornecedor_fantasia || '',
        cnpj: xmlData.xml_fornecedor_cnpj || '',
        cep: xmlData.xml_fornecedor_cep || '',
        logradouro: xmlData.xml_fornecedor_logradouro || '',
        numero: xmlData.xml_fornecedor_numero || '',
        bairro: xmlData.xml_fornecedor_bairro || '',
        cidade: xmlData.xml_fornecedor_cidade || '',
        estado: xmlData.xml_fornecedor_estado || '',
        telefone: xmlData.xml_fornecedor_telefone || '',
        email: xmlData.xml_fornecedor_email || '',
        status: true 
      });
    } else {
      setFornecedorParaPreencher(null); 
    }
    setIsFornecedorModalOpen(true);
  };

  const handleFornecedorSalvo = async (fornecedorSalvo) => {
    setIsFornecedorModalOpen(false);
    setLoading(true); 
    const resForn = await axios.get(`${FORNECEDORES_SERVICE_URL}/fornecedores`);
    setFornecedores(resForn.data);

    if (fornecedorSalvo && fornecedorSalvo.id) {
       setFormData(prev => ({ ...prev, fornecedor_id: fornecedorSalvo.id }));
    }
    setLoading(false);
  };

  const handleOpenProdutoModal = (itemXML, index) => {
    setProdutoParaPreencher({
      nome_item: itemXML.nome,
      codigo_barras: itemXML.ean,
      preco_custo: itemXML.custo_unitario,
      tipo_item: 'Produto de Revenda', 
      unidade_medida: 'un', 
      status: true
    });
    setItemIndexToUpdate(index); 
    setIsProdutoModalOpen(true);
  };
  
  const handleProdutoSalvo = async (produtoSalvo) => {
    setIsProdutoModalOpen(false);
    setLoading(true);

    const resProd = await axios.get(`${PRODUTOS_SERVICE_URL}/produtos/gerenciamento`);
    setProdutos(resProd.data);

    setItens(prevItens => 
      prevItens.map((item, i) => {
        if (i === itemIndexToUpdate || (item.ean && item.ean === produtoSalvo.codigo_barras)) {
          return { ...item, produto_id: produtoSalvo.id, casado: true, nome: produtoSalvo.nome_item };
        }
        return item;
      })
    );
    setLoading(false);
    setItemIndexToUpdate(null);
  };

  const handleCasarItemManual = (index, novoProdutoId) => {
    const prod = produtos.find(p => p.id === novoProdutoId);
    setItens(prevItens => 
      prevItens.map((item, i) => 
        i === index 
        ? { ...item, produto_id: novoProdutoId, casado: true, nome: prod.nome_item } 
        : item
      )
    );
  };

  // --- Renderização do conteúdo da Etapa ---
  function getStepContent(step) {
    switch (step) {
      // ETAPA 1: CABEÇALHO
      case 0:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {xmlData && !formData.fornecedor_id && (
              <Grid item xs={12}>
                <Alert severity="warning" action={
                  <Button color="inherit" size="small" onClick={handleOpenFornecedorModal}>
                    Cadastrar
                  </Button>
                }>
                  Fornecedor (CNPJ: {xmlData.xml_fornecedor_cnpj}) não encontrado. Selecione manualmente ou cadastre-o.
                </Alert>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Fornecedor</InputLabel>
                <Select name="fornecedor_id" value={formData.fornecedor_id} label="Fornecedor" onChange={handleChange}>
                  {fornecedores.map(f => <MenuItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Almoxarifado (Destino)</InputLabel>
                <Select name="almoxarifado_id" value={formData.almoxarifado_id} label="Almoxarifado (Destino)" onChange={handleChange}>
                  {almoxarifados.map(a => <MenuItem key={a.id} value={a.id}>{a.nome || a.nome_almoxarifado}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="numero_nota" label="Nº da Nota Fiscal (Opcional)" value={formData.numero_nota} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="observacoes" label="Observações (Opcional)" value={formData.observacoes} onChange={handleChange} fullWidth />
            </Grid>
          </Grid>
        );
      
      // ETAPA 2: ITENS
      case 1:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth size="small">
                <InputLabel>Produto</InputLabel>
                <Select name="produto_id" value={currentItem.produto_id} label="Produto" onChange={handleItemSelectChange}>
                  {produtos.map(p => <MenuItem key={p.id} value={p.id}>{p.nome_item}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField name="quantidade" label="Qtd." type="number" value={currentItem.quantidade} onChange={(e) => handleItemChange(e.target.name, e.target.value)} size="small" fullWidth />
            </Grid>
            <Grid item xs={12} sm={3}>
              <NumericFormat
                name="custo_unitario"
                label="Custo Unit."
                value={currentItem.custo_unitario}
                onValueChange={(values) => {
                  handleItemChange('custo_unitario', values.floatValue); 
                }}
                customInput={TextField}
                prefix="R$ "
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                // fixedDecimalScale // <-- REMOVIDO
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button onClick={handleAddItem} variant="outlined" fullWidth sx={{ height: '100%' }}>Adicionar</Button>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 1, mt: 1, minHeight: 150, maxHeight: 300, overflowY: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Produto (Sistema)</TableCell>
                      <TableCell align="right">Qtd.</TableCell>
                      <TableCell align="right">Custo Unit.</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={index} sx={{ backgroundColor: (item.ean && !item.casado) ? 'warning.light' : 'transparent' }}>
                        <TableCell>
                          {item.nome || item.nome_item}
                          {(item.ean) && <Typography variant="caption" display="block">EAN: {item.ean}</Typography>}
                        </TableCell>
                        <TableCell sx={{ minWidth: 200 }}>
                          {(item.ean && !item.casado) ? (
                            <Box>
                              <FormControl fullWidth size="small" error>
                                <InputLabel>Vincular Produto</InputLabel>
                                <Select
                                  value={item.produto_id}
                                  label="Vincular Produto"
                                  onChange={(e) => handleCasarItemManual(index, e.target.value)}
                                >
                                  <MenuItem value=""><em>Selecione...</em></MenuItem>
                                  {produtos.map(p => <MenuItem key={p.id} value={p.id}>{p.nome_item}</MenuItem>)}
                                </Select>
                              </FormControl>
                              <Button 
                                size="small" 
                                startIcon={<Plus size={14} />} 
                                onClick={() => handleOpenProdutoModal(item, index)} 
                                sx={{ mt: 0.5 }}
                              >
                                Criar Novo
                              </Button>
                            </Box>
                          ) : (
                            produtos.find(p => p.id === item.produto_id)?.nome_item || item.nome
                          )}
                        </TableCell>
                        <TableCell align="right">{item.quantidade}</TableCell>
                        <TableCell align="right">{formatCurrency(item.custo_unitario || item.valor_unitario)}</TableCell>
                        <TableCell align="right">{formatCurrency(parseFloat(item.quantidade) * parseFloat(item.custo_unitario || item.valor_unitario))}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}><Trash2 size={16} /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6} align="right">
                        <Typography variant="h6" sx={{ mt: 1 }}>Total Itens: {formatCurrency(totalItens)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        );
      
      // ETAPA 3: PAGAMENTO
      case 2:
        return (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Plano de Contas (Obrigatório p/ Finalizar)</InputLabel>
                <Select name="plano_de_contas_id" value={formData.plano_de_contas_id} label="Plano de Contas (Obrigatório p/ Finalizar)" onChange={handleChange}>
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {planosDeConta.map(p => <MenuItem key={p.id} value={p.id}>{p.descricao}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography>Lançar Pagamentos</Typography></Divider></Grid>
            
            {/* Formulário de Adicionar Pagamento */}
            <Grid item xs={12} sm={3}>
              <NumericFormat
                name="valor"
                label="Valor Pgto."
                value={currentPagamento.valor}
                onValueChange={(values) => {
                  handlePagamentoChange('valor', values.floatValue); 
                }}
                customInput={TextField}
                prefix="R$ "
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                // fixedDecimalScale // <-- REMOVIDO
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small"><InputLabel>Condição</InputLabel>
                <Select name="condicao" value={currentPagamento.condicao} label="Condição" onChange={handlePagamentoSelectChange}>
                  <MenuItem value="À vista">À vista</MenuItem>
                  <MenuItem value="Parcelado">Parcelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              {/* ==========================================================
                  2. CORREÇÃO: Usando DatePicker aqui
                 ========================================================== */}
              <DatePicker 
                label="1º Vencimento" 
                value={new Date(currentPagamento.dataVencimento + "T12:00:00Z")} 
                onChange={(newValue) => {
                  handlePagamentoChange('dataVencimento', newValue.toISOString().split('T')[0]);
                }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} 
              />
            </Grid>
            
            {currentPagamento.condicao === 'Parcelado' && (
              <Grid item xs={12} sm={1}>
                <TextField name="parcelas" label="Nº" type="number" InputProps={{ inputProps: { min: 1 } }} value={currentPagamento.parcelas} onChange={(e) => handlePagamentoChange(e.target.name, e.target.value)} size="small" fullWidth />
              </Grid>
            )}
            
            <Grid item xs={12} sm={2}>
              <Button onClick={handleAddPagamento} variant="outlined" fullWidth sx={{ height: '100%' }}>Adicionar</Button>
            </Grid>
            
            {/* Tabela de Pagamentos Editável */}
            <Grid item xs={12}>
               <Paper variant="outlined" sx={{ p: 1, mt: 1, minHeight: 150, maxHeight: 300, overflowY: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parcela</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Vencimento</TableCell>
                      <TableCell align="right">Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagamentos.map((pgto, index) => (
                      <TableRow key={index}>
                        <TableCell>{pgto.parcelas}</TableCell>
                        <TableCell>
                          <NumericFormat
                            name="valor"
                            value={pgto.valor} 
                            onValueChange={(values) => {
                              handlePagamentoEdit(index, 'valor', values.floatValue);
                            }}
                            customInput={TextField}
                            prefix="R$ "
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={2}
                            // fixedDecimalScale // <-- REMOVIDO
                            variant="standard"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <DatePicker 
                            value={new Date(pgto.dataVencimento + "T12:00:00Z")}
                            onChange={(newValue) => {
                              handlePagamentoEdit(index, 'dataVencimento', newValue.toISOString().split('T')[0]);
                            }}
                            slotProps={{ textField: { size: 'small', variant: 'standard' } }} 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleRemovePagamento(index)}><Trash2 size={16} /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                         <Typography variant="h6" sx={{ mt: 1 }}>Total Pagamentos: {formatCurrency(totalPagamentos)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
               </Paper>
               {Math.abs(totalItens - totalPagamentos) > 0.01 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    O Total dos Pagamentos ( {formatCurrency(totalPagamentos)} ) é diferente do Total dos Itens ( {formatCurrency(totalItens)} ).
                  </Alert>
               )}
            </Grid>
          </Grid>
        );
      default:
        return 'Etapa desconhecida';
    }
  }

  return (
    <Box>
      {/* ==========================================================
          3. ENVOLVER TUDO COM O 'LOCALIZATIONPROVIDER'
         ========================================================== */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        {/* Modais "Filhos" (para criar Fornecedor/Produto) */}
        <FornecedorForm
          open={isFornecedorModalOpen}
          onClose={() => setIsFornecedorModalOpen(false)}
          onSaveSuccess={handleFornecedorSalvo}
          fornecedorToEdit={fornecedorParaPreencher} 
        />
        <ProductForm
          open={isProdutoModalOpen}
          onClose={() => setIsProdutoModalOpen(false)}
          onSaveSuccess={handleProdutoSalvo}
          productToEdit={produtoParaPreencher} 
        />

        {/* Modal Principal (Este componente) */}
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
          <DialogTitle>{isEditMode ? `Editando Compra (Aberta) - ID: ${compraId}` : 'Registrar Nova Compra'}</DialogTitle>
          <DialogContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Carregando dados...</Typography>
              </Box>
            ) : (
              <>
                <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
                  {steps.map((label) => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                  ))}
                </Stepper>
                
                <Box>
                  {getStepContent(activeStep)}
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
            >
              Voltar
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
                {isEditMode ? 'Atualizar Pagamentos' : 'Salvar Pagamentos'}
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleNext} disabled={loading}>
                {activeStep === 0 ? (isEditMode ? 'Salvar Cabeçalho' : 'Salvar e Continuar') : 'Salvar Itens e Ir p/ Pgto.'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
}

PurchaseForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveSuccess: PropTypes.func.isRequired,
  onSaveRascunho: PropTypes.func.isRequired,
  purchaseToEdit: PropTypes.object,
};