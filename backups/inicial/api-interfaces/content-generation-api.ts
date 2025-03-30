/**
 * Interface de API para o Módulo de Geração de Conteúdo
 * 
 * Este arquivo define contratos claros para as operações de geração de conteúdo,
 * permitindo que este módulo possa ser extraído como um microserviço independente.
 */

// Interfaces para requisições
export interface GenerateScriptRequest {
  theme: string;
  targetAudience?: string;
  duration?: number;
  tone?: string;
  keywords?: string[];
  additionalInstructions?: string;
  provider?: 'openai' | 'gemini' | 'mistral' | 'huggingface' | 'auto';
  useFallback?: boolean;
}

export interface GenerateContentRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  provider?: 'openai' | 'gemini' | 'mistral' | 'huggingface' | 'auto';
  format?: 'text' | 'json' | 'markdown';
  useFallback?: boolean;
}

export interface GenerateSocialMediaContentRequest {
  theme: string;
  script: string;
  platforms?: ('instagram' | 'tiktok' | 'facebook' | 'twitter' | 'youtube')[];
  contentTypes?: ('post' | 'caption' | 'hashtags' | 'description')[];
  useFallback?: boolean;
}

export interface TrendingTopicsRequest {
  theme: string;
  count?: number;
  useFallback?: boolean;
}

// Interfaces para respostas
export interface GenerateScriptResponse {
  script: string;
  title?: string;
  sections?: string[];
  usedProvider: string;
  usedFallback: boolean;
  estimatedDuration?: number;
  requestId: string;
}

export interface GenerateContentResponse {
  content: string;
  usedProvider: string;
  usedFallback: boolean;
  tokensUsed?: number;
  requestId: string;
}

export interface GenerateSocialMediaContentResponse {
  content: {
    instagram?: {
      caption?: string;
      hashtags?: string[];
    };
    tiktok?: {
      caption?: string;
      hashtags?: string[];
    };
    facebook?: {
      post?: string;
      hashtags?: string[];
    };
    twitter?: {
      tweet?: string;
      hashtags?: string[];
    };
    youtube?: {
      title?: string;
      description?: string;
      tags?: string[];
    };
  };
  usedProvider: string;
  usedFallback: boolean;
  requestId: string;
}

export interface TrendingTopicsResponse {
  topics: string[];
  usedProvider: string;
  usedFallback: boolean;
  requestId: string;
}

// Interface de status do serviço
export interface ServiceStatusResponse {
  status: 'online' | 'degraded' | 'offline';
  providers: {
    openai: {
      available: boolean;
      status: string;
    };
    gemini: {
      available: boolean;
      status: string;
    };
    mistral: {
      available: boolean;
      status: string;
    };
    huggingface: {
      available: boolean;
      status: string;
    };
  };
  fallbackAvailable: boolean;
  cacheStatus: {
    size: number;
    hits: number;
    misses: number;
  };
  version: string;
}

// URLs de endpoints
export const CONTENT_API_ENDPOINTS = {
  generateScript: '/api/content/script',
  generateContent: '/api/content/generate',
  generateSocialMedia: '/api/content/social-media',
  trendingTopics: '/api/content/trending-topics',
  status: '/api/content/status'
};