const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

class AppUpdater {
  constructor(mainWindow, logger, notifier) {
    this.mainWindow = mainWindow;
    this.logger = logger;
    this.notifier = notifier;
    this.updateCheckInProgress = false;
    
    this.configure();
    this.setupEventHandlers();
  }

  configure() {
    // Configurar autoUpdater
    autoUpdater.autoDownload = false; // Não baixar automaticamente
    autoUpdater.autoInstallOnAppQuit = true; // Instalar ao fechar o app
    
    // Configurar logger
    if (this.logger) {
      autoUpdater.logger = this.logger;
    }
    
    this.log('Auto-updater configurado');
  }

  setupEventHandlers() {
    // Quando uma atualização está disponível
    autoUpdater.on('update-available', (info) => {
      this.log('Atualização disponível', { version: info.version });
      this.onUpdateAvailable(info);
    });

    // Quando não há atualização disponível
    autoUpdater.on('update-not-available', (info) => {
      this.log('Nenhuma atualização disponível', { version: info.version });
      
      if (this.updateCheckInProgress) {
        this.showNoUpdateDialog();
        this.updateCheckInProgress = false;
      }
    });

    // Progresso do download
    autoUpdater.on('download-progress', (progressObj) => {
      const message = `Download: ${Math.round(progressObj.percent)}%`;
      this.log(message, progressObj);
      
      // Enviar progresso para o renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-download-progress', {
          percent: Math.round(progressObj.percent),
          transferred: this.formatBytes(progressObj.transferred),
          total: this.formatBytes(progressObj.total),
          bytesPerSecond: this.formatBytes(progressObj.bytesPerSecond)
        });
      }
    });

    // Quando o download está completo
    autoUpdater.on('update-downloaded', (info) => {
      this.log('Atualização baixada', { version: info.version });
      this.onUpdateDownloaded(info);
    });

    // Erros
    autoUpdater.on('error', (error) => {
      this.logError('Erro no auto-updater', error);
      
      if (this.updateCheckInProgress) {
        this.showUpdateErrorDialog(error);
        this.updateCheckInProgress = false;
      }
    });

    // Verificando por atualizações
    autoUpdater.on('checking-for-update', () => {
      this.log('Verificando atualizações...');
    });
  }

  async onUpdateAvailable(info) {
    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Atualização Disponível',
      message: `Nova versão ${info.version} disponível!`,
      detail: `Versão atual: ${autoUpdater.currentVersion}\nNova versão: ${info.version}\n\nDeseja baixar agora?`,
      buttons: ['Baixar', 'Mais Tarde'],
      defaultId: 0,
      cancelId: 1
    });

    if (response.response === 0) {
      // Usuário escolheu baixar
      this.log('Iniciando download da atualização');
      
      if (this.notifier) {
        await this.notifier.info(
          'Download Iniciado',
          'A atualização está sendo baixada...'
        );
      }
      
      autoUpdater.downloadUpdate();
    } else {
      this.log('Usuário optou por não baixar a atualização');
    }
    
    this.updateCheckInProgress = false;
  }

  async onUpdateDownloaded(info) {
    if (this.notifier) {
      await this.notifier.success(
        'Atualização Pronta',
        `Versão ${info.version} baixada com sucesso!`
      );
    }

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Atualização Pronta',
      message: 'Atualização baixada com sucesso!',
      detail: `A versão ${info.version} foi baixada e está pronta para ser instalada.\n\nDeseja instalar agora? O aplicativo será reiniciado.`,
      buttons: ['Instalar Agora', 'Instalar ao Fechar'],
      defaultId: 0,
      cancelId: 1
    });

    if (response.response === 0) {
      // Instalar imediatamente
      this.log('Instalando atualização imediatamente');
      setImmediate(() => autoUpdater.quitAndInstall(false, true));
    } else {
      // Instalar ao fechar o app
      this.log('Atualização será instalada ao fechar o app');
      
      if (this.notifier) {
        await this.notifier.info(
          'Atualização Agendada',
          'A atualização será instalada quando você fechar o aplicativo.'
        );
      }
    }
  }

  showNoUpdateDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Sem Atualizações',
      message: 'Você está usando a versão mais recente!',
      detail: `Versão atual: ${autoUpdater.currentVersion}`,
      buttons: ['OK']
    });
  }

  showUpdateErrorDialog(error) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'error',
      title: 'Erro ao Verificar Atualizações',
      message: 'Não foi possível verificar atualizações',
      detail: `Erro: ${error.message}\n\nTente novamente mais tarde.`,
      buttons: ['OK']
    });
  }

  // Verificar atualizações automaticamente (ao iniciar o app)
  async checkForUpdatesAuto() {
    // Só verificar em produção
    if (process.env.NODE_ENV === 'development' || !process.defaultApp) {
      return;
    }

    try {
      this.log('Verificando atualizações automaticamente...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.logError('Erro ao verificar atualizações automaticamente', error);
    }
  }

  // Verificar atualizações manualmente (pelo menu/botão)
  async checkForUpdatesManual() {
    this.updateCheckInProgress = true;
    
    try {
      this.log('Verificação manual de atualizações iniciada');
      
      if (this.notifier) {
        await this.notifier.info(
          'Verificando Atualizações',
          'Aguarde enquanto verificamos se há atualizações disponíveis...'
        );
      }
      
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.logError('Erro ao verificar atualizações manualmente', error);
      this.showUpdateErrorDialog(error);
      this.updateCheckInProgress = false;
    }
  }

  // Funções auxiliares
  log(message, meta = {}) {
    if (this.logger) {
      this.logger.info(`[Updater] ${message}`, meta);
    } else {
      console.log(`[Updater] ${message}`, meta);
    }
  }

  logError(message, error) {
    if (this.logger) {
      this.logger.error(`[Updater] ${message}`, { 
        error: error?.message || String(error) 
      });
    } else {
      console.error(`[Updater] ${message}:`, error);
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Exportar classe
module.exports = AppUpdater;