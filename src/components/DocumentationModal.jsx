import { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Modal de Documentação
 * Exibe guia completo de uso da aplicação
 */
function DocumentationModal({ onClose }) {
  /**
   * Handler para fechar com ESC
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="documentation-title"
    >
      <div 
        className="modal-container modal-large" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="documentation-title">
            <span aria-hidden="true">📚</span>
            Documentação
          </h2>
          <button 
            className="modal-close" 
            onClick={onClose} 
            type="button"
            aria-label="Fechar documentação"
            title="Fechar (Esc)"
          >
            ✕
          </button>
        </header>

        <div className="modal-body documentation-content">
          {/* Introdução */}
          <section className="doc-section" aria-labelledby="intro-title">
            <h3 id="intro-title">
              <span aria-hidden="true">🚀</span>
              Introdução
            </h3>
            <p>
              O <strong>VTEX Update Tracking</strong> é uma aplicação desktop para automatizar 
              a atualização de rastreamento e marcação de entrega de pedidos na VTEX, 
              utilizando dados da API Bisturi Express.
            </p>
          </section>

          {/* Primeiros Passos */}
          <section className="doc-section" aria-labelledby="getting-started-title">
            <h3 id="getting-started-title">
              <span aria-hidden="true">🎯</span>
              Primeiros Passos
            </h3>
            <ol>
              <li>
                <strong>Configure o arquivo .env:</strong>
                <ul>
                  <li><code>VTEX_ACCOUNT_NAME</code>: Nome da sua conta VTEX</li>
                  <li><code>VTEX_ENVIRONMENT</code>: Ambiente VTEX (vtexcommercestable.com.br)</li>
                  <li><code>VTEX_APP_KEY</code>: Chave de API da VTEX</li>
                  <li><code>VTEX_APP_TOKEN</code>: Token de API da VTEX</li>
                </ul>
              </li>
              <li>
                <strong>Prepare seu arquivo de entrada:</strong>
                <ul>
                  <li><strong>Formato TXT:</strong> Um pedido por linha (ex: 1234567)</li>
                  <li><strong>Formato CSV:</strong> Com coluna "orderId" ou "order"</li>
                </ul>
              </li>
              <li>
                <strong>Selecione o arquivo ou adicione pedidos manualmente</strong>
              </li>
              <li>
                <strong>Configure as opções (dry-run, concorrência, delay)</strong>
              </li>
              <li>
                <strong>Clique em "Iniciar Processamento"</strong>
              </li>
            </ol>
          </section>

          {/* Funcionalidades */}
          <section className="doc-section" aria-labelledby="features-title">
            <h3 id="features-title">
              <span aria-hidden="true">⚡</span>
              Funcionalidades
            </h3>
            <ul>
              <li><strong>Upload de Arquivos:</strong> Suporte a TXT e CSV com drag &amp; drop</li>
              <li><strong>Input Manual:</strong> Adicione pedidos manualmente via tags</li>
              <li><strong>Dry-run:</strong> Simule o processamento sem alterar dados</li>
              <li><strong>Validação de Transportadora:</strong> Processa apenas Bisturi Express (ID 1924)</li>
              <li><strong>Idempotência:</strong> Não reprocessa pedidos que já têm tracking</li>
              <li><strong>Histórico:</strong> Armazena últimas 50 execuções</li>
              <li><strong>Logs em Tempo Real:</strong> Acompanhe o processamento</li>
              <li><strong>Notificações Desktop:</strong> Alerta ao finalizar</li>
              <li><strong>Backup Automático:</strong> Histórico salvo diariamente</li>
            </ul>
          </section>

          {/* Atalhos de Teclado */}
          <section className="doc-section" aria-labelledby="shortcuts-title">
            <h3 id="shortcuts-title">
              <span aria-hidden="true">⌨️</span>
              Atalhos de Teclado
            </h3>
            <table className="shortcuts-table">
              <caption className="sr-only">Lista de atalhos de teclado disponíveis</caption>
              <thead>
                <tr>
                  <th scope="col">Atalho</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><kbd>Ctrl</kbd> + <kbd>O</kbd></td>
                  <td>Abrir arquivo</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td>
                  <td>Iniciar processamento</td>
                </tr>
                <tr>
                  <td><kbd>Esc</kbd></td>
                  <td>Parar processamento</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl</kbd> + <kbd>L</kbd></td>
                  <td>Limpar lista</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl</kbd> + <kbd>K</kbd></td>
                  <td>Limpar logs</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl</kbd> + <kbd>H</kbd></td>
                  <td>Ver histórico</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl</kbd> + <kbd>D</kbd></td>
                  <td>Alternar tema</td>
                </tr>
                <tr>
                  <td><kbd>Ctrl</kbd> + <kbd>,</kbd></td>
                  <td>Configurações</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Fluxo de Processamento */}
          <section className="doc-section" aria-labelledby="flow-title">
            <h3 id="flow-title">
              <span aria-hidden="true">🔄</span>
              Fluxo de Processamento
            </h3>
            <ol>
              <li><strong>Busca na Bisturi:</strong> Consulta dados do pedido na API Bisturi</li>
              <li><strong>Validação:</strong> Verifica se é Bisturi Express (ID 1924)</li>
              <li><strong>Busca na VTEX:</strong> Localiza o pedido na VTEX usando orderWeb</li>
              <li><strong>Localiza Invoice:</strong> Busca a nota fiscal em múltiplos locais</li>
              <li><strong>Verifica Tracking:</strong> Pula se já possui rastreamento</li>
              <li><strong>Atualiza Tracking:</strong> PATCH com dados de rastreamento</li>
              <li><strong>Marca Entrega:</strong> PUT se status ENTREGUE na Bisturi</li>
            </ol>
          </section>

          {/* Configurações */}
          <section className="doc-section" aria-labelledby="settings-title">
            <h3 id="settings-title">
              <span aria-hidden="true">⚙️</span>
              Configurações
            </h3>
            <dl>
              <dt><strong>Dry-run:</strong></dt>
              <dd>Simula execução sem alterar dados (recomendado para testes)</dd>
              
              <dt><strong>Concorrência:</strong></dt>
              <dd>
                Número de requisições paralelas (padrão: 4)
                <ul>
                  <li>Menor valor = mais lento, mais seguro</li>
                  <li>Maior valor = mais rápido, maior chance de rate limit</li>
                </ul>
              </dd>
              
              <dt><strong>Delay:</strong></dt>
              <dd>
                Tempo entre requisições em ms (padrão: 200ms)
                <ul>
                  <li>Aumentar se estiver recebendo muitos erros 429</li>
                </ul>
              </dd>
            </dl>
          </section>

          {/* Solução de Problemas */}
          <section className="doc-section" aria-labelledby="troubleshooting-title">
            <h3 id="troubleshooting-title">
              <span aria-hidden="true">🔧</span>
              Solução de Problemas
            </h3>
            <dl>
              <dt><strong>Erro 429 (Rate Limit):</strong></dt>
              <dd>
                <ul>
                  <li>Reduza a concorrência</li>
                  <li>Aumente o delay entre requisições</li>
                  <li>O sistema já faz retry automático</li>
                </ul>
              </dd>
              
              <dt><strong>Pedido não encontrado na Bisturi:</strong></dt>
              <dd>
                <ul>
                  <li>Verifique se o pedido existe na Bisturi</li>
                  <li>Confirme o formato do ID (pode ser 1234567 ou v1234567)</li>
                </ul>
              </dd>
              
              <dt><strong>Invoice não encontrada:</strong></dt>
              <dd>
                <ul>
                  <li>Verifique se a nota fiscal foi emitida na VTEX</li>
                  <li>Confirme o número da nota fiscal</li>
                </ul>
              </dd>
              
              <dt><strong>Transportadora incorreta:</strong></dt>
              <dd>
                <ul>
                  <li>Este script processa apenas Bisturi Express (ID 1924)</li>
                  <li>Outras transportadoras devem ser gerenciadas pelo TMS</li>
                </ul>
              </dd>
            </dl>
          </section>

          {/* Logs e Histórico */}
          <section className="doc-section" aria-labelledby="logs-title">
            <h3 id="logs-title">
              <span aria-hidden="true">📊</span>
              Logs e Histórico
            </h3>
            <ul>
              <li><strong>Logs em Tempo Real:</strong> Acompanhe o processamento na seção de logs</li>
              <li><strong>Exportar Logs:</strong> Salve os logs em arquivo CSV para análise</li>
              <li><strong>Histórico:</strong> Últimas 50 execuções são salvas automaticamente</li>
              <li><strong>Backup Automático:</strong> Histórico é salvo diariamente</li>
              <li><strong>Logs Persistentes:</strong> Logs são salvos em disco (últimos 30 dias)</li>
            </ul>
          </section>

          {/* Suporte */}
          <section className="doc-section" aria-labelledby="support-title">
            <h3 id="support-title">
              <span aria-hidden="true">💬</span>
              Suporte
            </h3>
            <p>
              Para suporte técnico ou dúvidas, entre em contato com o desenvolvedor.
            </p>
            <dl className="info-list">
              <dt>Versão:</dt>
              <dd>1.0.3</dd>
              <dt>Autor:</dt>
              <dd>Alberto Luiz</dd>
            </dl>
          </section>
        </div>

        <footer className="modal-footer">
          <button 
            className="btn btn-primary" 
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

// ============================================
// PROP TYPES
// ============================================

DocumentationModal.propTypes = {
  /** Callback para fechar o modal */
  onClose: PropTypes.func.isRequired
};

export default DocumentationModal;