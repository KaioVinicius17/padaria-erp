// index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Para comunicar com outros serviços
const pool = require('./db');

const app = express();
const PORT = 3005; // Porta do novo serviço

app.use(express.json());
app.use(cors());

// URLs dos outros microerviços
const PRODUTOS_SERVICE_URL = 'http://localhost:3003';
const FINANCEIRO_SERVICE_URL = 'http://localhost:3007';

// ID Fixo para o "Plano de Contas" de Receita de Venda
// (Idealmente, isso viria de uma consulta ou variável de ambiente)
const PLANO_DE_CONTAS_ID_VENDA = 1; // Ajuste se o ID for diferente

/**
 * ROTA PRINCIPAL: REGISTRAR UMA NOVA VENDA (PDV)
 * Esta é uma rota "orquestradora".
 */
app.post('/vendas', async (req, res) => {
    const { cliente_id, valor_total, forma_pagamento, itens } = req.body;

    // Validação básica
    if (!valor_total || !forma_pagamento || !itens || itens.length === 0) {
        return res.status(400).json({ message: 'Dados da venda incompletos.' });
    }

    // Inicia a transação no banco de Vendas
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // INICIA A TRANSAÇÃO

        // 1. Salva a Venda principal (Tabela 'vendas')
        const vendaQuery = `
            INSERT INTO vendas (cliente_id, valor_total, forma_pagamento, data_venda) 
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
            RETURNING id, data_venda
        `;
        const vendaResult = await client.query(vendaQuery, [cliente_id || null, valor_total, forma_pagamento]);
        const vendaId = vendaResult.rows[0].id;
        const dataVenda = vendaResult.rows[0].data_venda;

        // 2. Salva os Itens da Venda (Tabela 'venda_itens')
        for (const item of itens) {
            await client.query(
                'INSERT INTO venda_itens (venda_id, produto_id, quantidade, valor_unitario) VALUES ($1, $2, $3, $4)',
                [vendaId, item.id, item.quantidade, item.preco_venda]
            );
        }

        // --- INÍCIO DA ORQUESTRAÇÃO ---
        // Se qualquer um dos 'axios.post' falhar, o 'catch' será ativado e fará o ROLLBACK.

        // 3. Comunica com o Serviço de Estoque para dar baixa
        // (Ainda precisamos criar esta rota no produtos-service)
        console.log('Comunicando com Serviço de Produtos para baixa de estoque...');
        await axios.post(`${PRODUTOS_SERVICE_URL}/produtos/baixa-estoque`, { 
            itens: itens, // Envia a lista de itens vendidos
            almoxarifado_id: 1 // Assumindo Almoxarifado '1' (Loja)
        });

        // 4. Comunica com o Serviço Financeiro para registrar a entrada no caixa
        console.log('Comunicando com Serviço Financeiro para registrar receita...');
        await axios.post(`${FINANCEIRO_SERVICE_URL}/lancamentos`, {
            descricao: `Venda PDV - ID ${vendaId}`,
            valor: valor_total,
            tipo: 'Entrada',
            plano_de_contas_id: PLANO_DE_CONTAS_ID_VENDA,
            data_vencimento: new Date(dataVenda).toISOString().split('T')[0], // Usa a data da venda
            forma_pagamento: forma_pagamento,
            condicao_pagamento: 'À vista' // Venda PDV é sempre à vista
        });

        // --- FIM DA ORQUESTRAÇÃO ---

        // 5. Se tudo deu certo, confirma a transação
        await client.query('COMMIT');
        console.log(`Venda ${vendaId} registrada com sucesso.`);
        res.status(201).json({ message: 'Venda registrada com sucesso!', venda_id: vendaId });

    } catch (error) {
        // Se qualquer passo falhar (banco ou axios), desfaz tudo
        await client.query('ROLLBACK');
        
        console.error('Erro ao processar venda (ROLLBACK EXECUTADO):', error.message);
        
        // Verifica se o erro veio de outro serviço (ex: estoque insuficiente)
        if (error.response) {
            return res.status(400).json({ 
                message: 'Falha em serviço dependente.', 
                service: error.config.url,
                error: error.response.data.message || 'Erro desconhecido'
            });
        }
        
        res.status(500).send('Erro interno no servidor ao processar a venda.');
    } finally {
        client.release();
    }
});

app.listen(PORT, () => {
  console.log(`Serviço de Vendas rodando na porta ${PORT}`);
});