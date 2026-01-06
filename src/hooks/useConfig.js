import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CONFIG } from '../utils/constants';

export function useConfig() {
  const [config, setConfig] = useState({
    ...DEFAULT_CONFIG,
    notificationsEnabled: true,
    soundEnabled: true,
    notificationTimeout: 5
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Carregar configurações salvas
  useEffect(() => {
    async function loadSavedConfig() {
      try {
        const result = await window.electronAPI.loadConfig();
        if (result && result.ok && result.config) {
          const loadedConfig = {
            dryRun: result.config.dryRun ?? DEFAULT_CONFIG.dryRun,
            concurrency: result.config.concurrency ?? DEFAULT_CONFIG.concurrency,
            delay: result.config.delay ?? DEFAULT_CONFIG.delay,
            darkMode: result.config.darkMode ?? DEFAULT_CONFIG.darkMode,
            notificationsEnabled: result.config.notificationsEnabled ?? true,
            soundEnabled: result.config.soundEnabled ?? true,
            notificationTimeout: result.config.notificationTimeout ?? 5
          };
          
          setConfig(loadedConfig);
          
          // Aplicar tema escuro se necessário
          if (loadedConfig.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        }
      } catch (e) {
        console.error('Erro ao carregar configurações:', e);
      } finally {
        setIsInitialLoad(false);
      }
    }
    loadSavedConfig();
  }, []);

  // Salvar configurações (com debounce)
  useEffect(() => {
    // Não salvar no carregamento inicial
    if (isInitialLoad) return;

    setConfigSaving(true);
    const timeoutId = setTimeout(async () => {
      try {
        await window.electronAPI.saveConfig(config);
        
        // Se for atualização de notificação, chamar API específica
        if (window.electronAPI.updateNotificationSettings) {
          await window.electronAPI.updateNotificationSettings({
            notificationsEnabled: config.notificationsEnabled,
            soundEnabled: config.soundEnabled,
            notificationTimeout: config.notificationTimeout
          });
        }
        
        console.log('✅ Configurações salvas:', config);
      } catch (e) {
        console.error('❌ Erro ao salvar configurações:', e);
      } finally {
        setConfigSaving(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [config, isInitialLoad]);

  // Aplicar tema escuro no DOM
  useEffect(() => {
    if (config.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [config.darkMode]);

  // Atualizar configurações
  const updateConfig = useCallback((updates) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // Validar concurrency
      if (updates.concurrency !== undefined) {
        newConfig.concurrency = Math.max(1, Math.min(12, updates.concurrency));
      }
      
      // Validar delay
      if (updates.delay !== undefined) {
        newConfig.delay = Math.max(0, Math.min(2000, updates.delay));
      }
      
      // Validar notificationTimeout
      if (updates.notificationTimeout !== undefined) {
        newConfig.notificationTimeout = Math.max(3, Math.min(15, updates.notificationTimeout));
      }
      
      return newConfig;
    });
  }, []);

  return { config, updateConfig, configSaving };
}