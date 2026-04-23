// --- FUNÇÃO DE GERAÇÃO DE PDF CORRIGIDA ---
function generatePDF(data) {
    const template = document.getElementById('pdf-template');
    
    if (!template) {
        console.error("Template de PDF não encontrado!");
        return;
    }

    // Preencher os dados no template
    document.getElementById('pdf-client-name').innerText = data.client_name;
    document.getElementById('pdf-service-cat').innerText = data.service_cat;
    document.getElementById('pdf-service-desc').innerText = data.service_desc;
    document.getElementById('pdf-amount').innerText = 'R$ ' + data.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    document.getElementById('pdf-date-now').innerText = new Date().toLocaleDateString('pt-BR');

    // Configurações do PDF
    const opt = {
        margin: [10, 10],
        filename: `Orcamento_${data.client_name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Tornar visível temporariamente para o html2pdf capturar
    template.style.display = 'block';

    // Gerar e baixar
    html2pdf().set(opt).from(template).save().then(() => {
        template.style.display = 'none'; // Esconder de novo
        console.log("PDF gerado com sucesso!");
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        template.style.display = 'none';
    });
}

// --- EVENTO DE SUBMIT ATUALIZADO ---
const budgetForm = document.getElementById('budgetForm');
if (budgetForm) {
    budgetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const btn = document.getElementById('btnSave');
        const originalText = btn.innerText;
        btn.innerText = "Salvando e Gerando PDF...";
        btn.disabled = true;

        const budgetData = {
            client_name: document.getElementById('clientName').value,
            budget_date: document.getElementById('budgetDate').value,
            amount: parseFloat(document.getElementById('budgetAmount').value),
            service_desc: document.getElementById('serviceDesc').value,
            service_cat: document.getElementById('serviceCat').value || 'Geral'
        };

        try {
            // 1. Tentar salvar no Supabase
            const { error } = await supabaseClient.from('budgets').insert([budgetData]);

            if (error) throw error;

            // 2. Se salvou, gera o PDF imediatamente
            generatePDF(budgetData);

            // 3. Limpar formulário e atualizar tabela
            this.reset();
            if (typeof fetchBudgets === 'function') fetchBudgets();
            
            alert("Orçamento salvo e PDF iniciado!");

        } catch (error) {
            console.error("Erro na operação:", error);
            alert("Erro ao salvar dados. O PDF não será gerado.");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}
