const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3005;

app.use(express.json());
app.use(cors());

// ROTA: CRIAR uma nova Ficha Técnica
app.post('/fichas-tecnicas', async (req, res) => {
    // Agora salvamos também o tipo_producao
    const { produto_final_id, descricao, itens, tipo_producao } = req.body;
    
    if (!produto_final_id || !itens || itens.length === 0 || !tipo_producao) {
        return res.status(400).json({ message: 'Dados inválidos.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const fichaQuery = 'INSERT INTO fichas_tecnicas (produto_final_id, descricao, tipo_producao) VALUES ($1, $2, $3) RETURNING id';
        const fichaResult = await client.query(fichaQuery, [produto_final_id, descricao, tipo_producao]);
        const fichaId = fichaResult.rows[0].id;

        for (const item of itens) {
            await client.query(
                'INSERT INTO fichas_tecnicas_itens (ficha_tecnica_id, insumo_id, quantidade_insumo) VALUES ($1, $2, $3)',
                [fichaId, item.insumo_id, item.quantidade_insumo]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Ficha técnica criada com sucesso!', ficha_tecnica_id: fichaId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar ficha técnica:', err.message);
        res.status(500).send('Erro no servidor');
    } finally {
        client.release();
    }
});

app.get('/fichas-tecnicas', async (req, res) => {
    try {
        const query = `
            SELECT 
                ft.id,
                ft.descricao,
                ft.tipo_producao,
                p.nome_item AS produto_final_nome,
                ft.produto_final_id
            FROM fichas_tecnicas ft
            JOIN produtos p ON ft.produto_final_id = p.id
            ORDER BY p.nome_item;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar fichas técnicas:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// --- NOVA ROTA ADICIONADA ---
// ROTA: DELETAR uma Ficha Técnica
app.delete('/fichas-tecnicas/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Primeiro, deleta os itens associados na tabela 'fichas_tecnicas_itens'
        await client.query('DELETE FROM fichas_tecnicas_itens WHERE ficha_tecnica_id = $1', [id]);
        // Depois, deleta a ficha principal
        const result = await client.query('DELETE FROM fichas_tecnicas WHERE id = $1 RETURNING *', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Ficha técnica não encontrada.' });
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Ficha técnica deletada com sucesso.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao deletar ficha técnica:', err.message);
        res.status(500).send('Erro no servidor');
    } finally {
        client.release();
    }
});

app.post('/ordens-producao', async (req, res) => {
    const { descricao, itens } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ message: 'A ordem de produção deve conter pelo menos um item.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insere a ordem de produção principal
        const ordemQuery = 'INSERT INTO ordens_producao (descricao) VALUES ($1) RETURNING id';
        const ordemResult = await client.query(ordemQuery, [descricao]);
        const ordemId = ordemResult.rows[0].id;

        // 2. Insere cada item da ordem de produção
        for (const item of itens) {
            await client.query(
                `INSERT INTO ordens_producao_itens 
                (ordem_producao_id, produto_final_id, ficha_tecnica_id, quantidade_a_produzir, almoxarifado_destino_id) 
                VALUES ($1, $2, $3, $4, $5)`,
                [ordemId, item.produto_final_id, item.ficha_tecnica_id, item.quantidade_a_produzir, item.almoxarifado_destino_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Ordem de produção criada com sucesso!', ordem_id: ordemId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar ordem de produção:', err.message);
        res.status(500).send('Erro no servidor');
    } finally {
        client.release();
    }
});

// ROTA: LISTAR todas as Ordens de Produção
app.get('/ordens-producao', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ordens_producao ORDER BY data_producao DESC, id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar ordens de produção:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

app.get('/ordens-producao/:id/detalhes', async (req, res) => {
    const { id } = req.params;
    try {
        // Query atualizada para buscar também o tipo_producao da ficha técnica
        const itensOrdemQuery = `
            SELECT 
                opi.quantidade_a_produzir,
                opi.ficha_tecnica_id,
                opi.produto_final_id,
                p.nome_item AS produto_final_nome,
                ft.tipo_producao 
            FROM ordens_producao_itens opi
            JOIN produtos p ON opi.produto_final_id = p.id
            JOIN fichas_tecnicas ft ON opi.ficha_tecnica_id = ft.id
            WHERE opi.ordem_producao_id = $1;
        `;
        const itensOrdemResult = await pool.query(itensOrdemQuery, [id]);
        if (itensOrdemResult.rows.length === 0) {
            return res.json([]);
        }

        let receitaCalculada = [];
        for (const item of itensOrdemResult.rows) {
            const insumosResult = await pool.query(
                `SELECT fti.quantidade_insumo, p.nome_item, p.unidade_medida 
                 FROM fichas_tecnicas_itens fti
                 JOIN produtos p ON fti.insumo_id = p.id
                 WHERE fti.ficha_tecnica_id = $1`,
                [item.ficha_tecnica_id]
            );

            const insumosCalculados = insumosResult.rows.map(insumo => ({
                ...insumo,
                quantidade_necessaria: insumo.quantidade_insumo * item.quantidade_a_produzir
            }));

            receitaCalculada.push({
                produto_final_nome: item.produto_final_nome,
                quantidade_a_produzir: item.quantidade_a_produzir,
                tipo_producao: item.tipo_producao, // Adiciona o tipo de produção à resposta
                ingredientes: insumosCalculados
            });
        }
        
        res.json(receitaCalculada);
    } catch (err) {
        console.error('Erro ao buscar detalhes da ordem:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// --- NOVA ROTA ADICIONADA ---
// ROTA: CONCLUIR uma Ordem de Produção (movimentar estoque)
app.patch('/ordens-producao/:id/concluir', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Busca todos os itens da ordem de produção
        const itensResult = await client.query('SELECT * FROM ordens_producao_itens WHERE ordem_producao_id = $1', [id]);
        const itensDaOrdem = itensResult.rows;

        for (const item of itensDaOrdem) {
            // 2. Para cada item, busca os insumos da sua ficha técnica
            const insumosResult = await client.query('SELECT * FROM fichas_tecnicas_itens WHERE ficha_tecnica_id = $1', [item.ficha_tecnica_id]);
            const insumosDaReceita = insumosResult.rows;

            // 3. Dá baixa nos insumos (assume que os insumos saem do primeiro almoxarifado, ID 1 - pode ser aprimorado no futuro)
            for (const insumo of insumosDaReceita) {
                const quantidadeNecessaria = insumo.quantidade_insumo * item.quantidade_a_produzir;
                await client.query(
                    `UPDATE estoque_por_almoxarifado 
                     SET quantidade = quantidade - $1 
                     WHERE produto_id = $2 AND almoxarifado_id = 1`, // Usando Almoxarifado Principal (ID 1) como padrão
                    [quantidadeNecessaria, insumo.insumo_id]
                );
            }

            // 4. Dá entrada no produto final no almoxarifado de destino
            const stockUpdateQuery = `
              INSERT INTO estoque_por_almoxarifado (produto_id, almoxarifado_id, quantidade)
              VALUES ($1, $2, $3)
              ON CONFLICT (produto_id, almoxarifado_id)
              DO UPDATE SET quantidade = estoque_por_almoxarifado.quantidade + EXCLUDED.quantidade;
            `;
            await client.query(stockUpdateQuery, [item.produto_final_id, item.almoxarifado_destino_id, item.quantidade_a_produzir]);
        }

        // 5. Atualiza o status da ordem de produção para "Concluída"
        await client.query(`UPDATE ordens_producao SET status = 'Concluída' WHERE id = $1`, [id]);

        await client.query('COMMIT');
        res.json({ message: 'Ordem de produção concluída e estoque atualizado com sucesso!' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao concluir ordem de produção:', err.message);
        res.status(500).send('Erro no servidor');
    } finally {
        client.release();
    }
});

app.listen(PORT, () => {
    console.log(`Serviço de Produção rodando na porta ${PORT}`);
});
