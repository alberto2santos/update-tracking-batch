import PropTypes from 'prop-types';

/**
 * Estatísticas Detalhadas do Processamento
 * Exibe métricas em tempo real durante o processamento
 */
function DetailedStats({ running, stats }) {
  if (!running) return null;

  return (
    <section 
      className="detailed-stats-section"
      aria-label="Estatísticas detalhadas do processamento"
      role="region"
    >
      {/* Card: Sucesso */}
      <div 
        className="stat-card stat-success"
        role="status"
        aria-label={`${stats.success} pedidos processados com sucesso`}
      >
        <div className="stat-icon" aria-hidden="true">✅</div>
        <div className="stat-content">
          <div className="stat-value">{stats.success}</div>
          <div className="stat-label">Sucesso</div>
        </div>
      </div>

      {/* Card: Pulados */}
      <div 
        className="stat-card stat-warning"
        role="status"
        aria-label={`${stats.skipped} pedidos pulados`}
      >
        <div className="stat-icon" aria-hidden="true">⊘</div>
        <div className="stat-content">
          <div className="stat-value">{stats.skipped}</div>
          <div className="stat-label">Pulados</div>
        </div>
      </div>

      {/* Card: Erros */}
      <div 
        className="stat-card stat-error"
        role="status"
        aria-label={`${stats.errors} pedidos com erro`}
      >
        <div className="stat-icon" aria-hidden="true">❌</div>
        <div className="stat-content">
          <div className="stat-value">{stats.errors}</div>
          <div className="stat-label">Erros</div>
        </div>
      </div>

      {/* Card: Tempo Médio */}
      <div 
        className="stat-card stat-time"
        role="status"
        aria-label={`Tempo médio de ${stats.avgTime} segundos por pedido`}
      >
        <div className="stat-icon" aria-hidden="true">⚡</div>
        <div className="stat-content">
          <div className="stat-value">{stats.avgTime}s</div>
          <div className="stat-label">Tempo Médio</div>
        </div>
      </div>
    </section>
  );
}

DetailedStats.propTypes = {
  /** Indica se o processamento está em execução */
  running: PropTypes.bool.isRequired,
  
  /** Estatísticas do processamento */
  stats: PropTypes.shape({
    /** Número de pedidos processados com sucesso */
    success: PropTypes.number.isRequired,
    
    /** Número de pedidos pulados */
    skipped: PropTypes.number.isRequired,
    
    /** Número de pedidos com erro */
    errors: PropTypes.number.isRequired,
    
    /** Tempo médio de processamento por pedido (em segundos) */
    avgTime: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]).isRequired
  }).isRequired
};

export default DetailedStats;