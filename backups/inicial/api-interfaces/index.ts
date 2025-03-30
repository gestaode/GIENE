/**
 * Índice central das interfaces de API
 * 
 * Este arquivo exporta todas as interfaces de API dos diferentes módulos,
 * permitindo um ponto único de acesso para referências.
 */

export * from './content-generation-api';
export * from './video-generation-api';
export * from './social-media-api';
export * from './sales-automation-api';

/**
 * Configuração para comunicação entre microserviços
 */
export interface MicroserviceConfig {
  // URLs base para cada serviço
  baseUrls: {
    contentGeneration: string;
    videoGeneration: string;
    socialMedia: string;
    salesAutomation: string;
  };
  
  // Configurações de autenticação
  auth: {
    apiKey?: string;
    bearerToken?: string;
    clientId?: string;
    clientSecret?: string;
  };
  
  // Tempos limite em ms para cada tipo de serviço
  timeouts: {
    contentGeneration: number;
    videoGeneration: number;
    socialMedia: number;
    salesAutomation: number;
  };
  
  // Configuração de retry
  retry: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
  };
  
  // Circuit breaker pattern
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
  };
}

// Configuração padrão para desenvolvimento local
export const DEFAULT_LOCAL_CONFIG: MicroserviceConfig = {
  baseUrls: {
    contentGeneration: 'http://localhost:3001',
    videoGeneration: 'http://localhost:3002',
    socialMedia: 'http://localhost:3003',
    salesAutomation: 'http://localhost:3004'
  },
  auth: {
    apiKey: 'local-development-key'
  },
  timeouts: {
    contentGeneration: 10000,
    videoGeneration: 30000,
    socialMedia: 15000,
    salesAutomation: 10000
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000
  }
};

// Para ambiente de testes integrados (quando todos os serviços estão no mesmo servidor)
export const INTEGRATED_TEST_CONFIG: MicroserviceConfig = {
  baseUrls: {
    contentGeneration: '/api/content',
    videoGeneration: '/api/video',
    socialMedia: '/api/social-media',
    salesAutomation: '/api/sales'
  },
  auth: {},
  timeouts: {
    contentGeneration: 5000,
    videoGeneration: 15000,
    socialMedia: 5000,
    salesAutomation: 5000
  },
  retry: {
    maxRetries: 2,
    initialDelay: 500,
    backoffMultiplier: 1.5
  },
  circuitBreaker: {
    failureThreshold: 3,
    resetTimeout: 15000
  }
};