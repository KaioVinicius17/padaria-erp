// services/financeiro-service/index.js
// (COMPLETO - Com a rota /cancelar-por-compra que faltava)

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const axios = require('axios');

const app = express();
const PORT = 3007;

app.use(express.json());
app.use(cors());

// --- ROTAS DE PLANOS/CONTAS ---
app.get('/plano-de-contas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM plano_de_contas ORDER BY descricao ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar plano de contas:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});
app.get('/contas-bancarias', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contas_bancarias ORDER BY nome_conta ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar contas bancárias:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});
app.get('/clientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome_completo as nome_razao_social FROM clientes ORDER BY nome_completo ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar clientes:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// --- ROTAS DE LANÇAMENTOS ---

app.post('/lancamentos', async (req, res) => {
    const { 
        descricao, valor, tipo, data_vencimento, 
        plano_de_contas_id, 
        compra_id, forma_pagamento, condicao_pagamento, 
        fornecedor_id, cliente_id, observacao 
    } = req.body;

    if (!descricao || !valor || !tipo || !data_vencimento || !plano_de_contas_id) {
        return res.status(400).json({ message: 'Dados de lançamento incompletos.' });
    }
    
    try {
        const query = `
            INSERT INTO lancamentos_financeiros (
                descricao, valor, tipo, data_vencimento, plano_de_contas_id, 
                compra_id, forma_pagamento, condicao_pagamento, fornecedor_id, 
                cliente_id, observacao, status
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pendente') 
            RETURNING *
        `;
        const params = [
            descricao, valor, tipo, data_vencimento, plano_de_contas_id,
            compra_id || null, forma_pagamento || null, condicao_pagamento || null,
            fornecedor_id || null, cliente_id || null, observacao || null
        ];
        const result = await pool.query(query, params);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar lançamento:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

app.get('/lancamentos/pagar', async (req, res) => {
    try {
        const query = `
            SELECT 
                lf.id, lf.descricao, lf.valor, lf.data_vencimento, lf.status,
                lf.data_pagamento, pc.descricao AS plano_de_contas,
                lf.plano_de_contas_id,
                f.nome_fantasia AS fornecedor_nome
            FROM lancamentos_financeiros lf
            JOIN plano_de_contas pc ON lf.plano_de_contas_id = pc.id
            LEFT JOIN fornecedores f ON lf.fornecedor_id = f.id
            WHERE lf.tipo = 'Saída'
            ORDER BY 
                CASE 
                    WHEN lf.status = 'Pendente' THEN 1 
                    WHEN lf.status = 'Pago' THEN 2
                    ELSE 3 
                END, 
                lf.data_vencimento ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar contas a pagar:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

app.patch('/lancamentos/:id/pagar', async (req, res) => {
    const { id } = req.params;
    const { data_pagamento, forma_pagamento, conta_bancaria_id, valor_pago } = req.body;
    if (!data_pagamento || !forma_pagamento || !conta_bancaria_id || !valor_pago) {
        return res.status(400).json({ message: 'Dados de pagamento incompletos.' });
    }
    try {
        const result = await pool.query(
            `UPDATE lancamentos_financeiros 
             SET status = 'Pago', data_pagamento = $1, forma_pagamento = $2, conta_bancaria_id = $3, valor_pago = $4 
             WHERE id = $5 RETURNING *`,
            [data_pagamento, forma_pagamento, conta_bancaria_id, valor_pago, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Lançamento não encontrado.' });
        }
        res.json({ message: 'Lançamento baixado com sucesso!', lancamento: result.rows[0] });
    } catch (err) {
        console.error('Erro ao marcar como pago:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

app.put('/lancamentos/:id', async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, data_vencimento, plano_de_contas_id, cliente_id, observacao } = req.body;
    if (!descricao || !valor || !data_vencimento || !plano_de_contas_id) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }
    try {
        const result = await pool.query(
            `UPDATE lancamentos_financeiros 
             SET descricao = $1, valor = $2, data_vencimento = $3, 
                 plano_de_contas_id = $4, cliente_id = $5, observacao = $6
             WHERE id = $7 RETURNING *`,
            [descricao, valor, data_vencimento, plano_de_contas_id, cliente_id, observacao, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Lançamento não encontrado.' });
        }
        res.json({ message: 'Lançamento atualizado com sucesso!', lancamento: result.rows[0] });
    } catch (err) {
        console.error('Erro ao atualizar lançamento:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

app.patch('/lancamentos/:id/estornar', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE lancamentos_financeiros 
             SET status = 'Pendente', data_pagamento = NULL, forma_pagamento = NULL, 
                 conta_bancaria_id = NULL, valor_pago = NULL
             WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Lançamento não encontrado.' });
        }
        res.json({ message: 'Lançamento estornado com sucesso!', lancamento: result.rows[0] });
    } catch (err) {
        console.error('Erro ao estornar lançamento:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ==========================================================
// ROTA: CANCELAR LANÇAMENTOS (chamada pelo 'compras-service')
// (Esta rota estava faltando e causava o bug do cancelamento)
// ==========================================================
app.patch('/lancamentos/cancelar-por-compra/:compra_id', async (req, res) => {
    const { compra_id } = req.params;
    try {
        // Marca como 'Cancelado' qualquer lançamento (Pendente ou Pago)
        const result = await pool.query(
            `UPDATE lancamentos_financeiros 
             SET status = 'Cancelado' 
             WHERE compra_id = $1 AND (status = 'Pendente' OR status = 'Pago') 
             RETURNING *`,
            [compra_id]
        );
        res.json({ 
            message: 'Lançamentos financeiros cancelados/estornados com sucesso.', 
            count: result.rowCount 
        });
    } catch (err) {
        console.error('Erro ao cancelar lançamentos financeiros:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});
// ==========================================================

// --- ROTAS DE CONTAS A RECEBER ---
app.get('/lancamentos/receber', async (req, res) => {
    try {
        const query = `
            SELECT 
                lf.id, lf.descricao, lf.valor, lf.data_vencimento, lf.status,
                lf.data_pagamento AS data_recebimento,
                pc.descricao AS plano_de_contas,
                lf.plano_de_contas_id,
                c.nome_completo AS cliente_nome
            FROM lancamentos_financeiros lf
            JOIN plano_de_contas pc ON lf.plano_de_contas_id = pc.id
            LEFT JOIN clientes c ON lf.cliente_id = c.id
            WHERE lf.tipo = 'Entrada'
            ORDER BY 
                CASE WHEN lf.status = 'Pendente' THEN 1 ELSE 2 END, 
                lf.data_vencimento ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar contas a receber:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});
app.patch('/lancamentos/:id/receber', async (req, res) => {
    const { id } = req.params;
    const { data_pagamento, forma_pagamento, conta_bancaria_id, valor_pago } = req.body;
    if (!data_pagamento || !forma_pagamento || !conta_bancaria_id || !valor_pago) {
        return res.status(400).json({ message: 'Dados de recebimento incompletos.' });
    }
    try {
        const result = await pool.query(
            `UPDATE lancamentos_financeiros 
             SET status = 'Recebido', data_pagamento = $1, forma_pagamento = $2, 
                 conta_bancaria_id = $3, valor_pago = $4 
             WHERE id = $5 RETURNING *`,
            [data_pagamento, forma_pagamento, conta_bancaria_id, valor_pago, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Lançamento não encontrado.' });
        }
        res.json({ message: 'Lançamento baixado com sucesso!', lancamento: result.rows[0] });
    } catch (err) {
        console.error('Erro ao marcar como recebido:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// --- ROTAS DE CAIXA ---
app.get('/caixa/status', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM caixa_sessoes WHERE status = 'Aberto' ORDER BY id DESC LIMIT 1");
        if (result.rowCount > 0) {
            res.json({ status: 'Aberto', sessao: result.rows[0] });
        } else {
            res.json({ status: 'Fechado' });
        }
    } catch (err) {
        console.error('Erro ao verificar status do caixa:', err.message);
        res.status(500).send('Erro no servidor');
    }
});
app.post('/caixa/abrir', async (req, res) => {
    const { valor_abertura, usuario_id } = req.body;
    if (!valor_abertura || valor_abertura < 0) {
        return res.status(400).json({ message: 'Valor de abertura (fundo de troco) é obrigatório.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const checkResult = await client.query("SELECT id FROM caixa_sessoes WHERE status = 'Aberto' LIMIT 1");
        if (checkResult.rowCount > 0) {
            return res.status(400).json({ message: 'Não é possível abrir um novo caixa. Um caixa já está aberto (ID: ' + checkResult.rows[0].id + ').' });
        }
        const query = `
            INSERT INTO caixa_sessoes (valor_abertura, usuario_id, status) 
            VALUES ($1, $2, 'Aberto') 
            RETURNING *
        `;
        const result = await client.query(query, [valor_abertura, usuario_id || null]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Caixa aberto com sucesso!', sessao: result.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao abrir caixa:', err.message);
        res.status(500).send('Erro no servidor');
    } finally {
        client.release();
    }
});
app.post('/caixa/fechar', async (req, res) => {
    const { sessao_id, valor_fechamento_contado } = req.body;
    if (!sessao_id || valor_fechamento_contado === undefined) {
        return res.status(400).json({ message: 'ID da sessão e Valor Contado são obrigatórios.' });
    }
    const PLANO_CONTAS_VENDA_ID = 1; // Assumindo ID 1 para Receita de Venda
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const sessaoQuery = "SELECT * FROM caixa_sessoes WHERE id = $1 AND status = 'Aberto' FOR UPDATE";
        const sessaoResult = await client.query(sessaoQuery, [sessao_id]);
        if (sessaoResult.rowCount === 0) {
            throw new Error('Sessão de caixa não encontrada ou já está fechada.');
        }
        const sessao = sessaoResult.rows[0];
        const valor_abertura = parseFloat(sessao.valor_abertura);

        const vendasQuery = `
            SELECT SUM(valor) as total 
            FROM lancamentos_financeiros 
            WHERE tipo = 'Entrada' 
              AND plano_de_contas_id = $1 
              AND data_vencimento >= $2::date
        `;
        const vendasResult = await client.query(vendasQuery, [PLANO_CONTAS_VENDA_ID, sessao.data_abertura]);
        const valor_total_vendas = parseFloat(vendasResult.rows[0].total) || 0;
        const valor_total_sangrias = 0.00;
        const valor_calculado = (valor_abertura + valor_total_vendas - valor_total_sangrias);
        const diferenca = (parseFloat(valor_fechamento_contado) - valor_calculado);

        const updateQuery = `
            UPDATE caixa_sessoes 
            SET data_fechamento = CURRENT_TIMESTAMP,
                valor_total_vendas = $1,
                valor_total_sangrias = $2,
                valor_calculado = $3,
                valor_fechamento_contado = $4,
                diferenca = $5,
                status = 'Fechado'
            WHERE id = $6
            RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [
            valor_total_vendas,
            valor_total_sangrias,
            valor_calculado,
            valor_fechamento_contado,
            diferenca,
            sessao_id
        ]);
        await client.query('COMMIT');
        res.json({ message: 'Caixa fechado com sucesso!', fechamento: updateResult.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao fechar caixa:', err.message);
        res.status(500).send('Erro no servidor');
    } finally {
        client.release();
    }
});


app.listen(PORT, () => {
  console.log(`Serviço Financeiro rodando na porta ${PORT}`);
});