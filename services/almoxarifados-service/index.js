// services/almoxarifados-service/index.js
// (ATUALIZADO: Com 'status' e 'gerenciamento')

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3008; // Porta 3008

app.use(express.json());
app.use(cors());

// ROTA: CRIAR um novo almoxarifado
app.post('/almoxarifados', async (req, res) => {
    // Agora inclui 'status'
    const { nome, descricao, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO almoxarifados (nome, descricao, status) VALUES ($1, $2, $3) RETURNING *',
            [nome, descricao, status || 'Ativo']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ROTA: LISTAR (Apenas Ativos - para Dropdowns)
// (Usado pelo PurchaseForm, TransferenciaForm, etc.)
app.get('/almoxarifados', async (req, res) => {
    try {
        // Rota principal agora só busca ativos
        const result = await pool.query("SELECT * FROM almoxarifados WHERE status = 'Ativo' ORDER BY nome ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ==========================================================
// NOVA ROTA: LISTAR TODOS (para a página de Gerenciamento)
// ==========================================================
app.get('/almoxarifados/gerenciamento', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM almoxarifados ORDER BY nome ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar todos almoxarifados:', err.message);
        res.status(500).send('Erro no servidor');
    }
});
// ==========================================================

// ROTA: OBTER um almoxarifado específico
app.get('/almoxarifados/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM almoxarifados WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Almoxarifado não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ROTA: ATUALIZAR um almoxarifado
app.put('/almoxarifados/:id', async (req, res) => {
    const { id } = req.params;
    // Agora inclui 'status'
    const { nome, descricao, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE almoxarifados SET nome = $1, descricao = $2, status = $3 WHERE id = $4 RETURNING *',
            [nome, descricao, status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Almoxarifado não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ROTA: DELETAR um almoxarifado
app.delete('/almoxarifados/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // (Aqui precisaríamos verificar se o almoxarifado está em uso no 'estoque_por_almoxarifado')
        const result = await pool.query('DELETE FROM almoxarifados WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Almoxarifado não encontrado.' });
        }
        res.json({ message: 'Almoxarifado deletado com sucesso.' });
    } catch (err) { 
        console.error(err.message);
        // Verifica se é um erro de chave estrangeira
        if (err.code === '23503') {
             return res.status(400).json({ message: 'Erro: Este almoxarifado não pode ser excluído pois já possui estoque vinculado.' });
        }
        res.status(500).send('Erro no servidor');
    }
});

// ROTA: Ver estoque de um almoxarifado (do seu código original)
app.get('/almoxarifados/:id/estoque', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                p.nome_item,
                p.unidade_medida,
                epa.quantidade
            FROM estoque_por_almoxarifado epa
            JOIN produtos p ON epa.produto_id = p.id
            WHERE epa.almoxarifado_id = $1 AND epa.quantidade > 0
            ORDER BY p.nome_item;
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar estoque do almoxarifado:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

app.listen(PORT, () => {
    console.log(`Serviço de Almoxarifados rodando na porta ${PORT}`);
});