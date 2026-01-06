// ============================================
// INFORMAÇÕES DA APLICAÇÃO
// ============================================

export const APP_INFO = {
  NAME: 'VTEX Update Tracking',
  VERSION: '1.0.3',
  AUTHOR: 'Alberto Luiz',
  DESCRIPTION: 'Dashboard desktop para atualizar rastreio e marcar entrega de pedidos na VTEX',
  GITHUB: 'https://github.com/alberto2santos/vtex-update-tracking',
};

// ============================================
// TIPOS E CATEGORIAS
// ============================================

export const LOG_TYPES = Object.freeze({
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  PROGRESS: 'progress',
  COMPLETE: 'complete',
  SKIPPED: 'skipped',
  TECHNICAL: 'technical'
});

export const LOG_FILTERS = Object.freeze({
  ALL: 'all',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  SKIPPED: 'skipped',
  INFO: 'info'
});

export const TOAST_TYPES = Object.freeze({
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning'
});

export const PROCESS_STATUS = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  STOPPING: 'stopping',
  COMPLETED: 'completed',
  ERROR: 'error',
  PAUSED: 'paused'
});

// ============================================
// CONFIGURAÇÕES PADRÃO
// ============================================

export const DEFAULT_CONFIG = Object.freeze({
  dryRun: true,
  concurrency: 4,
  delay: 200,
  darkMode: false,
  autoScroll: true,
  showTechnicalLogs: false,
  notifications: true,
  notificationsEnabled: true,
  soundEnabled: true,
  notificationTimeout: 5
});

export const CONCURRENCY_LIMITS = Object.freeze({
  MIN: 1,
  MAX: 12,
  DEFAULT: 4,
  RECOMMENDED: 4
});

export const DELAY_LIMITS = Object.freeze({
  MIN: 0,
  MAX: 2000,
  STEP: 50,
  DEFAULT: 200,
  RECOMMENDED: 200
});

// ============================================
// LIMITES E RESTRIÇÕES
// ============================================

export const LIMITS = Object.freeze({
  MAX_LOGS_DISPLAY: 500,
  MAX_HISTORY_ITEMS: 50,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_MANUAL_LIST_SIZE: 1000,
  REQUEST_TIMEOUT: 60000, // 60s
  AUTO_SAVE_INTERVAL: 30000 // 30s
});

// Manter exports individuais para compatibilidade
export const MAX_LOGS_DISPLAY = LIMITS.MAX_LOGS_DISPLAY;
export const MAX_HISTORY_ITEMS = LIMITS.MAX_HISTORY_ITEMS;
export const MAX_FILE_SIZE = LIMITS.MAX_FILE_SIZE;
export const MAX_MANUAL_LIST_SIZE = LIMITS.MAX_MANUAL_LIST_SIZE;
export const REQUEST_TIMEOUT = LIMITS.REQUEST_TIMEOUT;
export const AUTO_SAVE_INTERVAL = LIMITS.AUTO_SAVE_INTERVAL;

// ============================================
// DURAÇÕES E TIMINGS
// ============================================

export const TOAST_DURATION = 4000;

export const ANIMATION_DURATION = Object.freeze({
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
});

export const DEBOUNCE_DELAYS = Object.freeze({
  SEARCH: 300,
  RESIZE: 150,
  SCROLL: 100,
  INPUT: 300,
  CONFIG_SAVE: 500
});

// ============================================
// ARQUIVOS E VALIDAÇÃO
// ============================================

export const ACCEPTED_FILE_TYPES = Object.freeze({
  CSV: '.csv',
  TXT: '.txt',
  ALL: '*'
});

export const FILE_EXTENSIONS = Object.freeze({
  TEXT: Object.freeze(['txt', 'csv']),
  ALL: Object.freeze(['*'])
});

export const VALIDATION_REGEX = Object.freeze({
  TRACKING_NUMBER: /^[A-Z0-9]{8,20}$/i,
  ORDER_ID: /^[A-Z0-9-]{10,30}$/i,
  INVOICE_NUMBER: /^\d{6,10}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s()-]{10,20}$/,
  URL: /^https?:\/\/.+/i
});

// ============================================
// ATALHOS DE TECLADO
// ============================================

