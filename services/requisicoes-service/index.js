// services/requisicoes-service/index.js (Porta 3005)

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3005;

app.use(express.json());
app.use(cors());

// ROTA 1: LISTAR todas as requisições
app.get('/requisicoes', async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id, r.status, r.data_criacao, r.observacoes,
                COUNT(ri.id) AS total_itens
            FROM requisicoes r
            LEFT JOIN requisicao_itens ri ON r.id = ri.requisicao_id
            GROUP BY r.id
            ORDER BY r.data_criacao DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar requisições:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 2: CRIAR RASCUNHO (Etapa 1 do Form)
app.post('/requisicoes', async (req, res) => {
    const { observacoes, departamento } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO requisicoes (observacoes, departamento, status)
             VALUES ($1, $2, 'Aberta') RETURNING *`,
            [observacoes, departamento || 'Geral']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar rascunho de requisição:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 3: BUSCAR UMA REQUISIÇÃO (para Edição)
app.get('/requisicoes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let requisicao, itens;
        
        const reqResult = await pool.query("SELECT * FROM requisicoes WHERE id = $1", [id]);
        if (reqResult.rowCount === 0) {
            return res.status(404).json({ message: 'Requisição não encontrada.' });
        }
        requisicao = reqResult.rows[0];

        const itensQuery = `
            SELECT 
                ri.produto_id, 
                ri.quantidade, 
                p.nome_item AS nome
            FROM requisicao_itens ri
            JOIN produtos p ON ri.produto_id = p.id
            WHERE ri.requisicao_id = $1
        `;
        const itensResult = await pool.query(itensQuery, [id]);
        itens = itensResult.rows;
        
        res.json({ requisicao, itens });
    } catch (err) {
        console.error('Erro ao buscar requisição completa:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 4: ATUALIZAR REQUISIÇÃO (Salvar Itens - Etapa 2)
app.put('/requisicoes/:id', async (req, res) => {
    const { id } = req.params;
    const { observacoes, itens } = req.body; // Apenas o que pode ser editado
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            `UPDATE requisicoes SET observacoes = $1
             WHERE id = $2 AND status = 'Aberta'`,
            [observacoes, id]
        );

        await client.query('DELETE FROM requisicao_itens WHERE requisicao_id = $1', [id]);
        if (itens && itens.length > 0) {
            for (const item of itens) {
                await client.query(
                    'INSERT INTO requisicao_itens (requisicao_id, produto_id, quantidade) VALUES ($1, $2, $3)',
                    [id, item.produto_id, item.quantidade]
                );
            }
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Requisição atualizada com sucesso!' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao ATUALIZAR requisição:', err.message);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 5: APROVAR (Implementação simples)
app.patch('/requisicoes/:id/aprovar', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE requisicoes SET status = 'Aprovada', data_aprovacao = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'Aberta' RETURNING id",
            [id]
        );
        if (result.rowCount === 0) {
            throw new Error('Requisição não encontrada ou não pode ser aprovada.');
        }
        res.json({ message: 'Requisição Aprovada!' });
    } catch (err) {
        console.error('Erro ao aprovar requisição:', err.message);
        res.status(500).json({ message: err.message, error: err.message });
    }
});

// ROTA 6: CANCELAR / REJEITAR
app.patch('/requisicoes/:id/cancelar', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE requisicoes SET status = 'Cancelada' WHERE id = $1 AND (status = 'Aberta' OR status = 'Aprovada') RETURNING id",
            [id]
        );
        if (result.rowCount === 0) {
            throw new Error('Requisição não encontrada ou já foi concluída.');
        }
        res.json({ message: 'Requisição Cancelada/Rejeitada.' });
    } catch (err) {
        console.error('Erro ao cancelar requisição:', err.message);
        res.status(500).json({ message: err.message, error: err.message });
    }
});

// ROTA 7: CONCLUIR (Chamada pelo 'pedidos-service' quando um Pedido é criado)
app.patch('/requisicoes/:id/concluir', async (req, res) => {
    const { id } = req.params;
    try {
        // Só pode concluir uma requisição APROVADA
        const result = await pool.query(
            "UPDATE requisicoes SET status = 'Concluída' WHERE id = $1 AND status = 'Aprovada' RETURNING id",
            [id]
        );
        if (result.rowCount === 0) {
            throw new Error('Requisição não encontrada ou não estava Aprovada.');
        }
        res.json({ message: 'Requisição marcada como "Concluída".' });
    } catch (err) {
        console.error('Erro ao concluir requisição:', err.message);
        res.status(500).json({ message: err.message, error: err.message });
    }
});

app.listen(PORT, () => {
  console.log(`Serviço de Requisições rodando na porta ${PORT}`);
});