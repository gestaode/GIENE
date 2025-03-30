
import time
import random

def rodar_sistema():
    try:
        print("Executando o sistema...")
        
        # Simula erro com 10% de chance
        if random.random() < 0.1:
            raise ValueError("Erro detectado na execução do sistema.")
            
        return True  # Execução bem-sucedida
        
    except Exception as e:
        print(f"Erro detectado: {e}")
        corrigir_erro(e)  # Chama a função para corrigir o erro
        return False

def corrigir_erro(erro):
    print(f"Tentando corrigir o erro: {erro}")
    time.sleep(1)  # Simula tempo de correção
    print("Correção aplicada")

def executar_com_resiliencia():
    max_tentativas = 100
    execucoes_sucesso = 0
    tentativas_consecutivas = 0
    
    while execucoes_sucesso < 1000 and tentativas_consecutivas < max_tentativas:
        if rodar_sistema():
            execucoes_sucesso += 1
            tentativas_consecutivas = 0
            print(f"Execução bem-sucedida: {execucoes_sucesso}/1000")
        else:
            tentativas_consecutivas += 1
            execucoes_sucesso = 0
            print(f"Reiniciando contagem. Tentativas consecutivas: {tentativas_consecutivas}")
        
        time.sleep(0.1)  # Pequeno delay entre execuções
    
    if execucoes_sucesso >= 1000:
        print("Sistema executado com sucesso 1000 vezes!")
    else:
        print("Muitas falhas consecutivas. Sistema interrompido.")

if __name__ == "__main__":
    executar_com_resiliencia()
