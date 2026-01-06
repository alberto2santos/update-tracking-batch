// hooks/useStats.js
import { useState, useEffect } from 'react';

export function useStats(logs, elapsedTime) {
  const [stats, setStats] = useState({ 
    success: 0, 
    skipped: 0, 
    errors: 0, 
    avgTime: 0 
  });

  useEffect(() => {
    const successCount = logs.filter(l => 
      l.includes('✅') || l.includes('[OK]') || l.toLowerCase().includes('success')
    ).length;
    
    const errorCount = logs.filter(l => 
      l.includes('❌') || l.includes('[ERR]') || l.toLowerCase().includes('error')
    ).length;
    
    const skippedCount = logs.filter(l => 
      l.includes('⊘') || l.includes('[SKIP]') || l.toLowerCase().includes('skip')
    ).length;
    
    const avgTime = (successCount + errorCount) > 0 && elapsedTime > 0
      ? Math.round(elapsedTime / (successCount + errorCount))
      : 0;
    
    setStats({
      success: successCount,
      skipped: skippedCount,
      errors: errorCount,
      avgTime
    });
  }, [logs, elapsedTime]);

  return stats;
}