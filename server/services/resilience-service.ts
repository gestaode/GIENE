import { storage } from "../storage";
import { log } from "../vite";
import { InsertResilienceTest } from "@shared/schema";

/**
 * Resultado de um teste de resiliência
 */
interface ResilienceTestResult {
  success: boolean;
  responseTime: number;
  fallbackUsed: boolean;
  fallbackService?: string;
  errorMessage?: string;
}

/**
 * Interface para testar a resiliência de um serviço
 */
interface ResilienceTestFunction {
  (options?: any): Promise<ResilienceTestResult>;
}

/**
 * Serviço para monitorar e testar a resiliência do sistema
 * Fornece ferramentas para verificar automaticamente cada serviço externo
 * e rastrear seus tempos de resposta e disponibilidade
 */
export class ResilienceService {
  private tests: Map<string, ResilienceTestFunction>;
  private isActive: boolean;
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    this.tests = new Map();
    this.isActive = true;
    
    // Iniciar os testes automáticos a cada 6 horas
    this.startAutomaticTests(6 * 60 * 60 * 1000);
  }
  
  /**
   * Registra uma função de teste para um serviço específico
   * @param service Nome do serviço a ser testado
   * @param testFunction Função que executa o teste
   */
  registerTest(service: string, testFunction: ResilienceTestFunction): void {
    this.tests.set(service, testFunction);
    log(`Teste de resiliência registrado para o serviço: ${service}`, "resilience-service");
  }
  
  /**
   * Remove um teste registrado
   * @param service Nome do serviço
   */
  unregisterTest(service: string): void {
    if (this.tests.has(service)) {
      this.tests.delete(service);
      log(`Teste de resiliência removido para o serviço: ${service}`, "resilience-service");
    }
  }
  
  /**
   * Inicia a execução automática de testes em intervalos regulares
   * @param interval Intervalo em milissegundos
   */
  startAutomaticTests(interval: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Iniciar imediatamente
    this.runAllTests().catch(error => {
      log(`Erro ao executar testes iniciais: ${error.message}`, "resilience-service");
    });
    
    // Configurar intervalo para execução contínua
    this.intervalId = setInterval(() => {
      if (this.isActive) {
        this.runAllTests().catch(error => {
          log(`Erro na execução automática de testes: ${error.message}`, "resilience-service");
        });
      }
    }, interval);
    
    log(`Testes de resiliência automáticos iniciados (intervalo: ${interval / (60 * 1000)} minutos)`, "resilience-service");
  }
  
  /**
   * Para a execução automática de testes
   */
  stopAutomaticTests(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      log("Testes de resiliência automáticos interrompidos", "resilience-service");
    }
  }
  
  /**
   * Define se o serviço está ativo ou não
   */
  setActive(active: boolean): void {
    this.isActive = active;
    log(`Serviço de resiliência ${active ? 'ativado' : 'desativado'}`, "resilience-service");
  }
  
  /**
   * Executa todos os testes registrados
   */
  async runAllTests(): Promise<void> {
    const services = Array.from(this.tests.keys());
    log(`Iniciando testes de resiliência para ${services.length} serviços`, "resilience-service");
    
    for (const service of services) {
      try {
        await this.runTest(service);
      } catch (error) {
        log(`Erro ao executar teste para o serviço ${service}: ${error.message}`, "resilience-service");
      }
    }
    
    log("Testes de resiliência concluídos", "resilience-service");
  }
  
  /**
   * Executa um teste específico
   * @param service Nome do serviço a ser testado
   * @param options Opções adicionais para o teste
   * @returns O resultado do teste
   */
  async runTest(service: string, options?: any): Promise<ResilienceTestResult> {
    const testFunction = this.tests.get(service);
    if (!testFunction) {
      log(`Teste não encontrado para o serviço: ${service}`, "resilience-service");
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: `Serviço ${service} não encontrado`
      };
    }
    
    log(`Executando teste de resiliência para o serviço: ${service}`, "resilience-service");
    try {
      const startTime = Date.now();
      const result = await testFunction(options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Registrar resultado do teste
      const testData: InsertResilienceTest = {
        name: `Teste automatizado - ${service}`,
        service,
        functionTested: options?.function || "default",
        result: result.success ? "success" : "failure",
        responseTime,
        fallbackUsed: result.fallbackUsed,
        fallbackService: result.fallbackService || null,
        errorMessage: result.errorMessage || null
      };
      
      await storage.createResilienceTest(testData);
      
      log(`Teste concluído para ${service}: ${result.success ? 'Sucesso' : 'Falha'} (${responseTime}ms)`, "resilience-service");
      return result;
    } catch (error) {
      log(`Erro ao executar teste para o serviço ${service}: ${error.message}`, "resilience-service");
      
      // Registrar falha
      const testData: InsertResilienceTest = {
        name: `Teste automatizado - ${service}`,
        service,
        functionTested: options?.function || "default",
        result: "error",
        responseTime: null,
        fallbackUsed: false,
        fallbackService: null,
        errorMessage: error.message
      };
      
      await storage.createResilienceTest(testData);
      
      return {
        success: false,
        responseTime: 0,
        fallbackUsed: false,
        errorMessage: error.message
      };
    }
  }
  
  /**
   * Obtém o status de todos os serviços registrados
   * @returns Um mapa com o status de cada serviço
   */
  async getServiceStatus(): Promise<Record<string, ResilienceTestResult>> {
    const services = Array.from(this.tests.keys());
    const results: Record<string, ResilienceTestResult> = {};
    
    for (const service of services) {
      try {
        const result = await this.runTest(service);
        results[service] = result;
      } catch (error) {
        results[service] = {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error.message
        };
      }
    }
    
    return results;
  }
  
  /**
   * Obtém estatísticas de resiliência para um serviço
   * @param service Nome do serviço
   */
  async getServiceStatistics(service: string): Promise<{
    totalTests: number;
    successRate: number;
    averageResponseTime: number;
    fallbackUsageRate: number;
    mostCommonErrors: { message: string; count: number }[];
  }> {
    const tests = await storage.getResilienceTestsByService(service);
    
    if (tests.length === 0) {
      return {
        totalTests: 0,
        successRate: 0,
        averageResponseTime: 0,
        fallbackUsageRate: 0,
        mostCommonErrors: []
      };
    }
    
    // Calcular estatísticas
    const totalTests = tests.length;
    const successfulTests = tests.filter(test => test.result === "success").length;
    const successRate = (successfulTests / totalTests) * 100;
    
    // Calcular tempo médio de resposta (apenas para testes bem-sucedidos)
    const responseTimes = tests
      .filter(test => test.result === "success" && test.responseTime !== null)
      .map(test => test.responseTime);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + (time || 0), 0) / responseTimes.length
      : 0;
    
    // Calcular taxa de uso de fallback
    const fallbackTests = tests.filter(test => test.fallbackUsed).length;
    const fallbackUsageRate = (fallbackTests / totalTests) * 100;
    
    // Identificar erros mais comuns
    const errorMap = new Map<string, number>();
    tests
      .filter(test => test.errorMessage)
      .forEach(test => {
        const message = test.errorMessage || "Unknown error";
        errorMap.set(message, (errorMap.get(message) || 0) + 1);
      });
    
    const mostCommonErrors = Array.from(errorMap.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalTests,
      successRate,
      averageResponseTime,
      fallbackUsageRate,
      mostCommonErrors
    };
  }
  
  /**
   * Obtém estatísticas gerais de resiliência do sistema
   */
  async getSystemStatistics(): Promise<{
    servicesCount: number;
    overallSuccessRate: number;
    leastReliableServices: { service: string; successRate: number }[];
    slowestServices: { service: string; averageResponseTime: number }[];
  }> {
    const allTests = await storage.getResilienceTests();
    
    if (allTests.length === 0) {
      return {
        servicesCount: 0,
        overallSuccessRate: 0,
        leastReliableServices: [],
        slowestServices: []
      };
    }
    
    // Identificar todos os serviços distintos
    const services = new Set(allTests.map(test => test.service));
    const servicesCount = services.size;
    
    // Calcular taxa de sucesso geral
    const successfulTests = allTests.filter(test => test.result === "success").length;
    const overallSuccessRate = (successfulTests / allTests.length) * 100;
    
    // Calcular estatísticas por serviço
    const serviceStats = new Map<string, { 
      totalTests: number;
      successfulTests: number;
      totalResponseTime: number;
      responseTimeCount: number;
    }>();
    
    // Inicializar estatísticas para cada serviço
    services.forEach(service => {
      serviceStats.set(service, {
        totalTests: 0,
        successfulTests: 0,
        totalResponseTime: 0,
        responseTimeCount: 0
      });
    });
    
    // Atualizar estatísticas com dados dos testes
    allTests.forEach(test => {
      const stats = serviceStats.get(test.service);
      if (stats) {
        stats.totalTests++;
        
        if (test.result === "success") {
          stats.successfulTests++;
        }
        
        if (test.responseTime !== null) {
          stats.totalResponseTime += test.responseTime || 0;
          stats.responseTimeCount++;
        }
      }
    });
    
    // Identificar serviços menos confiáveis (menor taxa de sucesso)
    const leastReliableServices = Array.from(serviceStats.entries())
      .map(([service, stats]) => ({
        service,
        successRate: (stats.successfulTests / stats.totalTests) * 100
      }))
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 5);
    
    // Identificar serviços mais lentos (maior tempo médio de resposta)
    const slowestServices = Array.from(serviceStats.entries())
      .map(([service, stats]) => ({
        service,
        averageResponseTime: stats.responseTimeCount > 0
          ? stats.totalResponseTime / stats.responseTimeCount
          : 0
      }))
      .filter(stat => stat.averageResponseTime > 0)
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 5);
    
    return {
      servicesCount,
      overallSuccessRate,
      leastReliableServices,
      slowestServices
    };
  }
}

// Instância única do serviço de resiliência
export const resilienceService = new ResilienceService();