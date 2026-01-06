const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');

// Require axios-retry defensivo
let axiosRetryModule = null;
try {
  axiosRetryModule = require('axios-retry');
} catch (e) {
  console.error('❌ Dependência "axios-retry" não encontrada. Execute: npm install axios-retry');
  throw e; // ✅ Corrigido: re-throw exception
}

const axiosRetry = axiosRetryModule?.default ?? axiosRetryModule; 

const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');
const minimist = require('minimist');

dotenv.config();

// ============================================
// ARGUMENTOS CLI
// ============================================

const argv = minimist(process.argv.slice(2), {
  boolean: ['dry-run', 'dry', 'verbose', 'help', 'debug'],
  alias: { i: 'input', h: 'help', v: 'verbose' }
});

if (argv.help) {
  console.log(`
update-invoice-tracking.js - Atualizar rastreamento VTEX via Bisturi

Uso:
  node update-invoice-tracking.js --input <arquivo> [opções]

Opções:
  --input, -i <arquivo>   Arquivo de entrada (.txt ou .csv) [obrigatório]
  --dry-run, --dry        Simular execução sem alterar dados
  --verbose, -v           Logs detalhados
  --debug                 Logs de debug (mostra dados brutos das APIs)
  --concurrency <N>       Requisições paralelas (default: 4)
  --delay <ms>            Delay entre requisições (default: 200ms)
  --help, -h              Mostrar esta ajuda

Exemplos:
  node update-invoice-tracking.js --input pedidos.txt
  node update-invoice-tracking.js --input pedidos.csv --dry-run --verbose
  node update-invoice-tracking.js -i pedidos.txt --concurrency 6 --delay 300
  node update-invoice-tracking.js -i pedidos.txt --debug
  `);
  process.exit(0);
}

const INPUT_FILE = argv.input || argv.i;
const DRY_RUN = argv['dry-run'] || argv.dry || false;
const VERBOSE = argv.verbose || false;
const DEBUG = argv.debug || false;
const CONCURRENCY = Number.parseInt(argv.concurrency || process.env.CONCURRENCY || '4', 10); // ✅ Number.parseInt
const REQUEST_DELAY_MS = Number.parseInt(argv.delay || process.env.REQUEST_DELAY_MS || '200', 10); // ✅ Number.parseInt

// ============================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// ============================================

const {
  VTEX_ACCOUNT_NAME,
  VTEX_ENVIRONMENT,
  VTEX_APP_KEY,
  VTEX_APP_TOKEN,
  BISTURI_BASE
} = process.env;

const requiredEnvVars = [
  'VTEX_ACCOUNT_NAME',
  'VTEX_ENVIRONMENT',
  'VTEX_APP_KEY',
  'VTEX_APP_TOKEN'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`❌ Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
  console.error('Configure-as no arquivo .env antes de continuar.');
  console.error('\nExemplo de .env:');
  console.error('VTEX_ACCOUNT_NAME=suaconta');
  console.error('VTEX_ENVIRONMENT=vtexcommercestable.com.br');
  console.error('VTEX_APP_KEY=vtexappkey-suaconta-XXXXXX');
  console.error('VTEX_APP_TOKEN=YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
  process.exit(1);
}

if (!axiosRetry) {
  console.error('❌ Dependência "axios-retry" não encontrada. Execute: npm install axios-retry');
  process.exit(1);
}

// ============================================
// CONFIGURAÇÃO DE CLIENTES HTTP
// ============================================

const BISTURI_BASE_URL = BISTURI_BASE?.trim()
  ? BISTURI_BASE.replace(/\/+$/, '')
  : 'https://api.bisturi.com.br'; 

const VTEX_BASE = `https://${VTEX_ACCOUNT_NAME}.${VTEX_ENVIRONMENT}`.replace(/\/+$/, '');

// Cliente VTEX
const vtexClient = axios.create({
  baseURL: VTEX_BASE,
  headers: {
    'X-VTEX-API-AppKey': VTEX_APP_KEY,
    'X-VTEX-API-AppToken': VTEX_APP_TOKEN,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000
});

const exponentialDelay = axiosRetryModule?.exponentialDelay
  ?? ((retryNumber) => Math.pow(2, retryNumber) * 500); 

axiosRetry(vtexClient, {
  retries: 3,
  retryDelay: exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status === 429 || error.response?.status >= 500); 
  }
});

