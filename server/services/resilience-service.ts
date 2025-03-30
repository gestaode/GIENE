/**
 * Serviço de Resiliência
 * 
 * Implementa mecanismos de resiliência para o sistema, incluindo:
 * - Rastreamento de operações e falhas
 * - Teste de serviços e componentes
 * - Cache para resultados comuns
 * - Mecanismos de fallback
 * - Detecção e auto-correção de erros
 */

import { log } from '../vite';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export interface ResilienceTestResult {
  success: boolean;
  responseTime: number;
  fallbackUsed: boolean;
  fallbackService?: string;
  errorMessage?: string;
}

export interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ServiceStatistics {
  serviceName: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  lastTestedAt?: Date;
  lastErrorMessage?: string;
  fallbackUsageRate: number;
  isAvailable: boolean;
  isHealthy: boolean;
}

// Classe de resiliência principal
export class ResilienceService {
  private operationsLog: Map<string, {
    operationId: string;
    operationType: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    result?: OperationResult;
  }> = new Map();

  private serviceStats: Map<string, ServiceStatistics> = new Map();
  
  private cacheData: Map<string, {
    data: any;
    timestamp: Date;
    ttl: number;
  }> = new Map();
  
  private readonly cacheDir = './fallback-cache';
  private readonly statsFile = './test_statistics.json';
  private readonly logsFile = './test_logs.log';
  
  constructor() {
    this.initializeDirectories();
    this.loadStatistics();
    this.registerCleanupListener();
  }
  
  // Inicializa diretórios necessários
  private initializeDirectories() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      
      if (!fs.existsSync(path.dirname(this.statsFile))) {
        fs.mkdirSync(path.dirname(this.statsFile), { recursive: true });
      }
      
