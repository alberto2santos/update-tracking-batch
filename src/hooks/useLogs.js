import { useCallback, useRef, useState } from 'react';

export function useLogs() {
  const [logs, setLogs] = useState([]);
  const logsRef = useRef([]);

  const pushLog = useCallback((txt) => {
    logsRef.current = [...logsRef.current, txt];
    
    // Limitar logs em memória
    if (logsRef.current.length > 3000) {
      logsRef.current = logsRef.current.slice(-3000);
    }
    
    // Mostrar apenas últimos 1000
    setLogs([...logsRef.current.slice(-1000)]);
    
    console.log(`📝 ${txt}`);
  }, []);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
    console.log('🧹 Logs limpos');
  }, []);

  const exportLogs = useCallback(() => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const content = logsRef.current.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${timestamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`📥 Logs exportados: logs_${timestamp}.txt`);
  }, []);

  return { logs, pushLog, clearLogs, exportLogs };
}