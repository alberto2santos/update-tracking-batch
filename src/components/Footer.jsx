import React from 'react';
import { KEYBOARD_SHORTCUTS } from '../utils/constants';

/**
 * Rodapé da aplicação
 * Exibe atalhos de teclado e informações do sistema
 */
function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-content">
        {/* Seção de Atalhos */}
        <nav className="footer-shortcuts" aria-label="Atalhos de teclado">
          <span className="footer-label" aria-hidden="true">⌨️ Atalhos:</span>
          <ul className="shortcuts-list">
            {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
              <li key={shortcut.key} className="shortcut-item">
                {index > 0 && (
                  <span className="shortcut-separator" aria-hidden="true">•</span>
                )}
                <kbd 
                  className="shortcut-key"
                  aria-label={`Tecla ${shortcut.key}`}
                >
                  {shortcut.key}
                </kbd>
                <span className="shortcut-desc">{shortcut.description}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;