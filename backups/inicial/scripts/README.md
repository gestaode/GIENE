# Sistema de Testes Automatizados VideoGenie

Este sistema de testes foi projetado para verificar a robustez, estabilidade e correção automática do sistema VideoGenie. Ele implementa testes em dois níveis:

1. **Testes Simulados**: Simulam a execução de diferentes módulos do sistema e verificam se há erros, aplicando correções automaticamente quando possível.
2. **Testes de Integração**: Executam requisições reais para os endpoints da API e verificam se estão funcionando corretamente.

## Arquivos Principais

- `system_tester.py`: Implementa os testes simulados que verificam cada módulo do sistema individualmente.
- `test_runner.py`: Implementa testes de integração que verificam as APIs reais.
- `run_system_tests.py`: Coordena ambos os tipos de teste e gera relatórios de análise.
- `run_tests.sh`: Script shell para facilitar a execução dos testes.
- `main.py`: Script principal para simular o funcionamento do sistema.

## Como Executar os Testes

### Utilizando o Script Shell

Para executar os testes via script shell:

```bash
./run_tests.sh [opções]
```

**Opções disponíveis:**
- `-m, --mode MODE`: Modo de execução (demo, full, simulation, integration)
- `-t, --tests NUM`: Número de testes simulados
- `-a, --api-tests NUM`: Número de testes de API
- `-h, --help`: Mostra a ajuda

**Exemplos:**

```bash
# Executa uma versão reduzida de teste para demonstração
./run_tests.sh -m demo -t 10 -a 3

# Executa apenas testes simulados
./run_tests.sh -m simulation -t 50 -a 0

# Executa apenas testes de integração
./run_tests.sh -m integration -t 0 -a 10

# Executa testes completos (mais demorado)
./run_tests.sh -m full -t 1000 -a 20
```

### Utilizando os Scripts Python Diretamente

Para executar os scripts Python diretamente:

```bash
# Executa o teste simulado do sistema
python3 scripts/system_tester.py

# Executa testes de integração
python3 scripts/test_runner.py

# Executa o coordenador de testes
python3 scripts/run_system_tests.py --mode demo --system-tests 20 --api-tests 5

# Executa o script principal
python3 main.py

# Executa o script principal com varredura
python3 main.py --varredura 50
```

## Resultados dos Testes

Os resultados dos testes são salvos em:

- `test_results/run_[timestamp]/`: Diretório com os resultados da execução
  - `simulation_tests.log`: Log detalhado dos testes simulados
  - `integration_tests.log`: Log detalhado dos testes de integração
  - `simulation_results.json`: Resultados em formato JSON dos testes simulados
  - `integration_results.json`: Resultados em formato JSON dos testes de integração
  - `analysis_report.json`: Análise completa dos resultados
  - `summary_report.txt`: Resumo dos resultados

Adicionalmente, estes arquivos são gerados na raiz:
- `test_statistics.json`: Estatísticas gerais dos testes simulados
- `varredura_estatisticas.json`: Estatísticas da varredura do sistema
- `system_logs.log`: Logs do sistema principal

## Módulos Testados

O sistema verifica os seguintes módulos críticos:

- `content_generation`: Geração de conteúdo (scripts, posts, etc.)
- `video_generation`: Geração e processamento de vídeos
- `text_to_speech`: Conversão de texto para voz
- `api_integration`: Integração com APIs externas
- `social_media_posting`: Postagem em redes sociais
- `fallback_mechanisms`: Mecanismos de fallback
- `resilience_service`: Serviço de resiliência do sistema

## Mecanismo de Correção Automática

O sistema inclui um mecanismo de correção automática que:

1. Detecta erros durante a execução dos testes
2. Identifica o tipo de erro e o módulo afetado
3. Aplica correções específicas para cada tipo de erro
4. Verifica se a correção foi bem-sucedida
5. Registra todas as ações e estatísticas

## Integração com o Sistema Principal

O sistema de testes se integra ao sistema principal VideoGenie através dos seguintes mecanismos:

1. Testes de API que verificam endpoints reais
2. Monitoramento de logs e resposta a erros
3. Fornecimento de estatísticas em tempo real
4. Análise de tendências e padrões de erro

## Requisitos

- Python 3.11 ou superior
- Biblioteca `requests` para Python
- Servidor API VideoGenie em execução (para testes de integração)