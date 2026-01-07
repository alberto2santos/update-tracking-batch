const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('node:path');
const { fork } = require('node:child_process');
const fs = require('node:fs');
const Store = require('electron-store');

app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar');
app.commandLine.appendSwitch('disable-smooth-scrolling', 'false');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas', 'true');
app.commandLine.appendSwitch('enable-gpu-rasterization');

const store = new Store();
const isDev = !app.isPackaged;

let mainWindow = null;
let currentProcess = null;
let logger = null;
let notifier = null;
let appUpdater = null;

// ============================================
// REACT DEVTOOLS (apenas em desenvolvimento)
// ============================================

let installExtension, REACT_DEVELOPER_TOOLS;
if (isDev) {
  try {
    const devtools = require('electron-devtools-installer');
    installExtension = devtools.default;
    REACT_DEVELOPER_TOOLS = devtools.REACT_DEVELOPER_TOOLS;
  } catch (err) {
    console.warn('⚠️ electron-devtools-installer não encontrado');
  }
}

// ============================================
// CARREGAR .env (DEV/PROD)
// ============================================

function loadEnvFromResources() {
  try {
    const dotenv = require('dotenv');
    const envPath = app.isPackaged
      ? path.join(process.resourcesPath, '.env')
      : path.join(__dirname, '..', '.env');

    console.log('=======================================');
    console.log('🔍 CARREGANDO .env');
    console.log('   isPackaged:', app.isPackaged);
    console.log('   envPath:', envPath);
    console.log('   exists:', fs.existsSync(envPath));
    console.log('=======================================');

    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log('✅ .env carregado de:', envPath);
    } else {
      console.warn('⚠️ .env não encontrado em:', envPath);
    }

    // ✅ LOG DAS VARIÁVEIS CARREGADAS
    console.log('=======================================');
    console.log('🔑 VARIÁVEIS NO MAIN:');
    console.log('   VTEX_ACCOUNT_NAME:', process.env.VTEX_ACCOUNT_NAME);
    console.log('   VTEX_APP_KEY:', process.env.VTEX_APP_KEY ? '✅' : '❌');
    console.log('   VTEX_APP_TOKEN:', process.env.VTEX_APP_TOKEN ? '✅' : '❌');
    console.log('=======================================');
  } catch (err) {
    console.warn('⚠️ Erro ao carregar .env:', err?.message || err);
  }
}

// ============================================
// FUNÇÕES AUXILIARES (Ícone, Limpeza, Backup, Logs ...)
// ============================================

function getIconPath() {
  // Em desenvolvimento
  if (isDev) {
    const iconPaths = {
      win32: path.join(__dirname, '..', 'public', 'icons', 'icon.ico'),
      darwin: path.join(__dirname, '..', 'public', 'icons', 'icon.icns'),
      linux: path.join(__dirname, '..', 'public', 'icons', 'icon.png')
    };

    const platformIcon = iconPaths[process.platform];

    if (platformIcon && fs.existsSync(platformIcon)) {
      console.log('✅ Ícone DEV encontrado:', platformIcon);
      return platformIcon;
    }
  }

  // Em produção - tentar múltiplos caminhos
  const iconPaths = {
    win32: [
      path.join(process.resourcesPath, 'icons', 'icon.ico'),
      path.join(process.resourcesPath, 'app.asar', 'public', 'icons', 'icon.ico'),
      path.join(__dirname, '..', 'public', 'icons', 'icon.ico')
    ],
    darwin: [
      path.join(process.resourcesPath, 'icons', 'icon.icns'),
      path.join(process.resourcesPath, 'app.asar', 'public', 'icons', 'icon.icns'),
      path.join(__dirname, '..', 'public', 'icons', 'icon.icns')
    ],
    linux: [
      path.join(process.resourcesPath, 'icons', 'icon.png'),
      path.join(process.resourcesPath, 'app.asar', 'public', 'icons', 'icon.png'),
      path.join(__dirname, '..', 'public', 'icons', 'icon.png')
    ]
  };

  const platformPaths = iconPaths[process.platform] || iconPaths.linux;

  for (const iconPath of platformPaths) {
    if (fs.existsSync(iconPath)) {
      console.log('✅ Ícone PROD encontrado:', iconPath);
      return iconPath;
    } else {
      console.log('⏭️  Tentando próximo caminho...');
    }
  }

  console.warn('⚠️ Ícone não encontrado em nenhum caminho');
  console.warn('   Caminhos testados:', platformPaths);
  return undefined;
}

function checkEnvironment() {
  const envPath = path.join(__dirname, '..', '.env');

  if (fs.existsSync(envPath)) {
    logInfo('Arquivo .env encontrado');
    return;
  }

  logWarn('Arquivo .env não encontrado');
  showEnvironmentWarning();
}

function showEnvironmentWarning() {
  if (!mainWindow?.isDestroyed()) {
    setTimeout(() => {
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Configuração Incompleta',
        message: 'Arquivo .env não encontrado',
        detail: 'Configure suas credenciais VTEX no arquivo .env para usar o aplicativo.\n\nCrie um arquivo .env baseado no .env.example fornecido.\n\nConsulte a documentação para mais informações.',
        buttons: ['OK']
      });
    }, 1000);
  }
}

