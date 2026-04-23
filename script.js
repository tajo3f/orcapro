/* =====================================================
   ORÇAPRO PREMIUM SCRIPT 2026
   Moderno / Seguro / Profissional
===================================================== */

/* =========================
   1. SUPABASE
========================= */
const SUPABASE_URL =
  "https://cynponjiqcszrzysuvlb.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_mWEIC5vvFYq8FFNf1QAnTA_u-Ix0xBx";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

/* =========================
   2. CONFIG
========================= */
const STORAGE_PREFIX = "orcapro_";

const companyFields = [
  "myCompany",
  "myPhone",
  "myEmail",
  "myDoc"
];

let itemCount = 0;

/* =========================
   3. START
========================= */
document.addEventListener(
  "DOMContentLoaded",
  () => {
    bootSystem();
  }
);

function bootSystem() {
  loadSavedCompanyData();
  applyDefaultDate();
  bindCompanyAutosave();
  bindFormSubmit();
  addItem();
  renderIcons();
}

/* =========================
   4. ICONS
========================= */
function renderIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

/* =========================
   5. LOCAL STORAGE
========================= */
function bindCompanyAutosave() {
  companyFields.forEach((id) => {
    const input =
      document.getElementById(id);

    if (!input) return;

    input.addEventListener(
      "input",
      (e) => {
        localStorage.setItem(
          STORAGE_PREFIX + id,
          e.target.value
        );
      }
    );
  });
}

function loadSavedCompanyData() {
  companyFields.forEach((id) => {
    const el =
      document.getElementById(id);

    if (!el) return;

    const saved =
      localStorage.getItem(
        STORAGE_PREFIX + id
      );

    if (saved) el.value = saved;
  });
}

function applyDefaultDate() {
  const input =
    document.getElementById(
      "validDate"
    );

  if (!input) return;

  const now = new Date();
  now.setDate(now.getDate() + 7);

  input.value =
    now.toISOString().split("T")[0];
}

/* =========================
   6. MONEY FORMAT
========================= */
function currencyBRL(value) {
  const number =
    Number(value) || 0;

  return number.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}

/* =========================
   7. ADD ITEM
========================= */
function addItem() {
  itemCount++;

  const container =
    document.getElementById(
      "itemsContainer"
    );

  if (!container) return;

  const row =
    document.createElement("div");

  row.className = "item-row";
  row.id = `item_${itemCount}`;

  row.innerHTML = `
    <div class="input-group">
      <input
        type="text"
        class="item-desc"
        placeholder="Ex: Site profissional, Logo, Cartão Digital"
        required
      >
    </div>

    <div class="input-group">
      <input
        type="number"
        class="item-value"
        placeholder="0.00"
        step="0.01"
        min="0"
        required
      >
    </div>

    <button
      type="button"
      class="btn-remove"
      onclick="removeItem(${itemCount})"
      title="Remover item"
    >
      <i data-lucide="trash-2"></i>
    </button>
  `;

  container.appendChild(row);

  const priceInput =
    row.querySelector(".item-value");

  priceInput.addEventListener(
    "input",
    calculateTotal
  );

  renderIcons();
  calculateTotal();
}

/* =========================
   8. REMOVE ITEM
========================= */
function removeItem(id) {
  const row =
    document.getElementById(
      `item_${id}`
    );

  if (row) {
    row.remove();
    calculateTotal();
  }
}

/* =========================
   9. TOTAL
========================= */
function calculateTotal() {
  const values =
    document.querySelectorAll(
      ".item-value"
    );

  let total = 0;

  values.forEach((input) => {
    total +=
      parseFloat(input.value) || 0;
  });

  const display =
    document.getElementById(
      "grandTotal"
    );

  if (display) {
    display.textContent =
      currencyBRL(total);
  }

  return total;
}

/* =========================
   10. FORM SUBMIT
========================= */
function bindFormSubmit() {
  const form =
    document.getElementById(
      "quoteForm"
    );

  if (!form) return;

  form.addEventListener(
    "submit",
    async (e) => {
      e.preventDefault();

      await processQuote();
    }
  );
}

/* =========================
   11. PROCESSAR ORÇAMENTO
========================= */
async function processQuote() {
  const button =
    document.querySelector(
      ".generate-btn"
    );

  const original =
    button.innerHTML;

  setLoadingButton(
    button,
    "Gerando PDF..."
  );

  try {
    validateItems();

    const data =
      collectAllData();

    fillPDFTemplate(data);

    await saveToSupabase(data);

    await generatePDF(
      data.clientName
    );

    restoreButton(
      button,
      original
    );
  } catch (error) {
    console.error(error);

    restoreButton(
      button,
      original
    );

    alert(
      error.message ||
        "Erro ao gerar orçamento."
    );
  }
}

/* =========================
   12. BUTTON STATE
========================= */
function setLoadingButton(
  button,
  text
) {
  button.disabled = true;

  button.innerHTML = `
    <i data-lucide="loader-circle"></i>
    ${text}
  `;

  renderIcons();
}

function restoreButton(
  button,
  html
) {
  button.disabled = false;
  button.innerHTML = html;
  renderIcons();
}

