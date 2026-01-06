import { useEffect, useCallback } from 'react';

export default function DocsModal({ onClose }) {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📚 Documentação</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="modal-body docs-content">
          <section className="docs-section">
            <h3>🚀 Início Rápido</h3>
            <ol>
              <li>Configure o arquivo <code>.env</code> com suas credenciais VTEX</li>
              <li>Selecione um arquivo TXT ou CSV com os pedidos</li>
              <li>Clique em "Iniciar Processamento"</li>
            </ol>
          </section>

          <section className="docs-section">
            <h3>📁 Formato de Arquivo</h3>
            <h4>TXT:</h4>
            <pre>
{`1234567-01
1234568-01
1234569-01`}
            </pre>

            <h4>CSV:</h4>
            <pre>
{`orderId,invoiceNumber
1234567-01,12345
1234568-01,12346`}
            </pre>
          </section>

          <section className="docs-section">
            <h3>⚙️ Configurações</h3>
            <ul>
              <li><strong>Dry-run:</strong> Simula execução sem alterar dados</li>
              <li><strong>Concorrência:</strong> Número de requisições paralelas (padrão: 4)</li>
              <li><strong>Delay:</strong> Tempo entre requisições em ms (padrão: 200ms)</li>
            </ul>
          </section>

          <section className="docs-section">
            <h3>⌨️ Atalhos de Teclado</h3>
            <table className="shortcuts-table">
              <thead>
                <tr>
                  <th>Atalho</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><kbd>Ctrl+O</kbd></td>
                  <td>Abrir arquivo</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl+Enter</kbd></td>
                  <td>Iniciar processamento</td>
                </tr>
                <tr>
                  <td><kbd>Esc</kbd></td>
                  <td>Parar processamento</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl+L</kbd></td>
                  <td>Limpar lista</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl+K</kbd></td>
                  <td>Limpar logs</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl+H</kbd></td>
                  <td>Ver histórico</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl+D</kbd></td>
                  <td>Alternar tema</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="docs-section">
            <h3>❓ Perguntas Frequentes</h3>
            
            <h4>Por que alguns pedidos são pulados?</h4>
            <p>Pedidos são pulados quando:</p>
            <ul>
              <li>Não são encontrados na Bisturi</li>
              <li>A transportadora não é Bisturi Express (ID 1924)</li>
              <li>Já possuem rastreamento cadastrado</li>
              <li>A invoice não é encontrada na VTEX</li>
            </ul>

            <h4>O que é Dry-run?</h4>
            <p>
              Dry-run simula a execução sem alterar dados na VTEX. 
              Use para testar antes de executar de verdade.
            </p>

            <h4>Como funcionam os backups?</h4>
            <p>
              O sistema cria backups automáticos do histórico a cada 24 horas 
              e antes de limpar o histórico. Os backups são salvos em:
            </p>
            <code>%APPDATA%/vtex-update-tracking/backups/</code>
          </section>

          <section className="docs-section">
            <h3>🔗 Links Úteis</h3>
            <ul>
              <li><a href="https://github.com/alberto2santos/vtex-update-tracking" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://developers.vtex.com/docs/api-reference/orders-api" target="_blank" rel="noopener noreferrer">VTEX Orders API</a></li>
              <li><a href="https://api.bisturi.com.br/docs" target="_blank" rel="noopener noreferrer">Bisturi API</a></li>
            </ul>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}