#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import sys
import datetime
import argparse
from tabulate import tabulate

def formatar_hora(tempo_str):
    """Formata uma string de data/hora ISO para exibição mais legível."""
    try:
        dt = datetime.datetime.fromisoformat(tempo_str)
        return dt.strftime("%d/%m/%Y %H:%M:%S")
    except:
        return tempo_str

def carregar_estatisticas(arquivo):
    """Carrega um arquivo JSON de estatísticas."""
    try:
        with open(arquivo, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar {arquivo}: {e}")
        return None

def exibir_varredura(estatisticas):
    """Exibe estatísticas da varredura do sistema."""
    if not estatisticas:
        print("Nenhuma estatística de varredura disponível.")
        return
    
    print("\n========== ESTATÍSTICAS DE VARREDURA ==========")
    print(f"Início: {formatar_hora(estatisticas.get('inicio', 'N/A'))}")
    print(f"Fim: {formatar_hora(estatisticas.get('fim', 'N/A'))}")
    
    # Calcular duração
    try:
        inicio = datetime.datetime.fromisoformat(estatisticas.get('inicio', ''))
        fim = datetime.datetime.fromisoformat(estatisticas.get('fim', ''))
        duracao = fim - inicio
        print(f"Duração: {duracao.total_seconds():.2f} segundos")
    except:
        print("Duração: Não disponível")
    
    # Estatísticas gerais
    total = estatisticas.get('total', 0)
    sucesso = estatisticas.get('sucesso', 0)
    falhas = estatisticas.get('falhas', 0)
    
    print(f"\nTotal de execuções: {total}")
    print(f"Sucessos: {sucesso} ({(sucesso/max(1,total+sucesso-falhas))*100:.2f}%)")
    print(f"Falhas: {falhas} ({(falhas/max(1,total+sucesso-falhas))*100:.2f}%)")
    print(f"Correções aplicadas: {estatisticas.get('correcoes', 0)}")
    print(f"Falhas de correção: {estatisticas.get('falhas_correcao', 0)}")
    
    # Tipos de erro
    erros = estatisticas.get('tipos_erro', {})
    if erros:
        print("\nTipos de erro detectados:")
        for erro, count in erros.items():
            print(f"  - {erro}: {count}")
    else:
        print("\nNenhum erro detectado!")

def exibir_testes(estatisticas):
    """Exibe estatísticas dos testes automatizados."""
    if not estatisticas:
        print("Nenhuma estatística de teste disponível.")
        return
    
    print("\n========== ESTATÍSTICAS DE TESTES AUTOMATIZADOS ==========")
    print(f"Início: {formatar_hora(estatisticas.get('start_time', 'N/A'))}")
    
    # Tabela de módulos
    modulos = estatisticas.get('modules_tested', {})
    if modulos:
        tabela = []
        for modulo, stats in modulos.items():
            tentativas = stats.get('attempts', 0)
            sucesso = stats.get('successes', 0)
            falhas = stats.get('failures', 0)
            
            if tentativas > 0:
                taxa_sucesso = (sucesso / tentativas) * 100
            else:
                taxa_sucesso = 0
                
            erros = ", ".join(stats.get('errors', {}).keys())
            if not erros:
                erros = "Nenhum"
                
            tabela.append([
                modulo,
                tentativas,
                sucesso,
                falhas,
                f"{taxa_sucesso:.2f}%",
                erros[:50] + ("..." if len(erros) > 50 else "")
            ])
        
        print("\nDesempenho por módulo:")
        print(tabulate(tabela, headers=["Módulo", "Tentativas", "Sucessos", "Falhas", "Taxa Sucesso", "Erros"]))
    else:
        print("\nNenhum módulo testado.")
    
    # Otimizações aplicadas
    otimizacoes = estatisticas.get('optimizations_applied', [])
    if otimizacoes:
        print("\nOtimizações aplicadas:")
        for opt in otimizacoes:
            timestamp = formatar_hora(opt.get('timestamp', 'N/A'))
            modulo = opt.get('module', 'desconhecido')
            erro = opt.get('error', 'desconhecido')
            acao = opt.get('action', 'desconhecida')
            
            print(f"  - [{timestamp}] Módulo: {modulo}")
            print(f"    Erro: {erro}")
            print(f"    Ação: {acao}")
            print()
    else:
        print("\nNenhuma otimização aplicada.")

def main():
    parser = argparse.ArgumentParser(description="Visualizador de estatísticas do sistema VideoGenie")
    parser.add_argument("--varredura", action="store_true", help="Exibir estatísticas de varredura")
    parser.add_argument("--testes", action="store_true", help="Exibir estatísticas de testes automatizados")
    parser.add_argument("--todos", action="store_true", help="Exibir todas as estatísticas")
    
    args = parser.parse_args()
    
    # Se nenhum argumento for fornecido, mostra todas as estatísticas
    if not (args.varredura or args.testes):
        args.todos = True
    
    # Carrega as estatísticas
    varredura_stats = None
    testes_stats = None
    
    if args.varredura or args.todos:
        varredura_stats = carregar_estatisticas('varredura_estatisticas.json')
        
    if args.testes or args.todos:
        testes_stats = carregar_estatisticas('test_statistics.json')
    
    # Exibe as estatísticas
    print("=" * 60)
    print("            VISUALIZADOR DE ESTATÍSTICAS VIDEOGENIE")
    print("=" * 60)
    
    if args.varredura or args.todos:
        exibir_varredura(varredura_stats)
        
    if args.testes or args.todos:
        exibir_testes(testes_stats)
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()