/* =========================
   13. VALIDAR
========================= */
function validateItems() {
  const desc =
    document.querySelectorAll(
      ".item-desc"
    );

  if (desc.length === 0) {
    throw new Error(
      "Adicione pelo menos 1 item."
    );
  }
}

/* =========================
   14. CAPTURA DADOS
========================= */
function collectAllData() {
  const companyName =
    getValue("myCompany") ||
    "Minha Empresa";

  const myPhone =
    getValue("myPhone");

  const myEmail =
    getValue("myEmail");

  const myDoc =
    getValue("myDoc");

  const clientName =
    getValue("clientName");

  const validDate =
    getValue("validDate");

  const quoteNumber =
    getValue("quoteNumber");

  const obs =
    getValue("obsText") ||
    "Proposta válida por 30 dias.";

  const items =
    getItemsData();

  const total =
    calculateTotal();

  return {
    companyName,
    myPhone,
    myEmail,
    myDoc,
    clientName,
    validDate,
    quoteNumber,
    obs,
    items,
    total
  };
}

function getValue(id) {
  const el =
    document.getElementById(id);

  return el
    ? el.value.trim()
    : "";
}

/* =========================
   15. PEGAR ITENS
========================= */
function getItemsData() {
  const descs =
    document.querySelectorAll(
      ".item-desc"
    );

  const values =
    document.querySelectorAll(
      ".item-value"
    );

  const list = [];

  for (
    let i = 0;
    i < descs.length;
    i++
  ) {
    const description =
      descs[i].value.trim();

    const price =
      parseFloat(
        values[i].value
      ) || 0;

    if (
      description &&
      price >= 0
    ) {
      list.push({
        description,
        price
      });
    }
  }

  return list;
}

/* =========================
   16. DATA FORMATADA
========================= */
function formatDateBR(date) {
  if (!date) return "";

  const parts =
    date.split("-");

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/* =========================
   17. PDF TEMPLATE
========================= */
function fillPDFTemplate(data) {
  text(
    "pdf-my-company",
    data.companyName
  );

  text(
    "pdf-my-phone",
    data.myPhone
  );

  text(
    "pdf-my-email",
    data.myEmail
  );

  text(
    "pdf-my-doc",
    data.myDoc
  );

  text(
    "pdf-client-name",
    data.clientName
  );

  text(
    "pdf-number",
    data.quoteNumber
  );

  text(
    "pdf-date",
    formatDateBR(
      data.validDate
    )
  );

  text(
    "pdf-grand-total",
    currencyBRL(
      data.total
    )
  );

  text(
    "pdf-obs-text",
    data.obs
  );

  fillPDFItems(data.items);
}

function text(id, value) {
  const el =
    document.getElementById(id);

  if (el) {
    el.textContent =
      value || "";
  }
}

/* =========================
   18. TABELA PDF
========================= */
function fillPDFItems(items) {
  const tbody =
    document.getElementById(
      "pdf-items-body"
    );

  tbody.innerHTML = "";

  items.forEach(
    (item, index) => {
      const tr =
        document.createElement(
          "tr"
        );

      const description =
        item.description
          .split(",")
          .map(
            (x) =>
              "• " +
              x.trim()
          )
          .join("<br>");

      tr.innerHTML = `
        <td><strong>Item ${String(
          index + 1
        ).padStart(2, "0")}</strong></td>

        <td>${description}</td>

        <td class="text-right">
          <strong>
            ${currencyBRL(
              item.price
            )}
          </strong>
        </td>
      `;

      tbody.appendChild(tr);
    }
  );
}

/* =========================
   19. SUPABASE SAVE
========================= */
async function saveToSupabase(
  data
) {
  try {
    await supabaseClient
      .from("propostas")
      .insert([
        {
          empresa_emissora:
            data.companyName,

          cliente:
            data.clientName,

          numero_orcamento:
            data.quoteNumber,

          data_validade:
            data.validDate,

          valor_total:
            data.total,

          itens:
            data.items
        }
      ]);
  } catch (err) {
    console.warn(
      "Supabase erro:",
      err
    );
  }
}

/* =========================
   20. GERAR PDF
========================= */
async function generatePDF(
  clientName
) {
  const element =
    document.getElementById(
      "pdf-template"
    );

  element.style.display =
    "block";

  const fileName =
    clientName
      .replace(/\s+/g, "_")
      .replace(
        /[^a-zA-Z0-9_]/g,
        ""
      ) || "cliente";

  const options = {
    margin: 0,
    filename:
      "Orcamento_" +
      fileName +
      ".pdf",

    image: {
      type: "jpeg",
      quality: 1
    },

    html2canvas: {
      scale: 3,
      useCORS: true,
      letterRendering: true
    },

    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation:
        "portrait"
    }
  };

  await html2pdf()
    .set(options)
    .from(element)
    .save();

  element.style.display =
    "none";
}

/* =========================
   21. GLOBAL
========================= */
window.addItem = addItem;
window.removeItem = removeItem;
window.calculateTotal =
  calculateTotal;
