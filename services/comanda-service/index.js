// index.js (comanda-service)
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3006; // Porta do novo serviço

app.use(express.json());
app.use(cors());

// ROTA 1: CRIAR UMA NOVA COMANDA (Usada pelo Atendente do Balcão)
app.post('/comandas', async (req, res) => {
    const { itens } = req.body; // Recebe uma lista de itens

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ message: 'A lista de itens é obrigatória.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Cria o "cabeçalho" da comanda
        const comandaQuery = "INSERT INTO comandas (status) VALUES ('Pendente') RETURNING id";
        const comandaResult = await client.query(comandaQuery);
        const comandaId = comandaResult.rows[0].id;

        // 2. Insere cada item na comanda
        for (const item of itens) {
            if (!item.produto_id || !item.quantidade || !item.valor_unitario_momento) {
                throw new Error('Item inválido. Faltam dados.');
            }
            
            const itemQuery = `
                INSERT INTO comanda_itens (comanda_id, produto_id, quantidade, valor_unitario_momento)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(itemQuery, [
                comandaId,
                item.produto_id,
                item.quantidade,
                item.valor_unitario_momento
            ]);
        }

        await client.query('COMMIT');
        
        // Retorna a comanda criada, principalmente o ID (que será o código #582)
        res.status(201).json({ message: 'Comanda criada com sucesso!', comanda_id: comandaId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar comanda:', err.message);
        res.status(500).send('Erro no servidor');
    } finally {
        client.release();
    }
});

// ROTA 2: BUSCAR UMA COMANDA E SEUS ITENS (Usada pelo Caixa/PDV)
app.get('/comandas/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Busca a comanda
        const comandaResult = await pool.query("SELECT * FROM comandas WHERE id = $1", [id]);
        if (comandaResult.rowCount === 0) {
            return res.status(404).json({ message: 'Comanda não encontrada.' });
        }
        
        const comanda = comandaResult.rows[0];
        
        // 2. Se já foi faturada, não pode ser puxada de novo
        if (comanda.status === 'Faturada') {
             return res.status(400).json({ message: 'Esta comanda já foi faturada (paga).' });
        }

        // 3. Busca os itens da comanda
        // (Usamos JOIN para já trazer o nome e preço atual do produto, caso necessário)
        const itensQuery = `
            SELECT 
                ci.*, 
                p.nome_item, 
                p.preco_venda as preco_atual 
            FROM comanda_itens ci
            JOIN produtos p ON ci.produto_id = p.id
            WHERE ci.comanda_id = $1
        `;
        const itensResult = await pool.query(itensQuery, [id]);

        // Retorna a comanda e a lista de itens
        res.json({ 
            comanda: comanda, 
            itens: itensResult.rows 
        });

    } catch (err) {
        console.error('Erro ao buscar comanda:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ROTA 3: MARCAR UMA COMANDA COMO 'FATURADA' (Chamada pelo 'vendas-service')
// Quando o PDV finaliza a venda, ele precisa "fechar" a comanda
app.patch('/comandas/:id/faturar', async (req, res) => {
    const { id } = req.params;
    const { venda_id } = req.body; // Opcional: ID da venda que a pagou

    try {
        const result = await pool.query(
            "UPDATE comandas SET status = 'Faturada', venda_id = $1 WHERE id = $2 RETURNING *",
            [venda_id || null, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Comanda não encontrada.' });
        }
        
        res.json({ message: 'Comanda faturada com sucesso!', comanda: result.rows[0] });
    } catch (err) {
        console.error('Erro ao faturar comanda:', err.message);
        res.status(500).send('Erro no servidor');
    }
});


app.listen(PORT, () => {
  console.log(`Serviço de Comandas rodando na porta ${PORT}`);
});