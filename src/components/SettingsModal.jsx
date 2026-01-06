import { useMemo, useCallback } from 'react';
import { CONCURRENCY_LIMITS, DELAY_LIMITS } from '../utils/constants';

export default function SettingsModal({
  config,
  configSaving,
  running,
  onClose,
  onConfigChange,
  onSave
}) {
  // ============================================
  // FUNÇÕES DE INFORMAÇÃO
  // ============================================

  const getConcurrencyInfo = useCallback((value) => {
    if (value <= 2) {
      return {
        icon: '🐌',
        label: 'Lento e Seguro',
        description: 'Processa poucos pedidos por vez. Ideal para conexões lentas ou quando há muitos erros.',
        color: 'info'
      };
    }
    if (value <= 6) {
      return {
        icon: '⚡',
        label: 'Balanceado (Recomendado)',
        description: 'Velocidade ideal para a maioria dos casos. Equilibra rapidez e estabilidade.',
        color: 'success'
      };
    }
    return {
      icon: '🚀',
      label: 'Rápido',
      description: 'Processa muitos pedidos simultaneamente. Pode causar erros se a API estiver sobrecarregada.',
      color: 'warning'
    };
  }, []);

  const getDelayInfo = useCallback((value) => {
    if (value === 0) {
      return {
        icon: '⚠️',
        label: 'Sem Pausa',
        description: 'Não aguarda entre requisições. Alto risco de bloqueio pela API.',
        color: 'error'
      };
    }
    if (value < 200) {
      return {
        icon: '⚡',
        label: 'Pausa Curta',
        description: 'Aguarda pouco tempo entre pedidos. Rápido, mas pode causar erros.',
        color: 'warning'
      };
    }
    if (value <= 500) {
      return {
        icon: '✅',
        label: 'Pausa Ideal (Recomendado)',
        description: 'Tempo de espera equilibrado. Evita erros mantendo boa velocidade.',
        color: 'success'
      };
    }
    return {
      icon: '🐌',
      label: 'Pausa Longa',
      description: 'Aguarda bastante entre pedidos. Muito seguro, mas mais lento.',
      color: 'info'
    };
  }, []);

  const concurrencyInfo = useMemo(
    () => getConcurrencyInfo(config.concurrency),
    [config.concurrency, getConcurrencyInfo]
  );

  const delayInfo = useMemo(
    () => getDelayInfo(config.delay),
    [config.delay, getDelayInfo]
  );

  // ============================================
  // HANDLERS
  // ============================================

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleTestNotification = useCallback(async () => {
    if (window.electronAPI?.testNotification) {
      try {
        await window.electronAPI.testNotification('success');
      } catch (error) {
        console.error('Erro ao testar notificação:', error);
      }
    }
  }, []);

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div 
        className="modal-content modal-settings" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="settings-modal-title">⚙️ Configurações do Sistema</h2>
          <button 
            className="btn-close-modal"
            onClick={onClose}
            title="Fechar configurações (ESC)"
            aria-label="Fechar configurações"
          >
            ✕
          </button>
        </div>
        
        <div className="settings-content">
          {configSaving && (
            <div className="config-saving-banner" role="status" aria-live="polite">
              <span className="saving-spinner" aria-hidden="true">⏳</span>
              Salvando suas configurações...
            </div>
          )}

          {running && (
            <div className="settings-warning-banner" role="alert">
              <span aria-hidden="true">⚠️</span>
              <div>
                <strong>Processamento em andamento</strong>
                <p>Algumas configurações não podem ser alteradas durante o processamento.</p>
              </div>
            </div>
          )}

          {/* Seção: Aparência */}
          <section className="settings-section" aria-labelledby="appearance-section">
            <h3 className="settings-section-title" id="appearance-section">
              <span className="section-icon" aria-hidden="true">🎨</span>
              Aparência
            </h3>
            
            <div className="form-group">
              <label className="setting-card">
                <div className="setting-card-header">
                  <input
                    type="checkbox"
                    checked={config.darkMode}
                    onChange={e => onConfigChange({ darkMode: e.target.checked })}
                    className="setting-checkbox"
                    aria-describedby="dark-mode-description"
                  />
                  <div className="setting-card-content">
                    <div className="setting-card-title">
                      <span className="setting-icon" aria-hidden="true">
                        {config.darkMode ? '🌙' : '☀️'}
                      </span>
                      <strong>Modo Escuro</strong>
                    </div>
                    <div className="setting-card-description" id="dark-mode-description">
                      Ativa o tema escuro para reduzir o cansaço visual, especialmente útil em ambientes com pouca luz.
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Seção: Notificações */}
          <section className="settings-section" aria-labelledby="notifications-section">
            <h3 className="settings-section-title" id="notifications-section">
              <span className="section-icon" aria-hidden="true">🔔</span>
              Notificações
            </h3>
            
            <div className="form-group">
              <label className="setting-card">
                <div className="setting-card-header">
                  <input
                    type="checkbox"
                    checked={config.notificationsEnabled ?? true}
                    onChange={e => onConfigChange({ notificationsEnabled: e.target.checked })}
                    className="setting-checkbox"
                    aria-describedby="notifications-description"
                  />
                  <div className="setting-card-content">
                    <div className="setting-card-title">
                      <span className="setting-icon" aria-hidden="true">🔔</span>
                      <strong>Habilitar Notificações</strong>
                      {config.notificationsEnabled !== false && (
                        <span className="badge-active" aria-label="Ativo">Ativo</span>
                      )}
                    </div>
                    <div className="setting-card-description" id="notifications-description">
                      Receba notificações do sistema quando o processamento iniciar, concluir ou encontrar erros.
                    </div>
                  </div>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className={`setting-card ${config.notificationsEnabled === false ? 'setting-card-disabled' : ''}`}>
                <div className="setting-card-header">
                  <input
                    type="checkbox"
                    checked={config.soundEnabled ?? true}
                    onChange={e => onConfigChange({ soundEnabled: e.target.checked })}
                    disabled={config.notificationsEnabled === false}
                    className="setting-checkbox"
                    aria-describedby="sound-description"
                  />
                  <div className="setting-card-content">
                    <div className="setting-card-title">
                      <span className="setting-icon" aria-hidden="true">🔊</span>
                      <strong>Sons de Notificação</strong>
                    </div>
                    <div className="setting-card-description" id="sound-description">
                      Reproduz um som quando as notificações aparecem. Desative para notificações silenciosas.
                    </div>
                  </div>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className={`form-label ${config.notificationsEnabled === false ? 'form-label-disabled' : ''}`}>
                <div className="label-header">
                  <strong>Duração da Notificação</strong>
                  <span className="label-badge" aria-label={`${config.notificationTimeout || 5} segundos`}>
                    {config.notificationTimeout || 5}s
                  </span>
                </div>
                <small>Por quanto tempo a notificação ficará visível</small>
              </label>
              
              <div className="slider-container">
                <div className="slider-wrapper">
                  <span className="slider-label" aria-hidden="true">3s</span>
                  <input
                    className="form-slider"
                    type="range"
                    min={3}
                    max={15}
                    step={1}
                    value={config.notificationTimeout || 5}
                    onChange={e => onConfigChange({ notificationTimeout: Number(e.target.value) })}
                    disabled={config.notificationsEnabled === false}
                    aria-label="Duração da notificação em segundos"
                  />
                  <span className="slider-label" aria-hidden="true">15s</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <button
                className="btn btn-secondary btn-test-notification"
                onClick={handleTestNotification}
                disabled={config.notificationsEnabled === false}
                title="Enviar uma notificação de teste"
              >
                <span aria-hidden="true">🧪</span>
                Testar Notificação
              </button>
            </div>
          </section>

          {/* Seção: Modo de Teste */}
          <section className="settings-section" aria-labelledby="test-mode-section">
            <h3 className="settings-section-title" id="test-mode-section">
              <span className="section-icon" aria-hidden="true">🧪</span>
              Modo de Teste
            </h3>
            
            <div className="form-group">
              <label className={`setting-card ${running ? 'setting-card-disabled' : ''}`}>
                <div className="setting-card-header">
                  <input
                    type="checkbox"
                    checked={config.dryRun}
                    onChange={e => onConfigChange({ dryRun: e.target.checked })}
                    disabled={running}
                    className="setting-checkbox"
                    aria-describedby="dry-run-description"
                  />
                  <div className="setting-card-content">
                    <div className="setting-card-title">
                      <span className="setting-icon" aria-hidden="true">🧪</span>
                      <strong>Simulação (Dry-Run)</strong>
                      {config.dryRun && (
                        <span className="badge-active" aria-label="Modo ativo">Ativo</span>
                      )}
                    </div>
                    <div className="setting-card-description" id="dry-run-description">
                      Simula todo o processo sem fazer alterações reais na VTEX. Use para testar antes de processar pedidos de verdade.
                    </div>
                    {config.dryRun && (
                      <div className="setting-card-alert" role="status">
                        <span aria-hidden="true">ℹ️</span>
                        <span>Nenhuma alteração será feita nos pedidos enquanto este modo estiver ativo.</span>
                      </div>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Seção: Velocidade de Processamento */}
          <section className="settings-section" aria-labelledby="speed-section">
            <h3 className="settings-section-title" id="speed-section">
              <span className="section-icon" aria-hidden="true">🚀</span>
              Velocidade de Processamento
            </h3>
            
            <div className="form-group">
              <label className="form-label">
                <div className="label-header">
                  <strong>Pedidos Simultâneos</strong>
                  <span className="label-badge" aria-label={`${config.concurrency} pedidos`}>
                    {config.concurrency}
                  </span>
                </div>
                <small>Quantos pedidos processar ao mesmo tempo</small>
              </label>
              
              <div className="slider-container">
                <div className="slider-wrapper">
                  <span className="slider-label" aria-hidden="true">Lento</span>
                  <input
                    className="form-slider"
                    type="range"
                    min={CONCURRENCY_LIMITS.MIN}
                    max={CONCURRENCY_LIMITS.MAX}
                    value={config.concurrency}
                    onChange={e => onConfigChange({ concurrency: Number(e.target.value) })}
                    disabled={running}
                    aria-label="Número de pedidos simultâneos"
                  />
                  <span className="slider-label" aria-hidden="true">Rápido</span>
                </div>
              </div>

              <div className={`setting-info-card setting-info-${concurrencyInfo.color}`}>
                <div className="setting-info-icon" aria-hidden="true">
                  {concurrencyInfo.icon}
                </div>
                <div className="setting-info-content">
                  <div className="setting-info-title">{concurrencyInfo.label}</div>
                  <div className="setting-info-description">{concurrencyInfo.description}</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <div className="label-header">
                  <strong>Tempo de Pausa</strong>
                  <span className="label-badge" aria-label={`${config.delay} milissegundos`}>
                    {config.delay}ms
                  </span>
                </div>
                <small>Quanto tempo aguardar entre cada pedido</small>
              </label>
              
              <div className="slider-container">
                <div className="slider-wrapper">
                  <span className="slider-label" aria-hidden="true">Sem pausa</span>
                  <input
                    className="form-slider"
                    type="range"
                    min={DELAY_LIMITS.MIN}
                    max={DELAY_LIMITS.MAX}
                    step={DELAY_LIMITS.STEP}
                    value={config.delay}
                    onChange={e => onConfigChange({ delay: Number(e.target.value) })}
                    disabled={running}
                    aria-label="Tempo de pausa entre pedidos"
                  />
                  <span className="slider-label" aria-hidden="true">Pausa longa</span>
                </div>
              </div>

              <div className={`setting-info-card setting-info-${delayInfo.color}`}>
                <div className="setting-info-icon" aria-hidden="true">
                  {delayInfo.icon}
                </div>
                <div className="setting-info-content">
                  <div className="setting-info-title">{delayInfo.label}</div>
                  <div className="setting-info-description">{delayInfo.description}</div>
                </div>
              </div>
            </div>
          </section>

          <div className="settings-footer">
            <button 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={configSaving}
            >
              Cancelar
            </button>
            
            <button 
              className="btn btn-primary btn-save-settings"
              onClick={onSave}
              disabled={configSaving}
              aria-busy={configSaving}
            >
              {configSaving ? (
                <>
                  <span className="saving-spinner" aria-hidden="true">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <span aria-hidden="true">💾</span>
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}