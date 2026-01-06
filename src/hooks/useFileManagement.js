import { useState, useCallback } from 'react';
import { formatFileLabel } from '../utils/formatters';

export function useFileManagement({ running, pushLog, showToast, electronAPI }) {
  const [filePath, setFilePath] = useState('');
  const [fileMeta, setFileMeta] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [manualList, setManualList] = useState([]);
  const [loading, setLoading] = useState(false);

  const getTotalPedidos = useCallback(() => {
    const fromFile = fileMeta ? fileMeta.lineCount : 0;
    const fromManual = manualList.length;
    return fromFile + fromManual;
  }, [fileMeta, manualList]);

  // Validar e remover duplicatas
  const validateAndRemoveDuplicates = useCallback((items) => {
    const seen = new Set();
    const duplicates = [];
    const unique = [];

    items.forEach(item => {
      const id = item.trim().toUpperCase();
      
      if (seen.has(id)) {
        duplicates.push(item);
      } else {
        seen.add(id);
        unique.push(item);
      }
    });

    if (duplicates.length > 0) {
      showToast(
        `${duplicates.length} pedido(s) duplicado(s) removido(s)`,
        'warning'
      );
      pushLog(`⚠️ Duplicatas removidas: ${duplicates.length} item(ns)`);
    }

    return unique;
  }, [showToast, pushLog]);

  // Validação mais robusta de pedido
  const validateOrderId = useCallback((value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return { valid: false, error: 'Pedido vazio' };
    }

    // Aceitar formatos: 1234567, 1234567-01, v1234567
    const pattern = /^[vV]?\d+(-\d{2})?$/;
    
    if (!pattern.test(trimmed)) {
      return { 
        valid: false, 
        error: 'Formato inválido. Use: 1234567 ou 1234567-01' 
      };
    }

    return { valid: true, value: trimmed };
  }, []);

  // PROCESSAR MÚLTIPLOS PEDIDOS (para paste)
  const processBulkOrders = useCallback((text) => {
    // Dividir por quebras de linha, espaços, vírgulas ou tabs
    const items = text
      .split(/[\n\r\s,\t]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (items.length === 0) {
      return { success: false, message: 'Nenhum pedido válido encontrado' };
    }

    // Validar cada item
    const validItems = [];
    const invalidItems = [];

    items.forEach(item => {
      const validation = validateOrderId(item);
      if (validation.valid) {
        validItems.push(validation.value.toUpperCase());
      } else {
        invalidItems.push(item);
      }
    });

    if (validItems.length === 0) {
      return { 
        success: false, 
        message: `Nenhum pedido válido. ${invalidItems.length} inválido(s)` 
      };
    }

    // Remover duplicatas internas
    const uniqueItems = [...new Set(validItems)];

    // Remover itens que já estão na lista
    const existingSet = new Set(manualList.map(item => item.toUpperCase()));
    const newItems = uniqueItems.filter(item => !existingSet.has(item));

    if (newItems.length === 0) {
      return { 
        success: false, 
        message: 'Todos os pedidos já estão na lista' 
      };
    }

    // Adicionar à lista
    setManualList(prev => [...prev, ...newItems]);

    // Logs e mensagens
    const duplicatesRemoved = validItems.length - uniqueItems.length;
    const alreadyInList = uniqueItems.length - newItems.length;

    let message = `${newItems.length} pedido(s) adicionado(s)`;
    
    if (duplicatesRemoved > 0) {
      message += ` | ${duplicatesRemoved} duplicata(s) removida(s)`;
    }
    
    if (alreadyInList > 0) {
      message += ` | ${alreadyInList} já na lista`;
    }
    
    if (invalidItems.length > 0) {
      message += ` | ${invalidItems.length} inválido(s)`;
    }

    pushLog(`✅ ${message}`);
    
    return { 
      success: true, 
      message,
      added: newItems.length,
      duplicates: duplicatesRemoved,
      alreadyInList,
      invalid: invalidItems.length
    };
  }, [manualList, validateOrderId, pushLog]);

  const handleSelect = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      const p = await electronAPI.selectUpload();
      
      if (!p) {
        setLoading(false);
        return;
      }

      setFilePath(p);
      pushLog(`📂 Carregando arquivo: ${formatFileLabel(p)}...`);

      const preview = await electronAPI.readFilePreview(p);
      
      if (!preview || !preview.ok) {
        pushLog(`❌ Erro ao ler arquivo: ${preview?.error || 'Erro desconhecido'}`);
        setFilePath('');
        setFileMeta(null);
        showToast('Erro ao ler arquivo', 'error');
        setLoading(false);
        return;
      }

      setFileMeta(preview);
      pushLog(`✅ Arquivo selecionado: ${preview.name} (${preview.lineCount} registros)`);
      showToast(`Arquivo selecionado: ${preview.lineCount} registros`, 'success');
    } catch (error) {
      console.error('Erro ao selecionar arquivo:', error);
      pushLog(`❌ Erro inesperado: ${error.message}`);
      showToast('Erro ao selecionar arquivo', 'error');
      setFilePath('');
      setFileMeta(null);
    } finally {
      setLoading(false);
    }
  }, [electronAPI, pushLog, showToast, loading]);

  const handleFileDrop = useCallback(async (p) => {
    if (loading) return;

    if (!p) {
      setFilePath('');
      setFileMeta(null);
      return;
    }

    setLoading(true);

    try {
      setFilePath(p);
      pushLog(`📂 Carregando arquivo: ${formatFileLabel(p)}...`);

      const preview = await electronAPI.readFilePreview(p);

      if (!preview || !preview.ok) {
        pushLog(`❌ Erro ao ler arquivo: ${preview?.error || 'Erro desconhecido'}`);
        setFilePath('');
        setFileMeta(null);
        showToast('Erro ao ler arquivo', 'error');
        setLoading(false);
        return;
      }

      setFileMeta(preview);
      pushLog(`✅ Arquivo carregado: ${preview.name} (${preview.lineCount} registros)`);
      showToast(`Arquivo carregado: ${preview.lineCount} registros`, 'success');
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      pushLog(`❌ Erro inesperado: ${error.message}`);
      showToast('Erro ao processar arquivo', 'error');
      setFilePath('');
      setFileMeta(null);
    } finally {
      setLoading(false);
    }
  }, [electronAPI, pushLog, showToast, loading]);

  // HANDLER PARA PASTE - CORRIGIDO
  const handleManualPaste = useCallback((e) => {
    const pastedText = e.clipboardData.getData('text');
    
    if (!pastedText || !pastedText.trim()) {
      return; // Deixa o comportamento padrão
    }

    // Só interceptar se tiver múltiplas linhas
    if (pastedText.includes('\n') || pastedText.includes('\r')) {
      e.preventDefault(); // Só previne se for múltiplas linhas
      
      const result = processBulkOrders(pastedText);
      
      if (result.success) {
        showToast(result.message, 'success');
        setManualInput('');
      } else {
        showToast(result.message, 'error');
      }
    }
    // Se não tiver quebra de linha, deixa o comportamento padrão (cola normalmente)
  }, [processBulkOrders, showToast]);

  const handleManualKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = manualInput.trim();

      if (!v) {
        setManualInput('');
        return;
      }

      // Validação mais robusta
      const validation = validateOrderId(v);

      if (!validation.valid) {
        pushLog(`❌ Pedido inválido: "${v}" - ${validation.error}`);
        showToast(`Pedido inválido: ${validation.error}`, 'error');
        return;
      }

      const normalizedValue = validation.value.toUpperCase();

      // Verificar duplicata (case-insensitive)
      const isDuplicate = manualList.some(
        item => item.toUpperCase() === normalizedValue
      );

      if (isDuplicate) {
        pushLog(`ℹ️ Pedido já na lista: ${normalizedValue}`);
        showToast(`Pedido ${normalizedValue} já está na lista`, 'warning');
        setManualInput('');
        return;
      }

      setManualList(prev => [...prev, normalizedValue]);
      pushLog(`✅ Pedido adicionado: ${normalizedValue}`);
      showToast(`Pedido ${normalizedValue} adicionado`, 'success');
      setManualInput('');
    }
  }, [manualInput, manualList, pushLog, showToast, validateOrderId]);

  const removeManualItem = useCallback((i) => {
    const removed = manualList[i];
    setManualList(prev => prev.filter((_, idx) => idx !== i));
    pushLog(`🗑️ Pedido removido: ${removed}`);
    showToast(`Pedido ${removed} removido`, 'info');
  }, [manualList, pushLog, showToast]);

  // Remover duplicatas da lista manual
  const removeDuplicatesFromManualList = useCallback(() => {
    if (manualList.length === 0) {
      showToast('Lista vazia', 'info');
      return;
    }

    const originalCount = manualList.length;
    const unique = validateAndRemoveDuplicates(manualList);
    const removedCount = originalCount - unique.length;

    if (removedCount === 0) {
      showToast('Nenhuma duplicata encontrada', 'info');
      pushLog('✅ Nenhuma duplicata encontrada na lista manual');
      return;
    }

    setManualList(unique);
    pushLog(`🧹 ${removedCount} duplicata(s) removida(s) da lista manual`);
    showToast(`${removedCount} duplicata(s) removida(s)`, 'success');
  }, [manualList, validateAndRemoveDuplicates, pushLog, showToast]);

  const handleClearAll = useCallback(() => {
    if (manualList.length === 0 && !filePath) {
      pushLog('ℹ️ Nada para limpar.');
      showToast('Nada para limpar', 'info');
      return;
    }

    const total = getTotalPedidos();
    const confirmed = window.confirm(
      `🗑️ Limpar ${total} pedido${total > 1 ? 's' : ''}?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmed) {
      pushLog('↩️ Limpeza cancelada.');
      return;
    }

    setManualList([]);
    setFilePath('');
    setFileMeta(null);
    pushLog(`🧹 Lista limpa (${total} pedido${total > 1 ? 's' : ''} removido${total > 1 ? 's' : ''}).`);
    showToast('Lista limpa', 'success');
  }, [manualList, filePath, getTotalPedidos, pushLog, showToast]);

  return {
    filePath,
    fileMeta,
    manualInput,
    manualList,
    loading,
    handleSelect,
    handleFileDrop,
    handleManualKeyDown,
    handleManualPaste,
    removeManualItem,
    handleClearAll,
    removeDuplicatesFromManualList,
    setManualInput,
    getTotalPedidos
  };
}