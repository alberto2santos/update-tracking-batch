# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.3] - 2026-01-05

### Corrigido
- **Scroll automático da página:** Removido comportamento indesejado que rolava a página inteira até a seção de logs automaticamente
- **Scroll inteligente nos logs:** Implementado scroll apenas dentro do container de logs, respeitando interação do usuário
- **Handler de erro global:** Melhorado tratamento de `unhandledRejection` para evitar `[object Object]` em logs
- **Limpeza de arquivos temporários:** Aprimorado sistema de remoção de arquivos temp após processamento

### Melhorado
- **Performance do processamento de logs:** Otimização na renderização e filtragem de logs com `useMemo`
- **Deduplicação de logs:** Implementado sistema para evitar logs duplicados consecutivos
- **Mensagens simplificadas:** Logs mais claros e amigáveis, ocultando detalhes técnicos desnecessários
- **Sistema de explicações:** Adicionado contexto amigável para erros comuns (rate limit, timeout, etc.)

### Adicionado
- **Contador de logs por tipo:** Visualização em tempo real de sucessos, pulados e erros nos filtros
- **Busca em logs:** Campo de pesquisa para filtrar logs por texto
- **Backup automático do histórico:** Backup diário do histórico de execuções (mantém últimos 30)
- **Função de formatação de erros:** Melhoria na serialização de objetos de erro para logs

---

## [1.0.2] - 2024-12-30

### Corrigido
- **Erro ENOENT ao spawnar processo:** Corrigido uso de `fork()` com `ELECTRON_RUN_AS_NODE=1`
- **PID não capturado:** Processo child agora captura PID corretamente
- **Funcionamento em app empacotado:** Processo child funciona tanto em dev quanto em produção
- **Limpeza de arquivos temporários:** Implementado sistema automático de limpeza

### Melhorado
- **Toggle de tema:** Design deslizante integrado e consistente
- **CSS otimizado:** Sistema de design unificado com variáveis CSS
- **Cores consistentes:** Paleta de cores padronizada em todo o aplicativo
- **Arquitetura modular:** Código reorganizado em componentes separados e reutilizáveis

### Adicionado
- **Custom hooks:** Criados hooks `useConfig`, `useKeyboardShortcuts`, `useElectronAPI`
- **Scripts de build por plataforma:** Comandos específicos para Windows, macOS e Linux
- **Suporte Linux RPM:** Adicionado formato RPM além de deb e AppImage
- **Desktop entry para Linux:** Arquivo .desktop para integração com menu de aplicativos
- **Compressão máxima:** Otimização do tamanho dos builds
- **Instalador em português:** Interface de instalação traduzida para Windows
- **Ícones otimizados:** Ícones em múltiplos formatos e tamanhos para todas as plataformas

---

## [1.0.1] - 2024-12-30

### Corrigido
- **Erro ENOENT com arquivo temporário:** Corrigido caminho de arquivos temporários
- **Validação de paths no Windows:** Tratamento adequado de barras invertidas
- **Permissões de escrita:** Validação de permissões antes de criar arquivos

### Melhorado
- **Limpeza automática:** Arquivos temporários são removidos após 5 minutos
- **Logs de debug:** Adicionado logging detalhado para troubleshooting

---

## [1.0.0] - 2024-12-30

### Lançamento Inicial

#### Interface
- **Dashboard React completo:** Interface moderna e responsiva
- **Sistema de temas:** Modo claro e escuro com toggle
- **Drag & drop:** Upload de arquivos por arrastar e soltar
- **Entrada manual:** Adicionar códigos de rastreamento manualmente
- **Preview de arquivos:** Visualização prévia do conteúdo antes de processar

#### Processamento
- **Processamento em lote:** Múltiplos pedidos simultaneamente
- **Controle de concorrência:** Limite configurável de requisições paralelas (1-12)
- **Delay configurável:** Intervalo entre requisições (0-2000ms)
- **Retry automático:** 3 tentativas com backoff exponencial
- **Dry-run mode:** Simulação sem alterações reais na VTEX
- **Validação de transportadora:** Apenas Bisturi Express (carrierId 1924)
- **Marcação automática de entrega:** Atualiza status quando rastreio está "ENTREGUE"

