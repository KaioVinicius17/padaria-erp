// index.js (print-service)
// (VERSÃO CORRIGIDA - Sem o pacote 'printer')

const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

const app = express();
const PORT = 9000;

app.use(cors());
app.use(express.json());

app.post('/print-comanda', async (req, res) => {
    const { comanda_id, itens, comandaTotal } = req.body;

    if (!comanda_id || !itens || !comandaTotal) {
        return res.status(400).json({ message: 'Dados da comanda incompletos.' });
    }

    console.log(`[PrintService] Recebido pedido para imprimir comanda #${comanda_id}`);

    // ==========================================================
    // MUDANÇA AQUI: Configuração da Impressora
    // ==========================================================
    let printer = new ThermalPrinter({
        type: PrinterTypes.EPSON, // Tipo genérico (Epson, Bematech, etc.)
        
        // Use o prefixo 'printer:' para o nome do compartilhamento do Windows
        interface: `printer:TermicaBalcao`, // <-- MUDE AQUI o nome do seu compartilhamento
        
        // Não precisamos mais da linha 'driver: require('printer')'
    });
    // ==========================================================
    
    try {
        // --- Montagem do Recibo ---
        printer.alignCenter();
        printer.println("================================");
        printer.setTextSize(1, 1);
        printer.println(`COMANDA #${comanda_id}`);
        printer.setTextSize(0, 0);
        printer.println("================================");
        printer.newLine();
        
        printer.alignLeft();
        printer.tableCustom([
            { text: "QTD", align: "LEFT", width: 0.15 },
            { text: "ITEM", align: "LEFT", width: 0.55 },
            { text: "TOTAL", align: "RIGHT", width: 0.25 }
        ]);
        printer.println("--------------------------------");

        for (const item of itens) {
            printer.tableCustom([
                { text: `${item.quantidade}x`, align: "LEFT", width: 0.15 },
                { text: item.nome_item, align: "LEFT", width: 0.55 },
                { text: (item.preco_venda * item.quantidade).toFixed(2), align: "RIGHT", width: 0.25 }
            ]);
        }
        
        printer.println("--------------------------------");
        printer.newLine();
        printer.alignRight();
        printer.setTextSize(1, 1);
        printer.println(`TOTAL: ${formatCurrency(comandaTotal)}`);
        printer.newLine();

        printer.alignCenter();
        printer.setTextSize(0, 0);
        printer.println("Aguarde no caixa para pagamento.");
        printer.newLine();
        
        printer.cut(); 
        // --- Fim do Recibo ---

        // Executa a impressão
        await printer.execute();
        
        console.log(`[PrintService] Comanda #${comanda_id} enviada para a impressora.`);
        res.json({ success: true, message: 'Impressão enviada.' });

    } catch (error) {
        console.error(`[PrintService] Erro na impressão: ${error.message}`);
        // Erro comum: "Printer not found". Verifique o nome do compartilhamento.
        res.status(500).json({ success: false, message: 'Erro ao imprimir. Verifique o nome da impressora no print-service.' });
    }
});

// Helper para formatar moeda (para o log)
const formatCurrency = (value) => {
  if (isNaN(value)) value = 0;
  return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PrintService] Serviço de Impressão rodando na porta ${PORT}`);
    console.log('Escutando por pedidos de impressão em http://localhost:9000/print-comanda');
});