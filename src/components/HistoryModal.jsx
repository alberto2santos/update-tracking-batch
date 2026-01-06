import { formatDate, calculateSuccessRate } from '../utils/formatters';

export default function HistoryModal({
  history,
  onClose,
  onExport,
  onClear,
  onDeleteItem
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 Histórico de Execuções</h2>
          <div className="modal-actions">
            {history.length > 0 && (
              <>
                <button 
                className="btn-export-history"
                onClick={(e) => {
                    e.stopPropagation();
                    onExport();
                }}
                title="Exportar histórico para CSV"
                >
                Exportar em CSV
                </button>
                <button 
                className="btn-clear-history"
                onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                }}
                title="Limpar todo o histórico"
                >
                Limpar Histórico
                </button>
              </>
            )}
            <button 
              className="btn-close-modal"
              onClick={onClose}
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">📭</div>
              <p>Nenhuma execução registrada ainda</p>
              <p className="history-empty-hint">
                Execute um processamento para começar a construir seu histórico
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-header">
                  <div className="history-date">
                    {formatDate(item.date)}
                  </div>
                  <button
                    className="btn-delete-history-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    title="Remover este item"
                  >
                    🗑️
                  </button>
                </div>
                <div className="history-details">
                  <span className="history-detail-file">📁 {item.fileName}</span>
                  <span className="history-detail-total">📊 {item.total} pedidos</span>
                  <span className="history-detail-success">✅ {item.success} sucesso</span>
                  <span className="history-detail-error">❌ {item.errors} erros</span>
                  <span className="history-detail-duration">⏱️ {item.duration}s</span>
                </div>
                <div className="history-progress">
                  <div className="history-progress-bar">
                    <div 
                      className="history-progress-fill"
                      style={{ 
                        width: `${calculateSuccessRate(item.success, item.total)}%` 
                      }}
                    />
                  </div>
                  <span className="history-progress-text">
                    {calculateSuccessRate(item.success, item.total)}% sucesso
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}