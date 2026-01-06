import { useEffect, useCallback, useRef, useMemo } from 'react';

export function useElectronAPI({
  onLog,
  onDone,
  onError,
  onMenuAction
}) {
  // Refs para callbacks
  const onLogRef = useRef(onLog);
  const onDoneRef = useRef(onDone);
  const onErrorRef = useRef(onError);
  const onMenuActionRef = useRef(onMenuAction);

  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    onLogRef.current = onLog;
    onDoneRef.current = onDone;
    onErrorRef.current = onError;
    onMenuActionRef.current = onMenuAction;
  }, [onLog, onDone, onError, onMenuAction]);

  // Verificar disponibilidade da API (memoizado)
  const isElectronAvailable = useMemo(() => {
    return !!window.electronAPI;
  }, []);

  // Registrar listeners uma única vez
  useEffect(() => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não está disponível. Certifique-se de que o preload.js está configurado corretamente.');
      return;
    }

    try {
      // Registrar listeners usando refs
      const cleanupFunctions = [];

      if (window.electronAPI.onLog) {
        const cleanup = window.electronAPI.onLog((data) => onLogRef.current?.(data));
        if (cleanup) cleanupFunctions.push(cleanup);
      }
      
      if (window.electronAPI.onDone) {
        const cleanup = window.electronAPI.onDone((data) => onDoneRef.current?.(data));
        if (cleanup) cleanupFunctions.push(cleanup);
      }
      
      if (window.electronAPI.onError) {
        const cleanup = window.electronAPI.onError((data) => onErrorRef.current?.(data));
        if (cleanup) cleanupFunctions.push(cleanup);
      }
      
      if (window.electronAPI.onMenuAction) {
        const cleanup = window.electronAPI.onMenuAction((data) => onMenuActionRef.current?.(data));
        if (cleanup) cleanupFunctions.push(cleanup);
      }

      console.log('✅ Listeners do Electron registrados com sucesso');

      // Cleanup
      return () => {
        try {
          cleanupFunctions.forEach(cleanup => cleanup?.());
          
          if (window.electronAPI?.removeAllListeners) {
            window.electronAPI.removeAllListeners();
          }
          
          console.log('🧹 Listeners do Electron removidos');
        } catch (e) {
          console.error('❌ Erro ao remover listeners do Electron:', e);
        }
      };
    } catch (e) {
      console.error('❌ Erro ao registrar listeners do Electron:', e);
    }
  }, [isElectronAvailable]);

  // Funções da API
  const startJob = useCallback(async (args) => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return { ok: false, error: 'Electron API não disponível' };
    }

    try {
      console.log('🚀 Iniciando job com args:', args);
      const result = await window.electronAPI.startJob(args);
      
      if (result.ok) {
        console.log('✅ Job iniciado com sucesso. PID:', result.pid);
      } else {
        console.error('❌ Falha ao iniciar job:', result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao iniciar job:', err);
      return { ok: false, error: err.message };
    }
  }, [isElectronAvailable]);

  const stopJob = useCallback(async () => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return { ok: false, error: 'Electron API não disponível' };
    }

    try {
      console.log('⏸️ Parando job...');
      const result = await window.electronAPI.stopJob();
      
      if (result.ok) {
        console.log('✅ Job parado com sucesso');
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao parar job:', err);
      return { ok: false, error: err.message };
    }
  }, [isElectronAvailable]);

  const selectUpload = useCallback(async () => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return null;
    }

    try {
      const filePath = await window.electronAPI.selectUpload();
      
      if (filePath) {
        console.log('✅ Arquivo selecionado:', filePath);
      }
      
      return filePath;
    } catch (err) {
      console.error('❌ Erro ao selecionar arquivo:', err);
      return null;
    }
  }, [isElectronAvailable]);

  const readFilePreview = useCallback(async (filePath) => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return { ok: false, error: 'Electron API não disponível' };
    }

    try {
      const result = await window.electronAPI.readFilePreview(filePath);
      
      if (result.ok) {
        console.log('✅ Preview carregado:', result.lineCount, 'linhas');
      } else {
        console.error('❌ Erro ao ler preview:', result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao ler preview:', err);
      return { ok: false, error: err.message };
    }
  }, [isElectronAvailable]);

  const getExecutionHistory = useCallback(async () => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return { ok: false, history: [] };
    }

    try {
      const result = await window.electronAPI.getExecutionHistory();
      
      if (result.ok) {
        console.log('✅ Histórico carregado:', result.history.length, 'itens');
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao carregar histórico:', err);
      return { ok: false, history: [] };
    }
  }, [isElectronAvailable]);

  const saveExecutionHistory = useCallback(async (data) => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return { ok: false, error: 'Electron API não disponível' };
    }

    try {
      const result = await window.electronAPI.saveExecutionHistory(data);
      
      if (result.ok) {
        console.log('✅ Histórico salvo com sucesso');
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao salvar histórico:', err);
      return { ok: false, error: err.message };
    }
  }, [isElectronAvailable]);

  const exportHistoryCSV = useCallback(async () => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return { ok: false, error: 'Electron API não disponível' };
    }

    try {
      const result = await window.electronAPI.exportHistoryCSV();
      
      if (result.ok) {
        console.log('✅ Histórico exportado:', result.filePath);
      } else if (!result.canceled) {
        console.error('❌ Erro ao exportar:', result.error);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao exportar histórico:', err);
      return { ok: false, error: err.message };
    }
  }, [isElectronAvailable]);

  const clearExecutionHistory = useCallback(async () => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return { ok: false, error: 'Electron API não disponível' };
    }

    try {
      const result = await window.electronAPI.clearExecutionHistory();
      
      if (result.ok) {
        console.log('✅ Histórico limpo com sucesso');
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao limpar histórico:', err);
      return { ok: false, error: err.message };
    }
  }, [isElectronAvailable]);

  const deleteHistoryItem = useCallback(async (itemId) => {
    if (!isElectronAvailable) {
      console.error('❌ Electron API não disponível');
      return { ok: false, error: 'Electron API não disponível' };
    }

    try {
      const result = await window.electronAPI.deleteHistoryItem(itemId);
      
      if (result.ok) {
        console.log('✅ Item deletado com sucesso');
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao deletar item:', err);
      return { ok: false, error: err.message };
    }
  }, [isElectronAvailable]);

  // MÉTODOS PARA REGISTRAR CALLBACKS DINAMICAMENTE (SEM LOGS DE DEBUG)
  const onJobDone = useCallback((callback) => {
    if (!isElectronAvailable || !window.electronAPI.onDone) {
      console.warn('⚠️ onDone não disponível');
      return () => {};
    }

    return window.electronAPI.onDone(callback);
  }, [isElectronAvailable]);

  const onJobError = useCallback((callback) => {
    if (!isElectronAvailable || !window.electronAPI.onError) {
      console.warn('⚠️ onError não disponível');
      return () => {};
    }

    return window.electronAPI.onError(callback);
  }, [isElectronAvailable]);

  return {
    startJob,
    stopJob,
    selectUpload,
    readFilePreview,
    getExecutionHistory,
    saveExecutionHistory,
    exportHistoryCSV,
    clearExecutionHistory,
    deleteHistoryItem,
    onJobDone,
    onJobError,
    isElectronAvailable
  };
}