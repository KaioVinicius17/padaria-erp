// services/produtos-service/index.js
// (COMPLETO E ATUALIZADO COM 'status' VINDO DO FRONT-END)

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3003;

app.use(express.json());
app.use(cors());

// --- ROTAS DE PRODUTOS ---

// ROTA ATUALIZADA: LISTAR PRODUTOS (Agora com saldo total)
app.get('/produtos', async (req, res) => {
    const { categoria_id } = req.query; 

    try {
        let query = "SELECT * FROM produtos WHERE status = 'Ativo'"; // <-- SÓ ATIVOS
        const params = [];

        if (categoria_id) {
            query += " AND categoria_id = $1";
            params.push(categoria_id);
        }
        
        query += " ORDER BY nome_item ASC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar produtos (ativos):", err.message);
        res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
    }
});

// ==========================================================
// ROTA NOVA: LISTAR TODOS OS PRODUTOS (para Gerenciamento)
// Busca TODOS os produtos (Ativos e Inativos) e calcula o saldo total
// ==========================================================
app.get('/produtos/gerenciamento', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*, 
                COALESCE(SUM(e.quantidade), 0) as saldo_total
            FROM 
                produtos p
            LEFT JOIN 
                estoque_por_almoxarifado e ON p.id = e.produto_id
            GROUP BY 
                p.id
            ORDER BY 
                p.nome_item ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar produtos (gerenciamento):", err.message);
        res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
    }
});
// ==========================================================

// ROTA: BUSCAR ESTOQUE POR ALMOXARIFADO (Corrigida)
app.get('/produtos/:id/estoque_almoxarifados', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                e.quantidade,
                a.nome AS nome_almoxarifado, -- CORRIGIDO DE a.nome_almoxarifado
                p.estoque_minimo,
                p.estoque_maximo
            FROM 
                estoque_por_almoxarifado e
            JOIN 
                almoxarifados a ON e.almoxarifado_id = a.id
            JOIN
                produtos p ON e.produto_id = p.id
            WHERE 
                e.produto_id = $1;
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar estoque por almoxarifado:", err.message);
        res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
    }
});

// ROTA: BUSCAR PRODUTO PELO CÓDIGO DE BARRAS
app.get('/produtos/barcode/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const query = "SELECT * FROM produtos WHERE codigo_barras = $1 AND status = 'Ativo'";
        const result = await pool.query(query, [code]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar por código de barras:', err.message);
        res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
    }
});

