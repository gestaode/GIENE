#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import json
import time
import shutil
import datetime
import subprocess
import argparse

def criar_backup(nome=None):
    """Cria um backup do sistema atual."""
    if nome is None:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        nome = f"backup_{timestamp}"
    
    diretorio_backup = os.path.join("backups", nome)
    
    # Criar o diretório de backup se não existir
    os.makedirs("backups", exist_ok=True)
    os.makedirs(diretorio_backup, exist_ok=True)
    
    # Lista de diretórios para fazer backup
    diretorios = [
        "server", 
        "client", 
        "shared",
        "scripts",
        "api-interfaces"
    ]
    
    # Lista de arquivos para fazer backup
    arquivos = [
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "main.py",
        "drizzle.config.ts"
    ]
    
    # Copiar diretórios
    for diretorio in diretorios:
        if os.path.exists(diretorio):
            destino = os.path.join(diretorio_backup, diretorio)
            shutil.copytree(diretorio, destino, dirs_exist_ok=True)
            print(f"Diretório copiado: {diretorio} -> {destino}")
    
    # Copiar arquivos
    for arquivo in arquivos:
        if os.path.exists(arquivo):
            destino = os.path.join(diretorio_backup, arquivo)
            # Criar diretórios intermediários se necessário
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            shutil.copy2(arquivo, destino)
            print(f"Arquivo copiado: {arquivo} -> {destino}")
    
    print(f"\nBackup criado com sucesso em: {diretorio_backup}")
    return diretorio_backup

def restaurar_backup(nome):
    """Restaura um backup do sistema."""
    diretorio_backup = os.path.join("backups", nome)
    
    if not os.path.exists(diretorio_backup):
        print(f"Erro: Backup '{nome}' não encontrado.")
        return False
    
    print(f"Restaurando backup de: {diretorio_backup}")
    
    # Lista de diretórios para restaurar
    diretorios = [
        "server", 
        "client", 
        "shared",
        "scripts",
        "api-interfaces"
    ]
    
    # Lista de arquivos para restaurar
    arquivos = [
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "main.py",
        "drizzle.config.ts"
    ]
    
    # Restaurar diretórios
    for diretorio in diretorios:
        origem = os.path.join(diretorio_backup, diretorio)
        if os.path.exists(origem):
            # Remover diretório existente
            if os.path.exists(diretorio):
                shutil.rmtree(diretorio)
            # Copiar do backup
            shutil.copytree(origem, diretorio)
            print(f"Diretório restaurado: {origem} -> {diretorio}")
    
    # Restaurar arquivos
    for arquivo in arquivos:
        origem = os.path.join(diretorio_backup, arquivo)
        if os.path.exists(origem):
            # Criar diretórios intermediários se necessário
            os.makedirs(os.path.dirname(arquivo), exist_ok=True)
            # Copiar do backup
            shutil.copy2(origem, arquivo)
            print(f"Arquivo restaurado: {origem} -> {arquivo}")
    
    print(f"\nBackup '{nome}' restaurado com sucesso!")
    return True

def listar_backups():
    """Lista todos os backups disponíveis."""
    if not os.path.exists("backups"):
        print("Nenhum backup encontrado.")
        return []
    
    backups = os.listdir("backups")
    backups = [b for b in backups if os.path.isdir(os.path.join("backups", b))]
    
    if not backups:
        print("Nenhum backup encontrado.")
        return []
    
    print("\nBackups disponíveis:")
    for i, backup in enumerate(backups):
        data_criacao = datetime.datetime.fromtimestamp(
            os.path.getctime(os.path.join("backups", backup))
        ).strftime("%d/%m/%Y %H:%M:%S")
        
        print(f"  {i+1}. {backup} (Criado em: {data_criacao})")
    
    return backups

