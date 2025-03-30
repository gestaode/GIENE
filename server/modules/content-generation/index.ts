/**
 * Módulo de Geração de Conteúdo
 * 
 * Este módulo é responsável por gerenciar todas as operações relacionadas à geração de conteúdo,
 * incluindo textos, scripts, roteiros e outros materiais de marketing.
 * 
 * Características principais:
 * - Interface unificada para geração de conteúdo
 * - Suporte a múltiplos provedores de IA (OpenAI, Gemini, Mistral, HuggingFace)
 * - Sistema de fallback e resiliência para garantir operação contínua
 * - Cache de conteúdo para otimizar desempenho e reduzir custos
 */

import { log } from '../../vite';
import { OpenAIService } from '../../services/openai';
import { GeminiService } from '../../services/gemini';
import { MistralAIService } from '../../services/mistral';
import { HuggingFaceService } from '../../services/huggingface';
import { AIOrchestrator } from '../../services/AIOrchestrator';
import { localFallbackService } from '../../services/local-fallback';
import { cacheService } from '../../services/caching';

/**
 * Classe principal do módulo de geração de conteúdo
 */
export class ContentGenerationModule {
  private aiOrchestrator: AIOrchestrator;
  private openaiService: OpenAIService | null = null;
  private geminiService: GeminiService | null = null;
  private mistralService: MistralAIService | null = null;
  private huggingfaceService: HuggingFaceService | null = null;

  constructor() {
    log('Inicializando módulo de geração de conteúdo', 'content-module');
    
    // Carregar serviços de IA se as chaves de API estiverem disponíveis
    if (process.env.OPENAI_API_KEY) {
      this.openaiService = new OpenAIService(process.env.OPENAI_API_KEY);
    }
    
    if (process.env.GOOGLE_AI_API_KEY) {
      this.geminiService = new GeminiService(process.env.GOOGLE_AI_API_KEY);
    }
    
    if (process.env.MISTRAL_API_KEY) {
      this.mistralService = new MistralAIService(process.env.MISTRAL_API_KEY);
    }
    
    if (process.env.HUGGINGFACE_API_KEY) {
      this.huggingfaceService = new HuggingFaceService(process.env.HUGGINGFACE_API_KEY);
    }
    
    // Inicializar o orquestrador de IA
    this.aiOrchestrator = new AIOrchestrator(
      process.env.MISTRAL_API_KEY || '',
      process.env.HUGGINGFACE_API_KEY || '',
      process.env.OPENAI_API_KEY || '',
      process.env.GOOGLE_AI_API_KEY || ''
    );
  }