// ROTA: CRIAR NOVO PRODUTO
app.post('/produtos', async (req, res) => {
    const { 
        nome_item, tipo_item, preco_venda, preco_custo, 
        unidade_medida, estoque_minimo, estoque_maximo, categoria_id, codigo_barras, status, custo_medio
    } = req.body;

    try {
        const query = `
            INSERT INTO produtos (
                nome_item, tipo_item, preco_venda, preco_custo, 
                unidade_medida, estoque_minimo, estoque_maximo, categoria_id, status, codigo_barras, custo_medio
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
        
        const params = [
            nome_item, tipo_item, preco_venda || null, preco_custo || null, 
            unidade_medida, estoque_minimo || 0, estoque_maximo || 1000, categoria_id || null,
            status || 'Ativo', codigo_barras || null, custo_medio || 0
        ];
        const result = await pool.query(query, params);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar produto:', err.message);
        res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
    }
});

// ROTA: ATUALIZAR PRODUTO
app.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        nome_item, tipo_item, preco_venda, preco_custo, 
        unidade_medida, estoque_minimo, estoque_maximo, categoria_id, codigo_barras, status, custo_medio
    } = req.body;

    try {
        const query = `
            UPDATE produtos SET 
                nome_item = $1, tipo_item = $2, preco_venda = $3, 
                preco_custo = $4, unidade_medida = $5, estoque_minimo = $6, 
                estoque_maximo = $7, categoria_id = $8, codigo_barras = $9, 
                status = $10, custo_medio = $11
            WHERE id = $12 RETURNING *`;
        
        const params = [
            nome_item, tipo_item, preco_venda || null, preco_custo || null, 
            unidade_medida, estoque_minimo || 0, estoque_maximo || 1000, categoria_id || null,
            codigo_barras || null, status || 'Ativo', custo_medio || 0,
            id
        ];
        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar produto:', err.message);
        res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
    }
});

// ROTA DE DELEÇÃO PERMANENTE (HARD DELETE)
app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect(); 
    console.log(`Iniciando deleção permanente do produto ID: ${id}`);
    try {
        await client.query('BEGIN');
        console.log(`Limpando 'ordens_producao_itens'...`);
        await client.query("DELETE FROM ordens_producao_itens WHERE produto_final_id = $1", [id]);
        console.log(`Limpando 'compra_itens'...`);
        await client.query("DELETE FROM compra_itens WHERE produto_id = $1", [id]);
        console.log(`Limpando 'estoque_por_almoxarifado'...`);
        await client.query("DELETE FROM estoque_por_almoxarifado WHERE produto_id = $1", [id]);
        console.log(`Deletando produto 'produtos'...`);
        await client.query("DELETE FROM pedido_compra_itens WHERE produto_id = $1", [id]);
        const result = await client.query("DELETE FROM produtos WHERE id = $1 RETURNING *", [id]);
        if (result.rowCount === 0) {
            console.log('Produto não encontrado, mas a limpeza foi executada.');
        }
        await client.query('COMMIT'); 
        console.log(`Produto ID: ${id} DELETADO com sucesso.`);
        res.json({ message: 'Produto e todo o seu histórico de teste foram DELETADOS permanentemente!' });
    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error('Erro ao deletar produto (ROLLBACK EXECUTADO):', err.message);
        res.status(500).json({ message: 'Erro no servidor. A deleção foi revertida.' });
    } finally {
        client.release();
    }
});

// --- ROTAS DE CATEGORIAS ---

// ROTA: LISTAR TODAS AS CATEGORIAS (para Gerenciamento)
// Agora busca TODOS (Ativos e Inativos) e CONTA os produtos vinculados
app.get('/categorias', async (req, res) => {
    try {
        // Query para contar produtos vinculados
        const query = `
            SELECT 
                c.*, 
                COUNT(p.id) AS produtos_vinculados
            FROM 
                categorias c
            LEFT JOIN 
                produtos p ON c.id = p.categoria_id
            GROUP BY 
                c.id
            ORDER BY 
                c.nome ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar categorias:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ROTA: CRIAR NOVA CATEGORIA (Atualizada com status)
app.post('/categorias', async (req, res) => {
    const { nome, tipo_item, status } = req.body;
    if (!nome) {
        return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    }
    try {
        const query = "INSERT INTO categorias (nome, tipo_item, status) VALUES ($1, $2, $3) RETURNING *";
        const result = await pool.query(query, [nome, tipo_item || null, status || 'Ativo']);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar categoria:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ROTA: ATUALIZAR CATEGORIA (Atualizada com status)
app.put('/categorias/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, tipo_item, status } = req.body;
    if (!nome) {
        return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
    }
    try {
        const query = "UPDATE categorias SET nome = $1, tipo_item = $2, status = $3 WHERE id = $4 RETURNING *";
        const result = await pool.query(query, [nome, tipo_item || null, status || 'Ativo', id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar categoria:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ROTA: DELETAR CATEGORIA
app.delete('/categorias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE produtos SET categoria_id = NULL WHERE categoria_id = $1", [id]);
        const result = await pool.query("DELETE FROM categorias WHERE id = $1 RETURNING *", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria deletada com sucesso.' });
    } catch (err) {
        console.error('Erro ao deletar categoria:', err.message);
        res.status(500).send('Erro no servidor');
    }
});

// ==========================================================
// ROTA: LISTAR ALMOXARIFADOS
// (CORRIGIDA: Ordenando por 'nome' em vez de 'nome_almoxarifado')
// ==========================================================
app.get('/almoxarifados', async (req, res) => {
    try {
        // (Assumindo que sua coluna se chama 'nome')
        const result = await pool.query("SELECT * FROM almoxarifados ORDER BY nome ASC");
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar almoxarifados:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});
// ==========================================================

// ROTA: Posição Detalhada de Estoque
app.get('/estoque/detalhado', async (req, res) => {
    try {
        const query = `
            SELECT 
                e.produto_id,
                p.nome_item,
                p.unidade_medida,
                e.almoxarifado_id,
                a.nome as nome_almoxarifado,
                e.quantidade
            FROM 
                estoque_por_almoxarifado e
            JOIN 
                produtos p ON e.produto_id = p.id
            JOIN 
                almoxarifados a ON e.almoxarifado_id = a.id
            ORDER BY 
                p.nome_item, a.nome;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar estoque detalhado:", err.message);
        res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
    }
});

// ROTA: TRANSFERÊNCIA DE ESTOQUE (com Log)
app.post('/estoque/transferir', async (req, res) => {
    const { 
        produto_id, 
        almoxarifado_origem_id, 
        almoxarifado_destino_id, 
        quantidade, 
        usuario_id 
    } = req.body;

    if (!produto_id || !almoxarifado_origem_id || !almoxarifado_destino_id || !quantidade) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    if (quantidade <= 0) {
        return res.status(400).json({ message: 'A quantidade deve ser positiva.' });
    }
    if (almoxarifado_origem_id === almoxarifado_destino_id) {
        return res.status(400).json({ message: 'Origem e Destino não podem ser iguais.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); 

        const estoqueOrigem = await client.query(
            `SELECT quantidade FROM estoque_por_almoxarifado 
             WHERE produto_id = $1 AND almoxarifado_id = $2`,
            [produto_id, almoxarifado_origem_id]
        );

        if (estoqueOrigem.rowCount === 0 || estoqueOrigem.rows[0].quantidade < quantidade) {
            throw new Error('Estoque insuficiente no almoxarifado de origem.');
        }

        await client.query(
            `UPDATE estoque_por_almoxarifado 
             SET quantidade = quantidade - $1 
             WHERE produto_id = $2 AND almoxarifado_id = $3`,
            [quantidade, produto_id, almoxarifado_origem_id]
        );

        const upsertQuery = `
            INSERT INTO estoque_por_almoxarifado (produto_id, almoxarifado_id, quantidade)
            VALUES ($1, $2, $3)
            ON CONFLICT (produto_id, almoxarifado_id)
            DO UPDATE SET quantidade = estoque_por_almoxarifado.quantidade + EXCLUDED.quantidade;
        `;
        await client.query(upsertQuery, [produto_id, almoxarifado_destino_id, quantidade]);
        
        await client.query(
            `INSERT INTO transferencias_log (produto_id, almoxarifado_origem_id, almoxarifado_destino_id, quantidade, usuario_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [produto_id, almoxarifado_origem_id, almoxarifado_destino_id, quantidade, usuario_id || null]
        );

        await client.query('COMMIT'); 
        res.status(200).json({ message: 'Transferência realizada com sucesso!' });

    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error('Erro ao transferir estoque:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    } finally {
        client.release();
    }
});

// ==========================================================
// ROTA QUE FALTAVA (Erro 404): Histórico de Transferências
// ==========================================================
app.get('/estoque/transferencias', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id,
                t.data_transferencia,
                t.quantidade,
                p.nome_item,
                p.unidade_medida,
                origem.nome AS almoxarifado_origem,
                destino.nome AS almoxarifado_destino
            FROM 
                transferencias_log t
            JOIN 
                produtos p ON t.produto_id = p.id
            JOIN 
                almoxarifados origem ON t.almoxarifado_origem_id = origem.id
            JOIN 
                almoxarifados destino ON t.almoxarifado_destino_id = destino.id
            ORDER BY 
                t.data_transferencia DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar histórico de transferências:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ==========================================================
// INÍCIO: NOVAS ROTAS DE TRANSFERÊNCIA (Estilo Compras)
// ==========================================================

// ROTA 1: LISTAR todas as transferências
// (Esta era a rota que estava quebrando com 500)
// CORREÇÃO: Removido /estoque/ do path
app.get('/transferencias', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id,
                t.status,
                t.data_criacao,
                t.data_finalizacao,
                t.observacoes,
                origem.nome AS almoxarifado_origem,
                destino.nome AS almoxarifado_destino,
                COUNT(ti.id) AS total_itens
            FROM 
                transferencias t
            JOIN 
                almoxarifados origem ON t.almoxarifado_origem_id = origem.id
            JOIN 
                almoxarifados destino ON t.almoxarifado_destino_id = destino.id
            LEFT JOIN
                transferencia_itens ti ON t.id = ti.transferencia_id
            GROUP BY
                t.id, origem.nome, destino.nome
            ORDER BY 
                t.data_criacao DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar transferências:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 2: CRIAR RASCUNHO (Etapa 1 do Form)
app.post('/transferencias', async (req, res) => {
    const { almoxarifado_origem_id, almoxarifado_destino_id, observacoes } = req.body;
    if (!almoxarifado_origem_id || !almoxarifado_destino_id) {
        return res.status(400).json({ message: 'Origem e Destino são obrigatórios.' });
    }
    if (String(almoxarifado_origem_id) === String(almoxarifado_destino_id)) {
        return res.status(400).json({ message: 'Origem e Destino não podem ser iguais.' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO transferencias (almoxarifado_origem_id, almoxarifado_destino_id, observacoes, status)
             VALUES ($1, $2, $3, 'Aberta') RETURNING *`,
            [almoxarifado_origem_id, almoxarifado_destino_id, observacoes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar rascunho de transferência:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 3: BUSCAR UMA TRANSFERÊNCIA (para Edição)
app.get('/transferencias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let transferencia, itens;
        const transfResult = await pool.query("SELECT * FROM transferencias WHERE id = $1", [id]);
        if (transfResult.rowCount === 0) {
            return res.status(404).json({ message: 'Transferência não encontrada.' });
        }
        transferencia = transfResult.rows[0];
        const itensQuery = `
            SELECT 
                ti.produto_id, 
                ti.quantidade, 
                p.nome_item AS nome
            FROM transferencia_itens ti
            JOIN produtos p ON ti.produto_id = p.id
            WHERE ti.transferencia_id = $1
        `;
        const itensResult = await pool.query(itensQuery, [id]);
        itens = itensResult.rows;
        res.json({ transferencia, itens });
    } catch (err) {
        console.error('Erro ao buscar transferência completa:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 4: ATUALIZAR TRANSFERÊNCIA (Salvar Itens - Etapa 2)
app.put('/transferencias/:id', async (req, res) => {
    const { id } = req.params;
    const { almoxarifado_origem_id, almoxarifado_destino_id, observacoes, itens } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `UPDATE transferencias SET 
             almoxarifado_origem_id = $1, 
             almoxarifado_destino_id = $2, 
             observacoes = $3
             WHERE id = $4 AND status = 'Aberta'`,
            [almoxarifado_origem_id, almoxarifado_destino_id, observacoes, id]
        );
        await client.query('DELETE FROM transferencia_itens WHERE transferencia_id = $1', [id]);
        if (itens && itens.length > 0) {
            for (const item of itens) {
                await client.query(
                    'INSERT INTO transferencia_itens (transferencia_id, produto_id, quantidade) VALUES ($1, $2, $3)',
                    [id, item.produto_id, item.quantidade]
                );
            }
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Transferência atualizada com sucesso!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao ATUALIZAR transferência:', err.message);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 5: FINALIZAR (Mover o Estoque)
app.patch('/transferencias/:id/finalizar', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const transfResult = await client.query("SELECT * FROM transferencias WHERE id = $1 AND status = 'Aberta'", [id]);
        if (transfResult.rowCount === 0) {
            throw new Error('Transferência não encontrada ou já foi finalizada/cancelada.');
        }
        const transf = transfResult.rows[0];
        const itensResult = await client.query('SELECT * FROM transferencia_itens WHERE transferencia_id = $1', [id]);
        const itens = itensResult.rows;
        if (itens.length === 0) {
            throw new Error('Não é possível finalizar uma transferência sem itens.');
        }
        for (const item of itens) {
            const estoqueOrigem = await client.query(
                `SELECT quantidade FROM estoque_por_almoxarifado 
                 WHERE produto_id = $1 AND almoxarifado_id = $2`,
                [item.produto_id, transf.almoxarifado_origem_id]
            );
            if (estoqueOrigem.rowCount === 0 || estoqueOrigem.rows[0].quantidade < item.quantidade) {
                throw new Error(`Estoque insuficiente para o produto ID ${item.produto_id} na origem.`);
            }
            await client.query(
                `UPDATE estoque_por_almoxarifado SET quantidade = quantidade - $1 
                 WHERE produto_id = $2 AND almoxarifado_id = $3`,
                [item.quantidade, item.produto_id, transf.almoxarifado_origem_id]
            );
            await client.query(
                `INSERT INTO estoque_por_almoxarifado (produto_id, almoxarifado_id, quantidade)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (produto_id, almoxarifado_id)
                 DO UPDATE SET quantidade = estoque_por_almoxarifado.quantidade + EXCLUDED.quantidade`,
                [item.produto_id, transf.almoxarifado_destino_id, item.quantidade]
            );
        }
        await client.query(
            "UPDATE transferencias SET status = 'Finalizada', data_finalizacao = CURRENT_TIMESTAMP WHERE id = $1", 
            [id]
        );
        await client.query('COMMIT');
        res.json({ message: 'Transferência Finalizada! Estoque movimentado.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao finalizar transferência:', err.message);
        res.status(500).json({ message: err.message, error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 6: CANCELAR (Deletar rascunho ou Estornar)
app.patch('/transferencias/:id/cancelar', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const transfResult = await client.query("SELECT * FROM transferencias WHERE id = $1", [id]);
        if (transfResult.rowCount === 0) throw new Error('Transferência não encontrada.');
        const transf = transfResult.rows[0];
        if (transf.status === 'Finalizada') {
            const itensResult = await client.query('SELECT * FROM transferencia_itens WHERE transferencia_id = $1', [id]);
            for (const item of itensResult.rows) {
                const estoqueDestino = await client.query(
                    `SELECT quantidade FROM estoque_por_almoxarifado 
                     WHERE produto_id = $1 AND almoxarifado_id = $2`,
                    [item.produto_id, transf.almoxarifado_destino_id]
                );
                if (estoqueDestino.rowCount === 0 || estoqueDestino.rows[0].quantidade < item.quantidade) {
                    throw new Error(`Estoque insuficiente no destino para estornar o produto ID ${item.produto_id}.`);
                }
                await client.query(
                    `UPDATE estoque_por_almoxarifado SET quantidade = quantidade - $1 
                     WHERE produto_id = $2 AND almoxarifado_id = $3`,
                    [item.quantidade, item.produto_id, transf.almoxarifado_destino_id]
                );
                await client.query(
                    `INSERT INTO estoque_por_almoxarifado (produto_id, almoxarifado_id, quantidade)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (produto_id, almoxarifado_id)
                     DO UPDATE SET quantidade = estoque_por_almoxarifado.quantidade + EXCLUDED.quantidade`,
                    [item.produto_id, transf.almoxarifado_origem_id, item.quantidade]
                );
            }
        }
        await client.query("UPDATE transferencias SET status = 'Cancelada' WHERE id = $1", [id]);
        await client.query('COMMIT');
        res.json({ message: 'Transferência cancelada com sucesso.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao cancelar transferência:', err.message);
        res.status(500).json({ message: err.message, error: err.message });
    } finally {
        client.release();
    }
});
// ==========================================================
// FIM: NOVAS ROTAS DE TRANSFERÊNCIA
// ==========================================================

// --- INICIAR SERVIÇO ---
app.listen(PORT, () => {
  console.log(`Serviço de Produtos rodando na porta ${PORT}`);
});