#### Logs e Monitoramento
- **Logs em tempo real:** Acompanhamento visual do processamento
- **Filtros por tipo:** Todos, Sucesso, Pulados, Erros
- **Estatísticas detalhadas:** Total, sucesso, erros, tempo médio
- **Barra de progresso:** Percentual e ETA (tempo estimado)
- **Exportação de logs:** Salvar logs em arquivo TXT
- **Deduplicação:** Sistema para evitar logs repetidos

#### Histórico
- **Registro de execuções:** Salva até 50 execuções mais recentes
- **Exportação CSV:** Exportar histórico completo
- **Busca e filtros:** Localizar execuções específicas
- **Estatísticas agregadas:** Taxa de sucesso, duração média, etc.
- **Exclusão individual:** Remover itens específicos do histórico
- **Limpeza completa:** Limpar todo o histórico (com backup automático)

#### Configurações
- **Persistência local:** Configurações salvas automaticamente (electron-store)
- **Auto-save:** Salva preferências instantaneamente
- **Notificações configuráveis:** Habilitar/desabilitar notificações desktop
- **Sons configuráveis:** Controle de feedback sonoro

#### Atalhos de Teclado
- `Ctrl+O` - Abrir arquivo
- `Ctrl+Enter` - Iniciar processamento
- `Ctrl+K` - Limpar logs
- `Ctrl+L` - Limpar lista
- `Ctrl+D` - Alternar tema
- `Ctrl+H` - Ver histórico
- `Ctrl+E` - Exportar logs
- `Ctrl+,` - Configurações
- `Esc` - Parar processamento

#### Menu
- **Menu em português:** Interface completamente traduzida
- **Atalhos integrados:** Todas as ações principais com atalhos
- **Menu contextual:** Opções rápidas de acesso
- **Sobre/Atualizações:** Informações da versão e verificação de updates

#### Integrações
- **VTEX OMS API:** Gestão de pedidos e invoices
- **Bisturi Express API:** Dados de rastreamento e status
- **CSV/TXT parsing:** Suporte para múltiplos formatos
- **Electron Store:** Persistência de dados local

#### Multiplataforma
- **Windows:** Instalador EXE e versão portátil
- **macOS:** DMG com suporte para Intel e Apple Silicon
- **Linux:** AppImage, deb e RPM

#### Segurança
- **Context isolation:** Separação de contextos Electron
- **CSP (Content Security Policy):** Política de segurança de conteúdo
- **Validação de entrada:** Sanitização de dados do usuário
- **Credenciais seguras:** Armazenamento via variáveis de ambiente (.env)
- **HTTPS obrigatório:** Todas as requisições via protocolo seguro

#### Performance
- **Virtualização de logs:** Renderização eficiente de grandes volumes
- **Debounce em buscas:** Otimização de filtros em tempo real
- **Lazy loading:** Carregamento sob demanda de componentes
- **Memoization:** Cache de computações pesadas

---

## [Unreleased]

### Planejado para v1.3.0
- Suporte a múltiplas transportadoras
- Agendamento de processamento
- Gráficos no histórico
- Exportação de relatórios em PDF
- Notificações desktop nativas aprimoradas
- Modo pausar/retomar processamento
- Filtros avançados no histórico (por data, status, arquivo)

### Planejado para v1.4.0
- Importar/exportar configurações
- Templates de processamento
- Logs persistentes opcionais
- Temas personalizados
- Multi-idioma (EN, ES)
- Modo offline (cache local)

### Planejado para v2.0.0
- API REST local
- Dashboard web complementar
- Multi-tenant (múltiplas contas VTEX)
- Webhooks para integração
- Modo batch avançado com priorização
- Auto-update automático
- Integração com outras plataformas de e-commerce

---

## Tipos de Mudanças

- **Adicionado:** para novas funcionalidades
- **Alterado:** para mudanças em funcionalidades existentes
- **Descontinuado:** para funcionalidades que serão removidas
- **Removido:** para funcionalidades removidas
- **Corrigido:** para correção de bugs
- **Segurança:** em caso de vulnerabilidades
- **Melhorado:** para otimizações e melhorias de UX/performance

---

## Versionamento Semântico

Este projeto usa [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis

---

## Links

- [Repositório](https://github.com/alberto2santos/update-tracking-batch)
- [Issues](https://github.com/alberto2santos/update-tracking-batch/issues)
- [Releases](https://github.com/alberto2santos/update-tracking-batch/releases)

---

**Mantenedor:** Alberto Luiz ([@alberto2santos](https://github.com/alberto2santos))  
**Última atualização:** 05 de Janeiro de 2026