def verificar_dependencias():
    """Verifica e instala as dependências necessárias para o sistema."""
    print("\nVerificando dependências do sistema...")
    
    # Verificar dependências Node.js
    try:
        resultado = subprocess.run(
            ["npm", "install"], 
            capture_output=True, 
            text=True
        )
        if resultado.returncode == 0:
            print("✓ Dependências Node.js instaladas com sucesso.")
        else:
            print(f"✗ Erro ao instalar dependências Node.js: {resultado.stderr}")
    except Exception as e:
        print(f"✗ Erro ao executar npm install: {str(e)}")
    
    # Verificar dependências Python
    try:
        python_packages = ["tabulate", "requests"]
        for package in python_packages:
            resultado = subprocess.run(
                [sys.executable, "-m", "pip", "install", package],
                capture_output=True,
                text=True
            )
            if resultado.returncode == 0:
                print(f"✓ Dependência Python '{package}' instalada com sucesso.")
            else:
                print(f"✗ Erro ao instalar dependência Python '{package}': {resultado.stderr}")
    except Exception as e:
        print(f"✗ Erro ao instalar dependências Python: {str(e)}")

def executar_testes():
    """Executa testes do sistema para verificar a integridade após a atualização."""
    print("\nExecutando testes do sistema...")
    
    try:
        # Executar testes automatizados
        resultado = subprocess.run(
            ["python3", "main.py", "--varredura", "5"],
            capture_output=True,
            text=True
        )
        
        if resultado.returncode == 0:
            print("✓ Testes automatizados executados com sucesso.")
            return True
        else:
            print(f"✗ Erro ao executar testes: {resultado.stderr}")
            return False
    except Exception as e:
        print(f"✗ Erro ao executar testes: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Ferramenta de atualização do sistema VideoGenie")
    
    subparsers = parser.add_subparsers(dest="comando", help="Comandos disponíveis")
    
    # Comando de backup
    backup_parser = subparsers.add_parser("backup", help="Criar um backup do sistema")
    backup_parser.add_argument("--nome", help="Nome do backup (opcional)")
    
    # Comando de restauração
    restore_parser = subparsers.add_parser("restaurar", help="Restaurar um backup do sistema")
    restore_parser.add_argument("nome", nargs="?", help="Nome do backup a ser restaurado")
    
    # Comando de listagem
    list_parser = subparsers.add_parser("listar", help="Listar backups disponíveis")
    
    # Comando de verificação de dependências
    deps_parser = subparsers.add_parser("dependencias", help="Verificar e instalar dependências")
    
    # Comando de teste
    test_parser = subparsers.add_parser("teste", help="Executar testes do sistema")
    
    # Comando de atualização completa
    update_parser = subparsers.add_parser("atualizar", help="Realizar uma atualização completa do sistema")
    
    args = parser.parse_args()
    
    if args.comando == "backup":
        criar_backup(args.nome)
    
    elif args.comando == "restaurar":
        if args.nome:
            restaurar_backup(args.nome)
        else:
            backups = listar_backups()
            if backups:
                escolha = input("\nDigite o número do backup a ser restaurado: ")
                try:
                    indice = int(escolha) - 1
                    if 0 <= indice < len(backups):
                        restaurar_backup(backups[indice])
                    else:
                        print("Escolha inválida.")
                except ValueError:
                    print("Entrada inválida. Digite um número.")
    
    elif args.comando == "listar":
        listar_backups()
    
    elif args.comando == "dependencias":
        verificar_dependencias()
    
    elif args.comando == "teste":
        executar_testes()
    
    elif args.comando == "atualizar":
        print("=" * 60)
        print("            ATUALIZANDO SISTEMA VIDEOGENIE")
        print("=" * 60)
        
        # 1. Criar backup
        print("\n[1/4] Criando backup do sistema atual...")
        backup_dir = criar_backup()
        
        # 2. Verificar dependências
        print("\n[2/4] Verificando dependências...")
        verificar_dependencias()
        
        # 3. Executar testes
        print("\n[3/4] Executando testes do sistema...")
        if executar_testes():
            print("\n[4/4] Atualização concluída com sucesso!")
        else:
            print("\n[4/4] Atualização concluída com avisos. Verifique os erros acima.")
            restaurar = input("\nDeseja restaurar o backup criado antes da atualização? (s/n): ")
            if restaurar.lower() == 's':
                nome_backup = os.path.basename(backup_dir)
                restaurar_backup(nome_backup)
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()