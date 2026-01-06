const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Sistema de logging com rotação automática de arquivos
 */
class Logger {
  constructor(electronApp = app) {
    this.app = electronApp;
    this.logsDir = path.join(this.app.getPath('userData'), 'logs');
    this.currentLogFile = null;
    this.maxLogFiles = 30; // Manter últimos 30 dias
    this.maxLogSize = 10 * 1024 * 1024; // 10MB por arquivo
    this.logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    
    this.initialize();
  }

  /**
   * Inicializa o sistema de logging
   */
  initialize() {
    try {
      this.ensureLogsDir();
      this.rotateOldLogs();
      this.createNewLogFile();
      this.info('Logger inicializado', { logsDir: this.logsDir });
    } catch (error) {
      console.error('❌ Erro ao inicializar Logger:', error);
    }
  }

  /**
   * Garante que o diretório de logs existe
   */
  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      console.log('✅ Diretório de logs criado:', this.logsDir);
    }
  }

  /**
   * Cria novo arquivo de log
   */
  createNewLogFile() {
    const timestamp = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(this.logsDir, `app-${timestamp}.log`);
    
    // Criar arquivo se não existir
    if (!fs.existsSync(this.currentLogFile)) {
      fs.writeFileSync(this.currentLogFile, '', 'utf8');
      console.log('📝 Novo arquivo de log criado:', path.basename(this.currentLogFile));
    }
  }

  /**
   * Remove logs antigos
   */
  rotateOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logsDir, f),
          time: fs.statSync(path.join(this.logsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Remover logs antigos (mantém apenas os últimos maxLogFiles)
      const filesToRemove = files.slice(this.maxLogFiles);
      
      filesToRemove.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Log antigo removido: ${file.name}`);
        } catch (error) {
          console.error(`❌ Erro ao remover log ${file.name}:`, error.message);
        }
      });

      if (filesToRemove.length > 0) {
        console.log(`✅ ${filesToRemove.length} log(s) antigo(s) removido(s)`);
      }
    } catch (error) {
      console.error('❌ Erro ao rotacionar logs:', error);
    }
  }

  /**
   * Verifica se precisa rotacionar o arquivo atual
   */
  checkRotation() {
    try {
      if (!fs.existsSync(this.currentLogFile)) {
        this.createNewLogFile();
        return;
      }

      const stats = fs.statSync(this.currentLogFile);
      
      // Rotacionar por tamanho
      if (stats.size > this.maxLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newPath = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, newPath);
        this.createNewLogFile();
        console.log('🔄 Log rotacionado por tamanho');
      }
      
      // Rotacionar por data (novo dia)
      const fileDate = path.basename(this.currentLogFile).match(/app-(\d{4}-\d{2}-\d{2})/)?.[1];
      const today = new Date().toISOString().split('T')[0];
      
      if (fileDate !== today) {
        this.createNewLogFile();
        console.log('🔄 Log rotacionado por data');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar rotação:', error);
      this.createNewLogFile();
    }
  }

  /**
   * Escreve entrada de log
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} data - Dados adicionais
   */
  log(level, message, data = null) {
    // Validar nível
    if (!this.logLevels.includes(level)) {
      level = 'INFO';
    }

    this.checkRotation();

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(this.currentLogFile, logLine, 'utf8');
    } catch (error) {
      console.error('❌ Erro ao escrever log:', error);
      
      // Tentar recriar o arquivo
      try {
        this.createNewLogFile();
        fs.appendFileSync(this.currentLogFile, logLine, 'utf8');
      } catch (retryError) {
        console.error('❌ Erro ao recriar arquivo de log:', retryError);
      }
    }
  }

  /**
   * Log de informação
   */
  info(message, data) {
    this.log('INFO', message, data);
  }

  /**
   * Log de aviso
   */
  warn(message, data) {
    this.log('WARN', message, data);
  }

  /**
   * Log de erro
   */
  error(message, data) {
    this.log('ERROR', message, data);
  }

  /**
   * Log de debug
   */
  debug(message, data) {
    this.log('DEBUG', message, data);
  }

  /**
   * Busca logs por período
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Array} Array de logs
   */
  getLogs(startDate, endDate) {
    const logs = [];
    
    try {
      // Validar datas
      if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        throw new Error('Datas inválidas');
      }

      if (startDate > endDate) {
        throw new Error('Data inicial maior que data final');
      }

      const files = fs.readdirSync(this.logsDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'));

      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(l => l.trim());

          lines.forEach(line => {
            try {
              const entry = JSON.parse(line);
              const logDate = new Date(entry.timestamp);

              if (logDate >= startDate && logDate <= endDate) {
                logs.push(entry);
              }
            } catch (parseError) {
              // Linha inválida, ignorar
              console.warn(`⚠️ Linha de log inválida em ${file}`);
            }
          });
        } catch (readError) {
          console.error(`❌ Erro ao ler arquivo ${file}:`, readError.message);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
    }

    return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Exporta logs para CSV
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @param {string} outputPath - Caminho do arquivo de saída
   * @returns {number} Número de logs exportados
   */
  exportLogsToCSV(startDate, endDate, outputPath) {
    try {
      const logs = this.getLogs(startDate, endDate);

      if (logs.length === 0) {
        console.warn('⚠️ Nenhum log encontrado no período especificado');
        return 0;
      }

      const csvLines = [
        'Timestamp,Level,Message,Data'
      ];

      logs.forEach(log => {
        const data = log.data ? JSON.stringify(log.data).replace(/"/g, '""') : '';
        const message = log.message.replace(/"/g, '""');
        csvLines.push(`"${log.timestamp}","${log.level}","${message}","${data}"`);
      });

      fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf8');
      
      console.log(`✅ ${logs.length} log(s) exportado(s) para ${outputPath}`);
      
      return logs.length;
    } catch (error) {
      console.error('❌ Erro ao exportar logs:', error);
      throw error;
    }
  }

  /**
   * Exporta logs para JSON
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @param {string} outputPath - Caminho do arquivo de saída
   * @returns {number} Número de logs exportados
   */
  exportLogsToJSON(startDate, endDate, outputPath) {
    try {
      const logs = this.getLogs(startDate, endDate);

      if (logs.length === 0) {
        console.warn('⚠️ Nenhum log encontrado no período especificado');
        return 0;
      }

      fs.writeFileSync(outputPath, JSON.stringify(logs, null, 2), 'utf8');
      
      console.log(`✅ ${logs.length} log(s) exportado(s) para ${outputPath}`);
      
      return logs.length;
    } catch (error) {
      console.error('❌ Erro ao exportar logs:', error);
      throw error;
    }
  }

  /**
   * Limpa todos os logs
   */
  clearAllLogs() {
    try {
      const files = fs.readdirSync(this.logsDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'));

      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        fs.unlinkSync(filePath);
      });

      console.log(`✅ ${files.length} arquivo(s) de log removido(s)`);
      
      // Criar novo arquivo
      this.createNewLogFile();
      
      return files.length;
    } catch (error) {
      console.error('❌ Erro ao limpar logs:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos logs
   * @returns {Object} Estatísticas
   */
  getStats() {
    try {
      const files = fs.readdirSync(this.logsDir)
        .filter(f => f.startsWith('app-') && f.endsWith('.log'));

      let totalSize = 0;
      let totalLines = 0;
      const levelCounts = { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0 };

      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        totalLines += lines.length;

        lines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            if (levelCounts[entry.level] !== undefined) {
              levelCounts[entry.level]++;
            }
          } catch {
            // Ignorar linhas inválidas
          }
        });
      });

      return {
        totalFiles: files.length,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        totalLines,
        levelCounts,
        logsDir: this.logsDir
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }

  /**
   * Formata bytes para formato legível
   * @param {number} bytes - Tamanho em bytes
   * @returns {string} Tamanho formatado
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// ============================================
// SINGLETON
// ============================================

let loggerInstance = null;

/**
 * Obtém instância única do Logger
 * @param {Object} electronApp - Instância do app Electron
 * @returns {Logger} Instância do Logger
 */
function getLogger(electronApp) {
  if (!loggerInstance) {
    loggerInstance = new Logger(electronApp);
  }
  return loggerInstance;
}

/**
 * Reseta a instância do Logger (útil para testes)
 */
function resetLogger() {
  loggerInstance = null;
}

module.exports = { Logger, getLogger, resetLogger };