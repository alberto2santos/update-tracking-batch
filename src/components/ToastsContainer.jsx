import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Container para exibir toasts/notificações
 */
function ToastsContainer({ toasts, onRemove = null }) {
  // ============================================
  // TRADUÇÕES E FORMATAÇÃO
  // ============================================

  /**
   * Mapa de traduções (memoizado)
   */
  const translations = useMemo(() => ({
    // Sucesso
    'Config saved': 'Configurações salvas com sucesso',
    'File uploaded': 'Arquivo carregado com sucesso',
    'Process started': 'Processamento iniciado',
    'Process completed': 'Processamento concluído',
    'Logs exported': 'Logs salvos com sucesso',
    'History exported': 'Histórico exportado com sucesso',
    'History cleared': 'Histórico limpo',
    'Item deleted': 'Item removido com sucesso',
    'Changes saved': 'Alterações salvas',
    
    // Erros
    'Failed to load': 'Falha ao carregar',
    'Failed to save': 'Falha ao salvar',
    'Failed to export': 'Falha ao exportar',
    'Invalid file': 'Arquivo inválido',
    'No file selected': 'Nenhum arquivo selecionado',
    'Process failed': 'Processamento falhou',
    'Connection error': 'Erro de conexão',
    'Timeout error': 'Tempo limite excedido',
    'Network error': 'Erro de rede',
    
    // Avisos
    'No data': 'Nenhum dado disponível',
    'Already running': 'Processamento já em andamento',
    'Please wait': 'Por favor, aguarde',
    'Unsaved changes': 'Há alterações não salvas',
    'File too large': 'Arquivo muito grande',
    
    // Info
    'Loading': 'Carregando',
    'Processing': 'Processando',
    'Please select': 'Por favor, selecione',
    'Saving': 'Salvando',
    'Exporting': 'Exportando'
  }), []);

  /**
   * Formata mensagem do toast aplicando traduções
   */
  const formatToastMessage = useCallback((message) => {
    if (!message) return '';

    let formattedMessage = message;

    // Aplicar traduções
    Object.entries(translations).forEach(([key, value]) => {
      const regex = new RegExp(key, 'gi');
      formattedMessage = formattedMessage.replace(regex, value);
    });

    return formattedMessage;
  }, [translations]);

  /**
   * Obtém título do toast baseado no tipo
   */
  const getToastTitle = useCallback((type) => {
    const titles = {
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Atenção',
      info: 'Informação'
    };
    return titles[type] || 'Notificação';
  }, []);

  /**
   * Obtém ícone do toast
   */
  const getToastIcon = useCallback((type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || '📢';
  }, []);

  /**
   * Obtém role ARIA apropriado
   */
  const getAriaRole = useCallback((type) => {
    return type === 'error' ? 'alert' : 'status';
  }, []);

  /**
   * Obtém aria-live apropriado
   */
  const getAriaLive = useCallback((type) => {
    return type === 'error' ? 'assertive' : 'polite';
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handler para fechar toast
   */
  const handleClose = useCallback((id) => {
    if (onRemove) {
      onRemove(id);
    }
  }, [onRemove]);

  /**
   * Handler para tecla Escape
   */
  const handleKeyDown = useCallback((e, id) => {
    if (e.key === 'Escape') {
      handleClose(id);
    }
  }, [handleClose]);

  // ============================================
  // RENDER
  // ============================================

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toasts-container"
      role="region"
      aria-label="Notificações"
    >
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`toast toast-${toast.type}`}
          role={getAriaRole(toast.type)}
          aria-live={getAriaLive(toast.type)}
          onKeyDown={(e) => handleKeyDown(e, toast.id)}
        >
          <div className="toast-icon-wrapper" aria-hidden="true">
            <span className="toast-icon">{getToastIcon(toast.type)}</span>
          </div>
          
          <div className="toast-content">
            <div className="toast-title">{getToastTitle(toast.type)}</div>
            <div className="toast-message">
              {formatToastMessage(toast.message)}
            </div>
          </div>

          {onRemove && (
            <button
              className="toast-close"
              onClick={() => handleClose(toast.id)}
              type="button"
              aria-label="Fechar notificação"
              title="Fechar (Esc)"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// PROP TYPES
// ============================================

ToastsContainer.propTypes = {
  /** Array de toasts a serem exibidos */
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      /** ID único do toast */
      id: PropTypes.number.isRequired,
      
      /** Mensagem a ser exibida */
      message: PropTypes.string.isRequired,
      
      /** Tipo do toast */
      type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
      
      /** Timestamp de criação (opcional) */
      timestamp: PropTypes.number
    })
  ).isRequired,
  
  /** Callback para remover toast */
  onRemove: PropTypes.func
};

export default ToastsContainer;