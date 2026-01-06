import { useState } from 'react';

export default function UpdateChecker() {
  const [checking, setChecking] = useState(false);

  const handleCheckUpdates = async () => {
    setChecking(true);
    
    try {
      const result = await window.electron.checkForUpdates();
      
      if (!result.ok) {
        console.error('Erro ao verificar atualizações:', result.error);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <button 
      onClick={handleCheckUpdates} 
      disabled={checking}
      className="btn-primary"
    >
      {checking ? 'Verificando...' : 'Verificar Atualizações'}
    </button>
  );
}