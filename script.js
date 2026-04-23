document.addEventListener('DOMContentLoaded', () => {
    loadCompanyData();
    addItem(); // Adiciona o primeiro item em branco ao carregar
});

// --- 1. MEMÓRIA DA EMPRESA (LocalStorage) ---
// Salva os dados do cabeçalho enquanto o usuário digita
const companyInputs = ['myCompany', 'myPhone', 'myEmail', 'myDoc'];
companyInputs.forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        localStorage.setItem(`orcapro_${id}`, e.target.value);
    });
});

function loadCompanyData() {
    companyInputs.forEach(id => {
        const saved = localStorage.getItem(`orcapro_${id}`);
        if (saved) document.getElementById(id).value = saved;
    });
    
    // Auto-preenche a data de validade para 7 dias no futuro
    const dateInput = document.getElementById('validDate');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    dateInput.value = futureDate.toISOString().split('T')[0];
}

// --- 2. SISTEMA DE ITENS DINÂMICOS ---
let itemCount = 0;

function addItem() {
    itemCount++;
    const container = document.getElementById('itemsContainer');
    
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
    row.remove();
    calculateTotal();
}

function calculateTotal() {
    let total = 0;
    const values = document.querySelectorAll('.item-value');
    values.forEach(input => {
        if(input.value) total += parseFloat(input.value);
    });
    
    document.getElementById('grandTotal').innerText = formatCurrency(total);
    return total;
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- 3. GERAÇÃO DE PDF PROFISSIONAL ---
document.getElementById('quoteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Preparar dados da empresa (Emissor)
    document.getElementById('pdf-my-company').innerText = document.getElementById('myCompany').value || 'Minha Empresa';
    document.getElementById('pdf-my-doc').innerText = document.getElementById('myDoc').value;
    document.getElementById('pdf-my-phone').innerText = document.getElementById('myPhone').value;
    document.getElementById('pdf-my-email').innerText = document.getElementById('myEmail').value;
    
    // Preparar dados do cliente e gerais
    document.getElementById('pdf-client-name').innerText = document.getElementById('clientName').value;
    document.getElementById('pdf-number').innerText = document.getElementById('quoteNumber').value;
    
    // Formatar Data
    const dateParts = document.getElementById('validDate').value.split('-');
    document.getElementById('pdf-date').innerText = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    
    // Injetar Itens na Tabela do PDF
    const tbody = document.getElementById('pdf-items-body');
    tbody.innerHTML = ''; // Limpa tabela
    
    const descriptions = document.querySelectorAll('.item-desc');
    const values = document.querySelectorAll('.item-value');
    
    for(let i = 0; i < descriptions.length; i++) {
        const tr = document.createElement('tr');
        const val = parseFloat(values[i].value || 0);
        
        tr.innerHTML = `
            <td><strong>${descriptions[i].value}</strong></td>
            <td class="text-right">${formatCurrency(val)}</td>
        `;
        tbody.appendChild(tr);
    }
    
    // Total e Observações
    document.getElementById('pdf-grand-total').innerText = document.getElementById('grandTotal').innerText;
    document.getElementById('pdf-obs-text').innerText = document.getElementById('obsText').value || 'Sem observações adicionais.';

    // Disparar PDF
    generatePDF(document.getElementById('clientName').value);
});

function generatePDF(clientName) {
    const element = document.getElementById('pdf-template');
    const btn = document.querySelector('.generate-btn');
    
    btn.innerText = "Gerando Documento...";
    element.style.display = 'block'; // Mostra pro script ler
    
    const opt = {
        margin: [0, 0],
        filename: `Proposta_${clientName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true }, // Scale 3 garante altíssima resolução
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none'; // Esconde novamente
        btn.innerHTML = '<i data-lucide="file-down"></i> Gerar e Baixar PDF Profissional';
        lucide.createIcons();
    });
}
