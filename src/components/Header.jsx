import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import logo from '/images/icon-vtex-home.png';

/**
 * Cabeçalho da aplicação
 * Exibe título, status, badges e controles
 */
function Header({ 
  running, 
  totalPedidos, 
  historyCount,
  onToggleHistory,
  onToggleSettings,
  onToggleTheme, 
  darkMode 
}) {
  const [imageError, setImageError] = useState(false);

  /**
   * Handler para erro no carregamento da imagem
   */
  const handleImageError = useCallback(() => {
    console.warn('⚠️ Erro ao carregar imagem do header');
    setImageError(true);
  }, []);

  /**
   * Renderiza ícone (imagem ou fallback)
   */
  const renderIcon = () => {
    if (imageError) {
      return (
        <div 
          className="icon-fallback"
          style={{
            width: 50,
            height: 50,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}
          aria-hidden="true"
        >
          📦
        </div>
      );
    }

    return (
      <img 
        src={logo}
        alt="Ícone VTEX" 
        title="VTEX Update Tracking" 
        width={50}
        height={50}
        onError={handleImageError}
        loading="eager"
      />
    );
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Título */}
        <h1 className="app-title">
          <span className="icon" aria-hidden="true">
            {renderIcon()}
          </span>
          <span>VTEX Update Tracking</span>
        </h1>

        {/* Badges e Controles */}
        <div className="header-badges">
          {/* Badge de Status */}
          <span 
            className={`badge ${running ? 'badge-running badge-pulse' : 'badge-idle'}`}
            role="status"
            aria-label={running ? 'Processamento em andamento' : 'Sistema aguardando'}
            aria-live="polite"
          >
            <span aria-hidden="true">{running ? '🔄' : '⏸️'}</span>
            <span>{running ? 'Processando' : 'Aguardando'}</span>
          </span>

          {/* Badge de Total de Pedidos */}
          {totalPedidos > 0 && (
            <span 
              className="badge badge-info"
              role="status"
              aria-label={`${totalPedidos} ${totalPedidos === 1 ? 'pedido' : 'pedidos'} na fila`}
              aria-live="polite"
            >
              <span aria-hidden="true">📊</span>
              <span>{totalPedidos} {totalPedidos === 1 ? 'pedido' : 'pedidos'}</span>
            </span>
          )}

          {/* Botão Histórico */}
          <button 
            className="btn-history"
            onClick={onToggleHistory}
            type="button"
            title="Ver histórico de execuções (Ctrl+H)"
            aria-label={`Ver histórico de execuções. ${historyCount} ${historyCount === 1 ? 'item' : 'itens'}`}
          >
            <span aria-hidden="true">📊</span>
            <span className="btn-text">Histórico</span>
            {historyCount > 0 && (
              <span className="badge-count" aria-hidden="true">
                {historyCount}
              </span>
            )}
          </button>

          {/* Botão Configurações */}
          <button 
            className="btn-settings"
            onClick={onToggleSettings}
            type="button"
            title="Abrir configurações (Ctrl+,)"
            aria-label="Abrir configurações"
          >
            <span aria-hidden="true">⚙️</span>
            <span className="btn-text">Configurações</span>
          </button>
          
          {/* Toggle de Tema */}
          <label 
            className="badge-toggle"
            title={darkMode ? 'Alternar para modo claro (Ctrl+D)' : 'Alternar para modo escuro (Ctrl+D)'}
          >
            <input 
              type="checkbox" 
              checked={darkMode}
              onChange={onToggleTheme}
              className="badge-toggle-input"
              aria-label={darkMode ? 'Modo escuro ativo. Alternar para modo claro' : 'Modo claro ativo. Alternar para modo escuro'}
            />
            <span className="badge-toggle-track">
              <span className="badge-toggle-option badge-toggle-light">
                <span className="badge-toggle-icon" aria-hidden="true">☀️</span>
                <span className="badge-toggle-text">Claro</span>
              </span>
              <span className="badge-toggle-option badge-toggle-dark">
                <span className="badge-toggle-icon" aria-hidden="true">🌙</span>
                <span className="badge-toggle-text">Escuro</span>
              </span>
              <span className="badge-toggle-slider" aria-hidden="true"></span>
            </span>
          </label>
        </div>
      </div>
    </header>
  );
}

// ============================================
// PROP TYPES
// ============================================

Header.propTypes = {
  /** Indica se o processamento está em execução */
  running: PropTypes.bool.isRequired,
  
  /** Número total de pedidos na fila */
  totalPedidos: PropTypes.number.isRequired,
  
  /** Número de itens no histórico */
  historyCount: PropTypes.number.isRequired,
  
  /** Callback para abrir/fechar histórico */
  onToggleHistory: PropTypes.func.isRequired,
  
  /** Callback para abrir/fechar configurações */
  onToggleSettings: PropTypes.func.isRequired,
  
  /** Callback para alternar tema */
  onToggleTheme: PropTypes.func.isRequired,
  
  /** Indica se o modo escuro está ativo */
  darkMode: PropTypes.bool.isRequired
};

export default Header;