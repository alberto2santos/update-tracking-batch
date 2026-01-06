import { useState, useEffect, useCallback } from 'react';

export function useProgress(logs, running, startTime) {
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [eta, setEta] = useState(null);

  // Atualizar progresso baseado nos logs
  useEffect(() => {
    const lastLog = logs[logs.length - 1];
    if (!lastLog) return;

    const match = lastLog.match(/(\d+)\/(\d+)\s+registros/i);
    if (match) {
      const current = parseInt(match[1]);
      const total = parseInt(match[2]);
      const percent = Math.round((current / total) * 100);
      setProgress({ current, total, percent });
    }

    // Reset progresso ao finalizar
    if (lastLog.includes('FINALIZADO') || lastLog.includes('ERRO NO PROCESSO')) {
      setTimeout(() => setProgress({ current: 0, total: 0, percent: 0 }), 3000);
    }
  }, [logs]);

  // Calcular ETA
  useEffect(() => {
    if (running && progress.current > 0 && progress.total > 0 && startTime) {
      const elapsed = Date.now() - startTime;
      const avgTimePerItem = elapsed / progress.current;
      const remaining = (progress.total - progress.current) * avgTimePerItem;
      setEta(remaining);
    } else {
      setEta(null);
    }
  }, [running, progress, startTime]);

  const resetProgress = useCallback(() => {
    setProgress({ current: 0, total: 0, percent: 0 });
    setEta(null);
  }, []);

  return { progress, eta, resetProgress };
}