import PropTypes from 'prop-types';

/**
 * Seção de Estatísticas Principais
 * Exibe resumo do processamento em cards
 */
function StatsSection({ totalPedidos, progress, dryRun }) {
  return (
    <section 
      className="stats-section"
      aria-label="Estatísticas principais"
      role="region"
    >
      {/* Card: Na Fila */}
      <div 
        className="stat-card stat-queue"
        role="status"
        aria-label={`${totalPedidos} ${totalPedidos === 1 ? 'pedido' : 'pedidos'} na fila`}
      >
        <div className="stat-icon" aria-hidden="true">📊</div>
        <div className="stat-content">
          <div className="stat-value">{totalPedidos}</div>
          <div className="stat-label">Na Fila</div>
        </div>
      </div>

      {/* Card: Processados */}
      <div 
        className="stat-card stat-processed"
        role="status"
        aria-label={`${progress.current || 0} ${progress.current === 1 ? 'pedido processado' : 'pedidos processados'}`}
      >
        <div className="stat-icon" aria-hidden="true">
          {progress.current > 0 ? '⚡' : '✅'}
        </div>
        <div className="stat-content">
          <div className="stat-value">{progress.current || 0}</div>
          <div className="stat-label">Processados</div>
        </div>
      </div>

      {/* Card: Progresso */}
      <div 
        className="stat-card stat-progress"
        role="status"
        aria-label={`Progresso: ${progress.total > 0 ? `${progress.percent}%` : 'não iniciado'}`}
      >
        <div className="stat-icon" aria-hidden="true">⏱️</div>
        <div className="stat-content">
          <div className="stat-value">
            {progress.total > 0 ? `${progress.percent}%` : '-'}
          </div>
          <div className="stat-label">Progresso</div>
        </div>
      </div>

      {/* Card: Modo */}
      <div 
        className={`stat-card stat-mode ${dryRun ? 'stat-mode-test' : 'stat-mode-real'}`}
        role="status"
        aria-label={`Modo: ${dryRun ? 'Teste (simulação)' : 'Real (produção)'}`}
      >
        <div className="stat-icon" aria-hidden="true">
          {dryRun ? '🧪' : '🚀'}
        </div>
        <div className="stat-content">
          <div className="stat-value">{dryRun ? 'Teste' : 'Real'}</div>
          <div className="stat-label">Modo</div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PROP TYPES
// ============================================

StatsSection.propTypes = {
  /** Número total de pedidos na fila */
  totalPedidos: PropTypes.number.isRequired,
  
  /** Objeto com informações de progresso */
  progress: PropTypes.shape({
    /** Número de pedidos processados */
    current: PropTypes.number.isRequired,
    
    /** Número total de pedidos a processar */
    total: PropTypes.number.isRequired,
    
    /** Porcentagem de progresso (0-100) */
    percent: PropTypes.number.isRequired
  }).isRequired,
  
  /** Indica se está em modo de teste (dry-run) */
  dryRun: PropTypes.bool.isRequired
};

export default StatsSection;