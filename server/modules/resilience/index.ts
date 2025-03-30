/**
 * Módulo de Resiliência e Fallback
 * 
 * Este módulo é responsável por implementar mecanismos de resiliência,
 * testes automáticos e estratégias de fallback para garantir que o sistema
 * continue funcionando mesmo quando serviços externos falham.
 * 
 * Características principais:
 * - Testes automáticos de serviços externos
 * - Mecanismos de fallback para todas as funcionalidades críticas
 * - Monitoramento de saúde do sistema
 * - Relatórios de confiabilidade e disponibilidade
 */

import { log } from '../../vite';
import { ResilienceTestResult } from '../../services/resilience-service';
import { localFallbackService } from '../../services/local-fallback';
import { cacheService } from '../../services/caching';
import { OpenAIService } from '../../services/openai';
import { GeminiService } from '../../services/gemini';
import { MistralAIService } from '../../services/mistral';
import { HuggingFaceService } from '../../services/huggingface';
import { PexelsService } from '../../services/pexels';
import { GoogleCloudTTSService } from '../../services/google-cloud-tts';
import { ResponsiveVoiceService } from '../../services/responsive-voice';
import { CoquiTTSService } from '../../services/coqui-tts';
import { FFmpegService } from '../../services/ffmpeg';

// Tipos para o módulo
export interface ServiceTest {
  name: string;
  service: string;
  testFunction: () => Promise<ResilienceTestResult>;
  lastResult?: ResilienceTestResult;
  lastRun?: Date;
  description: string;
  critical: boolean;
}

/**
 * Classe principal do módulo de resiliência
 */
export class ResilienceModule {
  private registeredTests: ServiceTest[] = [];
  private testResults: Record<string, ResilienceTestResult[]> = {};
  private testInterval: NodeJS.Timeout | null = null;
  private testIntervalMinutes: number = 360; // 6 horas por padrão
  
  constructor() {
    log('Inicializando módulo de resiliência', 'resilience-module');
    this.setupDefaultTests();
  }

  /**
   * Configura os testes padrão para os serviços essenciais
   */
  private setupDefaultTests() {
    // Testes para serviços de IA
    if (process.env.OPENAI_API_KEY) {
      this.registerTest({
        name: 'Teste de conexão com OpenAI',
        service: 'openai',
        testFunction: this.testOpenAI.bind(this),
        description: 'Verifica se a API da OpenAI está acessível e respondendo corretamente',
        critical: true
      });
    }
    
    if (process.env.MISTRAL_API_KEY) {
      this.registerTest({
        name: 'Teste de conexão com Mistral AI',
        service: 'mistral',
        testFunction: this.testMistral.bind(this),
        description: 'Verifica se a API da Mistral AI está acessível e respondendo corretamente',
        critical: true
      });
    }
    
    if (process.env.HUGGINGFACE_API_KEY) {
      this.registerTest({
        name: 'Teste de conexão com HuggingFace',
        service: 'huggingface',
        testFunction: this.testHuggingFace.bind(this),
        description: 'Verifica se a API do HuggingFace está acessível e respondendo corretamente',
        critical: true
      });
    }
    
    if (process.env.GOOGLE_AI_API_KEY) {
      this.registerTest({
        name: 'Teste de conexão com Google Gemini',
        service: 'gemini',
        testFunction: this.testGemini.bind(this),
        description: 'Verifica se a API do Google Gemini está acessível e respondendo corretamente',
        critical: true
      });
    }
    
    // Testes para serviços de mídia
    if (process.env.PEXELS_API_KEY) {
      this.registerTest({
        name: 'Teste de conexão com Pexels',
        service: 'pexels',
        testFunction: this.testPexels.bind(this),
        description: 'Verifica se a API do Pexels está acessível para busca de imagens e vídeos',
        critical: false
      });
    }
    
    if (process.env.GOOGLE_TTS_API_KEY) {
      this.registerTest({
        name: 'Teste de conexão com Google TTS',
        service: 'google_tts',
        testFunction: this.testGoogleTTS.bind(this),
        description: 'Verifica se a API do Google Text-to-Speech está acessível',
        critical: false
      });
    }
    
    // Teste para FFmpeg
    this.registerTest({
      name: 'Teste de funcionalidade do FFmpeg',
      service: 'ffmpeg',
      testFunction: this.testFFmpeg.bind(this),
      description: 'Verifica se o FFmpeg está disponível e funcionando corretamente',
      critical: true
    });
    
    // Teste para sistema de cache
    this.registerTest({
      name: 'Teste do sistema de cache',
      service: 'cache',
      testFunction: this.testCache.bind(this),
      description: 'Verifica se o sistema de cache está funcionando corretamente',
      critical: true
    });
    
    // Teste para o serviço de fallback
    this.registerTest({
      name: 'Teste do sistema de fallback local',
      service: 'fallback',
      testFunction: this.testLocalFallback.bind(this),
      description: 'Verifica se o sistema de fallback local está funcionando corretamente',
      critical: true
    });
  }

