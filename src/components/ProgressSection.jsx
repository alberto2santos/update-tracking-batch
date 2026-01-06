import { useMemo } from 'react';
import { formatElapsedTime, formatETA } from '../utils/formatters';

export default function ProgressSection({ running, progress, elapsedTime, eta }) {
  // Memoizar cálculos pesados
  const stats = useMemo(() => {
    if (!running || progress.total === 0) return null;

    const speed = elapsedTime > 0 
      ? Math.round((progress.current / (elapsedTime / 1000)) * 60) 
      : 0;

    const remaining = progress.total - progress.current;

    // Determinar status
    let status = { color: 'info', label: 'Iniciando' };
    if (progress.percent >= 75) status = { color: 'success', label: 'Quase lá' };
    else if (progress.percent >= 50) status = { color: 'warning', label: 'Avançando' };
    else if (progress.percent >= 25) status = { color: 'primary', label: 'Em andamento' };

    return {
      speed,
      remaining,
      status,
      formattedTime: formatElapsedTime(elapsedTime),
      formattedETA: eta ? formatETA(eta) : null
    };
  }, [running, progress, elapsedTime, eta]);

  if (!stats) return null;

  return (
    <section className="progress-section-optimized">
      {/* Header compacto */}
      <div className="progress-header-opt">
        <div className="progress-title-opt">
          <span className="progress-pulse-opt">●</span>
          Processando
        </div>
        <span className={`progress-badge-opt badge-${stats.status.color}`}>
          {stats.status.label}
        </span>
      </div>

      {/* Barra de progresso com info inline */}
      <div className="progress-bar-opt">
        <div className="progress-bar-info">
          <span className="progress-count-opt">
            {progress.current} / {progress.total}
          </span>
          <span className="progress-percent-opt">
            {progress.percent}%
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill-opt fill-${stats.status.color}`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Grid de stats compacto */}
      <div className="progress-stats-grid">
        <div className="stat-card-opt">
          <span className="stat-icon-opt">⏱️</span>
          <div className="stat-content-opt">
            <span className="stat-value-opt">{stats.formattedTime}</span>
            <span className="stat-label-opt">Decorrido</span>
          </div>
        </div>

        {stats.formattedETA && (
          <div className="stat-card-opt">
            <span className="stat-icon-opt">🎯</span>
            <div className="stat-content-opt">
              <span className="stat-value-opt">{stats.formattedETA}</span>
              <span className="stat-label-opt">Restante</span>
            </div>
          </div>
        )}

        {stats.speed > 0 && (
          <div className="stat-card-opt">
            <span className="stat-icon-opt">⚡</span>
            <div className="stat-content-opt">
              <span className="stat-value-opt">{stats.speed}</span>
              <span className="stat-label-opt">pedidos/min</span>
            </div>
          </div>
        )}

        <div className="stat-card-opt">
          <span className="stat-icon-opt">📦</span>
          <div className="stat-content-opt">
            <span className="stat-value-opt">{stats.remaining}</span>
            <span className="stat-label-opt">Faltam</span>
          </div>
        </div>
      </div>
    </section>
  );
}