  /**
   * Gera um roteiro de vídeo com base nos parâmetros fornecidos
   */
  async generateVideoScript(options: {
    theme: string;
    targetAudience: string;
    duration: number;
    tone: string;
    keywords: string[];
    additionalInstructions?: string;
  }, cacheEnabled: boolean = true): Promise<any> {
    const { theme, targetAudience, duration, tone, keywords, additionalInstructions } = options;
    
    // Verificar parâmetros obrigatórios
    if (!theme || !targetAudience || !duration || !tone || !keywords) {
      throw new Error('Parâmetros obrigatórios estão faltando');
    }
    
    log(`Gerando roteiro de vídeo para tema: ${theme}`, 'content-module');
    
    // Usar cache se estiver habilitado
    if (cacheEnabled) {
      const cacheKey = `script:${theme}:${targetAudience}:${duration}:${tone}`;
      
      return cacheService.wrap(
        cacheKey,
        { theme, targetAudience, duration, tone, keywords, additionalInstructions },
        async () => {
          try {
            // Tentar gerar com o orquestrador de IA com timeout
            const resultPromise = this.aiOrchestrator.generateVideoScript({
              theme,
              targetAudience, 
              duration,
              tone,
              keywords,
              additionalInstructions
            });
            
            // Criar uma versão da promise com timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Timeout ao gerar roteiro com APIs externas")), 10000);
            });
            
            // Competição entre a geração e o timeout
            return await Promise.race([resultPromise, timeoutPromise]);
          } catch (apiError) {
            // Em caso de erro ou timeout, usar o fallback local
            console.log(`Usando fallback local após erro nas APIs: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
            
            const fallbackResult = await localFallbackService.generateVideoScript({
              theme,
              targetAudience,
              duration,
              tone,
              keywords,
              additionalInstructions
            });
            
            // Adicionar flag indicando uso de fallback para rastreamento
            return {
              ...fallbackResult,
              usedFallback: true
            };
          }
        },
        3600 // Cache válido por 1 hora
      );
    } else {
      // Execução sem cache
      try {
        return await this.aiOrchestrator.generateVideoScript({
          theme,
          targetAudience,
          duration,
          tone,
          keywords,
          additionalInstructions
        });
      } catch (apiError) {
        console.log(`Usando fallback local após erro nas APIs: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        
        const fallbackResult = await localFallbackService.generateVideoScript({
          theme,
          targetAudience,
          duration,
          tone,
          keywords,
          additionalInstructions
        });
        
        return {
          ...fallbackResult,
          usedFallback: true
        };
      }
    }
  }

  /**
   * Gera conteúdo para redes sociais com base em um roteiro de vídeo
   */
  async generateSocialMediaContent(videoScript: string, options: any, cacheEnabled: boolean = true): Promise<any> {
    if (!videoScript) {
      throw new Error('O roteiro de vídeo é obrigatório');
    }
    
    log(`Gerando conteúdo para redes sociais a partir de roteiro`, 'content-module');
    
    // Usar cache se estiver habilitado
    if (cacheEnabled) {
      const scriptHash = Buffer.from(videoScript).toString('base64').substring(0, 20);
      const cacheKey = `social:${scriptHash}`;
      
      return cacheService.wrap(
        cacheKey,
        { videoScript, options },
        async () => {
          try {
            // Tente gerar com o orquestrador de IA com timeout
            const resultPromise = this.aiOrchestrator.generateSocialMediaContent(videoScript, options);
            
            // Criar uma versão da promise com timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Timeout ao gerar conteúdo para redes sociais com APIs externas")), 5000);
            });
            
            // Competição entre a geração e o timeout
            return await Promise.race([resultPromise, timeoutPromise]);
          } catch (apiError) {
            // Em caso de erro ou timeout, usar o fallback local
            console.log(`Usando fallback local para conteúdo social após erro nas APIs: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
            
            const fallbackResult = await localFallbackService.generateSocialMediaContent(videoScript, options);
            
            // Adicionar flag indicando uso de fallback para rastreamento
            return {
              ...fallbackResult,
              usedFallback: true
            };
          }
        },
        3600 // Cache válido por 1 hora
      );
    } else {
      // Execução sem cache
      try {
        return await this.aiOrchestrator.generateSocialMediaContent(videoScript, options);
      } catch (apiError) {
        console.log(`Usando fallback local para conteúdo social após erro nas APIs: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        
        const fallbackResult = await localFallbackService.generateSocialMediaContent(videoScript, options);
        
        return {
          ...fallbackResult,
          usedFallback: true
        };
      }
    }
  }

  /**
   * Obtém tópicos em tendência para um determinado tema
   */
  async getTrendingTopics(theme: string, count: number = 5, cacheEnabled: boolean = true): Promise<any> {
    if (!theme) {
      throw new Error('O tema é obrigatório');
    }
    
    log(`Obtendo tópicos em tendência para tema: ${theme}`, 'content-module');
    
    // Usar cache se estiver habilitado
    if (cacheEnabled) {
      const cacheKey = `trending:${theme}:${count}`;
      
      return cacheService.wrap(
        cacheKey,
        { theme, count },
        async () => {
          try {
            // Tente gerar com o orquestrador de IA com timeout
            const resultPromise = this.aiOrchestrator.suggestTrendingTopics(theme, count);
            
            // Criar uma versão da promise com timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Timeout ao buscar tópicos em tendência com APIs externas")), 5000);
            });
            
            // Competição entre a geração e o timeout
            return await Promise.race([resultPromise, timeoutPromise]);
          } catch (apiError) {
            // Em caso de erro ou timeout, usar o fallback local
            console.log(`Usando fallback local para tópicos em tendência após erro nas APIs: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
            
            const fallbackResult = await localFallbackService.suggestTrendingTopics(theme, count);
            
            // Adicionar flag indicando uso de fallback para rastreamento
            return {
              topics: fallbackResult,
              usedFallback: true
            };
          }
        },
        1800 // Cache válido por 30 minutos (tópicos em tendência mudam mais rápido)
      );
    } else {
      // Execução sem cache
      try {
        return await this.aiOrchestrator.suggestTrendingTopics(theme, count);
      } catch (apiError) {
        console.log(`Usando fallback local para tópicos em tendência após erro nas APIs: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        
        const fallbackResult = await localFallbackService.suggestTrendingTopics(theme, count);
        
        return {
          topics: fallbackResult,
          usedFallback: true
        };
      }
    }
  }

  /**
   * Obtém o status atual dos serviços de IA
   */
  getAIServicesStatus(): any {
    const errors = this.aiOrchestrator.getLastErrors();
    const hasMistral = !!process.env.MISTRAL_API_KEY;
    const hasHuggingface = !!process.env.HUGGINGFACE_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!process.env.GOOGLE_AI_API_KEY;
    
    return {
      providers: {
        mistral: { available: hasMistral, error: errors['mistral'] || null },
        huggingface: { available: hasHuggingface, error: errors['huggingface'] || null },
        openai: { available: hasOpenAI, error: errors['openai'] || null },
        gemini: { available: hasGemini, error: errors['gemini'] || null }
      },
      fallbackAvailable: true, // O sistema local de fallback está sempre disponível
      cacheStatus: cacheService.getStats()
    };
  }
}

// Exportar instância singleton do módulo
export const contentGenerationModule = new ContentGenerationModule();