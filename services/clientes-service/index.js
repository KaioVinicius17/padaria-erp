// services/clientes-service/index.js
// (COMPLETO E ATUALIZADO para salvar Status e Endereço)

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(cors());

// ROTA 1: LISTAR CLIENTES
app.get('/clientes', async (req, res) => {
    try {
        const query = "SELECT * FROM clientes ORDER BY nome_completo ASC";
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar clientes:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// ROTA 2: CRIAR NOVO CLIENTE
app.post('/clientes', async (req, res) => {
    // ==========================================================
    // LOG DE DEBUG:
    console.log('[CLIENTE-SERVICE] Recebido para CRIAR:', req.body);
    // ==========================================================
    
    const { 
        nome_completo, cpf_cnpj, telefone, email, status,
        cep, logradouro, numero, complemento, bairro, cidade, estado
    } = req.body;

    if (!nome_completo) {
        return res.status(400).json({ message: 'Nome é obrigatório.' });
    }

    try {
        const query = `
            INSERT INTO clientes (
                nome_completo, cpf_cnpj, telefone, email, status, 
                cep, logradouro, numero, complemento, bairro, cidade, estado
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING *
        `;
        const params = [
            nome_completo, cpf_cnpj || null, telefone || null, email || null, status || 'Ativo',
            cep || null, logradouro || null, numero || null, complemento || null, 
            bairro || null, cidade || null, estado || null
        ];
        
        const result = await pool.query(query, params);
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao criar cliente:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// ROTA 3: ATUALIZAR CLIENTE
app.put('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    
    // ==========================================================
    // LOG DE DEBUG:
    console.log(`[CLIENTE-SERVICE] Recebido para ATUALIZAR ID ${id}:`, req.body);
    // ==========================================================
    
    const { 
        nome_completo, cpf_cnpj, telefone, email, status,
        cep, logradouro, numero, complemento, bairro, cidade, estado
    } = req.body;

    if (!nome_completo) {
        return res.status(400).json({ message: 'Nome é obrigatório.' });
    }

    try {
        const query = `
            UPDATE clientes SET
                nome_completo = $1, cpf_cnpj = $2, telefone = $3, email = $4, status = $5, 
                cep = $6, logradouro = $7, numero = $8, complemento = $9, 
                bairro = $10, cidade = $11, estado = $12
            WHERE id = $13
            RETURNING *
        `;
        const params = [
            nome_completo, cpf_cnpj || null, telefone || null, email || null, status || 'Ativo',
            cep || null, logradouro || null, numero || null, complemento || null, 
            bairro || null, cidade || null, estado || null,
            id
        ];

        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }
        res.json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar cliente:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});
// ROTA 4: DELETAR CLIENTE (Hard Delete para testes)
app.delete('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    console.log(`Iniciando deleção permanente do cliente ID: ${id}`);
    
    try {
        await client.query('BEGIN');
        await client.query("UPDATE vendas SET cliente_id = NULL WHERE cliente_id = $1", [id]);
        await client.query("UPDATE lancamentos_financeiros SET cliente_id = NULL WHERE cliente_id = $1", [id]);
        const result = await client.query("DELETE FROM clientes WHERE id = $1 RETURNING *", [id]);
        
        if (result.rowCount === 0) {
            throw new Error('Cliente não encontrado.');
        }

        await client.query('COMMIT');
        res.json({ message: 'Cliente deletado com sucesso (teste).' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao deletar cliente:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    } finally {
        client.release();
    }
});


app.listen(PORT, () => {
  console.log(`Serviço de Clientes rodando na porta ${PORT}`);
});