function cleanup() {
  logInfo('Iniciando limpeza...');

  cleanupProcess();
  cleanupTempFiles();

  logInfo('Limpeza concluída');
}

function cleanupProcess() {
  if (!currentProcess) return;

  logInfo('Parando processo em execução...');

  try {
    currentProcess.kill('SIGTERM');
    currentProcess = null;
    logInfo('Processo parado');
  } catch (error) {
    logError('Erro ao parar processo', error);
  }
}

function cleanupTempFiles() {
  try {
    const tempDir = app.getPath('temp');
    const tempFiles = fs.readdirSync(tempDir)
      .filter(f => f.startsWith('vtex-manual-input-'));

    if (tempFiles.length === 0) return;

    logInfo(`Encontrados ${tempFiles.length} arquivo(s) temporário(s)`);

    tempFiles.forEach(file => removeTempFile(tempDir, file));
  } catch (error) {
    logError('Erro ao limpar arquivos temporários', error);
  }
}

function removeTempFile(tempDir, file) {
  try {
    fs.unlinkSync(path.join(tempDir, file));
    logInfo(`Removido: ${file}`);
  } catch (error) {
    logError(`Erro ao remover ${file}`, error);
  }
}

function scheduleAutoBackup() {
  const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;

  setInterval(() => {
    performAutoBackup();
  }, BACKUP_INTERVAL);
}

