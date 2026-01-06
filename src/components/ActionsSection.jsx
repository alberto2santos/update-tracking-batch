import { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Seção de Ações Principais
 * Controla início, parada e limpeza do processamento
 */
function ActionsSection({
  running,
  forceStopConfirm,
  onStart,
  onStop,
  onForceStop,
  onClearLogs
}) {
  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handler para tecla Enter no botão Iniciar
   */
  const handleStartKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !running) {
      onStart();
    }
  }, [running, onStart]);

  /**
   * Handler para tecla Escape no botão Parar
   */
  const handleStopKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && running) {
      onStop();
    }
  }, [running, onStop]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="actions-section" aria-label="Ações de processamento">
      <button
        className="btn btn-primary btn-start"
        onClick={onStart}
        onKeyDown={handleStartKeyDown}
        disabled={running}
        type="button"
        title={running ? 'Processamento em andamento' : 'Iniciar processamento (Ctrl+Enter)'}
        aria-label={running ? 'Processamento em andamento' : 'Iniciar processamento'}
        aria-disabled={running}
        aria-busy={running}
      >
        {running ? (
          <>
            <span className="spinner" aria-hidden="true"></span>
            <span>Processando...</span>
          </>
        ) : (
          <>
            <span aria-hidden="true">🚀</span>
            <span>Iniciar</span>
          </>
        )}
      </button>

      <button
        className="btn btn-secondary btn-stop"
        onClick={onStop}
        onKeyDown={handleStopKeyDown}
        disabled={!running}
        type="button"
        title="Parar processamento (Esc)"
        aria-label="Parar processamento"
        aria-disabled={!running}
      >
        <span aria-hidden="true">⏸️</span>
        <span>Parar</span>
      </button>

      {running && (
        <button
          className={`btn ${forceStopConfirm ? 'btn-danger btn-force-stop-confirm' : 'btn-ghost btn-force-stop'}`}
          onClick={onForceStop}
          type="button"
          title={forceStopConfirm ? 'Clique novamente para confirmar' : 'Forçar parada do processo'}
          aria-label={forceStopConfirm ? 'Confirmar parada forçada' : 'Forçar parada'}
          aria-pressed={forceStopConfirm}
        >
          <span aria-hidden="true">{forceStopConfirm ? '⚠️' : '🛑'}</span>
          <span>{forceStopConfirm ? 'Confirmar Parada Forçada' : 'Forçar Parada'}</span>
        </button>
      )}

      <span className="actions-separator" aria-hidden="true"></span>

      <button
        className="btn btn-ghost btn-clear-logs"
        onClick={onClearLogs}
        type="button"
        title="Limpar logs (Ctrl+K)"
        aria-label="Limpar logs"
      >
        <span aria-hidden="true">🧹</span>
        <span>Limpar Logs</span>
      </button>
    </div>
  );
}

ActionsSection.propTypes = {
  running: PropTypes.bool.isRequired,
  forceStopConfirm: PropTypes.bool.isRequired,
  onStart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onForceStop: PropTypes.func.isRequired,
  onClearLogs: PropTypes.func.isRequired
};

export default ActionsSection;