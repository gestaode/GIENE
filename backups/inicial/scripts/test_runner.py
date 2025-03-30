#!/usr/bin/env python3
"""
Script para executar testes de sistema em serviços reais
Este script utiliza o sistema de testes automatizados para verificar
o funcionamento real dos módulos do aplicativo
"""

import os
import sys
import logging
import json
import time
import requests
from datetime import datetime

# Adiciona o diretório pai ao caminho para importar outros módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("integration_test_logs.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("integration_tester")

# URL base da API (assumindo que o servidor está rodando localmente)
API_BASE_URL = "http://localhost:3000/api"

# Define os módulos principais do sistema que serão testados
MODULES = {
    "content_generation": {
        "endpoints": [
            "/content/generate-script",
            "/content/trending-topics"
        ],
        "test_data": {
            "/content/generate-script": {
                "theme": "marketing digital",
                "targetAudience": "empreendedores",
                "duration": 60,
                "tone": "professional"
            },
            "/content/trending-topics": {
                "theme": "negócios online",
                "count": 5
            }
        }
    },
    "api_integration": {
        "endpoints": [
            "/settings",
            "/settings/services/status"
        ],
        "test_data": {
            "/settings": {
                "method": "GET"
            },
            "/settings/services/status": {
                "method": "GET"
            }
        }
    },
    "video_generation": {
        "endpoints": [
            "/video/create-advanced",
            "/videos"
        ],
        "test_data": {
            "/video/create-advanced": {
                "title": "Teste Automatizado",
                "options": {
                    "resolution": "720p"
                }
            },
            "/videos": {
                "method": "GET"
            }
        }
    },
    "resilience_service": {
        "endpoints": [
            "/health"
        ],
        "test_data": {
            "/health": {
                "method": "GET"
            }
        }
    }
}

class IntegrationTester:
    def __init__(self):
        self.results = {
            "start_time": datetime.now().isoformat(),
            "modules_tested": {},
            "success_rate": {},
            "failed_tests": []
        }
    
    def save_results(self):
        """Salva os resultados em um arquivo JSON"""
        with open("integration_test_results.json", "w", encoding="utf-8") as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        logger.info("Resultados salvos com sucesso.")
    
    def test_endpoint(self, module, endpoint, data):
        """Testa um endpoint específico da API"""
        url = f"{API_BASE_URL}{endpoint}"
        method = data.get("method", "POST")
        
        logger.info(f"Testando {method} {url}")
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, timeout=30)
            else:
                # Remove o campo 'method' antes de enviar
                payload = {k: v for k, v in data.items() if k != "method"}
                response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code >= 200 and response.status_code < 300:
                logger.info(f"Teste bem-sucedido: {response.status_code}")
                return True, None
            else:
                error_msg = f"Código de resposta inesperado: {response.status_code}"
                logger.error(f"Falha no teste: {error_msg}")
                return False, error_msg
                
        except requests.RequestException as e:
            logger.error(f"Erro na requisição: {str(e)}")
            return False, str(e)
        except Exception as e:
            logger.error(f"Erro inesperado: {str(e)}")
            return False, str(e)
    
    def test_module(self, module_name, module_info, attempts=10):
        """Testa todos os endpoints de um módulo"""
        if module_name not in self.results["modules_tested"]:
            self.results["modules_tested"][module_name] = {
                "total_tests": 0,
                "successful_tests": 0,
                "endpoints": {}
            }
        
        for endpoint in module_info["endpoints"]:
            test_data = module_info["test_data"].get(endpoint, {})
            
            logger.info(f"Iniciando teste do endpoint {endpoint} no módulo {module_name}")
            
            # Inicializa estatísticas para este endpoint
            if endpoint not in self.results["modules_tested"][module_name]["endpoints"]:
                self.results["modules_tested"][module_name]["endpoints"][endpoint] = {
                    "attempts": 0,
                    "successes": 0,
                    "failures": 0
                }
            
            successes = 0
            
            for attempt in range(1, attempts + 1):
                self.results["modules_tested"][module_name]["total_tests"] += 1
                self.results["modules_tested"][module_name]["endpoints"][endpoint]["attempts"] += 1
                
                logger.info(f"Tentativa {attempt}/{attempts} para {endpoint}")
                
                success, error = self.test_endpoint(module_name, endpoint, test_data)
                
                if success:
                    successes += 1
                    self.results["modules_tested"][module_name]["successful_tests"] += 1
                    self.results["modules_tested"][module_name]["endpoints"][endpoint]["successes"] += 1
                else:
                    self.results["modules_tested"][module_name]["endpoints"][endpoint]["failures"] += 1
                    self.results["failed_tests"].append({
                        "module": module_name,
                        "endpoint": endpoint,
                        "timestamp": datetime.now().isoformat(),
                        "error": error
                    })
                
                # Curto intervalo entre requisições para não sobrecarregar
                time.sleep(0.5)
            
            # Calcula a taxa de sucesso para este endpoint
            success_rate = (successes / attempts) * 100
            logger.info(f"Taxa de sucesso para {endpoint}: {success_rate:.2f}%")
            
            self.save_results()
    
    def run_all_tests(self, test_attempts=10):
        """Executa testes em todos os módulos"""
        logger.info(f"Iniciando testes de integração com {test_attempts} tentativas por endpoint")
        
        for module_name, module_info in MODULES.items():
            logger.info(f"Testando módulo: {module_name}")
            self.test_module(module_name, module_info, test_attempts)
        
        # Calcula taxas de sucesso gerais
        for module_name, module_data in self.results["modules_tested"].items():
            if module_data["total_tests"] > 0:
                success_rate = (module_data["successful_tests"] / module_data["total_tests"]) * 100
                self.results["success_rate"][module_name] = f"{success_rate:.2f}%"
        
        # Finaliza o teste
        self.results["end_time"] = datetime.now().isoformat()
        self.results["total_tests"] = sum(m["total_tests"] for m in self.results["modules_tested"].values())
        self.results["total_successful_tests"] = sum(m["successful_tests"] for m in self.results["modules_tested"].values())
        
        if self.results["total_tests"] > 0:
            overall_rate = (self.results["total_successful_tests"] / self.results["total_tests"]) * 100
            self.results["overall_success_rate"] = f"{overall_rate:.2f}%"
        
        self.save_results()
        
        # Log resultados
        logger.info("Testes de integração concluídos")
        logger.info(f"Taxa geral de sucesso: {self.results.get('overall_success_rate', '0%')}")
        for module, rate in self.results["success_rate"].items():
            logger.info(f"Módulo {module}: {rate}")
        
        return self.results

def main():
    """Função principal para executar os testes de integração"""
    logger.info("=== INICIANDO TESTES DE INTEGRAÇÃO ===")
    
    tester = IntegrationTester()
    
    # Usar um número menor de tentativas para demonstração
    # Em produção, você pode aumentar este número
    results = tester.run_all_tests(test_attempts=5)
    
    logger.info("=== TESTES DE INTEGRAÇÃO CONCLUÍDOS ===")
    logger.info(f"Resultados salvos em 'integration_test_results.json'")

if __name__ == "__main__":
    main()