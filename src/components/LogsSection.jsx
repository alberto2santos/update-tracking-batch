import { useState, useRef, useMemo } from 'react';

export default function LogsSection({ logs, onExport }) {
  const [logFilter, setLogFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const logsContainerRef = useRef(null);

  // Processar e agrupar logs similares
  const processedLogs = useMemo(() => {
    const processed = [];
    const seen = new Set();

    logs.forEach((log, index) => {
      const cleanLog = log
        .replace(/ℹ️/g, '')
        .replace(/⚠️/g, '')
        .replace(/❌/g, '')
        .replace(/✅/g, '')
        .replace(/📊/g, '')
        .replace(/🎉/g, '')
        .replace(/▶️/g, '')
        .replace(/📈/g, '')
        .trim();

      if (!cleanLog) return;

      const key = cleanLog.toLowerCase();

      if (seen.has(key)) return;

      seen.add(key);
      if (seen.size > 50) {
        const firstKey = seen.values().next().value;
        seen.delete(firstKey);
      }

      processed.push({
        original: log,
        clean: cleanLog,
        index
      });
    });

    return processed;
  }, [logs]);

  // Filtrar logs processados
  const filteredLogs = useMemo(() => {
    let filtered = processedLogs;
    
    if (logFilter !== 'all') {
      filtered = filtered.filter(item => {
        const type = getLogType(item.clean);
        return type === logFilter;
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.clean.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [processedLogs, logFilter, searchTerm]);

  // Determinar tipo do log
  function getLogType(log) {
    if (log.includes('[OK]') || log.includes('PATCH aplicado') || log.includes('Marcado como ENTREGUE')) {
      return 'success';
    }
    
    if (log.includes('[SKIP]') || log.includes('já possui tracking') || log.includes('PULADO:')) {
      return 'skipped';
    }
    
    if (log.includes('[ERR]') || log.includes('Erro ao') || log.includes('Falha')) {
      return 'error';
    }
    
    if (log.includes('PROCESSO FINALIZADO') || log.includes('Relatórios CSV gerados')) {
      return 'complete';
    }
    
    if (log.includes('Progresso:') || log.includes('registros |')) {
      return 'progress';
    }
    
    if (log.includes('Iniciando processamento') || log.includes('VTEX Update Tracking - Iniciando')) {
      return 'start';
    }

    if (log.includes('Resumo:')) {
      return 'summary';
    }
    
    if (log.includes('Bisturi data:') || 
        log.includes('Pedido VTEX encontrado:') || 
        log.includes('Invoice encontrada em packages:') ||
        log.includes('Buscando pedido na VTEX:') ||
        log.includes('Transportadora: Bisturi Express')) {
      return 'technical';
    }
    
    return 'info';
  }

  // Determinar ícone e cor
  function getLogStyle(log) {
    const type = getLogType(log);
    
    const styles = {
      success: { icon: '✅', label: 'Sucesso', color: '#10b981' },
      skipped: { icon: '⏭️', label: 'Pulado', color: '#f59e0b' },
      error: { icon: '❌', label: 'Erro', color: '#ef4444' },
      complete: { icon: '🎉', label: 'Concluído', color: '#10b981' },
      progress: { icon: '📊', label: 'Progresso', color: '#8b5cf6' },
      start: { icon: '▶️', label: 'Iniciando', color: '#3b82f6' },
      summary: { icon: 'ℹ️', label: 'Resumo', color: '#6b7280' },
      technical: { icon: '🔧', label: 'Técnico', color: '#6b7280' },
      info: { icon: 'ℹ️', label: 'Info', color: '#6b7280' }
    };
    
    return styles[type] || styles.info;
  }

  // Limpar e simplificar mensagem
  function cleanMessage(log) {
    let message = log
      .replace(/ℹ️/g, '')
      .replace(/⚠️/g, '')
      .replace(/❌/g, '')
      .replace(/✅/g, '')
      .replace(/📊/g, '')
      .replace(/🎉/g, '')
      .replace(/▶️/g, '')
      .replace(/🔧/g, '')
      .replace(/📈/g, '')
      .replace(/\[ERR\]/g, '')
      .replace(/\[OK\]/g, '')
      .replace(/\[SKIP\]/g, 'PULADO:')
      .replace(/\[START\]/g, '')
      .trim();

    if (message.includes('Dry-run=') || message.includes('Modo teste')) {
      const dryRun = message.includes('Dry-run=SIM') || message.includes('Modo teste: SIM') ? 'SIM' : 'NÃO';
      const match = message.match(/(\d+)\s+pedidos?/);
      const count = match ? match[1] : '?';
      return `Iniciando processamento de ${count} ${count === '1' ? 'pedido' : 'pedidos'} (Modo teste: ${dryRun})`;
    }

    if (message.includes('Configurações:') || message.includes('Delay:') || message.includes('Verbose:')) {
      return null;
    }

    if (message.includes('Registros detectados:')) {
      return null;
    }

    if (message.includes('Processo iniciado (PID:') || message.includes('Processo iniciado com sucesso')) {
      return 'Processo iniciado com sucesso';
    }

    if (message.includes('Arquivos gerados:') || message.includes('Relatórios CSV gerados')) {
      return 'Relatórios CSV gerados com sucesso';
    }

    if (message.includes('Resumo:')) {
      const totalMatch = message.match(/Total:\s*(\d+)/);
      const sucessoMatch = message.match(/Sucesso:\s*(\d+)/);
      const puladosMatch = message.match(/Pulados:\s*(\d+)/);
      const errosMatch = message.match(/Erros:\s*(\d+)/);
      
      const total = totalMatch ? totalMatch[1] : '?';
      const sucesso = sucessoMatch ? sucessoMatch[1] : '0';
      const pulados = puladosMatch ? puladosMatch[1] : '0';
      const erros = errosMatch ? errosMatch[1] : '0';
      
      return `Resumo: ${total} ${total === '1' ? 'pedido' : 'pedidos'} processado(s) | ✅ ${sucesso} sucesso | ⏭️ ${pulados} pulado(s) | ❌ ${erros} erro(s)`;
    }

    if (message.includes('Progresso:')) {
      return message.replace('registros', 'pedidos');
    }

    return message;
  }

  // Adicionar explicação amigável
  function getExplanation(log) {
    const type = getLogType(log);
    
    if (type === 'success') {
      if (log.includes('PATCH aplicado')) {
        return 'O número de rastreamento foi cadastrado com sucesso no pedido VTEX.';
      }
      if (log.includes('Marcado como ENTREGUE')) {
        return 'O pedido foi marcado como entregue no sistema VTEX.';
      }
      return null;
    }
    
    if (type === 'skipped') {
      return 'Este pedido não precisa ser processado novamente.';
    }
    
    if (type === 'error') {
      if (log.includes('Rate limit') || log.includes('429')) {
        return 'Muitas requisições. O sistema tentará novamente automaticamente.';
      }
      if (log.includes('timeout')) {
        return 'A conexão demorou muito. Verifique sua internet.';
      }
      if (log.includes('não encontrado') || log.includes('404')) {
        return 'Pedido não encontrado no sistema.';
      }
      return 'Verifique os detalhes do erro acima.';
    }
    
    if (type === 'complete') {
      if (log.includes('PROCESSO FINALIZADO')) {
        return 'Todos os pedidos foram processados. Verifique o resumo e os arquivos gerados.';
      }
      return null;
    }
    
    if (type === 'progress') {
      return null;
    }

    if (type === 'summary') {
      return null;
    }
    
    return null;
  }

  // Contar logs por tipo
  const logCounts = useMemo(() => {
    return {
      all: processedLogs.length,
      success: processedLogs.filter(item => getLogType(item.clean) === 'success').length,
      error: processedLogs.filter(item => getLogType(item.clean) === 'error').length,
      skipped: processedLogs.filter(item => getLogType(item.clean) === 'skipped').length
    };
  }, [processedLogs]);

  return (
    <section className="logs-section">
      <div className="logs-header">
        <h2 className="section-title">📋 Acompanhamento</h2>
        <div className="logs-actions">
          {logs.length > 0 && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onExport}
              title="Salvar logs em arquivo"
            >
              💾 Salvar
            </button>
          )}
        </div>
      </div>

      <div className="logs-toolbar">
        <div className="logs-filters">
          <button 
            className={`filter-btn ${logFilter === 'all' ? 'active' : ''}`}
            onClick={() => setLogFilter('all')}
          >
            Todos ({logCounts.all})
          </button>
          <button 
            className={`filter-btn filter-success ${logFilter === 'success' ? 'active' : ''}`}
            onClick={() => setLogFilter('success')}
          >
            ✅ Sucesso ({logCounts.success})
          </button>
          <button 
            className={`filter-btn filter-skipped ${logFilter === 'skipped' ? 'active' : ''}`}
            onClick={() => setLogFilter('skipped')}
          >
            ⏭️ Pulados ({logCounts.skipped})
          </button>
          <button 
            className={`filter-btn filter-error ${logFilter === 'error' ? 'active' : ''}`}
            onClick={() => setLogFilter('error')}
          >
            ❌ Erros ({logCounts.error})
          </button>
        </div>
        
        <input
          type="text"
          className="logs-search"
          placeholder="🔍 Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="logs-container" ref={logsContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="logs-empty">
            <div className="logs-empty-icon">
              {processedLogs.length === 0 ? '📋' : '🔍'}
            </div>
            <div className="logs-empty-title">
              {processedLogs.length === 0 ? 'Nenhum registro ainda' : 'Nenhum registro encontrado'}
            </div>
            <div className="logs-empty-subtitle">
              {processedLogs.length === 0 
                ? 'Clique em "Iniciar Processamento" para começar' 
                : 'Tente ajustar os filtros'}
            </div>
          </div>
        ) : (
          filteredLogs.map((item) => {
            const style = getLogStyle(item.clean);
            const message = cleanMessage(item.clean);
            const explanation = getExplanation(item.clean);
            const type = getLogType(item.clean);

            if (!message || type === 'technical') return null;

            return (
              <div key={item.index} className={`log-entry log-${type}`}>
                <div className="log-icon" style={{ color: style.color }}>
                  {style.icon}
                </div>
                <div className="log-content">
                  <div className="log-message">{message}</div>
                  {explanation && (
                    <div className="log-explanation">{explanation}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}