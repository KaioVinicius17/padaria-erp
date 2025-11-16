// services/fornecedores-service/index.js
// (Serviço completo para gerenciar fornecedores)

const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Assumindo que o db.js está na mesma pasta

const app = express();
const PORT = 3001; // Defina a porta (ex: 3001)

app.use(express.json());
app.use(cors());

// ROTA 1: LISTAR (para Gerenciamento)
// Busca TODOS (Ativos e Inativos)
app.get('/fornecedores', async (req, res) => {
    try {
        const query = "SELECT * FROM fornecedores ORDER BY razao_social ASC";
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar fornecedores:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// ROTA 2: LISTAR (para Operações)
// Busca APENAS ATIVOS (para Compras, etc.)
app.get('/fornecedores/ativos', async (req, res) => {
    try {
        const query = "SELECT * FROM fornecedores WHERE status = 'Ativo' ORDER BY nome_fantasia ASC";
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar fornecedores ativos:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});


// ROTA 3: CRIAR NOVO FORNECEDOR
app.post('/fornecedores', async (req, res) => {
    const { 
        razao_social, nome_fantasia, cnpj, telefone, email, status,
        cep, logradouro, numero, complemento, bairro, cidade, estado
    } = req.body;

    if (!razao_social) {
        return res.status(400).json({ message: 'Razão Social é obrigatória.' });
    }

    try {
        const query = `
            INSERT INTO fornecedores (
                razao_social, nome_fantasia, cnpj, telefone, email, status, 
                cep, logradouro, numero, complemento, bairro, cidade, estado
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *
        `;
        const params = [
            razao_social, nome_fantasia || null, cnpj || null, telefone || null, email || null, status || 'Ativo',
            cep || null, logradouro || null, numero || null, complemento || null, 
            bairro || null, cidade || null, estado || null
        ];
        
        const result = await pool.query(query, params);
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao criar fornecedor:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// ROTA 4: ATUALIZAR FORNECEDOR
app.put('/fornecedores/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        razao_social, nome_fantasia, cnpj, telefone, email, status,
        cep, logradouro, numero, complemento, bairro, cidade, estado
    } = req.body;

    if (!razao_social) {
        return res.status(400).json({ message: 'Razão Social é obrigatória.' });
    }

    try {
        const query = `
            UPDATE fornecedores SET
                razao_social = $1, nome_fantasia = $2, cnpj = $3, telefone = $4, email = $5, status = $6, 
                cep = $7, logradouro = $8, numero = $9, complemento = $10, 
                bairro = $11, cidade = $12, estado = $13
            WHERE id = $14
            RETURNING *
        `;
        const params = [
            razao_social, nome_fantasia || null, cnpj || null, telefone || null, email || null, status || 'Ativo',
            cep || null, logradouro || null, numero || null, complemento || null, 
            bairro || null, cidade || null, estado || null,
            id
        ];

        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Fornecedor não encontrado.' });
        }
        res.json(result.rows[0]);

    } catch (err) {
        console.error('Erro ao atualizar fornecedor:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// ROTA 5: DELETAR FORNECEDOR (Hard Delete para testes)
app.delete('/fornecedores/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Desvincula de 'compras'
        await client.query("UPDATE compras SET fornecedor_id = NULL WHERE fornecedor_id = $1", [id]);
        
        // Desvincula de 'lancamentos_financeiros'
        await client.query("UPDATE lancamentos_financeiros SET fornecedor_id = NULL WHERE fornecedor_id = $1", [id]);
        
        // Deleta o fornecedor
        const result = await client.query("DELETE FROM fornecedores WHERE id = $1 RETURNING *", [id]);
        
        if (result.rowCount === 0) {
            throw new Error('Fornecedor não encontrado.');
        }

        await client.query('COMMIT');
        res.json({ message: 'Fornecedor deletado com sucesso (teste).' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao deletar fornecedor:', err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    } finally {
        client.release();
    }
});


app.listen(PORT, () => {
  console.log(`Serviço de Fornecedores rodando na porta ${PORT}`);
});