function performAutoBackup() {
  const history = store.get('execution_history', []);

  if (history.length === 0) return;

  const backupDir = path.join(app.getPath('userData'), 'backups');

  ensureDirectoryExists(backupDir);

  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `history_auto_${timestamp}.json`);

  fs.writeFileSync(backupFile, JSON.stringify(history, null, 2), 'utf8');

  logInfo('Backup automático criado', { file: backupFile, count: history.length });

  cleanupOldBackups(backupDir);
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanupOldBackups(backupDir) {
  try {
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('history_auto_'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    backups.slice(30).forEach(backup => {
      fs.unlinkSync(backup.path);
      logInfo('Backup antigo removido', { file: backup.name });
    });
  } catch (error) {
    logError('Erro ao limpar backups antigos', error);
  }
}

// ============================================
// FUNÇÕES DE LOG
// ============================================

function logInfo(message, meta = {}) {
  if (logger) {
    logger.info(message, meta);
  } else {
    console.log(`[INFO] ${message}`, meta);
  }
}

function logWarn(message, meta = {}) {
  if (logger) {
    logger.warn(message, meta);
  } else {
    console.warn(`[WARN] ${message}`, meta);
  }
}

function logError(message, error) {
  if (logger) {
    logger.error(message, { error: error?.message || String(error) });
  } else {
    console.error(`[ERROR] ${message}:`, error);
  }
}

// ============================================
// CRIAR MENU (mantive seu menu em PT-BR igual ao original)
// ============================================

function createMenu() {
  const template = buildMenuTemplate();

  if (process.platform === 'darwin') {
    template.unshift(buildMacMenu());
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function buildMenuTemplate() {
  return [
    buildFileMenu(),
    buildEditMenu(),
    buildViewMenu(),
    buildProcessMenu(),
    buildHistoryMenu(),
    buildWindowMenu(),
    buildHelpMenu()
  ];
}

function buildFileMenu() {
  return {
    label: 'Arquivo',
    submenu: [
      {
        label: 'Abrir Arquivo',
        accelerator: 'CmdOrCtrl+O',
        click: () => mainWindow?.webContents.send('menu-action', 'open-file')
      },
      {
        label: 'Exportar Logs',
        accelerator: 'CmdOrCtrl+E',
        click: () => mainWindow?.webContents.send('menu-action', 'export-logs')
      },
      { type: 'separator' },
      {
        label: 'Configurações',
        accelerator: 'CmdOrCtrl+,',
        click: () => mainWindow?.webContents.send('menu-action', 'settings')
      },
      { type: 'separator' },
      {
        label: 'Sair',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
        role: 'quit'
      }
    ]
  };
}

function buildEditMenu() {
  return {
    label: 'Editar',
    submenu: [
      { label: 'Desfazer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: 'Refazer', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
      { type: 'separator' },
      { label: 'Recortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: 'Colar', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      { label: 'Selecionar Tudo', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
    ]
  };
}

function buildViewMenu() {
  return {
    label: 'Visualizar',
    submenu: [
      {
        label: 'Recarregar',
        accelerator: 'CmdOrCtrl+R',
        click: () => mainWindow?.reload()
      },
      {
        label: 'Forçar Recarregar',
        accelerator: 'CmdOrCtrl+Shift+R',
        click: () => mainWindow?.webContents.reloadIgnoringCache()
      },
      { type: 'separator' },
      {
        label: 'Alternar Tema',
        accelerator: 'CmdOrCtrl+D',
        click: () => mainWindow?.webContents.send('menu-action', 'toggle-theme')
      },
      { type: 'separator' },
      {
        label: 'Tela Cheia',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
        click: () => {
          const isFullScreen = mainWindow?.isFullScreen();
          mainWindow?.setFullScreen(!isFullScreen);
        }
      },
      { type: 'separator' },
      { label: 'Aumentar Zoom', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
      { label: 'Diminuir Zoom', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
      { label: 'Zoom Padrão', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
      { type: 'separator' },
      {
        label: 'Ferramentas do Desenvolvedor',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        click: () => mainWindow?.webContents.toggleDevTools()
      }
    ]
  };
}

function buildProcessMenu() {
  return {
    label: 'Processamento',
    submenu: [
      {
        label: 'Iniciar',
        accelerator: 'CmdOrCtrl+Enter',
        click: () => mainWindow?.webContents.send('menu-action', 'start-job')
      },
      {
        label: 'Parar',
        accelerator: 'Esc',
        click: () => mainWindow?.webContents.send('menu-action', 'stop-job')
      },
      { type: 'separator' },
      {
        label: 'Limpar Lista',
        accelerator: 'CmdOrCtrl+L',
        click: () => mainWindow?.webContents.send('menu-action', 'clear-list')
      },
      {
        label: 'Limpar Logs',
        accelerator: 'CmdOrCtrl+K',
        click: () => mainWindow?.webContents.send('menu-action', 'clear-logs')
      }
    ]
  };
}

function buildHistoryMenu() {
  return {
    label: 'Histórico',
    submenu: [
      {
        label: 'Ver Histórico',
        accelerator: 'CmdOrCtrl+H',
        click: () => mainWindow?.webContents.send('menu-action', 'show-history')
      },
      {
        label: 'Exportar Histórico',
        click: () => mainWindow?.webContents.send('menu-action', 'export-history')
      },
      { type: 'separator' },
      {
        label: 'Limpar Histórico',
        click: () => mainWindow?.webContents.send('menu-action', 'clear-history')
      }
    ]
  };
}

function buildWindowMenu() {
  return {
    label: 'Janela',
    submenu: [
      { label: 'Minimizar', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
      { label: 'Fechar', accelerator: 'CmdOrCtrl+W', role: 'close' },
      { type: 'separator' },
      {
        label: 'Sempre no Topo',
        type: 'checkbox',
        checked: false,
        click: (menuItem) => mainWindow?.setAlwaysOnTop(menuItem.checked)
      }
    ]
  };
}

function buildHelpMenu() {
  return {
    label: 'Ajuda',
    submenu: [
      {
        label: 'Documentação',
        click: () => mainWindow?.webContents.send('menu-action', 'show-docs')
      },
      {
        label: 'Atalhos de Teclado',
        accelerator: 'CmdOrCtrl+/',
        click: () => mainWindow?.webContents.send('menu-action', 'show-shortcuts')
      },
      { type: 'separator' },
      {
        label: 'Sobre',
        click: () => showAboutDialog()
      },
      {
        label: 'Verificar Atualizações',
        click: () => showUpdateDialog()
      }
    ]
  };
}

function buildMacMenu() {
  return {
    label: app.name,
    submenu: [
      { label: `Sobre ${app.name}`, role: 'about' },
      { type: 'separator' },
      {
        label: 'Preferências',
        accelerator: 'Cmd+,',
        click: () => mainWindow?.webContents.send('menu-action', 'settings')
      },
      { type: 'separator' },
      { label: 'Serviços', role: 'services' },
      { type: 'separator' },
      { label: `Ocultar ${app.name}`, accelerator: 'Cmd+H', role: 'hide' },
      { label: 'Ocultar Outros', accelerator: 'Cmd+Alt+H', role: 'hideOthers' },
      { label: 'Mostrar Todos', role: 'unhide' },
      { type: 'separator' },
      { label: 'Sair', accelerator: 'Cmd+Q', role: 'quit' }
    ]
  };
}

// ============================================
// DIALOGS & ABOUT
// ============================================

function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Sobre VTEX Update Tracking',
    message: 'VTEX Update Tracking',
    detail: `Versão: 1.0.4\nAutor: Alberto Luiz\nDescrição: Dashboard desktop para atualizar rastreio e marcar entrega de pedidos na VTEX\n\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}`,
    buttons: ['OK']
  });
}

function showUpdateDialog() {
  if (!isDev && appUpdater) {
    appUpdater.checkForUpdatesManual();
    return;
  }

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Atualizações',
    message: 'Verificação de atualizações disponível apenas em produção',
    detail: isDev
      ? 'Modo desenvolvimento: auto-updater desabilitado\n\nPara testar atualizações, faça o build de produção.'
      : 'Versão ' + app.getVersion(),
    buttons: ['OK']
  });
}

// ============================================
// CRIAR JANELA (com DevTools opcional em prod)
// ============================================

async function createWindow() {
  console.log('🌍 Criando janela principal...');

  await installDevTools();

  const iconPath = getIconPath();
  console.log('🎨 Ícone selecionado:', iconPath);

  // Habilita DevTools quando em dev OU se variável ENABLE_DEVTOOLS=true (útil para debug em produção)
  const enableDevTools = isDev || process.env.ENABLE_DEVTOOLS === 'true';

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#667eea',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: enableDevTools,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
      backgroundThrottling: false
    }
  });

  // CSP
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' http://localhost:5173; " +
            "script-src 'self' 'unsafe-inline' http://localhost:5173; " +
            "style-src 'self' 'unsafe-inline' http://localhost:5173; " +
            "font-src 'self' data:; " +
            "img-src 'self' data: blob: http://localhost:5173; " +
            "connect-src 'self' http://localhost:5173 ws://localhost:5173;"
            : "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "font-src 'self' data:; " +
            "img-src 'self' data: blob:; " +
            "connect-src 'self';"
        ]
      }
    });
  });

  createMenu();

  try {
    if (isDev) {
      console.log('🔧 Modo DEV: Carregando de http://localhost:5173');
      await mainWindow.loadURL('http://localhost:5173');
    } else {
      console.log('📦 Modo PROD: Carregando de arquivo local');
      console.log('📂 __dirname:', __dirname);
      console.log('📂 process.resourcesPath:', process.resourcesPath);
      console.log('📂 app.getAppPath():', app.getAppPath());

      const possiblePaths = [
        path.join(__dirname, '..', 'dist', 'index.html'),
        path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
        path.join(process.resourcesPath, 'dist', 'index.html'),
        path.join(app.getAppPath(), 'dist', 'index.html')
      ];

      let indexPath = null;

      for (const testPath of possiblePaths) {
        console.log('🔍 Testando:', testPath);
        if (fs.existsSync(testPath)) {
          console.log('✅ Arquivo encontrado!');
          indexPath = testPath;
          break;
        } else {
          console.log('❌ Não encontrado');
        }
      }

      if (!indexPath) {
        throw new Error('index.html não encontrado em nenhum caminho');
      }

      console.log('📄 Carregando de:', indexPath);

      await mainWindow.loadFile(indexPath);

      // Abrir DevTools se habilitado (útil para debug em prod via ENABLE_DEVTOOLS)
      if (enableDevTools) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  } catch (error) {
    console.error('❌ ERRO AO CARREGAR:', error);

    dialog.showErrorBox(
      'Erro ao Iniciar',
      `Não foi possível carregar a interface do aplicativo.\n\nErro: ${error.message}\n\nDetalhes técnicos:\n__dirname: ${__dirname}\nisDev: ${isDev}`
    );

    app.quit();
    return;
  }

  mainWindow.once('ready-to-show', () => {
    console.log('✅ Janela pronta, mostrando...');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Atalho F12 para DevTools
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Conteúdo carregado com sucesso!');
    mainWindow.webContents.executeJavaScript(`
    console.log('✅ Habilitando eventos de scroll...');
    document.body.style.overscrollBehavior = 'contain';
    document.documentElement.style.overscrollBehavior = 'contain';
    console.log('✅ Scroll configurado!');
  `).catch(err => console.error('❌ Erro ao configurar scroll:', err));

    checkEnvironment();
    initializeAutoUpdater();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Falha ao carregar:', errorCode, errorDescription);
    console.error('❌ URL que falhou:', validatedURL);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER] ${message}`);
  });
}

// ============================================
// AUTO-UPDATER
// ============================================

function initializeAutoUpdater() {
  if (isDev) {
    console.log('⏭️  Auto-updater desabilitado em desenvolvimento');
    return;
  }

  try {
    const AppUpdater = require('./updater');
    appUpdater = new AppUpdater(mainWindow, logger, notifier);

    setTimeout(() => {
      if (appUpdater) {
        appUpdater.checkForUpdatesAuto();
      }
    }, 5000);

    logInfo('Auto-updater inicializado');
  } catch (error) {
    logError('Erro ao inicializar auto-updater', error);
  }
}

async function installDevTools() {
  if (!isDev || !installExtension || !REACT_DEVELOPER_TOOLS) return;

  try {
    const name = await installExtension(REACT_DEVELOPER_TOOLS, {
      loadExtensionOptions: { allowFileAccess: true }
    });
    logInfo('React DevTools instalado', { name });
  } catch (error) {
    logWarn('Erro ao instalar React DevTools', { error: error.message });
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

async function initializeApp() {
  await loadModules();

  const { Logger } = require('./utils/logger');
  logger = new Logger(app);
  logger.info('Aplicativo iniciado', { version: '1.0.4', isDev });

  const iconPath = getIconPath();
  const { Notifier } = require('./utils/notifier');
  notifier = new Notifier(iconPath);

  await loadNotificationPreferences();

  registerIPCHandlers();

  await createWindow();

  scheduleAutoBackup();

  logInfo('Inicialização completa', {
    logger: logger ? 'OK' : 'ERRO',
    notifier: notifier ? 'OK' : 'ERRO',
    mainWindow: mainWindow ? 'OK' : 'ERRO'
  });
}

async function loadModules() {
  try {
    require('./utils/logger');
    console.log('✅ Logger carregado');
  } catch (error) {
    console.error('❌ Erro ao carregar Logger:', error.message);
  }

  try {
    require('./utils/notifier');
    console.log('✅ Notifier carregado');
  } catch (error) {
    console.error('❌ Erro ao carregar Notifier:', error.message);
  }
}

async function loadNotificationPreferences() {
  try {
    const config = store.get('config', {});

    if (config.notificationsEnabled === false) {
      notifier.disable();
      logInfo('Notificações desabilitadas por preferência do usuário');
    }

    if (config.soundEnabled === false) {
      notifier.disableSound();
      logInfo('Sons de notificação desabilitados');
    }

    if (config.notificationTimeout) {
      notifier.setDefaultTimeout(config.notificationTimeout);
    }
  } catch (error) {
    logWarn('Erro ao carregar preferências de notificação', { error: error.message });
  }
}

// ============================================
// REGISTRAR HANDLERS IPC
// ============================================

function registerIPCHandlers() {
  console.log('📋 Registrando handlers IPC...');

  ipcMain.handle('save-config', handleSaveConfig);
  ipcMain.handle('load-config', handleLoadConfig);
  ipcMain.handle('update-notification-settings', handleUpdateNotificationSettings);
  ipcMain.handle('test-notification', handleTestNotification);

  ipcMain.handle('select-upload', handleSelectUpload);
  ipcMain.handle('read-file-preview', handleReadFilePreview);

  ipcMain.handle('start-job', handleStartJob);
  ipcMain.handle('stop-job', handleStopJob);

  ipcMain.handle('save-execution-history', handleSaveExecutionHistory);
  ipcMain.handle('get-execution-history', handleGetExecutionHistory);
  ipcMain.handle('clear-execution-history', handleClearExecutionHistory);
  ipcMain.handle('delete-history-item', handleDeleteHistoryItem);
  ipcMain.handle('export-history-csv', handleExportHistoryCSV);
  ipcMain.handle('get-history-stats', handleGetHistoryStats);
  ipcMain.handle('get-history-chart-data', handleGetHistoryChartData);

  ipcMain.handle('export-logs-file', handleExportLogsFile);

  ipcMain.handle('check-for-updates', handleCheckForUpdates);

  console.log('✅ Handlers IPC registrados com sucesso');
}

// ============================================
// APP LIFECYCLE
// ============================================

(async () => {
  await app.whenReady();
  loadEnvFromResources();
  await initializeApp();
})();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

app.on('before-quit', () => {
  logInfo('Aplicativo fechando...');
  cleanup();
});

app.on('will-quit', () => {
  logInfo('Aplicativo finalizado');
});

// ============================================
// IPC HANDLERS - IMPLEMENTAÇÕES (mantive o seu código)
// ============================================

// --- handlers: save-config, load-config, update-notification-settings, test-notification
// --- handlers: save-execution-history, get-execution-history, clear-execution-history, delete-history-item
// --- handlers: export-history-csv, get-history-stats, get-history-chart-data
// --- handlers: select-upload, read-file-preview
// --- handlers: export-logs-file, check-for-updates
// --- OBS: mantive a lógica que você já tinha no seu main.js original
// Para evitar duplicação aqui, assumo que você mantém o bloco original desses handlers abaixo
// (caso queira, eu colo tudo exatamente como estava no seu arquivo original)

// ============================================
// START JOB / PROCESS HANDLERS (corrigidos: fallback path + merge env)
// ============================================

async function handleStartJob(_event, args) {
  if (currentProcess) {
    return { ok: false, error: 'Processo já em execução' };
  }

  try {
    const prodCandidates = [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'update-invoice-tracking.js'),
      path.join(process.resourcesPath, 'update-invoice-tracking.js'),
      path.join(app.getAppPath(), 'update-invoice-tracking.js'),
      path.join(__dirname, '..', 'update-invoice-tracking.js')
    ];

    let scriptPath = null;
    if (app.isPackaged) {
      for (const p of prodCandidates) {
        if (fs.existsSync(p)) {
          scriptPath = p;
          break;
        }
      }
    } else {
      scriptPath = path.join(__dirname, '..', 'update-invoice-tracking.js');
    }

    console.log('📄 SCRIPT PATH RESOLVIDO:', scriptPath);
    if (!scriptPath || !fs.existsSync(scriptPath)) {
      logError('Script não encontrado', { path: scriptPath });
      return { ok: false, error: 'Script não encontrado' };
    }

    const cliArgs = await prepareJobArguments(args);
    const processResult = await startJobProcess(scriptPath, cliArgs);

    if (processResult.ok && notifier) {
      const totalPedidos = args.manualList?.length || 0;
      await notifier.info(
        'Processamento Iniciado',
        `Processando ${totalPedidos} ${totalPedidos === 1 ? 'pedido' : 'pedidos'}`
      );
    }

    return processResult;
  } catch (error) {
    logError('Erro ao iniciar job', error);
    currentProcess = null;
    return { ok: false, error: error.message };
  }
}

async function prepareJobArguments(args) {
  const cliArgs = [];

  if (args.manualList?.length > 0) {
    const tempFile = await createTempFile(args.manualList);
    cliArgs.push('--input', tempFile);
    scheduleTempFileCleanup(tempFile);
  } else if (args.filePath) {
    cliArgs.push('--input', args.filePath);
  } else {
    throw new Error('Nenhum input fornecido');
  }

  if (args.dryRun) cliArgs.push('--dry-run');
  if (args.verbose) cliArgs.push('--verbose');
  if (args.concurrency) cliArgs.push('--concurrency', String(args.concurrency));
  if (args.delay) cliArgs.push('--delay', String(args.delay));

  return cliArgs;
}

async function createTempFile(manualList) {
  const tempDir = app.getPath('temp');
  const tempFile = path.join(tempDir, `vtex-manual-input-${Date.now()}.txt`);

  logInfo('Criando arquivo temporário', { path: tempFile });

  try {
    fs.writeFileSync(tempFile, manualList.join('\n'), 'utf8');
    return tempFile;
  } catch (error) {
    logError('Erro ao criar arquivo temporário', error);
    throw new Error(`Erro ao criar arquivo temporário: ${error.message}`);
  }
}

function scheduleTempFileCleanup(tempFile) {
  setTimeout(() => {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
        logInfo('Arquivo temporário removido', { path: tempFile });
      }
    } catch (error) {
      logWarn('Erro ao remover arquivo temporário', { error: error.message });
    }
  }, 5 * 60 * 1000);
}

async function startJobProcess(scriptPath, cliArgs) {
  const { spawn } = require('node:child_process');
  
  console.log('=======================================');
  console.log('🚀 INICIANDO PROCESSO');
  console.log('   scriptPath:', scriptPath);
  console.log('   scriptPath exists:', fs.existsSync(scriptPath));
  console.log('   args:', cliArgs);
  console.log('   isPackaged:', app.isPackaged);
  console.log('=======================================');

  logInfo('Iniciando processo', {
    script: scriptPath,
    args: cliArgs
  });

  try {
    // ✅ Calcular o caminho correto para node_modules
    const nodeModulesPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'node_modules')
      : path.join(__dirname, '..', 'node_modules');

    console.log('📦 node_modules path:', nodeModulesPath);

    const processEnv = {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'production',
      VTEX_ACCOUNT_NAME: process.env.VTEX_ACCOUNT_NAME,
      VTEX_ENVIRONMENT: process.env.VTEX_ENVIRONMENT,
      VTEX_APP_KEY: process.env.VTEX_APP_KEY,
      VTEX_APP_TOKEN: process.env.VTEX_APP_TOKEN,
      VTEX_WORKSPACE: process.env.VTEX_WORKSPACE || 'master',
      VTEX_GRAPHQL_LOCALE: process.env.VTEX_GRAPHQL_LOCALE || 'pt-BR',
      BISTURI_BASE: process.env.BISTURI_BASE || 'https://api.bisturi.com.br',
      REQUEST_DELAY_MS: process.env.REQUEST_DELAY_MS || '200',
      CONCURRENCY: process.env.CONCURRENCY || '4',
      ELECTRON_RUN_AS_NODE: '1',
      // ✅ Adicionar NODE_PATH para encontrar módulos
      NODE_PATH: nodeModulesPath
    };

    console.log('=======================================');
    console.log('🔑 ENV PARA O PROCESSO:');
    console.log('   VTEX_ACCOUNT_NAME:', processEnv.VTEX_ACCOUNT_NAME);
    console.log('   VTEX_APP_KEY:', processEnv.VTEX_APP_KEY ? '✅' : '❌');
    console.log('   VTEX_APP_TOKEN:', processEnv.VTEX_APP_TOKEN ? '✅' : '❌');
    console.log('   ELECTRON_RUN_AS_NODE:', processEnv.ELECTRON_RUN_AS_NODE);
    console.log('   NODE_PATH:', processEnv.NODE_PATH);
    console.log('=======================================');

    console.log('🔄 Criando processo...');

    if (app.isPackaged) {
      currentProcess = spawn(process.execPath, [scriptPath, ...cliArgs], {
        env: processEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      });
    } else {
      currentProcess = fork(scriptPath, cliArgs, {
        cwd: path.join(__dirname, '..'),
        env: processEnv,
        silent: true
      });
    }

    console.log('✅ Processo criado!');
    console.log('   PID:', currentProcess?.pid);

    if (!currentProcess?.pid) {
      console.error('❌ Processo sem PID!');
      throw new Error('Falha ao criar processo filho');
    }

    logInfo('Processo criado', { pid: currentProcess.pid });

    setupProcessHandlers();

    return { ok: true, pid: currentProcess.pid };
  } catch (error) {
    console.error('❌ ERRO AO CRIAR PROCESSO:');
    console.error('   message:', error.message);
    console.error('   stack:', error.stack);
    console.error('   code:', error.code);

    logError('Erro ao criar processo', error);
    currentProcess = null;
    throw error;
  }
}

function setupProcessHandlers() {
  currentProcess.stdout?.on('data', (data) => {
    const text = data.toString();
    mainWindow?.webContents.send('job-log', { type: 'stdout', text });
  });

  currentProcess.stderr?.on('data', (data) => {
    const text = data.toString();
    mainWindow?.webContents.send('job-log', { type: 'stderr', text });
  });

  currentProcess.on('close', (code) => {
    handleProcessClose(code);
  });

  currentProcess.on('error', (err) => {
    handleProcessError(err);
  });
}

function handleProcessClose(code) {
  logInfo('Processo finalizado', { code });

  if (notifier) {
    if (code === 0) {
      const stats = extractStatsFromLogs();

      if (stats) {
        notifier.complete('Processamento Concluído', stats);
      } else {
        notifier.success(
          'Processamento Concluído',
          'Todos os pedidos foram processados com sucesso!'
        );
      }
    } else {
      notifier.error(
        'Processamento Finalizado com Erros',
        'Verifique os logs para mais detalhes.'
      );
    }
  }

  mainWindow?.webContents.send('job-done', { code });
  currentProcess = null;
}

function extractStatsFromLogs() {
  try {
    const history = store.get('execution_history', []);
    if (history.length === 0) return null;

    const lastExecution = history[0];

    return {
      total: lastExecution.total || 0,
      success: lastExecution.success || 0,
      errors: lastExecution.errors || 0,
      duration: lastExecution.duration || 0
    };
  } catch {
    return null;
  }
}

function handleProcessError(err) {
  logError('Erro no processo', err);

  if (notifier) {
    notifier.error('Erro no Processamento', err.message);
  }

  mainWindow?.webContents.send('job-error', { message: err.message });
  currentProcess = null;
}

async function handleStopJob() {
  if (!currentProcess) {
    return { ok: true };
  }

  logInfo('Parando processo...');

  try {
    currentProcess.kill('SIGTERM');
    currentProcess = null;
    logInfo('Processo parado');

    if (notifier) {
      await notifier.info(
        'Processamento Parado',
        'O processamento foi interrompido.'
      );
    }
  } catch (error) {
    logError('Erro ao parar processo', error);
  }

  return { ok: true };
}

async function handleExportLogsFile(_event, { startDate, endDate }) {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultPath = `logs_${timestamp}.csv`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Logs',
      defaultPath,
      filters: [
        { name: 'CSV', extensions: ['csv'] },
        { name: 'Todos os Arquivos', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }

    const count = logger?.exportLogsToCSV(
      new Date(startDate),
      new Date(endDate),
      result.filePath
    ) || 0;

    logInfo('Logs exportados', { path: result.filePath, count });
    return { ok: true, count, filePath: result.filePath };
  } catch (error) {
    logError('Erro ao exportar logs', error);
    return { ok: false, error: error.message };
  }
}

async function handleCheckForUpdates() {
  try {
    if (!appUpdater) {
      return { ok: false, error: 'Auto-updater não disponível' };
    }

    await appUpdater.checkForUpdatesManual();
    return { ok: true };
  } catch (error) {
    logError('Erro ao verificar atualizações', error);
    return { ok: false, error: error.message };
  }
}

// ============================================
// TRATAMENTO DE ERROS GLOBAIS
// ============================================

process.on('uncaughtException', (error) => {
  logError('Erro não capturado', error);

  if (mainWindow?.isDestroyed() === false) {
    dialog.showErrorBox(
      'Erro Inesperado',
      `Ocorreu um erro inesperado:\n\n${error.message}\n\nO aplicativo pode não funcionar corretamente.`
    );
  }
});

process.on('unhandledRejection', (reason) => {
  const errorMessage = formatErrorReason(reason);
  logError('Promise rejeitada não tratada', { reason: errorMessage });
});

function formatErrorReason(reason) {
  if (reason instanceof Error) {
    return `${reason.message}${reason.stack ? '\n' + reason.stack : ''}`;
  }

  if (typeof reason === 'string') {
    return reason;
  }

  if (typeof reason === 'object' && reason !== null) {
    try {
      return JSON.stringify(reason, null, 2);
    } catch {
      return String(reason);
    }
  }

  return String(reason);
}


// ============================================
// IPC HANDLERS - IMPLEMENTAÇÕES
// ============================================

async function handleSaveConfig(_event, config) {
  try {
    store.set('config', config);
    logInfo('Configurações salvas', { config });
    return { ok: true };
  } catch (error) {
    logError('Erro ao salvar config', error);
    return { ok: false, error: error.message };
  }
}

async function handleLoadConfig() {
  try {
    const config = store.get('config');
    return { ok: true, config };
  } catch (error) {
    logError('Erro ao carregar config', error);
    return { ok: false, error: error.message };
  }
}

async function handleUpdateNotificationSettings(_event, settings) {
  try {
    const config = store.get('config', {});

    const updatedConfig = {
      ...config,
      notificationsEnabled: settings.notificationsEnabled ?? config.notificationsEnabled ?? true,
      soundEnabled: settings.soundEnabled ?? config.soundEnabled ?? true,
      notificationTimeout: settings.notificationTimeout ?? config.notificationTimeout ?? 5
    };

    store.set('config', updatedConfig);

    if (!notifier) {
      return { ok: true, warning: 'Notifier não disponível' };
    }

    if (settings.notificationsEnabled === false) {
      notifier.disable();
    } else if (settings.notificationsEnabled === true) {
      notifier.enable();
    }

    if (settings.soundEnabled === false) {
      notifier.disableSound();
    } else if (settings.soundEnabled === true) {
      notifier.enableSound();
    }

    if (settings.notificationTimeout) {
      notifier.setDefaultTimeout(settings.notificationTimeout);
    }

    logInfo('Preferências atualizadas', settings);
    return { ok: true };
  } catch (error) {
    logError('Erro ao atualizar preferências', error);
    return { ok: false, error: error.message };
  }
}

async function handleTestNotification(_event, type = 'info') {
  try {
    if (!notifier) {
      return { ok: false, error: 'Notifier não disponível' };
    }

    const messages = {
      success: { title: 'Teste', message: 'Sucesso! ✅' },
      error: { title: 'Teste', message: 'Erro! ❌' },
      warning: { title: 'Teste', message: 'Aviso! ⚠️' },
      info: { title: 'Teste', message: 'Info! ℹ️' }
    };

    const msg = messages[type] || messages.info;
    await notifier[type](msg.title, msg.message);
    return { ok: true };
  } catch (error) {
    logError('Erro ao enviar notificação', error);
    return { ok: false, error: error.message };
  }
}

async function handleSaveExecutionHistory(_event, data) {
  try {
    const history = store.get('execution_history', []);
    history.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      fileName: data.fileName || 'Desconhecido',
      total: data.total || 0,
      success: data.success || 0,
      errors: data.errors || 0,
      duration: data.duration || 0
    });
    const limitedHistory = history.slice(0, 50);
    store.set('execution_history', limitedHistory);
    return { ok: true };
  } catch (error) {
    logError('Erro ao salvar histórico', error);
    return { ok: false, error: error.message };
  }
}

async function handleGetExecutionHistory() {
  try {
    const history = store.get('execution_history', []);
    return { ok: true, history };
  } catch (error) {
    return { ok: false, error: error.message, history: [] };
  }
}

async function handleClearExecutionHistory() {
  try {
    store.set('execution_history', []);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleDeleteHistoryItem(_event, itemId) {
  try {
    const history = store.get('execution_history', []);
    const filtered = history.filter(item => item.id !== itemId);
    store.set('execution_history', filtered);
    return { ok: true, history: filtered };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleExportHistoryCSV() {
  try {
    const history = store.get('execution_history', []);
    if (history.length === 0) {
      return { ok: false, error: 'Nenhum histórico' };
    }

    const headers = ['Data', 'Arquivo', 'Total', 'Sucesso', 'Erros', 'Duração'];
    const rows = history.map(item => [
      new Date(item.date).toLocaleString('pt-BR'),
      item.fileName, item.total, item.success, item.errors, item.duration
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Histórico',
      defaultPath: `historico_${new Date().toISOString().split('T')[0]}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });

    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }

    fs.writeFileSync(result.filePath, csv, 'utf8');
    return { ok: true, filePath: result.filePath };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleGetHistoryStats() {
  try {
    const history = store.get('execution_history', []);
    if (history.length === 0) {
      return { ok: true, stats: { totalExecutions: 0, totalProcessed: 0, totalSuccess: 0, totalErrors: 0, avgDuration: 0, avgSuccessRate: 0 } };
    }

    const stats = {
      totalExecutions: history.length,
      totalProcessed: history.reduce((s, i) => s + i.total, 0),
      totalSuccess: history.reduce((s, i) => s + i.success, 0),
      totalErrors: history.reduce((s, i) => s + i.errors, 0),
      avgDuration: Math.round(history.reduce((s, i) => s + i.duration, 0) / history.length),
      avgSuccessRate: 0
    };
    stats.avgSuccessRate = stats.totalProcessed > 0 ? Math.round((stats.totalSuccess / stats.totalProcessed) * 100) : 0;

    return { ok: true, stats };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleGetHistoryChartData() {
  try {
    const history = store.get('execution_history', []);
    const recent = history.slice(0, 10).reverse();
    const labels = recent.map(i => {
      const d = new Date(i.date);
      return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    return {
      ok: true,
      chartData: {
        labels,
        datasets: [
          { label: 'Sucesso', data: recent.map(i => i.success), backgroundColor: 'rgba(16, 185, 129, 0.5)', borderColor: 'rgba(16, 185, 129, 1)', borderWidth: 2 },
          { label: 'Erros', data: recent.map(i => i.errors), backgroundColor: 'rgba(239, 68, 68, 0.5)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 2 }
        ]
      }
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function handleSelectUpload() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Texto', extensions: ['txt', 'csv'] }]
  });
  if (result.canceled || !result.filePaths?.length) return null;
  return result.filePaths[0];
}

async function handleReadFilePreview(_event, filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: 'Arquivo não encontrado' };
    }
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    return {
      ok: true,
      name: path.basename(filePath),
      size: stats.size,
      lineCount: lines.length,
      preview: lines.slice(0, 5)
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================

console.log('=== ELECTRON MAIN INICIADO ===');
console.log('Versão do App:', app.getVersion ? app.getVersion() : '1.0.4');
console.log('Modo:', isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);
console.log('Node version:', process.version);
console.log('Electron version:', process.versions.electron);
console.log('App Path:', app.getAppPath());
console.log('User Data:', app.getPath('userData'));
console.log('Temp:', app.getPath('temp'));
console.log('==============================');