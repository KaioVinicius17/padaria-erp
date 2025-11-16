// services/compras-service/index.js
// (COMPLETO - Refatorado para fluxo "Salvar e Seguir")

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const pool = require('./db');

const app = express();
const PORT = 3004;

app.use(express.json());
app.use(cors());

const FINANCEIRO_SERVICE_URL = 'http://localhost:3007';
const PRODUTOS_SERVICE_URL = 'http://localhost:3003'; 

// ROTA 1: LISTAR COMPRAS (para Gerenciamento)
app.get('/compras', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id, c.data_emissao, c.numero_nota, c.valor_total, c.status,
                c.almoxarifado_id, c.plano_de_contas_id, c.fornecedor_id,
                c.observacoes, c.dados_pagamento,
                f.nome_fantasia 
            FROM compras c
            LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
            ORDER BY c.data_emissao DESC, c.id DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar compras:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 2: BUSCAR UMA COMPRA COMPLETA (para Edição)
// (Esta rota era a que faltava para a Edição funcionar)
app.get('/compras/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let compra, itens;
        
        const compraResult = await pool.query("SELECT * FROM compras WHERE id = $1", [id]);
        if (compraResult.rowCount === 0) {
            return res.status(404).json({ message: 'Compra não encontrada.' });
        }
        compra = compraResult.rows[0];

        // Busca os itens da compra (com nome do produto)
        const itensQuery = `
            SELECT 
                ci.produto_id, 
                ci.quantidade, 
                ci.valor_unitario,
                p.nome_item AS nome
            FROM compra_itens ci
            JOIN produtos p ON ci.produto_id = p.id
            WHERE ci.compra_id = $1
        `;
        const itensResult = await pool.query(itensQuery, [id]);
        itens = itensResult.rows;
        
        // Retorna o objeto completo que o PurchaseForm espera
        res.json({ 
            compra: compra, // Contém o cabeçalho e os dados_pagamento
            itens: itens    // Contém os itens formatados
        });

    } catch (err) {
        console.error('Erro ao buscar compra completa:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 3: BUSCAR ITENS (para o colapso da tabela)
app.get('/compras/:id/itens', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT ci.quantidade, ci.valor_unitario, p.nome_item, p.unidade_medida
            FROM compra_itens ci
            JOIN produtos p ON ci.produto_id = p.id
            WHERE ci.compra_id = $1
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar itens da compra:', err.message);
        res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
});

// ROTA 4: REGISTRAR RASCUNHO DA COMPRA (Etapa 1)
app.post('/compras', async (req, res) => {
    const { 
        fornecedor_id, 
        numero_nota, 
        almoxarifado_id,
        observacoes
    } = req.body; // Só recebe dados da Etapa 1

    if (!fornecedor_id || !almoxarifado_id) {
        return res.status(400).json({ message: 'Fornecedor e Almoxarifado são obrigatórios.' });
    }

    const client = await pool.connect();
    try {
        const compraQuery = `
            INSERT INTO compras (
                fornecedor_id, numero_nota, almoxarifado_id, observacoes,
                status, data_emissao, valor_total
            ) 
            VALUES ($1, $2, $3, $4, 'Aberta', CURRENT_DATE, 0) 
            RETURNING *
        `;
        
        const compraResult = await client.query(compraQuery, [
            fornecedor_id, numero_nota || null, almoxarifado_id, observacoes || null
        ]);
        
        // Retorna a compra completa (sem itens)
        res.status(201).json({ 
            message: 'Compra registrada como ABERTA com sucesso!', 
            compra: compraResult.rows[0],
            itens: [] // Retorna itens vazios para o front-end
        });

    } catch (err) {
        console.error('Erro ao registrar compra (Aberta):', err.message);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 5: ATUALIZAR UMA COMPRA (Etapas 2 e 3)
app.put('/compras/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        fornecedor_id, valor_total, observacoes, itens, 
        numero_nota, almoxarifado_id, pagamentos, plano_de_contas_id 
    } = req.body;

    if (!fornecedor_id || !almoxarifado_id) {
        return res.status(400).json({ message: 'Dados da compra inválidos.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const compraQuery = `
            UPDATE compras SET
                fornecedor_id = $1, valor_total = $2, observacoes = $3, numero_nota = $4, 
                almoxarifado_id = $5, plano_de_contas_id = $6, dados_pagamento = $7
            WHERE id = $8 AND (status = 'Aberta' OR status = 'Finalizada' OR status = 'Cancelada')
            RETURNING id
        `;
        const dadosPagamentoJson = JSON.stringify(pagamentos || []);
        
        const compraResult = await client.query(compraQuery, [
            fornecedor_id, valor_total || 0, observacoes, numero_nota, 
            almoxarifado_id, plano_de_contas_id || null, dadosPagamentoJson, id
        ]);

        if (compraResult.rowCount === 0) {
            throw new Error('Compra não encontrada ou não pode ser editada.');
        }

        // Atualiza os itens (Limpa e Re-insere)
        await client.query('DELETE FROM compra_itens WHERE compra_id = $1', [id]);
        if (itens && itens.length > 0) {
            for (const item of itens) {
                await client.query(
                    'INSERT INTO compra_itens (compra_id, produto_id, quantidade, valor_unitario) VALUES ($1, $2, $3, $4)',
                    [id, item.produto_id, item.quantidade, item.custo_unitario]
                );
            }
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Compra atualizada com sucesso!', compra_id: id });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao ATUALIZAR compra:', err.message);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 6: FINALIZAR A COMPRA (Mexe no Estoque e Financeiro)
app.patch('/compras/:id/finalizar', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        const compraResult = await client.query("SELECT * FROM compras WHERE id = $1 AND status = 'Aberta'", [id]);
        if (compraResult.rowCount === 0) {
            throw new Error('Compra não encontrada ou já está finalizada/cancelada.');
        }
        const compra = compraResult.rows[0];

        const itensResult = await client.query('SELECT * FROM compra_itens WHERE compra_id = $1', [id]);
        const itens = itensResult.rows;
        
        if (itens.length === 0) {
            throw new Error('Não é possível finalizar uma compra sem itens.');
        }
        if (!compra.dados_pagamento || compra.dados_pagamento.length === 0) {
            throw new Error('Não é possível finalizar uma compra sem dados de pagamento.');
        }

        for (const item of itens) {
            const stockUpdateQuery = `
              INSERT INTO estoque_por_almoxarifado (produto_id, almoxarifado_id, quantidade)
              VALUES ($1, $2, $3)
              ON CONFLICT (produto_id, almoxarifado_id)
              DO UPDATE SET quantidade = estoque_por_almoxarifado.quantidade + EXCLUDED.quantidade;
            `;
            await client.query(stockUpdateQuery, [item.produto_id, compra.almoxarifado_id, item.quantidade]);
        }
        
        const pagamentos = compra.dados_pagamento; 
        const plano_de_contas_id = compra.plano_de_contas_id;

        if (pagamentos && pagamentos.length > 0 && plano_de_contas_id) {
            for (const pagamento of pagamentos) {
                const basePayload = {
                    descricao: `Pgto. Compra - Nota ${compra.numero_nota || `ID ${compra.id}`}`,
                    valor: pagamento.valor,
                    tipo: 'Saída',
                    plano_de_contas_id: plano_de_contas_id,
                    compra_id: compra.id,
                    forma_pagamento: pagamento.formaPagamento,
                    condicao_pagamento: pagamento.condicao,
                    fornecedor_id: compra.fornecedor_id
                };

                if (pagamento.condicao === 'À vista') {
                    await axios.post(`${FINANCEIRO_SERVICE_URL}/lancamentos`, {...basePayload, data_vencimento: pagamento.dataVencimento});
                } else if (pagamento.condicao === 'Parcelado' && pagamento.parcelas > 0) {
                    const valorParcela = (pagamento.valor / pagamento.parcelas).toFixed(2);
                    let dataVencimentoParcela = new Date(pagamento.dataVencimento);

                    for (let i = 1; i <= pagamento.parcelas; i++) {
                        if (i > 1) dataVencimentoParcela.setMonth(dataVencimentoParcela.getMonth() + 1);
                        await axios.post(`${FINANCEIRO_SERVICE_URL}/lancamentos`, {
                            ...basePayload,
                            descricao: `${basePayload.descricao} (Parc. ${i}/${pagamento.parcelas})`,
                            valor: valorParcela,
                            data_vencimento: dataVencimentoParcela.toISOString().split('T')[0],
                        });
                    }
                }
            }
        }
        
        await client.query("UPDATE compras SET status = 'Finalizada' WHERE id = $1", [id]);

        await client.query('COMMIT');
        res.json({ message: 'Compra Finalizada com sucesso! Estoque e Financeiro atualizados.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao finalizar compra:', err.message);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 7: CANCELAR A COMPRA (Faz o Estorno)
app.patch('/compras/:id/cancelar', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const compraResult = await client.query("SELECT * FROM compras WHERE id = $1", [id]);
        if (compraResult.rowCount === 0) throw new Error('Compra não encontrada.');
        const compra = compraResult.rows[0];

        if (compra.status === 'Finalizada') {
            const itensResult = await client.query('SELECT * FROM compra_itens WHERE compra_id = $1', [id]);
            for (const item of itensResult.rows) {
                await client.query(
                    `UPDATE estoque_por_almoxarifado SET quantidade = estoque_por_almoxarifado.quantidade - $1
                     WHERE produto_id = $2 AND almoxarifado_id = $3`,
                    [item.quantidade, item.produto_id, compra.almoxarifado_id]
                );
            }
            
            // Chama a rota de cancelamento no financeiro
            await axios.patch(`${FINANCEIRO_SERVICE_URL}/lancamentos/cancelar-por-compra/${id}`);
        }

        await client.query("UPDATE compras SET status = 'Cancelada' WHERE id = $1", [id]);
        
        await client.query('COMMIT');
        res.json({ message: 'Compra cancelada com sucesso.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao cancelar compra:', err.message);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    } finally {
        client.release();
    }
});

// ROTA 8: REABRIR A COMPRA (Faz o Estorno e volta para 'Aberta')
app.patch('/compras/:id/reabrir', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const compraResult = await client.query("SELECT * FROM compras WHERE id = $1 AND (status = 'Finalizada' OR status = 'Cancelada')", [id]);
        if (compraResult.rowCount === 0) throw new Error('Compra não encontrada ou já está Aberta.');
        const compra = compraResult.rows[0];

        if (compra.status === 'Finalizada') {
            const itensResult = await client.query('SELECT * FROM compra_itens WHERE compra_id = $1', [id]);
            for (const item of itensResult.rows) {
                await client.query(
                    `UPDATE estoque_por_almoxarifado SET quantidade = estoque_por_almoxarifado.quantidade - $1
                     WHERE produto_id = $2 AND almoxarifado_id = $3`,
                    [item.quantidade, item.produto_id, compra.almoxarifado_id]
                );
            }
            
            // Chama a rota de cancelamento no financeiro
            await axios.patch(`${FINANCEIRO_SERVICE_URL}/lancamentos/cancelar-por-compra/${id}`);
        }
        
        await client.query("UPDATE compras SET status = 'Aberta' WHERE id = $1", [id]);
        
        await client.query('COMMIT');
        res.json({ message: 'Compra reaberta com sucesso. Estoque e financeiro (se existirem) foram estornados.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao reabrir compra:', err.message);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    } finally {
        client.release();
    }
});


app.listen(PORT, () => {
  console.log(`Serviço de Compras (Refatorado) rodando na porta ${PORT}`);
});