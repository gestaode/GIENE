import time
import random
import os
import sys
import json
import logging
from datetime import datetime

# Configurando o logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("system_logs.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("system_main")

def rodar_sistema():
    """
    Função para simular a execução do seu código ou sistema.
    
    Ela simula a operação do sistema, com algumas falhas aleatórias para 
    demonstrar o mecanismo de detecção e correção de erros.
    
    Returns:
        tuple: (sucesso, mensagem_erro)
            - sucesso (bool): True se a execução foi bem-sucedida, False se houve erro
            - mensagem_erro (str): Descrição do erro se ocorreu, None caso contrário
    """
    # Módulos críticos do sistema
    modulos = [
        "content_generation", 
        "video_generation", 
        "text_to_speech", 
        "api_integration", 
        "social_media_posting",
        "fallback_mechanisms",
        "resilience_service"
    ]
    
    # Simulando tempo de execução
    time.sleep(0.1)
    
    # Chance de falha (5% de probabilidade geral)
    if random.random() < 0.05:
        # Selecionar um módulo aleatório que falhou
        modulo_com_falha = random.choice(modulos)
        
        # Tipos de erro por módulo
        erros_por_modulo = {
            "content_generation": ["API timeout", "Invalid response format", "Content policy violation"],
            "video_generation": ["FFmpeg error", "Video processing timeout", "Insufficient resources"],
            "text_to_speech": ["Unsupported language", "Audio generation failed", "API rate limit"],
            "api_integration": ["API connection refused", "Invalid credentials", "Rate limit exceeded"],
            "social_media_posting": ["Authentication failed", "Post rejected", "Media format invalid"],
            "fallback_mechanisms": ["No fallback available", "Fallback also failed", "Configuration error"],
            "resilience_service": ["Service unavailable", "Health check failed"]
        }
        
        # Selecionar um erro aleatório para o módulo que falhou
        tipo_erro = random.choice(erros_por_modulo.get(modulo_com_falha, ["Unknown error"]))
        mensagem_erro = f"{tipo_erro} em {modulo_com_falha}"
        
        logger.error(f"Erro detectado: {mensagem_erro}")
        return False, mensagem_erro
    
    # Simulando uma execução bem-sucedida
    logger.info("Sistema executado com sucesso")
    return True, None

def corrigir_erro(erro):
    """
    Tenta corrigir o erro detectado durante a execução.
    
    Args:
        erro (str): Mensagem de erro detectada.
        
    Returns:
        bool: True se o erro foi corrigido, False caso contrário.
    """
    if not erro:
        return True
    
    # Extrair o módulo e tipo de erro da mensagem
    partes = erro.split(" em ")
    if len(partes) != 2:
        logger.error(f"Formato de erro desconhecido: {erro}")
        return False
    
    tipo_erro, modulo = partes
    
    logger.info(f"Tentando corrigir erro '{tipo_erro}' no módulo '{modulo}'")
    
    # Simular o tempo de correção
    time.sleep(0.5)
    
    # Ações de correção por tipo de erro
    acoes_correcao = {
        "API timeout": "Aumentado timeout e implementado retry exponencial",
        "Invalid response format": "Adicionada validação e normalização de resposta",
        "Content policy violation": "Ajustado filtro de conteúdo com regras mais específicas",
        "FFmpeg error": "Atualizado parâmetros FFmpeg para compatibilidade",
        "Video processing timeout": "Otimizado processo de renderização com buffer",
        "Insufficient resources": "Implementado gerenciamento dinâmico de recursos",
        "Unsupported language": "Adicionado fallback para idioma não suportado",
        "Audio generation failed": "Implementado mecanismo alternativo de síntese",
        "API rate limit": "Adicionado controle de taxa com filas de prioridade",
        "API connection refused": "Implementado circuito aberto com reconexão gradual",
        "Invalid credentials": "Atualizado sistema de gerenciamento de tokens",
        "Rate limit exceeded": "Adicionado throttling adaptativo baseado em feedback",
        "Authentication failed": "Renovação automática de credenciais implementada",
        "Post rejected": "Adicionado pré-verificador de conformidade",
        "Media format invalid": "Implementado conversor automático de formato",
        "No fallback available": "Criado novo caminho de fallback para este cenário",
        "Fallback also failed": "Adicionado sistema de fallback em camadas",
        "Configuration error": "Correção de configuração e validação automática",
        "Service unavailable": "Implementado modo degradado autônomo",
        "Health check failed": "Ajustado algoritmo de detecção de saúde do serviço"
    }
    
    # Verificar se temos uma ação registrada para este tipo de erro
    if tipo_erro in acoes_correcao:
        acao = acoes_correcao[tipo_erro]
        logger.info(f"Aplicando correção: {acao}")
        
        # 95% de chance de sucesso na correção
        if random.random() < 0.95:
            logger.info(f"Correção aplicada com sucesso: {acao}")
            return True
        else:
            logger.error(f"Falha ao aplicar correção: {acao}")
            return False
    else:
        logger.warning(f"Nenhuma ação definida para o erro '{tipo_erro}'")
        # 50% de chance de sucesso para erros desconhecidos
        return random.random() < 0.5

