/**
 * Cliente de API unificado para comunicação entre microserviços
 * 
 * Este arquivo implementa um cliente HTTP para comunicação com os diferentes
 * microserviços, com suporte a retry, circuit breaker e timeouts.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { MicroserviceConfig, DEFAULT_LOCAL_CONFIG } from '../api-interfaces';

// Estados possíveis do circuit breaker
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private resetTimeout: number;
  private failureThreshold: number;
  private nextAttempt: number = Date.now();

  constructor(config: { failureThreshold: number; resetTimeout: number }) {
    this.failureThreshold = config.failureThreshold;
    this.resetTimeout = config.resetTimeout;
  }

  public isAllowed(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    return true; // HALF_OPEN
  }

  public onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  public onFailure(): boolean {
    this.failureCount++;
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      return false; // Circuit is now open
    }
    return true; // Circuit is still closed
  }

  public getState(): CircuitState {
    return this.state;
  }
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private config: MicroserviceConfig;
  private circuitBreakers: Record<string, CircuitBreaker> = {};

  constructor(config: MicroserviceConfig = DEFAULT_LOCAL_CONFIG) {
    this.config = config;

    // Criar a instância do axios
    this.axiosInstance = axios.create({
      timeout: 10000, // Timeout padrão
    });

    // Inicializar circuit breakers
    this.initCircuitBreakers();

    // Adicionar interceptor para autenticação
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.config.auth.apiKey) {
        config.headers['X-API-Key'] = this.config.auth.apiKey;
      }
      if (this.config.auth.bearerToken) {
        config.headers['Authorization'] = `Bearer ${this.config.auth.bearerToken}`;
      }
      return config;
    });
  }

  private initCircuitBreakers(): void {
    const services = ['contentGeneration', 'videoGeneration', 'socialMedia', 'salesAutomation'];
    
    for (const service of services) {
      this.circuitBreakers[service] = new CircuitBreaker({
        failureThreshold: this.config.circuitBreaker.failureThreshold,
        resetTimeout: this.config.circuitBreaker.resetTimeout
      });
    }
  }

  private getServiceFromUrl(url: string): string {
    if (url.includes('/api/content') || url.includes(this.config.baseUrls.contentGeneration)) {
      return 'contentGeneration';
    }
    if (url.includes('/api/video') || url.includes(this.config.baseUrls.videoGeneration)) {
      return 'videoGeneration';
    }
    if (url.includes('/api/social-media') || url.includes(this.config.baseUrls.socialMedia)) {
      return 'socialMedia';
    }
    if (url.includes('/api/sales') || url.includes(this.config.baseUrls.salesAutomation)) {
      return 'salesAutomation';
    }
    return 'unknown';
  }

  private getTimeoutForService(service: string): number {
    switch (service) {
      case 'contentGeneration':
        return this.config.timeouts.contentGeneration;
      case 'videoGeneration':
        return this.config.timeouts.videoGeneration;
      case 'socialMedia':
        return this.config.timeouts.socialMedia;
      case 'salesAutomation':
        return this.config.timeouts.salesAutomation;
      default:
        return 10000; // Timeout padrão
    }
  }

  private async executeWithRetry<T>(
    request: () => Promise<AxiosResponse<T>>,
    service: string,
    maxRetries: number = this.config.retry.maxRetries
  ): Promise<AxiosResponse<T>> {
    let lastError: any;
    let retryCount = 0;
    let delay = this.config.retry.initialDelay;

    // Verificar se o circuit breaker permite a requisição
    if (!this.circuitBreakers[service]?.isAllowed()) {
      throw new Error(`Circuit breaker for service ${service} is open. Try again later.`);
    }

    while (retryCount <= maxRetries) {
      try {
        const response = await request();
        // Em caso de sucesso, notificar o circuit breaker
        this.circuitBreakers[service]?.onSuccess();
        return response;
      } catch (error) {
        lastError = error;
        
        // Incrementar contagem de falhas no circuit breaker
        const shouldRetry = this.circuitBreakers[service]?.onFailure();
        
        if (!shouldRetry || retryCount >= maxRetries) {
          break;
        }

        // Aguardar com exponential backoff antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= this.config.retry.backoffMultiplier;
        retryCount++;
      }
    }

    throw lastError;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const service = this.getServiceFromUrl(url);
    const timeout = this.getTimeoutForService(service);
    
    const response = await this.executeWithRetry(
      () => this.axiosInstance.get<T>(url, { ...config, timeout }),
      service
    );
    
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const service = this.getServiceFromUrl(url);
    const timeout = this.getTimeoutForService(service);
    
    const response = await this.executeWithRetry(
      () => this.axiosInstance.post<T>(url, data, { ...config, timeout }),
      service
    );
    
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const service = this.getServiceFromUrl(url);
    const timeout = this.getTimeoutForService(service);
    
    const response = await this.executeWithRetry(
      () => this.axiosInstance.put<T>(url, data, { ...config, timeout }),
      service
    );
    
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const service = this.getServiceFromUrl(url);
    const timeout = this.getTimeoutForService(service);
    
    const response = await this.executeWithRetry(
      () => this.axiosInstance.delete<T>(url, { ...config, timeout }),
      service
    );
    
    return response.data;
  }

  // Métodos específicos para cada serviço
  public contentGeneration() {
    const baseUrl = this.config.baseUrls.contentGeneration;
    
    return {
      generateScript: async (data: any) => 
        this.post(`${baseUrl}/script`, data),
      
      generateContent: async (data: any) => 
        this.post(`${baseUrl}/generate`, data),
      
      generateSocialMedia: async (data: any) => 
        this.post(`${baseUrl}/social-media`, data),
      
      getTrendingTopics: async (theme: string, count: number = 5) => 
        this.get(`${baseUrl}/trending-topics?theme=${encodeURIComponent(theme)}&count=${count}`),
      
      getStatus: async () => 
        this.get(`${baseUrl}/status`)
    };
  }

  public videoGeneration() {
    const baseUrl = this.config.baseUrls.videoGeneration;
    
    return {
      generateVideo: async (data: any) => 
        this.post(`${baseUrl}/generate`, data),
      
      createFromImages: async (data: any) => 
        this.post(`${baseUrl}/create-from-images`, data),
      
      addAudioToVideo: async (data: any) => 
        this.post(`${baseUrl}/add-audio`, data),
      
      getVideoStatus: async (videoId: string) => 
        this.get(`${baseUrl}/status?videoId=${videoId}`),
      
      listVideos: async (status?: string, page: number = 1, limit: number = 10) => {
        let url = `${baseUrl}/list?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return this.get(url);
      },
      
      testFfmpeg: async () => 
        this.get(`${baseUrl}/test-ffmpeg`),
      
      getServiceStatus: async () => 
        this.get(`${baseUrl}/service-status`)
    };
  }

  public socialMedia() {
    const baseUrl = this.config.baseUrls.socialMedia;
    
    return {
      schedulePost: async (data: any) => 
        this.post(`${baseUrl}/posts/schedule`, data),
      
      listPosts: async (status?: string, platform?: string, page: number = 1, limit: number = 10) => {
        let url = `${baseUrl}/posts?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        if (platform) url += `&platform=${platform}`;
        return this.get(url);
      },
      
      getPostStatus: async (postId: string) => 
        this.get(`${baseUrl}/posts/status?postId=${postId}`),
      
      cancelPost: async (postId: string) => 
        this.post(`${baseUrl}/posts/cancel`, { postId }),
      
      updatePost: async (data: any) => 
        this.put(`${baseUrl}/posts/update`, data),
      
      getServiceStatus: async () => 
        this.get(`${baseUrl}/status`)
    };
  }

  public salesAutomation() {
    const baseUrl = this.config.baseUrls.salesAutomation;
    
    return {
      // Leads
      createLead: async (data: any) => 
        this.post(`${baseUrl}/leads`, data),
      
      getLeads: async (page: number = 1, limit: number = 10) => 
        this.get(`${baseUrl}/leads?page=${page}&limit=${limit}`),
      
      // Segments
      createSegment: async (data: any) => 
        this.post(`${baseUrl}/segments`, data),
      
      getSegments: async () => 
        this.get(`${baseUrl}/segments`),
      
      addToSegment: async (segmentId: string, leadIds: string[]) => 
        this.post(`${baseUrl}/segments/${segmentId}/add`, { leadIds }),
      
      // Email Campaigns
      createEmailCampaign: async (data: any) => 
        this.post(`${baseUrl}/campaigns`, data),
      
      getEmailCampaigns: async () => 
        this.get(`${baseUrl}/campaigns`),
      
      sendTestEmail: async (campaignId: string, testEmails: string[]) => 
        this.post(`${baseUrl}/campaigns/${campaignId}/test`, { testEmails }),
      
      // Funnels
      createFunnel: async (data: any) => 
        this.post(`${baseUrl}/funnels`, data),
      
      getFunnels: async () => 
        this.get(`${baseUrl}/funnels`),
      
      // Status
      getServiceStatus: async () => 
        this.get(`${baseUrl}/status`)
    };
  }
}

// Exportar uma instância padrão para uso em ambiente integrado
export const apiClient = new ApiClient(DEFAULT_LOCAL_CONFIG);

// Para microserviços separados, criar instâncias específicas com configurações adequadas
export const createApiClient = (config: MicroserviceConfig): ApiClient => {
  return new ApiClient(config);
};