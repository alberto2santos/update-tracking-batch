import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './assets/fonts/fonts.css';

// Função para remover loading screen
const removeLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Log para debug
    console.log('🎨 Removendo loading screen...');
    
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.remove();
        console.log('✅ Loading screen removido');
      }, 300);
    }, 500);
  }
};

// Log de inicialização
console.log('🚀 Iniciando aplicação React...');

// Criar root e renderizar
const root = createRoot(document.getElementById('root'));
root.render(<App />);

// Remover loading após render
removeLoadingScreen();

console.log('✅ Aplicação React inicializada');