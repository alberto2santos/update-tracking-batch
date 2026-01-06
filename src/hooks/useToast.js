import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook personalizado para gerenciar toasts/notificações
 * @returns {Object} Objeto com toasts, showToast e removeToast
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  /**
   * Limpa todos os timers ao desmontar o componente
   */
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  /**
   * Exibe um novo toast
   * @param {string} message - Mensagem do toast
   * @param {string} type - Tipo do toast (info, success, error, warning)
   * @param {number} duration - Duração em ms (padrão: 4000)
   * @returns {number} ID do toast criado
   */
  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random(); // Evita colisões de ID
    
    setToasts(prev => [...prev, { id, message, type, timestamp: Date.now() }]);
    
    // Agendar remoção automática
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      
      timersRef.current.set(id, timer);
    }
    
    return id;
  }, []);

  /**
   * Remove um toast específico
   * @param {number} id - ID do toast a ser removido
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    
    // Limpar timer associado
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  /**
   * Remove todos os toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  /**
   * Atalhos para tipos específicos de toast
   */
  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  return { 
    toasts, 
    showToast, 
    removeToast, 
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
}