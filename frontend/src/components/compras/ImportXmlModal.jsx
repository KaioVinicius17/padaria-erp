// src/components/compras/ImportXmlModal.jsx
// (ATUALIZADO - Lendo endereço/contato e garantindo CNPJ como string)

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress
} from '@mui/material';
import { UploadCloud } from 'lucide-react';
import PropTypes from 'prop-types';
import { XMLParser } from 'fast-xml-parser'; // 1. IMPORTAR O PARSER

// Função helper para garantir que algo seja um array
const ensureArray = (obj) => {
  if (!obj) return [];
  return Array.isArray(obj) ? obj : [obj];
};

export default function ImportXmlModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/xml') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Por favor, selecione um arquivo .xml válido.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const xmlText = e.target.result;
      
      try {
        const options = { ignoreAttributes: false, attributeNamePrefix: "" };
        const parser = new XMLParser(options);
        const nfeObj = parser.parse(xmlText);
        
        const infNFe = nfeObj.nfeProc ? nfeObj.nfeProc.NFe.infNFe : nfeObj.NFe.infNFe;
        if (!infNFe) {
          throw new Error("Estrutura NFe inválida. Tag <infNFe> não encontrada.");
        }

        const emitente = infNFe.emit;
        const identificacao = infNFe.ide;
        const dets = ensureArray(infNFe.det); 
        const cobranca = infNFe.cobr;
        const total = infNFe.total.ICMSTot;
        
        // ==========================================================
        // 1. CORREÇÃO AQUI: Capturando o endereço e telefone
        // ==========================================================
        const endereco = emitente.enderEmit; 
        
        const compraPreenchida = {
          id: null,
          numero_nota: identificacao.nNF,
          observacoes: `Importado via XML NFe ${identificacao.nNF} (Série ${identificacao.serie})`,
          valor_total: parseFloat(total.vNF),
          
          // Dados brutos do Fornecedor para o "De-Para"
          xml_fornecedor_cnpj: String(emitente.CNPJ), // <-- Força ser String
          xml_fornecedor_razao: emitente.xNome,    
          xml_fornecedor_fantasia: emitente.xFant,
          
          // Novos campos de endereço e contato
          xml_fornecedor_cep: endereco.CEP,
          xml_fornecedor_logradouro: endereco.xLgr,
          xml_fornecedor_numero: endereco.nro,
          xml_fornecedor_bairro: endereco.xBairro,
          xml_fornecedor_cidade: endereco.xMun,
          xml_fornecedor_estado: endereco.UF,
          xml_fornecedor_telefone: endereco.fone,
          xml_fornecedor_email: emitente.email, // (Seu XML não tinha, mas é comum)

          almoxarifado_id: '',
          plano_de_contas_id: '',
        };
        // ==========================================================

        // 2. Monta os Itens
        const itensPreenchidos = dets.map(det => ({
          produto_id: null,
          nome: det.prod.xProd,
          ean: det.prod.cEAN, // Código de barras
          quantidade: parseFloat(det.prod.qCom),
          custo_unitario: parseFloat(det.prod.vUnCom),
          casado: false
        }));

        // 3. Monta os Pagamentos (Duplicatas)
        let pagamentosPreenchidos = [];
        if (cobranca && cobranca.dup) {
          const duplicatas = ensureArray(cobranca.dup);
          pagamentosPreenchidos = duplicatas.map((dup) => ({
            valor: parseFloat(dup.vDup),
            condicao: 'Parcelado',
            formaPagamento: 'Boleto', 
            dataVencimento: dup.dVenc,
            parcelas: duplicatas.length
          }));
        } else {
          pagamentosPreenchidos = [{
            valor: parseFloat(total.vNF),
            condicao: 'À vista',
            formaPagamento: 'Boleto', 
            dataVencimento: identificacao.dhEmi.split('T')[0],
            parcelas: 1
          }];
        }
        
        const dadosCompletos = {
          ...compraPreenchida,
          itens: itensPreenchidos,
          dados_pagamento: pagamentosPreenchidos,
        };

        setLoading(false);
        onSuccess(dadosCompletos); 

      } catch (err) {
        console.error("Erro ao processar XML:", err);
        setError("Não foi possível ler o arquivo XML. Verifique o formato.");
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Não foi possível ler o arquivo.');
      setLoading(false);
    };
    
    reader.readAsText(file, "UTF-8");
  };

  const handleClose = () => {
    setFile(null);
    setError('');
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Importar NFe (XML)</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'action.hover',
            cursor: 'pointer'
          }}
          component="label" 
        >
          <UploadCloud size={48} style={{ opacity: 0.7 }} />
          <Typography variant="h6" sx={{ mt: 1 }}>
            Clique ou arraste o XML aqui
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {file ? file.name : 'Nenhum arquivo selecionado.'}
          </Typography>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <input
            type="file"
            hidden
            accept=".xml, text/xml"
            onChange={handleFileChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
        <Button 
          onClick={handleUpload} 
          variant="contained"
          disabled={!file || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Processar XML'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ImportXmlModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};