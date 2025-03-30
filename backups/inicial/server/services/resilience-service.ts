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
  private degradedMode: boolean = false;
  private degradedServices: Set<string> = new Set();
  private recoveryAttempts: Map<string, number> = new Map();
  private maxRecoveryAttempts: number = 5;
  
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
    inDegradedMode: boolean;
    degradedServices: string[];
  }> {
    const allTests = await storage.getResilienceTests();
    
    if (allTests.length === 0) {
      return {
        servicesCount: 0,
        overallSuccessRate: 0,
        leastReliableServices: [],
        slowestServices: [],
        inDegradedMode: this.degradedMode,
        degradedServices: Array.from(this.degradedServices)
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
      slowestServices,
      inDegradedMode: this.degradedMode,
      degradedServices: Array.from(this.degradedServices)
    };
  }

  /**
   * Ativa o modo degradado para um serviço específico
   * @param service Nome do serviço a ser colocado em modo degradado
   * @param reason Motivo para ativar o modo degradado
   */
  activateDegradedModeForService(service: string, reason: string): void {
    if (!this.degradedServices.has(service)) {
      this.degradedServices.add(service);
      log(`Modo degradado ativado para o serviço ${service}. Motivo: ${reason}`, "resilience-service");
      
      // Se é o primeiro serviço a entrar em modo degradado, ativar o modo degradado geral
      if (!this.degradedMode && this.degradedServices.size === 1) {
        this.degradedMode = true;
        log("Modo degradado do sistema ativado", "resilience-service");
      }
    }
  }
  
  /**
   * Desativa o modo degradado para um serviço específico
   * @param service Nome do serviço a sair do modo degradado
   */
  deactivateDegradedModeForService(service: string): void {
    if (this.degradedServices.has(service)) {
      this.degradedServices.delete(service);
      log(`Modo degradado desativado para o serviço ${service}`, "resilience-service");
      
      // Se não há mais serviços em modo degradado, desativar modo degradado geral
      if (this.degradedMode && this.degradedServices.size === 0) {
        this.degradedMode = false;
        log("Modo degradado do sistema desativado", "resilience-service");
      }
    }
  }
  
  /**
   * Verifica se um serviço está em modo degradado
   * @param service Nome do serviço
   * @returns true se estiver em modo degradado, false caso contrário
   */
  isServiceInDegradedMode(service: string): boolean {
    return this.degradedServices.has(service);
  }
  
  /**
   * Verifica se o sistema está em modo degradado
   * @returns true se estiver em modo degradado, false caso contrário
   */
  isSystemInDegradedMode(): boolean {
    return this.degradedMode;
  }
  
  /**
   * Processa um erro de serviço e decide se deve ativar o modo degradado
   * @param service Nome do serviço que apresentou erro
   * @param errorMessage Mensagem de erro
   * @param errorType Tipo de erro
   * @returns Um objeto com informações sobre a ação tomada
   */
  handleServiceError(
    service: string, 
    errorMessage: string, 
    errorType: 'timeout' | 'connection' | 'authentication' | 'availability' | 'other' = 'other'
  ): { 
    degradedModeActivated: boolean;
    action: string;
    recoveryScheduled: boolean;
  } {
    // Incrementar contador de tentativas de recuperação
    const currentAttempts = this.recoveryAttempts.get(service) || 0;
    this.recoveryAttempts.set(service, currentAttempts + 1);
    
    // Decidir se ativa o modo degradado com base no tipo de erro e número de tentativas
    let shouldActivateDegradedMode = false;
    let recoveryScheduled = false;
    let action = "Nenhuma ação necessária";
    
    if (errorType === 'timeout' && currentAttempts >= 2) {
      shouldActivateDegradedMode = true;
      action = "Ativado modo degradado devido a múltiplos timeouts";
    } else if (errorType === 'connection' && currentAttempts >= 1) {
      shouldActivateDegradedMode = true;
      action = "Ativado modo degradado devido a erro de conexão";
    } else if (errorType === 'authentication' && currentAttempts >= 2) {
      shouldActivateDegradedMode = true;
      action = "Ativado modo degradado devido a falhas de autenticação persistentes";
    } else if (errorType === 'availability' && currentAttempts >= 1) {
      shouldActivateDegradedMode = true;
      action = "Ativado modo degradado devido a serviço indisponível";
    } else if (currentAttempts >= this.maxRecoveryAttempts) {
      shouldActivateDegradedMode = true;
      action = "Ativado modo degradado após exceder número máximo de tentativas";
    }
    
    if (shouldActivateDegradedMode) {
      this.activateDegradedModeForService(service, errorMessage);
      
      // Agendar tentativa de recuperação automática
      this.scheduleRecoveryAttempt(service);
      recoveryScheduled = true;
    }
    
    return {
      degradedModeActivated: shouldActivateDegradedMode,
      action,
      recoveryScheduled
    };
  }
  
  /**
   * Agenda uma tentativa de recuperação para um serviço em modo degradado
   * @param service Nome do serviço
   * @param delayMs Tempo em ms para tentar a recuperação (padrão: 5 minutos)
   */
  private scheduleRecoveryAttempt(service: string, delayMs: number = 5 * 60 * 1000): void {
    log(`Agendando tentativa de recuperação para o serviço ${service} em ${delayMs / 1000} segundos`, "resilience-service");
    
    setTimeout(async () => {
      log(`Executando tentativa de recuperação para o serviço ${service}`, "resilience-service");
      
      try {
        // Executar teste para verificar se o serviço está funcionando
        const result = await this.runTest(service);
        
        if (result.success) {
          log(`Recuperação bem-sucedida para o serviço ${service}`, "resilience-service");
          this.deactivateDegradedModeForService(service);
          this.recoveryAttempts.set(service, 0); // Resetar contador de tentativas
        } else {
          log(`Falha na recuperação do serviço ${service}: ${result.errorMessage}`, "resilience-service");
          
          // Tentar novamente com um intervalo maior (exponential backoff)
          const currentAttempts = this.recoveryAttempts.get(service) || 0;
          if (currentAttempts < this.maxRecoveryAttempts * 2) { // Permitir mais tentativas de recuperação
            const nextDelay = Math.min(delayMs * 2, 60 * 60 * 1000); // No máximo 1 hora
            this.scheduleRecoveryAttempt(service, nextDelay);
          } else {
            log(`Número máximo de tentativas de recuperação excedido para o serviço ${service}`, "resilience-service");
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro durante tentativa de recuperação para o serviço ${service}: ${errorMessage}`, "resilience-service");
        
        // Tentar novamente com um intervalo maior
        const nextDelay = Math.min(delayMs * 2, 60 * 60 * 1000);
        this.scheduleRecoveryAttempt(service, nextDelay);
      }
    }, delayMs);
  }
}

// Instância única do serviço de resiliência
export const resilienceService = new ResilienceService();