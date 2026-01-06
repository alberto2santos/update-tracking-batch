import { useState, useCallback, useRef } from 'react';

/**
 * Hook personalizado para controlar o processamento de jobs
 * @param {Object} params - Parâmetros do hook
 * @returns {Object} Funções e estados de controle
 */
export function useJobControl({
  running,
  setRunning,
  setStartTime,
  filePath,
  manualList,
  config,
  getTotalPedidos,
  electronAPI,
  pushLog,
  showToast
}) {
  const [forceStopConfirm, setForceStopConfirm] = useState(false);
  const forceStopTimerRef = useRef(null);

  /**
   * Valida se há pedidos para processar
   * @returns {Object} { valid: boolean, error: string }
   */
  const validateInput = useCallback(() => {
    if (running) {
      return {
        valid: false,
        error: 'Já existe um processo em execução'
      };
    }

    const hasFile = filePath && filePath.trim() !== '';
    const hasManualList = manualList && manualList.length > 0;

    if (!hasFile && !hasManualList) {
      return {
        valid: false,
        error: 'Nenhum pedido fornecido'
      };
    }

    const total = getTotalPedidos();
    if (total === 0) {
      return {
        valid: false,
        error: 'Lista de pedidos está vazia'
      };
    }

    return { valid: true };
  }, [running, filePath, manualList, getTotalPedidos]);

  /**
   * Prepara os argumentos para o job
   * @returns {Object} Argumentos formatados
   */
  const prepareJobArgs = useCallback(() => {
    const args = {
      dryRun: config.dryRun,
      concurrency: config.concurrency,
      delay: config.delay,
      verbose: true
    };

    if (manualList && manualList.length > 0) {
      args.manualList = [...manualList]; // Clone do array
    } else {
      args.filePath = filePath;
    }

    return args;
  }, [config, manualList, filePath]);

  /**
   * Limpa o timer de confirmação de parada forçada
   */
  const clearForceStopTimer = useCallback(() => {
    if (forceStopTimerRef.current) {
      clearTimeout(forceStopTimerRef.current);
      forceStopTimerRef.current = null;
    }
  }, []);

  /**
   * Reseta o estado do job
   */
  const resetJobState = useCallback(() => {
    setRunning(false);
    setStartTime(null);
    setForceStopConfirm(false);
    clearForceStopTimer();
  }, [setRunning, setStartTime, clearForceStopTimer]);

  /**
   * Inicia o processamento de jobs
   */
  const startJob = useCallback(async () => {
    // Validar entrada
    const validation = validateInput();
    if (!validation.valid) {
      pushLog(`❌ ${validation.error}`);
      showToast(validation.error, 'error');
      return;
    }

    try {
      // Preparar estado
      setRunning(true);
      setStartTime(Date.now());
      setForceStopConfirm(false);
      clearForceStopTimer();

      // Log de início
      const total = getTotalPedidos();
      const mode = config.dryRun ? 'SIMULAÇÃO' : 'REAL';
      pushLog(`🚀 Iniciando processamento de ${total} ${total === 1 ? 'pedido' : 'pedidos'} (Modo: ${mode})`);
      pushLog(`⚙️ Configurações: Concorrência=${config.concurrency}, Delay=${config.delay}ms`);
      showToast(`Processando ${total} ${total === 1 ? 'pedido' : 'pedidos'}...`, 'info');

      // Preparar argumentos
      const args = prepareJobArgs();

      // Iniciar job
      const res = await electronAPI.startJob(args);

      // Verificar resposta
      if (res && res.ok) {
        pushLog(`✅ Processo iniciado com sucesso (PID: ${res.pid})`);
      } else {
        throw new Error(res?.error || 'Erro desconhecido ao iniciar processo');
      }
    } catch (error) {
      pushLog(`❌ Falha ao iniciar: ${error.message}`);
      showToast('Falha ao iniciar processo', 'error');
      resetJobState();
    }
  }, [
    validateInput,
    setRunning,
    setStartTime,
    clearForceStopTimer,
    getTotalPedidos,
    config,
    pushLog,
    showToast,
    prepareJobArgs,
    electronAPI,
    resetJobState
  ]);

  /**
   * Para o processamento de forma normal
   */
  const stopJob = useCallback(async () => {
    if (!running) {
      pushLog('⚠️ Nenhum processo em execução para parar');
      return;
    }

    try {
      pushLog('⏸️ Enviando pedido de parada...');
      
      await electronAPI.stopJob();
      
      resetJobState();
      
      pushLog('✅ Processo parado com sucesso');
      showToast('Processo parado', 'info');
    } catch (error) {
      pushLog(`❌ Erro ao parar processo: ${error.message}`);
      showToast('Erro ao parar processo', 'error');
    }
  }, [running, electronAPI, pushLog, showToast, resetJobState]);

  /**
   * Força a parada do processamento (com confirmação)
   */
  const forceStop = useCallback(async () => {
    if (!running) {
      pushLog('⚠️ Nenhum processo em execução para parar');
      return;
    }

    // Primeira vez: solicitar confirmação
    if (!forceStopConfirm) {
      setForceStopConfirm(true);
      pushLog('⚠️ ATENÇÃO: Clique novamente em "Forçar Parada" para confirmar');
      showToast('Clique novamente para confirmar parada forçada', 'warning');
      
      // Timer para resetar confirmação após 5 segundos
      clearForceStopTimer();
      forceStopTimerRef.current = setTimeout(() => {
        setForceStopConfirm(false);
        pushLog('ℹ️ Confirmação de parada forçada cancelada');
      }, 5000);
      
      return;
    }

    // Segunda vez: executar parada forçada
    try {
      pushLog('🛑 Forçando parada do processo...');
      
      await electronAPI.stopJob();
      
      resetJobState();
      
      pushLog('⚠️ Processo forçado a parar');
      showToast('Processo forçado a parar', 'warning');
    } catch (error) {
      pushLog(`❌ Erro ao forçar parada: ${error.message}`);
      showToast('Erro ao forçar parada', 'error');
    }
  }, [
    running,
    forceStopConfirm,
    electronAPI,
    pushLog,
    showToast,
    resetJobState,
    clearForceStopTimer
  ]);

  /**
   * Cancela a confirmação de parada forçada
   */
  const cancelForceStop = useCallback(() => {
    setForceStopConfirm(false);
    clearForceStopTimer();
    pushLog('ℹ️ Confirmação de parada forçada cancelada');
  }, [clearForceStopTimer, pushLog]);

  return {
    startJob,
    stopJob,
    forceStop,
    cancelForceStop,
    forceStopConfirm
  };
}