def realizar_varredura(repeticoes=1000):
    """
    Executa o sistema repetidamente para testar sua estabilidade.
    
    Args:
        repeticoes (int): Número de vezes que o sistema será executado.
        
    Returns:
        dict: Estatísticas da varredura.
    """
    logger.info(f"Iniciando varredura do sistema ({repeticoes} repetições)")
    
    estatisticas = {
        "inicio": datetime.now().isoformat(),
        "total": repeticoes,
        "sucesso": 0,
        "falhas": 0,
        "tipos_erro": {},
        "correcoes": 0,
        "falhas_correcao": 0
    }
    
    execucoes_consecutivas = 0
    
    while execucoes_consecutivas < repeticoes:
        logger.info(f"Execução {execucoes_consecutivas + 1}/{repeticoes}")
        
        # Executar o sistema
        sucesso, erro = rodar_sistema()
        
        if sucesso:
            execucoes_consecutivas += 1
            estatisticas["sucesso"] += 1
        else:
            execucoes_consecutivas = 0  # Reinicia a contagem
            estatisticas["falhas"] += 1
            
            # Registrar o tipo de erro
            if erro in estatisticas["tipos_erro"]:
                estatisticas["tipos_erro"][erro] += 1
            else:
                estatisticas["tipos_erro"][erro] = 1
            
            # Tentar corrigir o erro
            corrigido = corrigir_erro(erro)
            
            if corrigido:
                estatisticas["correcoes"] += 1
                logger.info("Erro corrigido, continuando varredura")
            else:
                estatisticas["falhas_correcao"] += 1
                logger.error("Não foi possível corrigir o erro, reiniciando contagem")
    
    estatisticas["fim"] = datetime.now().isoformat()
    logger.info(f"Varredura concluída: {estatisticas['sucesso']} sucessos, {estatisticas['falhas']} falhas")
    
    # Salvar estatísticas em arquivo JSON
    with open("varredura_estatisticas.json", "w", encoding="utf-8") as f:
        json.dump(estatisticas, f, ensure_ascii=False, indent=2)
    
    return estatisticas

if __name__ == "__main__":
    logger.info("=== INICIANDO SISTEMA ===")
    
    # Verificar argumentos da linha de comando
    if len(sys.argv) > 1 and sys.argv[1] == "--varredura":
        repeticoes = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
        realizar_varredura(repeticoes)
    else:
        # Executar o sistema uma vez
        sucesso, erro = rodar_sistema()
        if not sucesso:
            corrigido = corrigir_erro(erro)
            if corrigido:
                logger.info("Erro corrigido, executando novamente")
                sucesso, erro = rodar_sistema()
                
        if sucesso:
            logger.info("Sistema finalizado com sucesso")
        else:
            logger.error(f"Sistema finalizado com erro: {erro}")
    
    logger.info("=== SISTEMA FINALIZADO ===")