import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import './styles.css';
import './assets/fonts/fonts.css';

// Components
import Header from './components/Header';
import StatsSection from './components/StatsSection';
import DetailedStats from './components/DetailedStats';
import UploadSection from './components/UploadSection';
import ActionsSection from './components/ActionsSection';
import ProgressSection from './components/ProgressSection';
import LogsSection from './components/LogsSection';
import Footer from './components/Footer';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import DocumentationModal from './components/DocumentationModal';
import ToastsContainer from './components/ToastsContainer';

// Hooks
import { useConfig } from './hooks/useConfig';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useElectronAPI } from './hooks/useElectronAPI';
import { useLogs } from './hooks/useLogs';
import { useProgress } from './hooks/useProgress';
import { useStats } from './hooks/useStats';
import { useToast } from './hooks/useToast';
import { useJobControl } from './hooks/useJobControl';
import { useFileManagement } from './hooks/useFileManagement';
import useHistory from './hooks/useHistory';

function App() {
  // Estados principais
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);

  // Custom hooks básicos
  const { config, updateConfig, configSaving } = useConfig();
  const { logs, pushLog, clearLogs, exportLogs } = useLogs();
  const { toasts, showToast } = useToast();

  // Refs para callbacks estáveis
  const pushLogRef = useRef(pushLog);
  const showToastRef = useRef(showToast);
  const logsRef = useRef(logs);

  // Atualizar refs sempre que mudarem
  useEffect(() => {
    pushLogRef.current = pushLog;
  }, [pushLog]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Toggle functions
  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const toggleDocumentation = useCallback(() => {
    setShowDocumentation(prev => !prev);
  }, []);

  const toggleTheme = useCallback(() => {
    updateConfig({ darkMode: !config.darkMode });
  }, [config.darkMode, updateConfig]);

  const toggleDryRun = useCallback((value) => {
    updateConfig({ dryRun: value });
  }, [updateConfig]);

  // Electron API callbacks
  const handleLog = useCallback((d) => {
    const text = (d.type === 'stderr' ? `[ERR] ${d.text}` : d.text).trim();
    pushLogRef.current(text);
  }, []);

  // Ref para armazenar funções de menu action
  const menuActionsRef = useRef({});

  // Electron API
  const handleMenuAction = useCallback((action) => {
    console.log('🎬 Menu action:', action);

    // Executar ação se existir no ref
    if (menuActionsRef.current[action]) {
      menuActionsRef.current[action]();
    } else {
      console.warn('⚠️ Ação não registrada:', action);
    }
  }, []);

  const electronAPI = useElectronAPI({
    onLog: handleLog,
    onDone: null,
    onError: null,
    onMenuAction: handleMenuAction
  });

  // Hooks que dependem de electronAPI
  const {
    filePath,
    fileMeta,
    manualInput,
    manualList,
    loading,
    handleSelect,
    handleFileDrop,
    handleManualKeyDown,
    handleManualPaste,
    removeManualItem,
    handleClearAll,
    removeDuplicatesFromManualList,
    setManualInput,
    getTotalPedidos
  } = useFileManagement({
    running,
    pushLog,
    showToast,
    electronAPI
  });

  const {
    history,
    exportHistory,
    clearHistory,
    deleteHistoryItem,
    saveToHistory
  } = useHistory({
    showToast,
    electronAPI
  });

  // Hooks que dependem de outros estados
  const { progress, eta } = useProgress(logs, running, startTime);
  const stats = useStats(logs, elapsedTime);

  // handleDone com salvamento de histórico
  const handleDone = useCallback(async (d) => {
    console.log('✅ Processo finalizado:', d);

    pushLogRef.current(`✅ PROCESSO FINALIZADO (código=${d.code})`);
    setRunning(false);

    if (startTime) {
      const duration = Math.floor((Date.now() - startTime) / 1000);

      const currentLogs = logsRef.current || [];
      const progressLine = currentLogs
        .slice()
        .reverse()
        .find(log => log.includes('Progresso:') || log.includes('registros |'));

      let total = 0;
      let success = 0;
      let errors = 0;
      let skipped = 0;

      if (progressLine) {
        const match = progressLine.match(/(\d+)\/(\d+)\s+(?:registros|pedidos)\s+\|\s+✓(\d+)\s+⊘(\d+)\s+✗(\d+)/);

        if (match) {
          // ✅ Usar Number.parseInt em vez de parseInt
          total = Number.parseInt(match[2], 10) || 0;
          success = Number.parseInt(match[3], 10) || 0;
          skipped = Number.parseInt(match[4], 10) || 0;
          errors = Number.parseInt(match[5], 10) || 0;
        }
      }

      // ✅ Regex corrigida para Windows e Unix
      const fileName = filePath ? filePath.split(/[/\\]/).pop() : 'Manual';

      const historyData = {
        fileName,
        total,
        success,
        errors,
        skipped,
        duration
      };

      try {
        await saveToHistory(historyData);
        showToastRef.current('Processamento concluído!', 'success');
      } catch (error) {
        console.error('❌ Erro ao salvar histórico:', error);
        showToastRef.current('Processamento concluído (erro ao salvar histórico)', 'warning');
      }
    }

    setStartTime(null);
  }, [startTime, filePath, saveToHistory]);

  const handleError = useCallback((d) => {
    pushLogRef.current(`❌ ERRO NO PROCESSO: ${d.message}`);
    setRunning(false);
    setStartTime(null);
    showToastRef.current('Erro no processamento', 'error');
  }, []);

  // Registrar handleDone e handleError
  useEffect(() => {
    if (electronAPI?.onJobDone && electronAPI?.onJobError) {
      const unsubDone = electronAPI.onJobDone(handleDone);
      const unsubError = electronAPI.onJobError(handleError);

      return () => {
        unsubDone?.();
        unsubError?.();
      };
    }
  }, [electronAPI, handleDone, handleError]);

  const {
    startJob,
    stopJob,
    forceStop,
    forceStopConfirm
  } = useJobControl({
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
  });

  // ✅ Registrar menu actions no ref
  useEffect(() => {
    menuActionsRef.current = {
      'open-file': handleSelect,
      'export-logs': exportLogs,
      'start-job': () => !running && startJob(),
      'stop-job': () => running && stopJob(),
      'clear-list': handleClearAll,
      'clear-logs': clearLogs,
      'export-history': exportHistory,
      'clear-history': clearHistory,
      'settings': toggleSettings,
      'toggle-theme': toggleTheme,
      'show-history': toggleHistory,
      'show-docs': toggleDocumentation,
      'show-shortcuts': () => {
        showToast('Atalhos: Ctrl+O (Abrir), Ctrl+Enter (Iniciar), Esc (Parar), Ctrl+, (Configurações)', 'info');
      }
    };
  }, [
    handleSelect,
    exportLogs,
    running,
    startJob,
    stopJob,
    handleClearAll,
    clearLogs,
    exportHistory,
    clearHistory,
    toggleSettings,
    toggleTheme,
    toggleHistory,
    toggleDocumentation,
    showToast
  ]);

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.darkMode ? 'dark' : 'light');
  }, [config.darkMode]);

  // Cronômetro
  useEffect(() => {
    if (!running || !startTime) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [running, startTime]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onOpenFile: handleSelect,
    onStart: startJob,
    onClearLogs: clearLogs,
    onClearList: handleClearAll,
    onToggleTheme: toggleTheme,
    onToggleHistory: toggleHistory,
    onToggleSettings: toggleSettings,
    onStop: stopJob,
    running,
    showToast
  });

  // Memoizar totalPedidos
  const totalPedidos = useMemo(() => getTotalPedidos(), [getTotalPedidos]);

  // Handlers para fechar modais
  const handleCloseHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleSaveSettings = useCallback(() => {
    setShowSettings(false);
    showToast('Configurações salvas', 'success');
  }, [showToast]);

  const handleCloseDocumentation = useCallback(() => {
    setShowDocumentation(false);
  }, []);

  return (
    <div className="app-container">
      <Header
        running={running}
        totalPedidos={totalPedidos}
        historyCount={history.length}
        onToggleHistory={toggleHistory}
        onToggleTheme={toggleTheme}
        darkMode={config.darkMode}
        onToggleSettings={toggleSettings}
      />

      <main className="app-main">
        <StatsSection
          totalPedidos={totalPedidos}
          progress={progress}
          dryRun={config.dryRun}
        />

        <DetailedStats
          running={running}
          stats={stats}
        />

        <UploadSection
          filePath={filePath}
          fileMeta={fileMeta}
          manualInput={manualInput}
          manualList={manualList}
          running={running}
          dryRun={config.dryRun}
          loading={loading}
          onFileSelect={handleSelect}
          onManualInputChange={setManualInput}
          onManualKeyDown={handleManualKeyDown}
          onManualPaste={handleManualPaste}
          onRemoveManualItem={removeManualItem}
          onClearAll={handleClearAll}
          onRemoveDuplicates={removeDuplicatesFromManualList}
          onDryRunChange={toggleDryRun}
          onFileDrop={handleFileDrop}
          showToast={showToast}
        />

        <ActionsSection
          running={running}
          forceStopConfirm={forceStopConfirm}
          onStart={startJob}
          onStop={stopJob}
          onForceStop={forceStop}
          onClearLogs={clearLogs}
        />

        <ProgressSection
          running={running}
          progress={progress}
          elapsedTime={elapsedTime}
          eta={eta}
        />

        <LogsSection
          logs={logs}
          onExport={exportLogs}
        />
      </main>

      <Footer />

      {showHistory && (
        <HistoryModal
          history={history}
          onClose={handleCloseHistory}
          onExport={exportHistory}
          onClear={clearHistory}
          onDeleteItem={deleteHistoryItem}
        />
      )}

      {showSettings && (
        <SettingsModal
          config={config}
          configSaving={configSaving}
          running={running}
          onClose={handleCloseSettings}
          onConfigChange={updateConfig}
          onSave={handleSaveSettings}
        />
      )}

      {showDocumentation && (
        <DocumentationModal
          onClose={handleCloseDocumentation}
        />
      )}

      <ToastsContainer toasts={toasts} />
    </div>
  );
}

export default App;