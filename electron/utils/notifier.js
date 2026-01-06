const notifier = require('node-notifier');
const path = require('path');

/**
 * Classe para gerenciar notificações do sistema
 * Utiliza node-notifier para exibir notificações nativas
 */
class Notifier {
  /**
   * @param {string} iconPath - Caminho para o ícone da notificação
   */
  constructor(iconPath) {
    this.iconPath = iconPath;
    this.isEnabled = true;
    this.defaultTimeout = 5;
    this.soundEnabled = true;
  }

  /**
   * Envia uma notificação genérica
   * @param {string} title - Título da notificação
   * @param {string} message - Mensagem da notificação
   * @param {Object} options - Opções adicionais
   * @returns {Promise<void>}
   */
  async notify(title, message, options = {}) {
    if (!this.isEnabled) {
      console.log('[Notifier] Notificações desabilitadas');
      return;
    }

    if (!title || !message) {
      console.warn('[Notifier] Título ou mensagem não fornecidos');
      return;
    }

    try {
      const notificationOptions = {
        title: this.truncateText(title, 50),
        message: this.truncateText(message, 200),
        icon: this.iconPath,
        sound: options.sound !== false && this.soundEnabled,
        wait: options.wait || false,
        timeout: options.timeout || this.defaultTimeout,
        ...options
      };

      await this.sendNotification(notificationOptions);
    } catch (error) {
      console.error('[Notifier] Erro ao enviar notificação:', error.message);
    }
  }

  /**
   * Envia a notificação de forma assíncrona
   * @private
   * @param {Object} options - Opções da notificação
   * @returns {Promise<void>}
   */
  sendNotification(options) {
    return new Promise((resolve, reject) => {
      notifier.notify(options, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Notificação de sucesso
   * @param {string} title - Título
   * @param {string} message - Mensagem
   * @returns {Promise<void>}
   */
  async success(title, message) {
    return this.notify(title, message, {
      sound: true,
      type: 'success'
    });
  }

  /**
   * Notificação de erro
   * @param {string} title - Título
   * @param {string} message - Mensagem
   * @returns {Promise<void>}
   */
  async error(title, message) {
    return this.notify(title, message, {
      sound: true,
      type: 'error'
    });
  }

  /**
   * Notificação de informação
   * @param {string} title - Título
   * @param {string} message - Mensagem
   * @returns {Promise<void>}
   */
  async info(title, message) {
    return this.notify(title, message, {
      sound: false,
      type: 'info'
    });
  }

  /**
   * Notificação de aviso
   * @param {string} title - Título
   * @param {string} message - Mensagem
   * @returns {Promise<void>}
   */
  async warning(title, message) {
    return this.notify(title, message, {
      sound: true,
      type: 'warning'
    });
  }

  /**
   * Trunca texto para evitar notificações muito longas
   * @private
   * @param {string} text - Texto
   * @param {number} maxLength - Comprimento máximo
   * @returns {string}
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  }

  /**
   * Habilita notificações
   */
  enable() {
    this.isEnabled = true;
    console.log('[Notifier] Notificações habilitadas');
  }

  /**
   * Desabilita notificações
   */
  disable() {
    this.isEnabled = false;
    console.log('[Notifier] Notificações desabilitadas');
  }

  /**
   * Habilita sons
   */
  enableSound() {
    this.soundEnabled = true;
  }

  /**
   * Desabilita sons
   */
  disableSound() {
    this.soundEnabled = false;
  }

  /**
   * Define timeout padrão
   * @param {number} seconds - Segundos
   */
  setDefaultTimeout(seconds) {
    this.defaultTimeout = seconds;
  }

  /**
   * Verifica se notificações estão disponíveis
   * @returns {boolean}
   */
  isAvailable() {
    try {
      return notifier !== null && notifier !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Notificação de progresso
   * @param {string} title - Título
   * @param {number} current - Valor atual
   * @param {number} total - Valor total
   * @returns {Promise<void>}
   */
  async progress(title, current, total) {
    const percentage = Math.round((current / total) * 100);
    const message = `${current} de ${total} (${percentage}%)`;
    
    return this.notify(title, message, {
      sound: false,
      type: 'info',
      timeout: 3
    });
  }

  /**
   * Notificação de conclusão
   * @param {string} title - Título
   * @param {Object} stats - Estatísticas
   * @returns {Promise<void>}
   */
  async complete(title, stats = {}) {
    const { total = 0, success = 0, errors = 0, duration = 0 } = stats;
    
    const message = [
      `Total: ${total}`,
      success > 0 ? `✓ ${success}` : null,
      errors > 0 ? `✗ ${errors}` : null,
      duration > 0 ? `⏱ ${this.formatDuration(duration)}` : null
    ].filter(Boolean).join(' | ');
    
    return this.notify(title, message, {
      sound: true,
      type: 'success',
      timeout: 10
    });
  }

  /**
   * Formata duração
   * @private
   * @param {number} seconds - Segundos
   * @returns {string}
   */
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

module.exports = { Notifier };