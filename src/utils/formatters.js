/* ============================================  
   FORMATAÇÃO DE ARQUIVOS
   ============================================ */
/**
 * Formata o label do arquivo (extrai apenas o nome)
 * @param {string} filePath - Caminho completo do arquivo
 * @returns {string} Nome do arquivo
 */
export function formatFileLabel(filePath) {
  if (!filePath) return '';
  const parts = filePath.replaceAll('\\', '/').split('/');
  return parts.at(-1) || '';
}

/**
 * Formata o tamanho do arquivo em formato legível
 * @param {number} bytes - Tamanho em bytes
 * @param {number} decimals - Casas decimais (padrão: 1)
 * @returns {string} Tamanho formatado (ex: "1.5 MB")
 */
export function formatFileSize(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Obtém a extensão do arquivo
 * @param {string} filename - Nome do arquivo
 * @returns {string} Extensão (ex: "csv")
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  return filename.split('.').at(-1)?.toLowerCase() || '';
}

// ============================================
// FORMATAÇÃO DE TEMPO
// ============================================

/**
 * Formata tempo decorrido em formato legível
 * @param {number} ms - Tempo em milissegundos
 * @param {boolean} compact - Formato compacto (padrão: false)
 * @returns {string} Tempo formatado
 */
export function formatElapsedTime(ms, compact = false) {
  if (!ms || ms === 0) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (compact) {
    return formatCompactTime(days, hours, minutes, seconds);
  }
  
  return formatFullTime(days, hours, minutes, seconds);
}

/**
 * Formata tempo em formato compacto
 * @private
 */
function formatCompactTime(days, hours, minutes, seconds) {
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Formata tempo em formato completo
 * @private
 */
function formatFullTime(days, hours, minutes, seconds) {
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Formata ETA (tempo estimado) em formato legível
 * @param {number} ms - Tempo em milissegundos
 * @returns {string} ETA formatado
 */
export function formatETA(ms) {
  if (!ms || ms === 0) return 'Calculando...';
  if (ms < 0) return 'Concluído';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return formatETAString(days, hours, minutes, seconds);
}

/**
 * Formata string de ETA
 * @private
 */
function formatETAString(days, hours, minutes, seconds) {
  if (days > 0) return `~${days}d ${hours % 24}h`;
  if (hours > 0) return `~${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `~${minutes}m ${seconds % 60}s`;
  return `~${seconds}s`;
}

/**
 * Formata duração em segundos para formato legível
 * @param {number} seconds - Duração em segundos
 * @param {boolean} verbose - Formato verboso (padrão: false)
 * @returns {string} Duração formatada
 */
export function formatDuration(seconds, verbose = false) {
  if (!seconds || seconds === 0) {
    return verbose ? '0 segundos' : '0s';
  }
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (verbose) {
    return formatVerboseDuration(days, hours, minutes, seconds);
  }
  
  return formatCompactDuration(days, hours, minutes, seconds);
}

/**
 * Formata duração em formato verboso
 * @private
 */
function formatVerboseDuration(days, hours, minutes, seconds) {
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
  }
  if (hours % 24 > 0) {
    const h = hours % 24;
    parts.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
  }
  if (minutes % 60 > 0) {
    const m = minutes % 60;
    parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
  }
  if (seconds % 60 > 0) {
    const s = seconds % 60;
    parts.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`);
  }
  
  return parts.join(', ');
}

/**
 * Formata duração em formato compacto
 * @private
 */
function formatCompactDuration(days, hours, minutes, seconds) {
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ============================================
// FORMATAÇÃO DE DATA
// ============================================

/**
 * Formata data para exibição
 * @param {string|number|Date} timestamp - Timestamp ou Date
 * @param {boolean} includeSeconds - Incluir segundos (padrão: false)
 * @returns {string} Data formatada
 */
export function formatDate(timestamp, includeSeconds = false) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) return 'Data inválida';
  
  const datePart = formatDatePart(date);
  const timePart = formatTimePart(date, includeSeconds);
  
  return `${datePart} ${timePart}`;
}

/**
 * Formata parte da data (DD/MM/YYYY)
 * @private
 */