export const KEYBOARD_SHORTCUTS = Object.freeze([
  // Arquivo
  {
    key: 'Ctrl+O',
    mac: 'Cmd+O',
    name: 'Abrir Arquivo',
    description: 'Abrir arquivo',
    details: 'Abre o seletor de arquivos para carregar um CSV ou TXT',
    category: '📁 Arquivo'
  },
  {
    key: 'Ctrl+E',
    mac: 'Cmd+E',
    name: 'Exportar Logs',
    description: 'Exportar logs',
    details: 'Salva todos os logs em um arquivo de texto',
    category: '📁 Arquivo'
  },
  {
    key: 'Ctrl+,',
    mac: 'Cmd+,',
    name: 'Configurações',
    description: 'Configurações',
    details: 'Abre o painel de configurações do sistema',
    category: '📁 Arquivo'
  },
  
  // Processamento
  {
    key: 'Ctrl+Enter',
    mac: 'Cmd+Enter',
    name: 'Iniciar Processamento',
    description: 'Iniciar',
    details: 'Inicia o processamento dos pedidos carregados',
    category: '⚡ Processamento'
  },
  {
    key: 'Esc',
    mac: 'Esc',
    name: 'Parar Processamento',
    description: 'Parar',
    details: 'Interrompe o processamento em andamento',
    category: '⚡ Processamento'
  },
  {
    key: 'Ctrl+L',
    mac: 'Cmd+L',
    name: 'Limpar Lista',
    description: 'Limpar lista',
    details: 'Remove todos os pedidos da lista de entrada manual',
    category: '⚡ Processamento'
  },
  {
    key: 'Ctrl+K',
    mac: 'Cmd+K',
    name: 'Limpar Logs',
    description: 'Limpar logs',
    details: 'Apaga todos os registros de log da tela',
    category: '⚡ Processamento'
  },
  
  // Visualização
  {
    key: 'Ctrl+D',
    mac: 'Cmd+D',
    name: 'Alternar Tema',
    description: 'Tema claro/escuro',
    details: 'Alterna entre o modo claro e escuro',
    category: '🎨 Visualização'
  },
  {
    key: 'Ctrl+H',
    mac: 'Cmd+H',
    name: 'Ver Histórico',
    description: 'Histórico',
    details: 'Abre o histórico de execuções anteriores',
    category: '🎨 Visualização'
  },
  {
    key: 'F11',
    mac: 'Ctrl+Cmd+F',
    name: 'Tela Cheia',
    description: 'Tela cheia',
    details: 'Ativa ou desativa o modo de tela cheia',
    category: '🎨 Visualização'
  },
  {
    key: 'Ctrl+R',
    mac: 'Cmd+R',
    name: 'Recarregar',
    description: 'Recarregar',
    details: 'Recarrega a aplicação',
    category: '🎨 Visualização'
  },
  {
    key: 'Ctrl+/',
    mac: 'Cmd+/',
    name: 'Atalhos',
    description: 'Ver atalhos',
    details: 'Exibe a lista completa de atalhos de teclado',
    category: '🎨 Visualização'
  }
]);

// ============================================
// MENSAGENS DO SISTEMA
// ============================================

export const SYSTEM_MESSAGES = Object.freeze({
  // Sucesso
  CONFIG_SAVED: 'Configurações salvas com sucesso',
  FILE_LOADED: 'Arquivo carregado com sucesso',
  PROCESS_STARTED: 'Processamento iniciado',
  PROCESS_COMPLETED: 'Processamento concluído com sucesso',
  LOGS_EXPORTED: 'Logs exportados com sucesso',
  HISTORY_EXPORTED: 'Histórico exportado com sucesso',
  HISTORY_CLEARED: 'Histórico limpo com sucesso',
  HISTORY_ITEM_DELETED: 'Item removido do histórico',
  LOGS_CLEARED: 'Logs limpos',
  LIST_CLEARED: 'Lista limpa com sucesso',
  DUPLICATES_REMOVED: 'Duplicatas removidas',
  
  // Erro
  NO_FILE_SELECTED: 'Nenhum arquivo selecionado',
  INVALID_FILE: 'Arquivo inválido ou formato incorreto',
  FILE_TOO_LARGE: 'Arquivo muito grande (máx. 10MB)',
  PROCESS_FAILED: 'Erro durante o processamento',
  EXPORT_FAILED: 'Falha ao exportar',
  LOAD_CONFIG_FAILED: 'Erro ao carregar configurações',
  SAVE_CONFIG_FAILED: 'Erro ao salvar configurações',
  NETWORK_ERROR: 'Erro de conexão',
  TIMEOUT_ERROR: 'Tempo limite excedido',
  PERMISSION_DENIED: 'Permissão negada',
  
  // Aviso
  ALREADY_RUNNING: 'Processamento já está em andamento',
  NO_DATA: 'Nenhum dado disponível',
  EMPTY_LIST: 'Lista de pedidos está vazia',
  UNSAVED_CHANGES: 'Há alterações não salvas',
  CONFIRM_CLEAR: 'Tem certeza que deseja limpar?',
  CONFIRM_DELETE: 'Tem certeza que deseja excluir?',
  CONFIRM_STOP: 'Tem certeza que deseja parar o processamento?',
  
  // Info
  LOADING: 'Carregando...',
  PROCESSING: 'Processando...',
  STOPPING: 'Parando processamento...',
  SAVING: 'Salvando...',
  EXPORTING: 'Exportando...', 
  CONNECTING: 'Conectando...',
  VALIDATING: 'Validando...'
});

