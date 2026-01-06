import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook personalizado para gerenciar histórico de execuções
 * @param {Object} params - Parâmetros do hook
 * @param {Function} params.showToast - Função para exibir toasts
 * @param {Object} params.electronAPI - API do Electron
 * @returns {Object} Funções e estados do histórico
 */
export default function useHistory({ showToast, electronAPI }) {
  const [history, setHistory] = useState([]);
  const hasLoadedRef = useRef(false);

  /**
   * Carrega histórico ao iniciar (apenas uma vez)
   */
  useEffect(() => {
    // Evitar múltiplas execuções
    if (hasLoadedRef.current) return;
    
    async function loadHistory() {
      try {
        const result = await electronAPI.getExecutionHistory();
        
        // Usar optional chaining
        if (result?.ok) {
          setHistory(result.history || []);
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
    
    loadHistory();
  }, [electronAPI]);

  /**
   * Salva novo item no histórico
   * @param {Object} data - Dados da execução
   */
  const saveToHistory = useCallback(async (data) => {
    try {
      console.log('📊 useHistory.saveToHistory chamado com:', data);
      
      await electronAPI.saveExecutionHistory(data);
      
      const result = await electronAPI.getExecutionHistory();
      
      // Usar optional chaining
      if (result?.ok) {
        setHistory(result.history || []);
        console.log('✅ Histórico atualizado:', result.history?.length || 0, 'itens');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
      showToast?.('Erro ao salvar histórico', 'error');
    }
  }, [electronAPI, showToast]);

  /**
   * Exporta histórico para CSV
   */
  const exportHistory = useCallback(async () => {
    try {
      const result = await electronAPI.exportHistoryCSV();
      
      if (!result?.ok) {
        if (result?.canceled) {
          showToast?.('Exportação cancelada', 'info');
          return;
        }
        showToast?.(result?.error || 'Erro ao exportar histórico', 'error');
        return;
      }
      
      showToast?.('Histórico exportado com sucesso', 'success');
    } catch (error) {
      showToast?.('Erro ao exportar histórico', 'error');
      console.error('Erro ao exportar histórico:', error);
    }
  }, [electronAPI, showToast]);

  /**
   * Remove um item específico do histórico
   * @param {number} itemId - ID do item a ser removido
   */
  const deleteHistoryItem = useCallback(async (itemId) => {
    // Usar globalThis em vez de window
    const confirmed = globalThis.confirm?.('Deseja remover este item do histórico?');
    
    if (!confirmed) {
      return;
    }
    
    try {
      const result = await electronAPI.deleteHistoryItem(itemId);
      
      if (result?.ok) {
        setHistory(result.history || []);
        showToast?.('Item removido', 'success');
      } else {
        showToast?.('Erro ao remover item', 'error');
      }
    } catch (error) {
      showToast?.('Erro ao remover item', 'error');
      console.error('Erro ao deletar item:', error);
    }
  }, [electronAPI, showToast]);

  /**
   * Limpa todo o histórico
   */
  const clearHistory = useCallback(async () => {
    // Usar globalThis em vez de window
    const confirmed = globalThis.confirm?.(
      'Deseja limpar todo o histórico?\n\nEsta ação não pode ser desfeita.'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      await electronAPI.clearExecutionHistory();
      setHistory([]);
      showToast?.('Histórico limpo', 'success');
    } catch (error) {
      showToast?.('Erro ao limpar histórico', 'error');
      console.error('Erro ao limpar histórico:', error);
    }
  }, [electronAPI, showToast]);

  /**
   * Recarrega o histórico
   */
  const reloadHistory = useCallback(async () => {
    try {
      const result = await electronAPI.getExecutionHistory();
      
      if (result?.ok) {
        setHistory(result.history || []);
      }
    } catch (error) {
      console.error('Erro ao recarregar histórico:', error);
      showToast?.('Erro ao recarregar histórico', 'error');
    }
  }, [electronAPI, showToast]);

  return {
    history,
    saveToHistory,
    exportHistory,
    clearHistory,
    deleteHistoryItem,
    reloadHistory
  };
}