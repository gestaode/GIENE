# Sistema de Testes e Atualizações VideoGenie

O Sistema de Testes e Atualizações VideoGenie fornece uma solução completa para garantir a estabilidade, resiliência e manutenção do sistema. Este documento descreve os componentes do sistema e como utilizá-los.

## Componentes do Sistema

### 1. Scripts de Teste

- `main.py`: Script principal que implementa simulações de execução do sistema
- `scripts/system_tester.py`: Testes simulados para verificação dos módulos
- `scripts/test_runner.py`: Testes de integração para verificação da API
- `scripts/run_system_tests.py`: Coordenador de testes
- `run_tests.sh`: Script de inicialização para execução dos testes

### 2. Scripts de Visualização

- `scripts/visualizar_estatisticas.py`: Ferramenta de visualização de estatísticas

### 3. Scripts de Atualização

- `scripts/atualizar_sistema.py`: Ferramenta de atualização e backup do sistema

## Guia de Uso

### Executando Testes

#### Testes Simulados

Para executar testes simulados do sistema:

```bash
python3 main.py --varredura 25
```

Onde `25` é o número de execuções desejadas.

#### Testes de Integração

Para executar testes de integração:

```bash
./run_tests.sh -m integration -t 0 -a 10
```

#### Testes Completos

Para executar uma suíte completa de testes:

```bash
./run_tests.sh -m full -t 50 -a 10
```

### Visualizando Estatísticas

Para visualizar as estatísticas do sistema:

```bash
./scripts/visualizar_estatisticas.py
```

Opções disponíveis:

- `--varredura`: Exibe apenas estatísticas de varredura
- `--testes`: Exibe apenas estatísticas de testes automatizados
- `--todos`: Exibe todas as estatísticas (padrão)

### Gerenciando Atualizações

#### Criando Backups

Para criar um backup do sistema:

```bash
./scripts/atualizar_sistema.py backup --nome "meu_backup"
```

Se o nome não for especificado, um nome baseado em timestamp será usado.

#### Listando Backups

Para listar os backups disponíveis:

```bash
./scripts/atualizar_sistema.py listar
```

#### Restaurando Backups

Para restaurar um backup:

```bash
./scripts/atualizar_sistema.py restaurar "nome_do_backup"
```

Ou para escolher interativamente:

```bash
./scripts/atualizar_sistema.py restaurar
```

#### Verificando Dependências

Para verificar e instalar dependências:

```bash
./scripts/atualizar_sistema.py dependencias
```

#### Atualização Completa

Para executar um processo completo de atualização (backup, verificação de dependências e testes):

```bash
./scripts/atualizar_sistema.py atualizar
```

## Arquivos de Estatísticas

O sistema gera os seguintes arquivos de estatísticas:

- `test_statistics.json`: Estatísticas detalhadas dos testes automatizados
- `varredura_estatisticas.json`: Estatísticas das varreduras de sistema
- `system_logs.log`: Logs do sistema principal
- `test_results/run_[timestamp]/`: Diretório com resultados detalhados de cada execução

## Mecanismo de Correção Automática

O sistema implementa um mecanismo de correção automática que:

1. Detecta erros em tempo de execução
2. Identifica o tipo e módulo do erro
3. Aplica correções específicas para cada tipo de erro
4. Verifica se a correção foi bem-sucedida
5. Registra as ações e estatísticas

### Tipos de Erro Tratados

- `Content policy violation`: Violações de políticas de conteúdo nas requisições
- `Authentication failed`: Falhas de autenticação em integrações
- `Invalid response format`: Formatos de resposta inválidos
- `API connection refused`: Conexões de API recusadas
- `Rate limit exceeded`: Limites de requisição excedidos
- `FFmpeg error`: Erros do FFmpeg na geração de vídeo
- `Media format invalid`: Formatos de mídia inválidos

## Boas Práticas

1. **Execução Regular**: Execute testes regularmente para identificar problemas precocemente
2. **Backups Frequentes**: Crie backups antes de fazer modificações significativas
3. **Revisão de Estatísticas**: Analise regularmente as estatísticas para identificar tendências
4. **Ambiente de Desenvolvimento**: Use o sistema em um ambiente de desenvolvimento antes de aplicar em produção

## Considerações Técnicas

- O sistema foi desenvolvido para uso em ambiente Linux/Unix
- Requer Python 3.11 ou superior
- Necessita de Node.js 18 ou superior
- FFmpeg é necessário para testes relacionados a vídeo
- A execução pode ser demorada para testes completos em grande escala