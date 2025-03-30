#!/usr/bin/env python3
"""
Script principal para executar toda a estratégia de teste e otimização
Este script coordena os testes simulados e os testes de integração real
"""

import os
import sys
import time
import json
import logging
import argparse
import subprocess
from datetime import datetime, timedelta

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("main_test_process.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("test_coordinator")

def parse_arguments():
    """Parse argumentos da linha de comando"""
    parser = argparse.ArgumentParser(description="Executor da estratégia de teste e otimização do sistema")
    
    parser.add_argument(
        "--mode",
        choices=["full", "demo", "simulation", "integration"],
        default="demo",
        help="Modo de execução: 'full' para teste completo, 'demo' para uma versão reduzida, "
             "'simulation' apenas para testes simulados, 'integration' apenas para testes de integração"
    )
    
    parser.add_argument(
        "--module-tests",
        type=int,
        default=20,
        help="Número de execuções por módulo (padrão: 20, recomendado para produção: 1000)"
    )
    
    parser.add_argument(
        "--system-tests",
        type=int,
        default=50,
        help="Número de execuções do sistema (padrão: 50, recomendado para produção: 100000)"
    )
    
    parser.add_argument(
        "--api-tests",
        type=int,
        default=5,
        help="Número de testes por endpoint de API (padrão: 5, recomendado para produção: 20-100)"
    )
    
    parser.add_argument(
        "--output-dir",
        type=str,
        default="./test_results",
        help="Diretório para salvar os resultados dos testes"
    )
    
    return parser.parse_args()

def setup_output_directory(output_dir):
    """Configura o diretório de saída para os resultados dos testes"""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        logger.info(f"Criado diretório para resultados: {output_dir}")
    
    # Criar um subdiretório com data/hora para esta execução
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = os.path.join(output_dir, f"run_{timestamp}")
    os.makedirs(run_dir)
    
    return run_dir

def run_simulation_tests(args, run_dir):
    """Executa testes simulados do sistema"""
    logger.info("=== INICIANDO TESTES SIMULADOS ===")
    
    # Caminho para o script de teste simulado
    sim_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "system_tester.py")
    
    # Configuração de variáveis de ambiente para o teste
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env["TEST_MODULE_ITERATIONS"] = str(args.module_tests)
    env["TEST_SYSTEM_ITERATIONS"] = str(args.system_tests)
    
    # Comando para executar o script
    cmd = [sys.executable, sim_script]
    
    try:
        # Iniciar o processo de teste simulado
        start_time = datetime.now()
        logger.info(f"Iniciando testes simulados às {start_time.strftime('%H:%M:%S')}")
        
        # Executar o script como um processo separado e capturar sua saída
        process = subprocess.Popen(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        # Copiar logs do processo para nosso arquivo de log
        simulation_log_path = os.path.join(run_dir, "simulation_tests.log")
        with open(simulation_log_path, "w") as log_file:
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    logger.info(output.strip())
                    log_file.write(output)
                    log_file.flush()
        
        # Obter código de saída do processo
        return_code = process.wait()
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Verificar resultado
        if return_code == 0:
            logger.info(f"Testes simulados concluídos com sucesso em {duration}")
            
            # Copiar arquivo de resultados para o diretório de saída
            if os.path.exists("test_statistics.json"):
                import shutil
                shutil.copy2(
                    "test_statistics.json", 
                    os.path.join(run_dir, "simulation_results.json")
                )
            
            return True
        else:
            logger.error(f"Testes simulados falharam com código {return_code}")
            return False
            
    except Exception as e:
        logger.error(f"Erro ao executar testes simulados: {str(e)}")
        return False

def run_integration_tests(args, run_dir):
    """Executa testes de integração com a API real"""
    logger.info("=== INICIANDO TESTES DE INTEGRAÇÃO ===")
    
    # Caminho para o script de teste de integração
    int_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_runner.py")
    
    # Configuração de variáveis de ambiente para o teste
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env["API_TEST_ATTEMPTS"] = str(args.api_tests)
    
    # Comando para executar o script
    cmd = [sys.executable, int_script]
    
    try:
        # Iniciar o processo de teste de integração
        start_time = datetime.now()
        logger.info(f"Iniciando testes de integração às {start_time.strftime('%H:%M:%S')}")
        
        # Executar o script como um processo separado e capturar sua saída
        process = subprocess.Popen(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        # Copiar logs do processo para nosso arquivo de log
        integration_log_path = os.path.join(run_dir, "integration_tests.log")
        with open(integration_log_path, "w") as log_file:
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    logger.info(output.strip())
                    log_file.write(output)
                    log_file.flush()
        
        # Obter código de saída do processo
        return_code = process.wait()
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Verificar resultado
        if return_code == 0:
            logger.info(f"Testes de integração concluídos com sucesso em {duration}")
            
            # Copiar arquivo de resultados para o diretório de saída
            if os.path.exists("integration_test_results.json"):
                import shutil
                shutil.copy2(
                    "integration_test_results.json", 
                    os.path.join(run_dir, "integration_results.json")
                )
            
            return True
        else:
            logger.error(f"Testes de integração falharam com código {return_code}")
            return False
            
    except Exception as e:
        logger.error(f"Erro ao executar testes de integração: {str(e)}")
        return False

def analyze_results(run_dir):
    """Analisa os resultados dos testes e gera um relatório"""
    logger.info("=== ANALISANDO RESULTADOS DOS TESTES ===")
    
    results = {
        "timestamp": datetime.now().isoformat(),
        "simulation_success": False,
        "integration_success": False,
        "simulation_data": {},
        "integration_data": {},
        "overall_health": "unknown",
        "recommendations": []
    }
    
    # Verificar resultados da simulação
    sim_results_path = os.path.join(run_dir, "simulation_results.json")
    if os.path.exists(sim_results_path):
        try:
            with open(sim_results_path, "r") as f:
                sim_data = json.load(f)
                results["simulation_data"] = sim_data
                results["simulation_success"] = True
                logger.info("Resultados da simulação carregados com sucesso")
        except Exception as e:
            logger.error(f"Erro ao carregar resultados da simulação: {str(e)}")
    else:
        logger.warning("Arquivo de resultados da simulação não encontrado")
    
    # Verificar resultados da integração
    int_results_path = os.path.join(run_dir, "integration_results.json")
    if os.path.exists(int_results_path):
        try:
            with open(int_results_path, "r") as f:
                int_data = json.load(f)
                results["integration_data"] = int_data
                results["integration_success"] = True
                logger.info("Resultados da integração carregados com sucesso")
        except Exception as e:
            logger.error(f"Erro ao carregar resultados da integração: {str(e)}")
    else:
        logger.warning("Arquivo de resultados da integração não encontrado")
    
    # Determinar saúde geral do sistema
    if results["simulation_success"] and results["integration_success"]:
        # Verificar taxa de sucesso da integração
        if "overall_success_rate" in results["integration_data"]:
            success_rate = float(results["integration_data"]["overall_success_rate"].rstrip("%"))
            
            if success_rate >= 95:
                results["overall_health"] = "excellent"
                results["recommendations"].append("O sistema está funcionando perfeitamente.")
            elif success_rate >= 80:
                results["overall_health"] = "good"
                results["recommendations"].append("O sistema está saudável, mas há espaço para melhorias.")
            elif success_rate >= 60:
                results["overall_health"] = "fair"
                results["recommendations"].append("O sistema está funcional, mas precisa de atenção em alguns módulos.")
            else:
                results["overall_health"] = "poor"
                results["recommendations"].append("O sistema precisa de melhorias significativas.")
        else:
            results["overall_health"] = "unknown"
            results["recommendations"].append("Não foi possível determinar a saúde geral do sistema.")
    elif not results["simulation_success"] and not results["integration_success"]:
        results["overall_health"] = "critical"
        results["recommendations"].append("Ambos os testes falharam. Sistema em estado crítico.")
    elif not results["simulation_success"]:
        results["overall_health"] = "unstable"
        results["recommendations"].append("Os testes simulados falharam. O sistema pode estar instável.")
    elif not results["integration_success"]:
        results["overall_health"] = "degraded"
        results["recommendations"].append("Os testes de integração falharam. O sistema está em estado degradado.")
    
    # Analisar problemas específicos e fazer recomendações
    if results["integration_success"]:
        # Encontrar endpoints com problemas
        problem_endpoints = []
        
        for module, module_data in results["integration_data"].get("modules_tested", {}).items():
            for endpoint, endpoint_data in module_data.get("endpoints", {}).items():
                if endpoint_data.get("failures", 0) > 0:
                    success_rate = endpoint_data.get("successes", 0) / endpoint_data.get("attempts", 1) * 100
                    if success_rate < 80:
                        problem_endpoints.append({
                            "module": module,
                            "endpoint": endpoint,
                            "success_rate": f"{success_rate:.2f}%"
                        })
        
        if problem_endpoints:
            results["problem_endpoints"] = problem_endpoints
            results["recommendations"].append(
                f"Atenção necessária em {len(problem_endpoints)} endpoints com taxa de sucesso menor que 80%."
            )
    
    # Salvar o relatório completo
    report_path = os.path.join(run_dir, "analysis_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # Criar um relatório resumido em texto
    summary_path = os.path.join(run_dir, "summary_report.txt")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("=== RELATÓRIO DE TESTES DO SISTEMA ===\n")
        f.write(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write(f"Estado Geral: {results['overall_health'].upper()}\n\n")
        
        f.write("Recomendações:\n")
        for rec in results["recommendations"]:
            f.write(f"- {rec}\n")
        
        f.write("\nResultados por Módulo:\n")
        if results["integration_success"] and "success_rate" in results["integration_data"]:
            for module, rate in results["integration_data"]["success_rate"].items():
                f.write(f"- {module}: {rate}\n")
        
        if "problem_endpoints" in results:
            f.write("\nEndpoints Problemáticos:\n")
            for endpoint in results["problem_endpoints"]:
                f.write(f"- {endpoint['module']}: {endpoint['endpoint']} ({endpoint['success_rate']})\n")
    
    logger.info(f"Análise concluída. Relatório salvo em {report_path}")
    logger.info(f"Resumo salvo em {summary_path}")
    
    # Mostrar resumo no console
    with open(summary_path, "r") as f:
        summary = f.read()
    
    logger.info("\n" + "=" * 50 + "\n" + summary + "\n" + "=" * 50)
    
    return results

def main():
    """Função principal para coordenar todos os testes"""
    # Analisar argumentos da linha de comando
    args = parse_arguments()
    
    # Configurar diretório de saída
    run_dir = setup_output_directory(args.output_dir)
    logger.info(f"Resultados serão salvos em: {run_dir}")
    
    # Iniciar cronômetro geral
    start_time = datetime.now()
    logger.info(f"Iniciando sequência de testes às {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Modo: {args.mode}")
    
    # Executar os testes conforme o modo selecionado
    sim_success = True
    int_success = True
    
    if args.mode in ["full", "demo", "simulation"]:
        sim_success = run_simulation_tests(args, run_dir)
    
    if args.mode in ["full", "demo", "integration"]:
        int_success = run_integration_tests(args, run_dir)
    
    # Analisar resultados
    results = analyze_results(run_dir)
    
    # Finalizar
    end_time = datetime.now()
    duration = end_time - start_time
    
    logger.info(f"Sequência de testes concluída em {duration}")
    logger.info(f"Estado geral do sistema: {results['overall_health'].upper()}")
    
    return 0 if sim_success and int_success else 1

if __name__ == "__main__":
    sys.exit(main())