// Cliente Bisturi
const bisturiClient = axios.create({
  baseURL: BISTURI_BASE_URL,
  timeout: 60000,
  headers: { 
    'Accept': 'application/json' 
  }
});

axiosRetry(bisturiClient, {
  retries: 2,
  retryDelay: exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status >= 500); 
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toIsoDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString(); 
  
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/;
  const m = regex.exec(s); // 
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    const year = Number(m[3]);
    const hh = Number(m[4] || 0);
    const mm = Number(m[5] || 0);
    return new Date(Date.UTC(year, month, day, hh, mm, 0)).toISOString();
  }
  
  return null;
}

function formatDeliveredDateForVtex(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

// ============================================
// LEITURA DE ARQUIVOS
// ============================================

function readPlainList(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  
  return lines.map(l => ({ orderId: l }));
}

function detectDelimiter(sample) {
  const delimiters = [',', ';', '\t', '|'];
  let chosen = ',';
  let bestCount = -1;
  
  for (const d of delimiters) {
    const regex = new RegExp(escapeRegExp(d), 'g');
    const matches = sample.match(regex);
    const count = matches ? matches.length : 0;
    if (count > bestCount) {
      bestCount = count;
      chosen = d;
    }
  }
  
  return chosen;
}

function readCsvFlexible(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  
  if (!raw || raw.trim().length === 0) {
    return [];
  }
  
  const firstLines = raw.split(/\r?\n/).slice(0, 5).join('\n');
  const delimiter = detectDelimiter(firstLines);
  
  let records;
  try {
    records = parse(raw, {
      delimiter,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (e) {
    const errorMessage = e?.message ?? String(e); 
    console.error('❌ Erro ao parsear CSV:', errorMessage);
    return [];
  }
  
  if (!records || records.length === 0) return [];
  
  let header = null;
  const first = records[0];
  const hasLetters = first?.some(cell => /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(cell)); 
  
  if (hasLetters) {
    header = records.shift().map(h => String(h ?? '').trim().toLowerCase()); 
  }
  
  const rows = records.map(row => {
    if (!header) {
      return {
        orderId: String(row[0] ?? '').trim(),
        invoiceNumber: String(row[1] ?? '').trim()
      };
    }
    
    const norm = {};
    header.forEach((h, i) => {
      norm[h] = String(row[i] ?? '').trim();
    });
    
    return {
      orderId: norm.orderid || norm['order id'] || norm.order || norm.pedido || 
               norm.order_web || norm.orderweb || '',
      invoiceNumber: norm.invoicenumber || norm.invoice || norm.nfe || norm.nota || '',
      trackingNumber: norm.trackingnumber || norm.rastreio || norm.tracking || ''
    };
  });
  
  return rows.filter(r => r.orderId?.length > 0);
}

// ============================================
// FUNÇÕES DE API
// ============================================

async function getBisturi(orderId) {
  try {
    const url = `/api/v1/order/tracking/${encodeURIComponent(orderId)}`;
    const resp = await bisturiClient.get(url);
    
    if (DEBUG) {
      console.log(`[DEBUG] Bisturi response for ${orderId}:`, JSON.stringify(resp.data, null, 2));
    }
    
    return resp.data;
  } catch (err) {
    if (err?.response?.status === 404) { 
      return null;
    }
    throw err;
  }
}

async function getVtexOrder(orderId) {
  try {
    const resp = await vtexClient.get(`/api/oms/pvt/orders/${encodeURIComponent(orderId)}`);
    
    if (DEBUG) {
      console.log(`[DEBUG] VTEX response for ${orderId}:`, JSON.stringify(resp.data, null, 2));
    }
    
    return resp.data ?? null; 
  } catch (err) {
    if (err?.response?.status === 404) { 
      return null;
    }
    throw err;
  }
}


async function handleRateLimit(err, retryFn) {
  if (err.response?.status !== 429) {
    throw err;
  }
  
  const retryAfter = err.response.headers['retry-after'] ?? err.response.headers['Retry-After'];
  
  if (!retryAfter) {
    throw err;
  }
  
  let waitMs = 5000;
  
  if (/^\d+$/.test(retryAfter)) {
    waitMs = Number.parseInt(retryAfter, 10) * 1000;
  } else {
    const retryDate = Date.parse(retryAfter);
    if (!Number.isNaN(retryDate)) {
      waitMs = Math.max(0, retryDate - Date.now());
    }
  }
  
  console.log(`⏳ Rate limit (429). Aguardando ${waitMs}ms antes de retry...`);
  await sleep(waitMs + 500);
  
  return retryFn();
}

async function patchInvoice(orderId, invoiceNumber, payload) {
  const url = `/api/oms/pvt/orders/${encodeURIComponent(orderId)}/invoice/${encodeURIComponent(invoiceNumber)}`;
  
  try {
    const resp = await vtexClient.patch(url, payload);
    return resp.data;
  } catch (err) {
    return handleRateLimit(err, () => patchInvoice(orderId, invoiceNumber, payload));
  }
}

async function putInvoiceTrackingMarkDelivered(orderId, invoiceNumber, body) {
  const url = `/api/oms/pvt/orders/${encodeURIComponent(orderId)}/invoice/${encodeURIComponent(invoiceNumber)}/tracking`;
  
  try {
    const resp = await vtexClient.put(url, body);
    return resp.data;
  } catch (err) {
    return handleRateLimit(err, () => putInvoiceTrackingMarkDelivered(orderId, invoiceNumber, body));
  }
}

function extractStatusDate(statusArray, name) {
  if (!Array.isArray(statusArray)) return null;
  const st = statusArray.find(s => s.status?.toUpperCase() === name.toUpperCase()); 
  return st ?? null; 
}

// ============================================
// FUNÇÕES AUXILIARES DE PROCESSAMENTO
// ============================================

function getOrderWebFromBisturi(bist) {
  return bist.orderWeb ?? (bist.orderId ? String(bist.orderId) : null);
}

function getInvoiceNumberFromBisturi(bist) {
  return bist.invoiceNumber ?? (bist.invoiceNumber === 0 ? String(bist.invoiceNumber) : null);
}

function getErrorMessage(err) {
  if (err?.response?.data) {
    return JSON.stringify(err.response.data);
  }
  return err?.message ?? String(err);
}

// ============================================
// PROCESSAMENTO DE PEDIDO
// ============================================

async function processSingle(orderId, opts) {
  const { dryRun } = opts;
  
  try {
    if (VERBOSE) console.log(`\n[START] ${orderId}`);
    
    // 1. Buscar na Bisturi
    const bist = await getBisturi(orderId);
    if (!bist) {
      console.error(`[SKIP] ${orderId} — não encontrado na Bisturi`);
      return { ok: false, orderId, reason: 'bisturi-not-found' };
    }
    
    // 2. Extrair dados da Bisturi
    const orderWeb = getOrderWebFromBisturi(bist);
    const invoiceNumber = getInvoiceNumberFromBisturi(bist);
    const carrierId = bist.carrierId;
    const statuses = bist.status ?? [];
    const faturado = extractStatusDate(statuses, 'FATURADO');
    const entregue = extractStatusDate(statuses, 'ENTREGUE');
    
    const trackingNumber = String(bist.orderId ?? orderId);
    const trackingUrl = `https://rastreamento.bisturi.com.br/#/${trackingNumber}`;
    const courier = 'Bisturi Express';
    const dispatchedDate = faturado ? toIsoDate(faturado.date) : null;
    
    if (VERBOSE) {
      console.log(`   Bisturi data:`);
      console.log(`   - orderWeb: ${orderWeb}`);
      console.log(`   - invoiceNumber: ${invoiceNumber}`);
      console.log(`   - trackingNumber: ${trackingNumber}`);
      console.log(`   - carrierId: ${carrierId}`);
      console.log(`   - faturado: ${faturado ? 'SIM' : 'NÃO'}`);
      console.log(`   - entregue: ${entregue ? 'SIM' : 'NÃO'}`);
    }
    
    // VALIDAÇÃO DE TRANSPORTADORA (BISTURI EXPRESS = 1924)
    if (carrierId !== 1924) {
      const carrierName = carrierId ? `ID ${carrierId}` : 'desconhecida';
      console.error(`[SKIP] ${orderId} (${orderWeb ?? 'N/A'}) — Transportadora incorreta: ${carrierName}. Apenas Bisturi Express (ID 1924) é permitida.`);
      
      if (VERBOSE) {
        console.log(`   ⚠️  Transportadora encontrada: ${carrierName}`);
        console.log(`   ✓  Transportadora esperada: Bisturi Express (ID 1924)`);
      }
      
      return { 
        ok: false, 
        orderId: orderWeb ?? orderId, 
        invoiceNumber: invoiceNumber ?? '',
        reason: 'wrong-carrier',
        error: `Transportadora incorreta: ${carrierName}. Apenas Bisturi Express (ID 1924) é permitida.`
      };
    }
    
    if (VERBOSE) {
      console.log(`   ✓ Transportadora: Bisturi Express (ID 1924)`);
    }
    
    // 3. Validações
    if (!orderWeb) {
      console.error(`[SKIP] ${orderId} — orderWeb ausente na resposta Bisturi`);
      return { ok: false, orderId, reason: 'no-orderweb' };
    }
    
    if (!invoiceNumber) {
      console.error(`[SKIP] ${orderId} — invoiceNumber ausente na resposta Bisturi`);
      return { ok: false, orderId, reason: 'no-invoice' };
    }
    
    // 4. Buscar pedido na VTEX (usando orderWeb)
    if (VERBOSE) console.log(`   Buscando pedido na VTEX: ${orderWeb}`);
    
    const vOrder = await getVtexOrder(orderWeb);
    if (!vOrder) {
      console.error(`[SKIP] ${orderWeb} — pedido não encontrado na VTEX`);
      return { ok: false, orderId: orderWeb, reason: 'vtex-not-found' };
    }
    
    if (VERBOSE) {
      console.log(`   Pedido VTEX encontrado:`);
      console.log(`   - orderId: ${vOrder.orderId}`);
      console.log(`   - status: ${vOrder.status}`);
    }
    
    // 5. Localizar invoice (BUSCA ROBUSTA em múltiplos locais)
    const packages = vOrder.packageAttachment?.packages ?? vOrder.packages ?? [];
    const invoices = vOrder.invoices ?? vOrder.invoice ?? vOrder.orderForm?.invoices ?? [];

    const targetInvoiceNumber = String(invoiceNumber ?? '').trim();

    const normalizeVal = (v) => {
      if (v === null || v === undefined) return '';
      return String(v).trim();
    };

    let inv = null;
    let foundIn = '';

    if (!inv && Array.isArray(packages) && packages.length > 0) {
      inv = packages.find(p => {
        const val = normalizeVal(p.invoiceNumber ?? p.invoiceId ?? p.number);
        return val === targetInvoiceNumber;
      });
      if (inv) {
        foundIn = 'packageAttachment.packages';
        if (VERBOSE) {
          console.log(`   ✓ Invoice encontrada em packages: ${inv.invoiceNumber}`);
        }
      }
    }

    if (!inv && Array.isArray(invoices) && invoices.length > 0) {
      inv = invoices.find(i => {
        const val = normalizeVal(i.invoiceNumber ?? i.number ?? i.id ?? i.invoiceId);
        return val === targetInvoiceNumber;
      });
      if (inv) {
        foundIn = 'invoices';
        if (VERBOSE) {
          console.log(`   ✓ Invoice encontrada em invoices: ${inv.invoiceNumber ?? inv.number}`);
        }
      }
    }

    if (!inv && vOrder.orderForm && Array.isArray(vOrder.orderForm.invoices)) {
      inv = vOrder.orderForm.invoices.find(i => {
        const val = normalizeVal(i.invoiceNumber ?? i.number ?? i.id ?? i.invoiceId);
        return val === targetInvoiceNumber;
      });
      if (inv) {
        foundIn = 'orderForm.invoices';
        if (VERBOSE) {
          console.log(`   ✓ Invoice encontrada em orderForm.invoices: ${inv.invoiceNumber ?? inv.number}`);
        }
      }
    }

    if (!inv) {
      const fallbackPkg = packages.length > 0 ? packages[0] : null;
      const fallbackInv = invoices.length > 0 ? invoices[0] : null;
      
      if (fallbackPkg) {
        const fallbackNumber = normalizeVal(fallbackPkg.invoiceNumber ?? fallbackPkg.number);
        console.warn(`⚠️  [WARN] Invoice ${targetInvoiceNumber} não encontrada. Usando package fallback ${fallbackNumber} — confirme manualmente antes de remover o dry-run.`);
        inv = fallbackPkg;
        foundIn = 'packages (fallback)';
      } else if (fallbackInv) {
        const fallbackNumber = normalizeVal(fallbackInv.invoiceNumber ?? fallbackInv.number);
        console.warn(`⚠️  [WARN] Invoice ${targetInvoiceNumber} não encontrada. Usando invoice fallback ${fallbackNumber} — confirme manualmente antes de remover o dry-run.`);
        inv = fallbackInv;
        foundIn = 'invoices (fallback)';
      }
    }

    if (!inv) {
      console.error(`[SKIP] ${orderWeb} — invoice ${targetInvoiceNumber} não encontrada na VTEX`);
      if (VERBOSE) {
        console.log(`   Packages disponíveis (${packages.length}):`);
        packages.forEach((p, idx) => {
          const num = normalizeVal(p.invoiceNumber ?? p.number);
          console.log(`   ${idx + 1}. ${num}`);
        });
        console.log(`   Invoices disponíveis (${invoices.length}):`);
        invoices.forEach((i, idx) => {
          const num = normalizeVal(i.invoiceNumber ?? i.number);
          console.log(`   ${idx + 1}. ${num}`);
        });
      }
      return { ok: false, orderId: orderWeb, reason: 'invoice-not-found' };
    }
    
    if (VERBOSE) {
      const foundNumber = normalizeVal(inv.invoiceNumber ?? inv.number ?? inv.id);
      console.log(`   ✓ Invoice encontrada: ${foundNumber} (em ${foundIn})`);
    }
    
    // 6. Verificar se já tem tracking (idempotência)
    const curTrackingNumber = String(inv.trackingNumber ?? inv.trackingnumbers ?? '');
    const curTrackingUrl = String(inv.trackingUrl ?? inv.trackingurl ?? '');
    
    if (curTrackingNumber && curTrackingUrl) {
      if (VERBOSE) {
        console.log(`[SKIP] ${orderWeb} / ${invoiceNumber} — já possui tracking (${curTrackingNumber})`);
      }
      return { 
        ok: true, 
        skipped: true, 
        orderId: orderWeb, 
        invoiceNumber, 
        reason: 'already-has-tracking' 
      };
    }
    
    // 7. Preparar payload para PATCH
    const payload = {
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(trackingUrl ? { trackingUrl } : {}),
      ...(courier ? { courier } : {}),
      ...(dispatchedDate ? { dispatchedDate } : {})
    };
    
    const vtexInvoiceNumber = normalizeVal(inv.invoiceNumber ?? inv.number ?? inv.id);
    
    // 8. Executar PATCH (ou dry-run)
    if (dryRun) {
      console.log(`[DRY] ${orderWeb} / ${vtexInvoiceNumber} -> payload: ${JSON.stringify(payload)}`);
    } else {
      try {
        await patchInvoice(orderWeb, vtexInvoiceNumber, payload);
        console.log(`✅ [OK] PATCH aplicado ${orderWeb} / ${vtexInvoiceNumber}`);
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        console.error(`❌ [ERR] PATCH ${orderWeb} / ${vtexInvoiceNumber} -> ${errorMsg}`);
        
        return {
          ok: false,
          orderId: orderWeb,
          invoiceNumber: vtexInvoiceNumber,
          reason: 'patch-failed',
          error: errorMsg
        };
      }
    }
    
    // 9. Se entregue, marcar na VTEX
    if (entregue) {
      const deliveredIso = toIsoDate(entregue.date);
      const deliveredDateForVtex = formatDeliveredDateForVtex(deliveredIso);
      
      let city = '';
      let state = '';
      
      if (vOrder.selectedAddresses?.[0]) {
        const addr = vOrder.selectedAddresses[0];
        city = addr.city ?? '';
        state = addr.state ?? '';
      } else if (vOrder.shippingData?.address) {
        city = vOrder.shippingData.address.city ?? '';
        state = vOrder.shippingData.address.state ?? '';
      }
      
      const putBody = {
        isDelivered: true,
        deliveredDate: deliveredDateForVtex,
        events: [
          {
            city: city || '',
            state: state || '',
            description: 'ENTREGUE (Bisturi)',
            date: deliveredIso ?? new Date().toISOString()
          }
        ]
      };
      
      if (dryRun) {
        console.log(`[DRY] PUT delivered ${orderWeb} / ${vtexInvoiceNumber} -> ${JSON.stringify(putBody)}`);
      } else {
        try {
          await putInvoiceTrackingMarkDelivered(orderWeb, vtexInvoiceNumber, putBody);
          console.log(`✅ [OK] Marcado como ENTREGUE ${orderWeb} / ${vtexInvoiceNumber} (deliveredDate=${deliveredDateForVtex})`);
        } catch (err) {
          const errorMsg = getErrorMessage(err);
          console.error(`❌ [ERR] PUT delivered ${orderWeb} / ${vtexInvoiceNumber} -> ${errorMsg}`);
          
          return {
            ok: false,
            orderId: orderWeb,
            invoiceNumber: vtexInvoiceNumber,
            reason: 'put-failed',
            error: errorMsg
          };
        }
      }
    }
    
    return { 
      ok: true, 
      orderId: orderWeb, 
      invoiceNumber: vtexInvoiceNumber, 
      payload 
    };
    
  } catch (err) {
    const errorMsg = getErrorMessage(err);
    console.error(`❌ [ERR] Process ${orderId} -> ${errorMsg}`);
    
    return {
      ok: false,
      orderId,
      reason: 'exception',
      error: errorMsg
    };
  }
}

// ============================================
// LIMITER DE CONCORRÊNCIA
// ============================================

function createLimiter(concurrency) {
  let active = 0;
  const queue = [];
  
  const next = () => {
    if (active >= concurrency || queue.length === 0) return;
    
    const item = queue.shift();
    if (!item) return;
    
    active++;
    const { fn, resolve, reject } = item;
    
    Promise.resolve()
      .then(fn)
      .then(value => resolve(value))
      .catch(error => reject(error))
      .finally(() => {
        active--;
        setImmediate(next);
      });
  };
  
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}

// ============================================
// MAIN
// ============================================

(async () => {
  console.log('🚀 VTEX Update Tracking - Iniciando...\n');
  
  if (!INPUT_FILE) {
    console.error('❌ Erro: informe --input <arquivo.txt|csv>');
    console.error('Use --help para ver opções disponíveis.');
    process.exit(1);
  }
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Erro: arquivo não encontrado: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  let items = [];
  try {
    const ext = path.extname(INPUT_FILE).toLowerCase();
    
    if (ext === '.csv') {
      const csvRows = readCsvFlexible(INPUT_FILE);
      if (csvRows?.length > 0) {
        items = csvRows.map(r => ({
          orderId: r.orderId ?? r.trackingNumber ?? r.orderid ?? ''
        })).filter(x => x.orderId);
      }
    } else {
      items = readPlainList(INPUT_FILE);
    }
  } catch (e) {
    const errorMessage = e?.message ?? String(e);
    console.error('❌ Erro ao ler input:', errorMessage);
    process.exit(1);
  }
  
  if (!items || items.length === 0) {
    console.error('❌ Nenhum pedido encontrado no input.');
    process.exit(1);
  }
  
  console.log(`📊 Registros detectados: ${items.length}`);
  console.log(`⚙️  Configurações:`);
  console.log(`   - Dry-run: ${DRY_RUN ? 'SIM' : 'NÃO'}`);
  console.log(`   - Concorrência: ${CONCURRENCY}`);
  console.log(`   - Delay: ${REQUEST_DELAY_MS}ms`);
  console.log(`   - Verbose: ${VERBOSE ? 'SIM' : 'NÃO'}`);
  console.log(`   - Debug: ${DEBUG ? 'SIM' : 'NÃO'}\n`);
  
  const limiter = createLimiter(CONCURRENCY);
  
  const successRows = [];
  const errorRows = [];
  
  let processed = 0;
  let okCount = 0;
  let skippedCount = 0;
  let errCount = 0;
  
  const promises = items.map((it, idx) => limiter(async () => {
    await sleep(REQUEST_DELAY_MS * (idx % Math.max(1, CONCURRENCY)));
    
    const res = await processSingle(it.orderId, { dryRun: DRY_RUN });
    processed++;
    
    if (res?.ok) {
      if (res.skipped) {
        skippedCount++;
        successRows.push([
          res.orderId ?? '',
          res.invoiceNumber ?? '',
          '',
          'SKIPPED',
          res.reason ?? ''
        ]);
      } else {
        okCount++;
        successRows.push([
          res.orderId ?? '',
          res.invoiceNumber ?? '',
          res.payload?.trackingNumber ?? '',
          'OK',
          ''
        ]);
      }
    } else {
      errCount++;
      const errorMessage = res?.error ? JSON.stringify(res.error) : res?.reason ?? 'error';
      errorRows.push([
        it.orderId ?? '',
        res?.invoiceNumber ?? '',
        errorMessage,
        res?.reason ?? '',
        ''
      ]);
      
      if (!VERBOSE) {
        const reason = res?.reason ?? 'unknown';
        console.error(`❌ ERROR: ${it.orderId} -> ${reason}`);
      }
    }
    
    if (processed % 10 === 0 || processed === items.length) {
      console.log(`📈 Progresso: ${processed}/${items.length} registros | ✓${okCount} ⊘${skippedCount} ✗${errCount}`);
    }
    
    return res;
  }));
  
  await Promise.all(promises);
  
  // Nomes fixos (sobrescreve a cada execução)
  const successFile = `success_update_tracking.csv`;
  const errorFile = `error_update_tracking.csv`;
  
  try {
    const successCsv = successRows
      .map(r => r.map(c => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')) // ✅ replaceAll
      .join('\n');
    
    const errorCsv = errorRows
      .map(r => r.map(c => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')) // ✅ replaceAll
      .join('\n');
    
    fs.writeFileSync(successFile, successCsv, 'utf8');
    fs.writeFileSync(errorFile, errorCsv, 'utf8');
    
    console.log(`\n📄 Arquivos gerados:`);
    console.log(`   - Sucesso: ${successFile}`);
    console.log(`   - Erros: ${errorFile}`);
  } catch (e) {
    const errorMessage = e?.message ?? String(e);
    console.warn('⚠️  Erro ao escrever logs:', errorMessage);
  }
  
  console.log('\n✅ Processamento finalizado.');
  console.log(`📊 Resumo:`);
  console.log(`   - Total: ${items.length}`);
  console.log(`   - Sucesso: ${okCount}`);
  console.log(`   - Pulados: ${skippedCount}`);
  console.log(`   - Erros: ${errCount}`);
  
  process.exit(errCount > 0 ? 2 : 0);
})();