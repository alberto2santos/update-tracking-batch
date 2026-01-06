const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Configurações
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),

  // Notificações
  updateNotificationSettings: (settings) => ipcRenderer.invoke('update-notification-settings', settings),
  testNotification: (type) => ipcRenderer.invoke('test-notification', type),

  // Arquivos
  selectUpload: () => ipcRenderer.invoke('select-upload'),
  readFilePreview: (filePath) => ipcRenderer.invoke('read-file-preview', filePath),

  // Job
  startJob: (args) => ipcRenderer.invoke('start-job', args),
  stopJob: () => ipcRenderer.invoke('stop-job'),

  // Histórico
  saveExecutionHistory: (data) => ipcRenderer.invoke('save-execution-history', data),
  getExecutionHistory: () => ipcRenderer.invoke('get-execution-history'),
  clearExecutionHistory: () => ipcRenderer.invoke('clear-execution-history'),
  deleteHistoryItem: (itemId) => ipcRenderer.invoke('delete-history-item', itemId),
  exportHistoryCSV: () => ipcRenderer.invoke('export-history-csv'),
  getHistoryStats: () => ipcRenderer.invoke('get-history-stats'),
  getHistoryChartData: () => ipcRenderer.invoke('get-history-chart-data'),

  // Logs
  exportLogsFile: (dateRange) => ipcRenderer.invoke('export-logs-file', dateRange),

  // ============================================
  // AUTO-UPDATER
  // ============================================
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  onUpdateProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('update-download-progress', listener);
    return () => ipcRenderer.removeListener('update-download-progress', listener);
  },

  // ============================================
  // LISTENERS
  // ============================================
  onLog: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('job-log', listener);
    return () => ipcRenderer.removeListener('job-log', listener);
  },

  onDone: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('job-done', listener);
    return () => ipcRenderer.removeListener('job-done', listener);
  },

  onError: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('job-error', listener);
    return () => ipcRenderer.removeListener('job-error', listener);
  },

  onMenuAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on('menu-action', listener);
    return () => ipcRenderer.removeListener('menu-action', listener);
  },

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('job-log');
    ipcRenderer.removeAllListeners('job-done');
    ipcRenderer.removeAllListeners('job-error');
    ipcRenderer.removeAllListeners('menu-action');
    ipcRenderer.removeAllListeners('update-download-progress');
  }
});

console.log('✅ Preload script carregado');