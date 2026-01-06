import { useEffect } from 'react';

export function useKeyboardShortcuts({
  onOpenFile,
  onStart,
  onClearLogs,
  onClearList,
  onToggleTheme,
  onToggleHistory,
  onToggleSettings,
  onStop,
  running
}) {
  useEffect(() => {
    function handleKeyboard(e) {
      // Ctrl+O - Abrir arquivo
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        if (!running) onOpenFile();
      }

      // Ctrl+Enter - Iniciar
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!running) onStart();
      }

      // Ctrl+K - Limpar logs
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClearLogs();
      }

      // Ctrl+L - Limpar lista
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        if (!running) onClearList();
      }

      // Ctrl+D - Alternar tema
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        onToggleTheme();
      }

      // Ctrl+H - Histórico
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        onToggleHistory();
      }

      // Ctrl+, - Configurações
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        console.log('⌨️ Atalho Ctrl+, pressionado - Abrindo configurações');
        if (onToggleSettings) {
          onToggleSettings();
        }
      }

      // Esc - Parar
      if (e.key === 'Escape' && running) {
        onStop();
      }
    }

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [
    running,
    onOpenFile,
    onStart,
    onClearLogs,
    onClearList,
    onToggleTheme,
    onToggleHistory,
    onToggleSettings,
    onStop
  ]);
}