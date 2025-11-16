// Código completo e atualizado para o index.js do encomendas-service
const express = require('express');
const axios = require('axios');
const pool = require('./db');

const app = express();
const PORT = 3006;

app.use(express.json());

const PRODUCAO_SERVICE_URL = 'http://localhost:3005';
const FINANCEIRO_SERVICE_URL = 'http://localhost:3007'; // Nova URL

//... (manter a rota POST /encomendas e GET /encomendas)...
app.post('/encomendas', async (req, res) => {
    const { cliente_id, data_entrega, valor_total, observacoes, itens } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const encomendaQuery = 'INSERT INTO encomendas (cliente_id, data_entrega, valor_total, observacoes) VALUES ($1, $2, $3, $4) RETURNING id';
        const encomendaResult = await client.query(encomendaQuery, [cliente_id, data_entrega, valor_total, observacoes]);
        const encomendaId = encomendaResult.rows.id;

        for (const item of itens) {
            const itemQuery = 'INSERT INTO encomendas_itens (encomenda_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)';
            await client.query(itemQuery, [encomendaId, item.produto_id, item.quantidade, item.preco_unitario]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Encomenda criada com sucesso!', encomenda_id: encomendaId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Erro no servidor ao criar encomenda.');
    } finally {
        client.release();
    }
});

app.patch('/encomendas/:id/confirmar', async (req, res) => {
    const { id } = req.params;
    const { valor_sinal, plano_de_contas_id } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const encomendaResult = await client.query("UPDATE encomendas SET status = 'Confirmado', valor_sinal = $1 WHERE id = $2 RETURNING *", [valor_sinal, id]);
        const encomenda = encomendaResult.rows;

        const itensResult = await client.query('SELECT * FROM encomendas_itens WHERE encomenda_id = $1', [id]);
        const itensDaEncomenda = itensResult.rows;

        for (const item of itensDaEncomenda) {
            await axios.post(`${PRODUCAO_SERVICE_URL}/ordens-producao`, {
                produto_final_id: item.produto_id,
                quantidade_a_produzir: item.quantidade,
                encomenda_id: id
            });
        }

        // Delega a criação do lançamento financeiro do sinal
        if (valor_sinal > 0) {
            await axios.post(`${FINANCEIRO_SERVICE_URL}/lancamentos`, {
                descricao: `Sinal da encomenda #${id}`,
                valor: valor_sinal,
                tipo: 'Entrada',
                data_vencimento: new Date().toISOString().split('T'),
                status: 'Recebido', // Sinal já entra como recebido
                data_pagamento: new Date().toISOString().split('T'),
                plano_de_contas_id: plano_de_contas_id,
                encomenda_id: id
            });
        }

        // Cria o lançamento futuro para o restante do valor
        const valorRestante = encomenda.valor_total - valor_sinal;
        if (valorRestante > 0) {
             await axios.post(`${FINANCEIRO_SERVICE_URL}/lancamentos`, {
                descricao: `Restante da encomenda #${id}`,
                valor: valorRestante,
                tipo: 'Entrada',
                data_vencimento: encomenda.data_entrega,
                plano_de_contas_id: plano_de_contas_id,
                encomenda_id: id
            });
        }

        await client.query('COMMIT');
        res.json({ message: 'Encomenda confirmada, ordens de produção e lançamentos financeiros gerados!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao confirmar encomenda:', err.response? err.response.data : err.message);
        res.status(500).send('Erro no servidor ao confirmar a encomenda.');
    } finally {
        client.release();
    }
});

app.get('/encomendas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM encomendas ORDER BY data_entrega ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }
});

app.get('/encomendas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const encomendaQuery = 'SELECT * FROM encomendas WHERE id = $1';
        const itensQuery = 'SELECT * FROM encomendas_itens WHERE encomenda_id = $1';
        const encomendaResult = await pool.query(encomendaQuery, [id]);
        if (encomendaResult.rows.length === 0) {
            return res.status(404).json({ message: 'Encomenda não encontrada.' });
        }
        const itensResult = await pool.query(itensQuery, [id]);
        const encomendaCompleta = {
          ...encomendaResult.rows,
            itens: itensResult.rows
        };
        res.json(encomendaCompleta);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor.');
    }
});

app.listen(PORT, () => {
  console.log(`Serviço de Encomendas rodando na porta ${PORT}`);
});