#!/bin/bash
# Script para facilitar a execução dos testes do sistema

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Limpar a tela
clear

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}       SISTEMA DE TESTES AUTOMATIZADOS VideoGenie${NC}"
echo -e "${BLUE}====================================================${NC}"
echo

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Erro: Python 3 não está instalado. Por favor, instale-o primeiro.${NC}"
    exit 1
fi

# Verificar requisitos
echo -e "${YELLOW}Verificando requisitos...${NC}"
pip install requests &> /dev/null

# Checar argumentos
MODE="demo"
TESTS=50
API_TESTS=5

# Processar argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--mode)
      MODE="$2"
      shift 2
      ;;
    -t|--tests)
      TESTS="$2"
      shift 2
      ;;
    -a|--api-tests)
      API_TESTS="$2"
      shift 2
      ;;
    -h|--help)
      echo "Uso: ./run_tests.sh [opções]"
      echo "Opções:"
      echo "  -m, --mode MODE        Modo de execução: demo, full, simulation, integration (padrão: demo)"
      echo "  -t, --tests NUM        Número de testes simulados (padrão: 50)"
      echo "  -a, --api-tests NUM    Número de testes de API (padrão: 5)"
      echo "  -h, --help             Exibe esta ajuda"
      exit 0
      ;;
    *)
      echo -e "${RED}Opção desconhecida: $1${NC}"
      echo "Use ./run_tests.sh --help para ver as opções disponíveis"
      exit 1
      ;;
  esac
done

# Mostrar configuração
echo -e "${YELLOW}Configuração:${NC}"
echo -e "  Modo: ${GREEN}$MODE${NC}"
echo -e "  Testes simulados: ${GREEN}$TESTS${NC}"
echo -e "  Testes de API: ${GREEN}$API_TESTS${NC}"
echo

# Verificar se o servidor está rodando
echo -e "${YELLOW}Verificando servidor...${NC}"
if ! curl -s http://localhost:3000/api/health &> /dev/null; then
    echo -e "${RED}Aviso: O servidor parece não estar respondendo em http://localhost:3000${NC}"
    echo -e "${YELLOW}Os testes de integração podem falhar se o servidor não estiver rodando.${NC}"
    echo
    echo -e "${YELLOW}Continuando sem verificação do servidor para fins de demonstração...${NC}"
    echo
fi

# Criar diretório para resultados se não existir
mkdir -p test_results

# Executar os testes
echo -e "${YELLOW}Iniciando os testes...${NC}"
echo -e "${BLUE}====================================================${NC}"

python3 scripts/run_system_tests.py --mode "$MODE" --system-tests "$TESTS" --api-tests "$API_TESTS"
EXIT_CODE=$?

echo -e "${BLUE}====================================================${NC}"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Testes concluídos com sucesso!${NC}"
else
    echo -e "${RED}Ocorreram problemas durante os testes.${NC}"
fi

# Encontrar o diretório de resultados mais recente
LATEST_RESULTS=$(find test_results -type d -name "run_*" | sort -r | head -n1)

if [ -n "$LATEST_RESULTS" ]; then
    echo -e "${YELLOW}Resultados salvos em: ${GREEN}$LATEST_RESULTS${NC}"
    
    # Verificar se há um resumo
    SUMMARY="$LATEST_RESULTS/summary_report.txt"
    if [ -f "$SUMMARY" ]; then
        echo
        echo -e "${BLUE}Resumo dos resultados:${NC}"
        echo -e "${BLUE}---------------------------------------------------${NC}"
        cat "$SUMMARY"
        echo -e "${BLUE}---------------------------------------------------${NC}"
    fi
fi

echo
echo -e "${BLUE}Obrigado por utilizar o sistema de testes automatizados!${NC}"
echo