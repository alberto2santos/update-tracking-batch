import { useCallback, useState } from 'react';
import { formatFileLabel, formatFileSize } from '../utils/formatters';

export default function UploadSection({
  filePath,
  fileMeta,
  manualInput,
  manualList,
  running,
  dryRun,
  loading,
  onFileSelect,
  onManualInputChange,
  onManualKeyDown,
  onManualPaste,
  onRemoveManualItem,
  onClearAll,
  onRemoveDuplicates,
  onDryRunChange,
  onFileDrop,
  showToast
}) {
  const [dragActive, setDragActive] = useState(false);
  const [dropError, setDropError] = useState('');

  // Drag & Drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDropError('');

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) {
      setDropError('Nenhum arquivo detectado');
      return;
    }

    const f = files[0];
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();

    if (!['.txt', '.csv'].includes(ext)) {
      setDropError(`Formato não suportado: ${ext}. Use .txt ou .csv`);
      showToast(`Formato ${ext} não suportado`, 'error');
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setDropError(`Arquivo muito grande: ${(f.size / 1024 / 1024).toFixed(2)}MB (máx: 10MB)`);
      showToast('Arquivo muito grande (máx: 10MB)', 'error');
      return;
    }

    const p = f.path || (f.webkitRelativePath || f.name);
    if (!p) {
      setDropError('Arquivo sem path válido. Use "Selecionar arquivo"');
      return;
    }

    onFileDrop(p);
  }, [onFileDrop, showToast]);

  return (
    <section className="upload-section">
      <h2 className="section-title">📤 Enviar pedidos</h2>

      {/* Loading State */}
      {loading && (
        <div className="file-loading">
          <div className="loading-spinner"></div>
          <p>Carregando arquivo...</p>
        </div>
      )}

      {/* Dropzone */}
      <div
        className={`dropzone ${dragActive ? 'dropzone-active' : ''} ${filePath ? 'dropzone-success' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        tabIndex={0}
      >
        {!filePath ? (
          <div className="dropzone-content">
            <div className="dropzone-icon">{dragActive ? '📥' : '📁'}</div>
            <p className="dropzone-title">
              {dragActive ? 'Solte o arquivo aqui' : 'Arraste seu arquivo aqui'}
            </p>
            <p className="dropzone-subtitle">ou clique em Selecionar arquivo</p>
            <p className="dropzone-hint">
              Formato: .txt (1 orderId por linha) ou .csv com coluna orderId
            </p>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-icon">{fileMeta ? '✅' : '📁'}</div>
            <div className="file-info">
              <p className="file-name">{formatFileLabel(filePath)}</p>
              <p className={`file-status ${fileMeta ? 'status-success' : 'status-error'}`}>
                {fileMeta ? `${fileMeta.lineCount} registros (${formatFileSize(fileMeta.size)} KB)` : 'Arquivo inválido'}
              </p>
            </div>
            <button
              className="btn-change-file"
              onClick={() => onFileDrop('')}
              disabled={loading || running}
            >
              Trocar arquivo
            </button>
          </div>
        )}
      </div>

      {/* Drop Error */}
      {dropError && (
        <div className="drop-error">
          <span className="drop-error-icon">⚠️</span>
          <span className="drop-error-text">{dropError}</span>
          <button 
            className="drop-error-close"
            onClick={() => setDropError('')}
            aria-label="Fechar erro"
          >
            ✕
          </button>
        </div>
      )}

      {/* Manual Input */}
      <div className="manual-section">
        <div className="manual-input-container">
          <input
            className="manual-input"
            placeholder="Digite ou cole pedidos (separados por linha/espaço) e pressione Enter"
            value={manualInput}
            onChange={e => onManualInputChange(e.target.value)}
            onKeyDown={onManualKeyDown}
            onPaste={onManualPaste}
            disabled={running || loading}
          />

          <div className="manual-tags-container">
            {manualList.length === 0 ? (
              <div className="manual-tags-empty">
                Nenhum pedido adicionado manualmente
              </div>
            ) : (
              manualList.map((p, i) => (
                <div key={i} className="manual-tag">
                  <span>{p}</span>
                  <button
                    className="manual-tag-remove"
                    onClick={() => onRemoveManualItem(i)}
                    disabled={running}
                    title="Remover pedido"
                    aria-label={`Remover pedido ${p}`}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="manual-actions">
          <button
            className="btn btn-primary"
            onClick={onFileSelect}
            disabled={running || loading}
            title="Selecionar arquivo (Ctrl+O)"
          >
            📁 Selecionar arquivo
          </button>

          {/* Botão para remover duplicatas */}
          {manualList.length > 1 && (
            <button
              className="btn btn-secondary"
              onClick={onRemoveDuplicates}
              disabled={running || loading}
              title="Remover pedidos duplicados da lista manual"
            >
              🧹 Remover Duplicatas
            </button>
          )}
        </div>
      </div>

      {/* Upload Controls */}
      <div className="upload-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={e => onDryRunChange(e.target.checked)}
            disabled={running || loading}
          />
          <span>Dry-run (simular, não altera dados)</span>
        </label>

        <button
          className="btn btn-ghost"
          onClick={onClearAll}
          disabled={running || loading || (manualList.length === 0 && !filePath)}
          title="Limpar lista (Ctrl+L)"
        >
          🧹 Limpar lista
        </button>
      </div>
    </section>
  );
}