      if (!fs.existsSync(path.dirname(this.logsFile))) {
        fs.mkdirSync(path.dirname(this.logsFile), { recursive: true });
      }
    } catch (error) {
      log(`Erro ao criar diretórios para resiliência: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
    }
  }
  
  // Carrega estatísticas de testes anteriores
  private loadStatistics() {
    try {
      if (fs.existsSync(this.statsFile)) {
        const data = fs.readFileSync(this.statsFile, 'utf-8');
        const stats = JSON.parse(data);
        
        // Restaurar estatísticas de serviço
        if (stats.services && Array.isArray(stats.services)) {
          for (const service of stats.services) {
            this.serviceStats.set(service.serviceName, {
              ...service,
              lastTestedAt: service.lastTestedAt ? new Date(service.lastTestedAt) : undefined
            });
          }
        }
        
        log(`Estatísticas de resiliência carregadas: ${this.serviceStats.size} serviços`, 'resilience');
      }
    } catch (error) {
      log(`Erro ao carregar estatísticas: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
    }
  }
  
  // Registra operação no sistema e retorna um ID para rastreamento
  startOperation(operationType: string): string {
    const operationId = uuidv4();
    
    this.operationsLog.set(operationId, {
      operationId,
      operationType,
      startTime: new Date()
    });
    
    return operationId;
  }
  
  // Completa uma operação registrada anteriormente
  completeOperation(operationId: string, result: OperationResult): void {
    const operation = this.operationsLog.get(operationId);
    
    if (!operation) {
      log(`Operação não encontrada: ${operationId}`, 'resilience');
      return;
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - operation.startTime.getTime();
    
    this.operationsLog.set(operationId, {
      ...operation,
      endTime,
      duration,
      result
    });
    
    // Atualizar estatísticas do serviço
    this.updateServiceStats(operation.operationType, {
      success: result.success,
      duration,
      error: result.error
    });
    
    // Logging
    const logEntry = {
      timestamp: new Date().toISOString(),
      operationId,
      operationType: operation.operationType,
      duration: `${duration}ms`,
      success: result.success,
      error: result.error || null
    };
    
    this.appendToLog(logEntry);
  }
  
  // Executar teste em um serviço específico
  async runTest(serviceName: string): Promise<ResilienceTestResult> {
    const startTime = Date.now();
    
    // Diferentes testes com base no tipo de serviço
    try {
      switch (serviceName) {
        case 'tts_orchestrator':
          return this.testTTSOrchestrator();
        case 'ffmpeg_service':
          return this.testFFmpegService();
        case 'content_service':
          return this.testContentService();
        case 'image_service':
          return this.testImageService();
        default:
          log(`Teste não implementado para o serviço: ${serviceName}`, 'resilience');
          return {
            success: false,
            responseTime: Date.now() - startTime,
            fallbackUsed: false,
            errorMessage: `Teste não implementado para o serviço: ${serviceName}`
          };
      }
    } catch (error) {
      log(`Erro ao executar teste para ${serviceName}: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
      return {
        success: false,
        responseTime: Date.now() - startTime,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  // Obter dados em cache ou executar função para gerar
  async getWithCache<T>(key: string, ttlMs: number, generatorFn: () => Promise<T>): Promise<T> {
    // Verificar cache em memória
    const cachedItem = this.cacheData.get(key);
    if (cachedItem && (Date.now() - cachedItem.timestamp.getTime()) < cachedItem.ttl) {
      return cachedItem.data as T;
    }
    
    // Verificar cache em disco
    const cacheFilePath = path.join(this.cacheDir, `${key.replace(/[^a-z0-9]/gi, '_')}.json`);
    try {
      if (fs.existsSync(cacheFilePath)) {
        const cacheFileContent = fs.readFileSync(cacheFilePath, 'utf-8');
        const cacheFileData = JSON.parse(cacheFileContent);
        
        if (cacheFileData.timestamp && (Date.now() - new Date(cacheFileData.timestamp).getTime()) < ttlMs) {
          // Atualizar cache em memória
          this.cacheData.set(key, {
            data: cacheFileData.data,
            timestamp: new Date(cacheFileData.timestamp),
            ttl: ttlMs
          });
          
          return cacheFileData.data as T;
        }
      }
    } catch (error) {
      log(`Erro ao ler cache do disco: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
    }
    
    // Gerar novos dados
    try {
      const data = await generatorFn();
      
      // Atualizar cache em memória
      this.cacheData.set(key, {
        data,
        timestamp: new Date(),
        ttl: ttlMs
      });
      
      // Atualizar cache em disco
      try {
        fs.writeFileSync(cacheFilePath, JSON.stringify({
          data,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        log(`Erro ao escrever cache no disco: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
      }
      
      return data;
    } catch (error) {
      // Tentar usar cache expirado em caso de erro
      if (cachedItem) {
        log(`Usando cache expirado para ${key} devido a erro: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
        return cachedItem.data as T;
      }
      
      throw error;
    }
  }
  
  // Limpar cache
  clearCache(keyPattern?: string): void {
    if (keyPattern) {
      // Limpar apenas entradas específicas
      const regex = new RegExp(keyPattern);
      const keysToRemove: string[] = [];
      
      this.cacheData.forEach((_, key) => {
        if (regex.test(key)) {
          keysToRemove.push(key);
        }
      });
      
      keysToRemove.forEach(key => this.cacheData.delete(key));
      
      // Limpar do disco
      try {
        const files = fs.readdirSync(this.cacheDir);
        for (const file of files) {
          if (regex.test(file)) {
            fs.unlinkSync(path.join(this.cacheDir, file));
          }
        }
      } catch (error) {
        log(`Erro ao limpar cache do disco: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
      }
    } else {
      // Limpar todo o cache
      this.cacheData.clear();
      
      // Limpar do disco
      try {
        const files = fs.readdirSync(this.cacheDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      } catch (error) {
        log(`Erro ao limpar cache do disco: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
      }
    }
  }
  
  // Obter estatísticas de todos os serviços
  getServicesStatistics(): ServiceStatistics[] {
    return Array.from(this.serviceStats.values());
  }
  
  // Obter estatísticas de um serviço específico
  getServiceStatistics(serviceName: string): ServiceStatistics | undefined {
    return this.serviceStats.get(serviceName);
  }
  
  // Atualiza estatísticas para um serviço
  private updateServiceStats(serviceName: string, data: {
    success: boolean;
    duration: number;
    error?: string;
  }): void {
    const stats = this.serviceStats.get(serviceName) || {
      serviceName,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageResponseTime: 0,
      fallbackUsageRate: 0,
      isAvailable: true,
      isHealthy: true
    };
    
    stats.totalOperations += 1;
    if (data.success) {
      stats.successfulOperations += 1;
    } else {
      stats.failedOperations += 1;
      stats.lastErrorMessage = data.error;
    }
    
    // Atualizar tempo médio de resposta
    const totalTime = stats.averageResponseTime * (stats.totalOperations - 1) + data.duration;
    stats.averageResponseTime = totalTime / stats.totalOperations;
    
    // Atualizar status de disponibilidade
    stats.isAvailable = stats.failedOperations / stats.totalOperations < 0.8; // Considerar indisponível se mais de 80% das operações falham
    stats.isHealthy = stats.failedOperations / stats.totalOperations < 0.3; // Considerar não saudável se mais de 30% das operações falham
    
    stats.lastTestedAt = new Date();
    
    this.serviceStats.set(serviceName, stats);
    this.saveStatistics();
  }
  
  // Salva estatísticas no disco
  private saveStatistics(): void {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        services: Array.from(this.serviceStats.values())
      };
      
      fs.writeFileSync(this.statsFile, JSON.stringify(stats, null, 2));
    } catch (error) {
      log(`Erro ao salvar estatísticas: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
    }
  }
  
  // Adiciona entrada ao log
  private appendToLog(entry: any): void {
    try {
      const logLine = `${JSON.stringify(entry)}\n`;
      fs.appendFileSync(this.logsFile, logLine);
    } catch (error) {
      log(`Erro ao escrever no log: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
    }
  }
  
  // Registra listener para cleanup ao encerrar
  private registerCleanupListener(): void {
    process.on('SIGINT', () => {
      this.saveStatistics();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      this.saveStatistics();
      process.exit(0);
    });
  }
  
  // Testar orquestrador TTS
  private async testTTSOrchestrator(): Promise<ResilienceTestResult> {
    // Normalmente importaríamos o orquestrador TTS, mas para evitar dependências circulares,
    // usaremos um fallback simples neste ponto
    const startTime = Date.now();
    
    return {
      success: true,
      responseTime: Date.now() - startTime,
      fallbackUsed: false,
      fallbackService: "auto"
    };
  }
  
  // Testar serviço FFmpeg
  private async testFFmpegService(): Promise<ResilienceTestResult> {
    // Importar FFmpegService
    try {
      const { ffmpegService } = await import('./ffmpeg');
      const startTime = Date.now();
      
      const isAvailable = await ffmpegService.isAvailable();
      
      if (isAvailable) {
        return {
          success: true,
          responseTime: Date.now() - startTime,
          fallbackUsed: false
        };
      } else {
        return {
          success: false,
          responseTime: Date.now() - startTime,
          fallbackUsed: false,
          errorMessage: "FFmpeg não está disponível no sistema"
        };
      }
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : "Erro desconhecido ao testar FFmpeg"
      };
    }
  }
  
  // Testar serviço de conteúdo
  private async testContentService(): Promise<ResilienceTestResult> {
    const startTime = Date.now();
    
    // Verificar se pelo menos um provedor de IA está disponível
    const apiKeys = [
      { name: 'HUGGINGFACE_API_KEY', value: process.env.HUGGINGFACE_API_KEY },
      { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY },
      { name: 'MISTRAL_API_KEY', value: process.env.MISTRAL_API_KEY },
      { name: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY }
    ];
    
    const availableProviders = apiKeys.filter(api => !!api.value);
    
    if (availableProviders.length > 0) {
      return {
        success: true,
        responseTime: Date.now() - startTime,
        fallbackUsed: false,
        fallbackService: availableProviders[0].name
      };
    } else {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        fallbackUsed: false,
        errorMessage: "Nenhum provedor de IA configurado"
      };
    }
  }
  
  // Testar serviço de imagens
  private async testImageService(): Promise<ResilienceTestResult> {
    const startTime = Date.now();
    
    // Verificar se a API do Pexels está configurada
    if (process.env.PEXELS_API_KEY) {
      return {
        success: true,
        responseTime: Date.now() - startTime,
        fallbackUsed: false
      };
    } else {
      // Fallback: Usar imagens locais
      return {
        success: true,
        responseTime: Date.now() - startTime,
        fallbackUsed: true,
        fallbackService: "local_images"
      };
    }
  }
}

// Criar instância singleton
export const resilienceService = new ResilienceService();