function formatDatePart(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata parte do tempo (HH:MM ou HH:MM:SS)
 * @private
 */
function formatTimePart(date, includeSeconds) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  if (includeSeconds) {
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  
  return `${hours}:${minutes}`;
}

/**
 * Formata data de forma relativa (ex: "há 2 horas")
 * ✅ REFATORADO - Complexidade Cognitiva reduzida de 18 para 8
 * @param {string|number|Date} timestamp - Timestamp ou Date
 * @returns {string} Data relativa
 */
export function formatRelativeDate(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  
  return getRelativeDateString(diffMs);
}

/**
 * Obtém string de data relativa baseada na diferença em ms
 * @private
 */
function getRelativeDateString(diffMs) {
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) return 'agora mesmo';
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `há ${diffMinutes} ${pluralize(diffMinutes, 'minuto')}`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `há ${diffHours} ${pluralize(diffHours, 'hora')}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return formatDaysRelative(diffDays);
}

/**
 * Formata dias de forma relativa
 * @private
 */
function formatDaysRelative(diffDays) {
  if (diffDays < 7) {
    return `há ${diffDays} ${pluralize(diffDays, 'dia')}`;
  }
  
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `há ${weeks} ${pluralize(weeks, 'semana')}`;
  }
  
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `há ${months} ${pluralize(months, 'mês', 'meses')}`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `há ${years} ${pluralize(years, 'ano')}`;
}

/**
 * Formata data para nome de arquivo
 * @param {Date} date - Data (padrão: agora)
 * @returns {string} Data formatada (ex: "2024-01-15_14-30-00")
 */
export function formatDateForFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// ============================================
// FORMATAÇÃO DE NÚMEROS
// ============================================

/**
 * Calcula a taxa de sucesso em porcentagem
 * @param {number} success - Número de sucessos
 * @param {number} total - Total
 * @returns {number} Porcentagem (0-100)
 */
export function calculateSuccessRate(success, total) {
  if (!total || total === 0) return 0;
  return Math.round((success / total) * 100);
}

/**
 * Formata número com separador de milhares
 * @param {number} num - Número
 * @param {string} separator - Separador (padrão: ".")
 * @returns {string} Número formatado
 */
export function formatNumber(num, separator = '.') {
  if (num === null || num === undefined) return '0';
  return num.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Formata porcentagem
 * @param {number} value - Valor (0-100)
 * @param {number} decimals - Casas decimais (padrão: 0)
 * @returns {string} Porcentagem formatada
 */
export function formatPercentage(value, decimals = 0) {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata velocidade (itens por minuto)
 * @param {number} itemsPerMinute - Itens por minuto
 * @returns {string} Velocidade formatada
 */
export function formatSpeed(itemsPerMinute) {
  if (!itemsPerMinute || itemsPerMinute === 0) return '0 itens/min';
  
  if (itemsPerMinute >= 60) {
    const itemsPerSecond = (itemsPerMinute / 60).toFixed(1);
    return `${itemsPerSecond} itens/s`;
  }
  
  return `${Math.round(itemsPerMinute)} itens/min`;
}

// ============================================
// FORMATAÇÃO DE TEXTO
// ============================================

/**
 * Trunca texto com reticências
 * @param {string} text - Texto
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Capitaliza primeira letra
 * @param {string} text - Texto
 * @returns {string} Texto capitalizado
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Pluraliza palavra
 * @param {number} count - Quantidade
 * @param {string} singular - Forma singular
 * @param {string} plural - Forma plural (opcional)
 * @returns {string} Palavra pluralizada
 */
export function pluralize(count, singular, plural = null) {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

/**
 * Formata lista de itens
 * @param {Array} items - Lista de itens
 * @param {string} conjunction - Conjunção (padrão: "e")
 * @returns {string} Lista formatada
 */
export function formatList(items, conjunction = 'e') {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const allButLast = items.slice(0, -1).join(', ');
  const last = items.at(-1);
  
  return `${allButLast} ${conjunction} ${last}`;
}

/**
 * Remove caracteres especiais
 * @param {string} text - Texto
 * @returns {string} Texto sanitizado
 */
export function sanitizeText(text) {
  if (!text) return '';
  return text.replaceAll(/[^\w\s-]/gi, '');
}

/**
 * Valida e formata número de rastreamento
 * @param {string} trackingNumber - Número de rastreamento
 * @returns {string|null} Número formatado ou null se inválido
 */
export function formatTrackingNumber(trackingNumber) {
  if (!trackingNumber) return null;
  
  const cleaned = trackingNumber.trim().toUpperCase();
  
  // Validar formato básico (8-20 caracteres alfanuméricos)
  if (!/^[A-Z0-9]{8,20}$/.test(cleaned)) return null;
  
  return cleaned;
}

/**
 * Formata número de pedido
 * @param {string} orderId - ID do pedido
 * @returns {string} Pedido formatado
 */
export function formatOrderId(orderId) {
  if (!orderId) return '';
  return orderId.trim().toUpperCase();
}

// ============================================
// CONVERSÃO DE DADOS
// ============================================

/**
 * Converte objeto para query string
 * @param {Object} params - Parâmetros
 * @returns {string} Query string
 */
export function objectToQueryString(params) {
  return Object.keys(params)
    .filter(key => params[key] !== null && params[key] !== undefined)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

/**
 * Converte CSV para array de objetos
 * @param {string} csv - Conteúdo CSV
 * @param {string} delimiter - Delimitador (padrão: ",")
 * @returns {Array} Array de objetos
 */
export function csvToArray(csv, delimiter = ',') {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(delimiter).map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
  });
}

/**
 * Converte array de objetos para CSV
 * @param {Array} data - Array de objetos
 * @param {Array} headers - Headers (opcional)
 * @returns {string} CSV
 */
export function arrayToCSV(data, headers = null) {
  if (!data || data.length === 0) return '';
  
  const keys = headers || Object.keys(data[0]);
  const csvHeaders = keys.join(',');
  
  const csvRows = data.map(row => 
    keys.map(key => {
      const value = row[key] || '';
      return `"${value}"`;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}