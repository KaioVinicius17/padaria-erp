// services/pedidos-service/index.js
// (NOVO SERVIÇO na Porta 3006)

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const axios = require('axios');

const app = express();
const PORT = 3006; // Nova porta

app.use(express.json());
app.use(cors());

// URL do serviço que precisa ser notificado
const REQUISICOES_SERVICE_URL = 'http://localhost:3005';

// ROTA 1: LISTAR todos os pedidos
app.get('/pedidos', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id, p.status, p.data_criacao, p.valor_total,
                f.nome_fantasia AS fornecedor_nome,
                a.nome AS almoxarifado_nome,
                COUNT(pi.id) AS total_itens
            FROM 
                pedidos_compra p
            JOIN 
                fornecedores f ON p.fornecedor_id = f.id
            JOIN 
                almoxarifados a ON p.almoxarifado_id = a.id
            LEFT JOIN
                pedido_compra_itens pi ON p.id = pi.pedido_id
            GROUP BY
                p.id, f.nome_fantasia, a.nome
            ORDER BY 
                p.data_criacao DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar pedidos:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 2: CRIAR RASCUNHO (Etapa 1 do Form)
app.post('/pedidos', async (req, res) => {
    const { fornecedor_id, almoxarifado_id, observacoes, requisicao_id } = req.body;

    if (!fornecedor_id || !almoxarifado_id) {
        return res.status(400).json({ message: 'Fornecedor e Almoxarifado são obrigatórios.' });
    }
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            `INSERT INTO pedidos_compra (fornecedor_id, almoxarifado_id, observacoes, requisicao_id, status)
             VALUES ($1, $2, $3, $4, 'Aberta') RETURNING *`,
            [fornecedor_id, almoxarifado_id, observacoes, requisicao_id || null]
        );
        
        const novoPedido = result.rows[0];

        // Se foi baseado numa Requisição, notifica o outro serviço para "fechá-la"
        if (requisicao_id) {
            await axios.patch(`${REQUISICOES_SERVICE_URL}/requisicoes/${requisicao_id}/concluir`);
        }
        
        await client.query('COMMIT');
        res.status(201).json(novoPedido);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar rascunho de pedido:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 3: BUSCAR UM PEDIDO (para Edição)
app.get('/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pedido, itens;
        
        const pedResult = await pool.query("SELECT * FROM pedidos_compra WHERE id = $1", [id]);
        if (pedResult.rowCount === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }
        pedido = pedResult.rows[0];

        const itensQuery = `
            SELECT 
                pi.produto_id, 
                pi.quantidade, 
                pi.custo_unitario,
                p.nome_item AS nome
            FROM pedido_compra_itens pi
            JOIN produtos p ON pi.produto_id = p.id
            WHERE pi.pedido_id = $1
        `;
        const itensResult = await pool.query(itensQuery, [id]);
        itens = itensResult.rows;
        
        res.json({ pedido, itens });
    } catch (err) {
        console.error('Erro ao buscar pedido completo:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 4: ATUALIZAR PEDIDO (Salvar Itens - Etapa 2)
app.put('/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    const { fornecedor_id, almoxarifado_id, observacoes, itens } = req.body;
    
    let valorTotal = 0;
    if (itens && itens.length > 0) {
        valorTotal = itens.reduce((acc, item) => acc + (parseFloat(item.quantidade) * parseFloat(item.custo_unitario)), 0);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            `UPDATE pedidos_compra SET 
             fornecedor_id = $1, 
             almoxarifado_id = $2, 
             observacoes = $3,
             valor_total = $4
             WHERE id = $5 AND status = 'Aberta'`,
            [fornecedor_id, almoxarifado_id, observacoes, valorTotal, id]
        );

        await client.query('DELETE FROM pedido_compra_itens WHERE pedido_id = $1', [id]);
        if (itens && itens.length > 0) {
            for (const item of itens) {
                await client.query(
                    'INSERT INTO pedido_compra_itens (pedido_id, produto_id, quantidade, custo_unitario) VALUES ($1, $2, $3, $4)',
                    [id, item.produto_id, item.quantidade, item.custo_unitario]
                );
            }
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Pedido atualizado com sucesso!' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao ATUALIZAR pedido:', err.message);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 5: MARCAR COMO "ENVIADO"
app.patch('/pedidos/:id/enviar', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE pedidos_compra SET status = 'Enviado', data_envio = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'Aberta' RETURNING id",
            [id]
        );
        if (result.rowCount === 0) {
            throw new Error('Pedido não encontrado ou não pode ser enviado.');
        }
        res.json({ message: 'Pedido marcado como "Enviado"!' });
    } catch (err) {
        console.error('Erro ao enviar pedido:', err.message);
        res.status(500).json({ message: err.message, error: err.message });
    }
});

// ROTA 6: CANCELAR
app.patch('/pedidos/:id/cancelar', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE pedidos_compra SET status = 'Cancelado' WHERE id = $1 AND (status = 'Aberta' OR status = 'Enviado') RETURNING id",
            [id]
        );
        if (result.rowCount === 0) {
            throw new Error('Pedido não encontrado ou não pode ser cancelado.');
        }
        res.json({ message: 'Pedido Cancelado.' });
    } catch (err) {
        console.error('Erro ao cancelar pedido:', err.message);
        res.status(500).json({ message: err.message, error: err.message });
    }
});

// ROTA 7: MARCAR COMO "CONFIRMADO" (pelo Fornecedor)
app.patch('/pedidos/:id/confirmar', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE pedidos_compra SET status = 'Confirmado' WHERE id = $1 AND status = 'Enviado' RETURNING id",
            [id]
        );
        if (result.rowCount === 0) {
            throw new Error('Pedido não encontrado ou não está com o status "Enviado".');
        }
        res.json({ message: 'Pedido marcado como "Confirmado"!' });
    } catch (err) {
        console.error('Erro ao confirmar pedido:', err.message);
        res.status(500).json({ message: err.message, error: err.message });
    }
});

app.listen(PORT, () => {
  console.log(`Serviço de Pedidos de Compra rodando na porta ${PORT}`);
});