// --- 1. CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://cynponjiqcszrzysuvlb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mWEIC5vvFYq8FFNf1QAnTA_u-Ix0xBx'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    loadCompanyData();
    addItem(); // Adiciona o primeiro item em branco ao carregar
    lucide.createIcons();
});

// --- 2. MEMÓRIA DA EMPRESA (LocalStorage) ---
const companyInputs = ['myCompany', 'myPhone', 'myEmail', 'myDoc'];
companyInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', (e) => {
            localStorage.setItem(`orcapro_${id}`, e.target.value);
        });
    }
});

function loadCompanyData() {
    companyInputs.forEach(id => {
        const saved = localStorage.getItem(`orcapro_${id}`);
        const el = document.getElementById(id);
        if (saved && el) el.value = saved;
    });
    
    const dateInput = document.getElementById('validDate');
    if (dateInput) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        dateInput.value = futureDate.toISOString().split('T')[0];
    }
}

// --- 3. SISTEMA DE ITENS DINÂMICOS ---
let itemCount = 0;

function addItem() {
    itemCount++;
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    
    const row = document.createElement('div');
    row.className = 'item-row';
    row.id = `itemRow_${itemCount}`;
    
    row.innerHTML = `
        <div class="input-group">
            <input type="text" class="item-desc" placeholder="Descrição do item ou serviço" required>
        </div>
        <div class="input-group">
            <input type="number" class="item-value" placeholder="R$ 0,00" step="0.01" required oninput="calculateTotal()">
        </div>
        <button type="button" class="btn-remove" onclick="removeItem(${itemCount})" title="Remover Item">
            <i data-lucide="trash-2"></i>
        </button>
    `;
    
    container.appendChild(row);
    lucide.createIcons();
}

function removeItem(id) {
    const row = document.getElementById(`itemRow_${id}`);
    if (row) {
        row.remove();
        calculateTotal();
    }
}

function calculateTotal() {
    let total = 0;
    const values = document.querySelectorAll('.item-value');
    values.forEach(input => {
        if(input.value) total += parseFloat(input.value);
    });
    
    const display = document.getElementById('grandTotal');
    if (display) display.innerText = formatCurrency(total);
    return total;
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- 4. PROCESSAMENTO, SUPABASE E PDF ---
document.getElementById('quoteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = document.querySelector('.generate-btn');
    const originalText = btn.innerHTML;
    
    // Feedback visual de carregamento
    btn.innerHTML = '<i data-lucide="loader"></i> Salvando e Gerando...';
    btn.disabled = true;
    lucide.createIcons();
    
    // Captura de dados dos campos
    const companyName = document.getElementById('myCompany').value || 'Minha Empresa';
    const clientName = document.getElementById('clientName').value;
    const quoteNumber = document.getElementById('quoteNumber').value;
    const validDate = document.getElementById('validDate').value;
    const obs = document.getElementById('obsText').value;
    
    // Preparar campos do PDF (Cabeçalho/Rodapé)
    document.getElementById('pdf-my-company').innerText = companyName;
    document.getElementById('pdf-my-doc').innerText = document.getElementById('myDoc').value;
    document.getElementById('pdf-my-phone').innerText = document.getElementById('myPhone').value;
    document.getElementById('pdf-my-email').innerText = document.getElementById('myEmail').value;
    document.getElementById('pdf-client-name').innerText = clientName;
    document.getElementById('pdf-number').innerText = quoteNumber;
    
    const dateParts = validDate.split('-');
    document.getElementById('pdf-date').innerText = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    
    // Processar Itens (Tabela do PDF + Array para Banco)
    const tbody = document.getElementById('pdf-items-body');
    tbody.innerHTML = ''; 
    const descriptions = document.querySelectorAll('.item-desc');
    const values = document.querySelectorAll('.item-value');
    let itensArray = [];
    
    for(let i = 0; i < descriptions.length; i++) {
        const desc = descriptions[i].value;
        const val = parseFloat(values[i].value || 0);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${desc}</strong></td><td class="text-right">${formatCurrency(val)}</td>`;
        tbody.appendChild(tr);
        
        itensArray.push({ descrição: desc, valor: val });
    }
    
    const totalFinal = calculateTotal();
    document.getElementById('pdf-grand-total').innerText = formatCurrency(totalFinal);
    document.getElementById('pdf-obs-text').innerText = obs || 'Sem observações adicionais.';

    // --- LOGICA SUPABASE ---
    try {
        const { error } = await supabaseClient.from('propostas').insert([{
            empresa_emissora: companyName,
            cliente: clientName,
            numero_orcamento: quoteNumber,
            data_validade: validDate,
            valor_total: totalFinal,
            itens: itensArray // O SDK do Supabase já converte arrays/objetos para JSONB automaticamente
        }]);

        if (error) console.error("Erro Supabase:", error);
        else console.log("Dados sincronizados com sucesso!");
    } catch (err) {
        console.error("Erro crítico de conexão:", err);
    }

    // --- GERAÇÃO DO PDF ---
    generatePDF(clientName, btn, originalText);
});

function generatePDF(clientName, btnElement, originalText) {
    const element = document.getElementById('pdf-template');
    element.style.display = 'block'; 
    
    const opt = {
        margin: [0, 0],
        filename: `Proposta_${clientName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none'; 
        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
        lucide.createIcons();
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        btnElement.disabled = false;
    });
}
