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

def realizar_varredura(repeticoes=1000):
    execucoes_sucesso = 0
    execucoes_falha = 0
    tentativas = 0

    while execucoes_sucesso < repeticoes:
        print(f"Execução {tentativas+1}/{repeticoes}")
        tentativas += 1

        if rodar_sistema():
            execucoes_sucesso += 1
        else:
            execucoes_falha += 1
            execucoes_sucesso = 0  # Reinicia a contagem

        # Se houver mais de 100 falhas consecutivas, interrompe o processo
        if execucoes_falha > 100:
            print("Muitas falhas consecutivas. Ajuste o código e tente novamente.")
            break

        time.sleep(1)  # Evita sobrecarga

    if execucoes_sucesso == repeticoes:
        print(f"Parabéns! O sistema rodou {repeticoes} vezes sem erros!")
    else:
        print(f"Interrompido após {tentativas} tentativas. Falhas: {execucoes_falha}")

if __name__ == "__main__":
    realizar_varredura(1000)