  /**
   * Registra um novo teste de resiliência
   */
  registerTest(test: ServiceTest) {
    log(`Registrando teste de resiliência para o serviço: ${test.service}`, 'resilience-module');
    this.registeredTests.push(test);
    this.testResults[test.service] = [];
  }

  /**
   * Inicia os testes automáticos periódicos
   */
  startAutomaticTests(intervalMinutes: number = this.testIntervalMinutes) {
    if (this.testInterval) {
      clearInterval(this.testInterval);
    }
    
    this.testIntervalMinutes = intervalMinutes;
    log(`Testes de resiliência automáticos iniciados (intervalo: ${intervalMinutes} minutos)`, 'resilience-module');
    
    // Executar imediatamente na inicialização
    this.runAllTests();
    
    // Configurar execução periódica
    this.testInterval = setInterval(() => {
      this.runAllTests();
    }, intervalMinutes * 60 * 1000);
    
    return true;
  }

  /**
   * Para os testes automáticos
   */
  stopAutomaticTests() {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
      log('Testes de resiliência automáticos interrompidos', 'resilience-module');
      return true;
    }
    return false;
  }

  /**
   * Executa todos os testes registrados
   */
  async runAllTests(): Promise<Record<string, ResilienceTestResult>> {
    const results: Record<string, ResilienceTestResult> = {};
    log(`Iniciando testes de resiliência para ${this.registeredTests.length} serviços`, 'resilience-module');
    
    for (const test of this.registeredTests) {
      log(`Executando teste de resiliência para o serviço: ${test.service}`, 'resilience-module');
      try {
        const startTime = Date.now();
        const result = await test.testFunction();
        const endTime = Date.now();
        
        // Adicionar tempo de resposta se não fornecido pelo teste
        if (!result.responseTime) {
          result.responseTime = endTime - startTime;
        }
        
        // Atualizar o último resultado do teste
        test.lastResult = result;
        test.lastRun = new Date();
        
        // Salvar o resultado no histórico
        this.testResults[test.service].push({
          ...result,
          timestamp: new Date()
        } as any);
        
        // Limitar o histórico a 100 entradas por serviço
        if (this.testResults[test.service].length > 100) {
          this.testResults[test.service] = this.testResults[test.service].slice(-100);
        }
        
        // Adicionar ao resultado geral
        results[test.service] = result;
        
        log(`Teste concluído para ${test.service}: ${result.success ? 'Sucesso' : 'Falha'} (${result.responseTime}ms)`, 'resilience-module');
      } catch (error) {
        // Em caso de erro no próprio teste
        const failResult: ResilienceTestResult = {
          success: false,
          fallbackUsed: false,
          responseTime: 0,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
        
        test.lastResult = failResult;
        test.lastRun = new Date();
        
        this.testResults[test.service].push({
          ...failResult,
          timestamp: new Date()
        } as any);
        
        results[test.service] = failResult;
        
        log(`Erro ao executar teste para ${test.service}: ${failResult.errorMessage}`, 'resilience-module');
      }
    }
    
    log('Testes de resiliência concluídos', 'resilience-module');
    return results;
  }

  /**
   * Executa um teste específico por nome de serviço
   */
  async runTest(serviceName: string): Promise<ResilienceTestResult | null> {
    const test = this.registeredTests.find(t => t.service === serviceName);
    
    if (!test) {
      log(`Teste não encontrado para o serviço: ${serviceName}`, 'resilience-module');
      return null;
    }
    
    log(`Executando teste manual para o serviço: ${serviceName}`, 'resilience-module');
    
    try {
      const startTime = Date.now();
      const result = await test.testFunction();
      const endTime = Date.now();
      
      if (!result.responseTime) {
        result.responseTime = endTime - startTime;
      }
      
      test.lastResult = result;
      test.lastRun = new Date();
      
      this.testResults[test.service].push({
        ...result,
        timestamp: new Date()
      } as any);
      
      log(`Teste manual concluído para ${serviceName}: ${result.success ? 'Sucesso' : 'Falha'} (${result.responseTime}ms)`, 'resilience-module');
      
      return result;
    } catch (error) {
      const failResult: ResilienceTestResult = {
        success: false,
        fallbackUsed: false,
        responseTime: 0,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      
      test.lastResult = failResult;
      test.lastRun = new Date();
      
      this.testResults[test.service].push({
        ...failResult,
        timestamp: new Date()
      } as any);
      
      log(`Erro ao executar teste manual para ${serviceName}: ${failResult.errorMessage}`, 'resilience-module');
      
      return failResult;
    }
  }

  /**
   * Obtém estatísticas de confiabilidade dos serviços
   */
  getReliabilityStats(): any {
    const stats: Record<string, {
      service: string;
      successRate: number;
      averageResponseTime: number;
      fallbackUsageRate: number;
      lastResult?: ResilienceTestResult;
      lastRun?: Date;
      critical: boolean;
      description: string;
    }> = {};
    
    for (const test of this.registeredTests) {
      const results = this.testResults[test.service] || [];
      
      if (results.length === 0) {
        stats[test.service] = {
          service: test.service,
          successRate: 0,
          averageResponseTime: 0,
          fallbackUsageRate: 0,
          lastResult: test.lastResult,
          lastRun: test.lastRun,
          critical: test.critical,
          description: test.description
        };
        continue;
      }
      
      const successfulTests = results.filter(r => r.success).length;
      const testsWithFallback = results.filter(r => r.fallbackUsed).length;
      
      const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);
      
      stats[test.service] = {
        service: test.service,
        successRate: Math.round((successfulTests / results.length) * 100) / 100,
        averageResponseTime: Math.round(totalResponseTime / results.length),
        fallbackUsageRate: Math.round((testsWithFallback / results.length) * 100) / 100,
        lastResult: test.lastResult,
        lastRun: test.lastRun,
        critical: test.critical,
        description: test.description
      };
    }
    
    return stats;
  }

  /**
   * Obtém o status geral do sistema
   */
  getSystemStatus(): any {
    const stats = this.getReliabilityStats();
    const services = Object.values(stats);
    
    const criticalServices = services.filter(s => s.critical);
    const nonCriticalServices = services.filter(s => !s.critical);
    
    const criticalSuccessRate = criticalServices.reduce((sum, s) => sum + s.successRate, 0) / 
                               (criticalServices.length || 1);
    
    const overallSuccessRate = services.reduce((sum, s) => sum + s.successRate, 0) / 
                              (services.length || 1);
    
    const recentFailures = Object.entries(stats)
      .filter(([_, s]) => s.lastResult && !s.lastResult.success)
      .map(([id, s]) => ({
        service: id,
        errorMessage: s.lastResult?.errorMessage || 'Erro desconhecido',
        time: s.lastRun
      }));
    
    return {
      systemHealthy: criticalSuccessRate > 0.7, // Sistema saudável se mais de 70% dos serviços críticos estão funcionando
      criticalServiceStatus: criticalSuccessRate,
      overallServiceStatus: overallSuccessRate,
      totalServices: services.length,
      servicesUp: services.filter(s => s.lastResult?.success).length,
      servicesDown: services.filter(s => s.lastResult && !s.lastResult.success).length,
      fallbackServicesActive: services.filter(s => s.lastResult?.fallbackUsed).length,
      recentFailures,
      detailedStats: stats
    };
  }

  /**
   * Obtém o histórico de resultados de um serviço específico
   */
  getServiceHistory(serviceName: string, limit: number = 20): any[] {
    const history = this.testResults[serviceName] || [];
    return history.slice(-limit);
  }

  // ---- Implementações dos testes específicos ----

  private async testOpenAI(): Promise<ResilienceTestResult> {
    try {
      const openai = new OpenAIService(process.env.OPENAI_API_KEY || '');
      const startTime = Date.now();
      const result = await openai.suggestTrendingTopics('marketing', 1);
      const endTime = Date.now();
      
      return {
        success: Array.isArray(result) && result.length > 0,
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testMistral(): Promise<ResilienceTestResult> {
    try {
      const mistral = new MistralAIService(process.env.MISTRAL_API_KEY || '');
      const startTime = Date.now();
      const result = await mistral.suggestTrendingTopics('marketing', 1);
      const endTime = Date.now();
      
      return {
        success: Array.isArray(result) && result.length > 0,
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testHuggingFace(): Promise<ResilienceTestResult> {
    try {
      const huggingface = new HuggingFaceService(process.env.HUGGINGFACE_API_KEY || '');
      const startTime = Date.now();
      const result = await huggingface.suggestTrendingTopics('marketing', 1);
      const endTime = Date.now();
      
      return {
        success: Array.isArray(result) && result.length > 0,
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testGemini(): Promise<ResilienceTestResult> {
    try {
      const gemini = new GeminiService(process.env.GOOGLE_AI_API_KEY || '');
      const startTime = Date.now();
      const result = await gemini.suggestTrendingTopics('marketing', 1);
      const endTime = Date.now();
      
      return {
        success: Array.isArray(result) && result.length > 0,
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testPexels(): Promise<ResilienceTestResult> {
    try {
      const pexels = new PexelsService(process.env.PEXELS_API_KEY || '');
      const startTime = Date.now();
      const result = await pexels.searchPhotos('business', 1);
      const endTime = Date.now();
      
      return {
        success: result && result.photos && result.photos.length > 0,
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testGoogleTTS(): Promise<ResilienceTestResult> {
    try {
      const tts = new GoogleCloudTTSService(process.env.GOOGLE_TTS_API_KEY || '');
      const startTime = Date.now();
      const result = await tts.getVoices('pt-BR');
      const endTime = Date.now();
      
      return {
        success: result && Array.isArray(result.voices) && result.voices.length > 0,
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testFFmpeg(): Promise<ResilienceTestResult> {
    try {
      const ffmpeg = new FFmpegService();
      const startTime = Date.now();
      
      // Verificar se o FFmpeg está disponível
      const version = await ffmpeg.getVersion();
      const endTime = Date.now();
      
      return {
        success: version.includes('ffmpeg'),
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testCache(): Promise<ResilienceTestResult> {
    try {
      const startTime = Date.now();
      
      // Testar operações básicas do cache
      const testKey = `test-${Date.now()}`;
      const testValue = { test: true, time: Date.now() };
      
      await cacheService.set(testKey, testValue, 60);
      const retrieved = await cacheService.get(testKey);
      const deleted = await cacheService.delete(testKey);
      
      const endTime = Date.now();
      
      const success = (
        retrieved !== null && 
        retrieved.test === testValue.test && 
        retrieved.time === testValue.time &&
        deleted === true
      );
      
      return {
        success,
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testLocalFallback(): Promise<ResilienceTestResult> {
    try {
      const startTime = Date.now();
      
      // Testar geração de tópicos em tendência como um exemplo simples
      const topics = await localFallbackService.suggestTrendingTopics('marketing', 3);
      
      const endTime = Date.now();
      
      return {
        success: Array.isArray(topics) && topics.length === 3,
        responseTime: endTime - startTime,
        fallbackUsed: false
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Exportar instância singleton do módulo
export const resilienceModule = new ResilienceModule();