// ============================================
// CORES DO SISTEMA
// ============================================

export const SYSTEM_COLORS = Object.freeze({
  PRIMARY: '#3b82f6',
  PRIMARY_HOVER: '#2563eb',
  PRIMARY_LIGHT: '#60a5fa',
  PRIMARY_DARK: '#1d4ed8',
  
  SUCCESS: '#10b981',
  SUCCESS_HOVER: '#059669',
  SUCCESS_LIGHT: '#34d399',
  SUCCESS_DARK: '#047857',
  
  ERROR: '#ef4444',
  ERROR_HOVER: '#dc2626',
  ERROR_LIGHT: '#f87171',
  ERROR_DARK: '#b91c1c',
  
  WARNING: '#f59e0b',
  WARNING_HOVER: '#d97706',
  WARNING_LIGHT: '#fbbf24',
  WARNING_DARK: '#b45309',
  
  INFO: '#3b82f6',
  INFO_HOVER: '#2563eb',
  INFO_LIGHT: '#60a5fa',
  INFO_DARK: '#1d4ed8',
  
  GRAY: '#6b7280',
  GRAY_LIGHT: '#9ca3af',
  GRAY_DARK: '#4b5563',
  
  DARK_BG: '#1f2937',
  LIGHT_BG: '#ffffff',
  
  BORDER: '#e5e7eb',
  BORDER_DARK: '#374151'
});

// ============================================
// URLS E ENDPOINTS
// ============================================

export const API_ENDPOINTS = Object.freeze({
  VTEX_API: 'https://api.vtex.com',
  BISTURI_API: 'https://api.bisturi.com.br'
});

// ============================================
// FEATURES FLAGS
// ============================================

export const FEATURES = Object.freeze({
  ENABLE_NOTIFICATIONS: true,
  ENABLE_AUTO_UPDATE: false,
  ENABLE_ANALYTICS: false,
  ENABLE_DARK_MODE: true,
  ENABLE_EXPORT: true,
  ENABLE_HISTORY: true,
  ENABLE_MANUAL_INPUT: true,
  ENABLE_FILE_UPLOAD: true,
  ENABLE_DRY_RUN: true
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtém o atalho apropriado baseado na plataforma
 * @param {Object} shortcut - Objeto de atalho
 * @returns {string} Atalho formatado
 */
export const getShortcut = (shortcut) => {
  if (!shortcut) return '';
  
  // Detectar plataforma
  const isMac = typeof process !== 'undefined' 
    ? process.platform === 'darwin'
    : /Mac|iPhone|iPad|iPod/.test(navigator?.platform || '');
  
  return isMac ? shortcut.mac : shortcut.key;
};

/**
 * Obtém a cor baseada no tipo
 * @param {string} type - Tipo (success, error, warning, info)
 * @returns {string} Código de cor hexadecimal
 */
export const getColorByType = (type) => {
  const colorMap = {
    success: SYSTEM_COLORS.SUCCESS,
    error: SYSTEM_COLORS.ERROR,
    warning: SYSTEM_COLORS.WARNING,
    info: SYSTEM_COLORS.INFO
  };
  return colorMap[type] || SYSTEM_COLORS.GRAY;
};

/**
 * Valida o tamanho do arquivo
 * @param {number} size - Tamanho em bytes
 * @returns {boolean} True se válido
 */
export const isFileSizeValid = (size) => {
  return typeof size === 'number' && size > 0 && size <= MAX_FILE_SIZE;
};

/**
 * Valida a extensão do arquivo
 * @param {string} filename - Nome do arquivo
 * @returns {boolean} True se válido
 */
export const isFileExtensionValid = (filename) => {
  if (!filename || typeof filename !== 'string') return false;
  
  const ext = filename.split('.').pop()?.toLowerCase();
  return FILE_EXTENSIONS.TEXT.includes(ext);
};

/**
 * Formata bytes para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Formata duração em segundos para formato legível
 * @param {number} seconds - Duração em segundos
 * @returns {string} Duração formatada
 */
export const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True se válido
 */
export const isValidEmail = (email) => {
  return VALIDATION_REGEX.EMAIL.test(email);
};

/**
 * Valida formato de telefone
 * @param {string} phone - Telefone a validar
 * @returns {boolean} True se válido
 */
export const isValidPhone = (phone) => {
  return VALIDATION_REGEX.PHONE.test(phone);
};

/**
 * Valida formato de URL
 * @param {string} url - URL a validar
 * @returns {boolean} True se válido
 */
export const isValidURL = (url) => {
  return VALIDATION_REGEX.URL.test(url);
};

/**
 * Agrupa atalhos por categoria
 * @returns {Object} Atalhos agrupados
 */
export const getShortcutsByCategory = () => {
  return KEYBOARD_SHORTCUTS.reduce((acc, shortcut) => {
    const category = shortcut.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {});
};