import { log } from '../vite';
import { MistralAIService } from './mistral';
import { HuggingFaceService } from './huggingface';
import { OpenAIService } from './openai';
import { GeminiService } from './gemini';

// Tipos compartilhados com os serviços de IA
interface ScriptGenerationOptions {
  theme: string;
  targetAudience?: string;
  duration?: number;
  tone?: string;
  keywords?: string[];
  additionalInstructions?: string;
}

interface ContentGenerationOptions {
  title?: boolean;
  description?: boolean;
  hashtags?: boolean;
  count?: number;
}

interface GeneratedScript {
  title: string;
  introduction: string;
  mainPoints: string[];
  conclusion: string;
  fullScript: string;
}

interface GeneratedContent {
  title?: string;
  description?: string;
  hashtags?: string[];
}

/**
 * Serviço orquestrador de IA que gerencia múltiplos provedores 
 * com sistema automático de fallback.
 * 
 * Este serviço tenta cada provedor de IA em sequência até obter uma resposta válida.
 */
export class AIOrchestrator {
  private mistralService?: MistralAIService;
  private huggingfaceService?: HuggingFaceService;
  private openaiService?: OpenAIService;
  private geminiService?: GeminiService;

  // Lista de erros para diagnóstico
  private errors: Record<string, string> = {};

  constructor(
    mistralApiKey?: string,
    huggingfaceApiKey?: string,
    openaiApiKey?: string,
    geminiApiKey?: string
  ) {
    // Inicializar cada serviço se a chave de API correspondente estiver disponível
    if (mistralApiKey) {
      try {
        this.mistralService = new MistralAIService(mistralApiKey);
        log('Serviço Mistral AI inicializado com sucesso', 'ai-orchestrator');
      } catch (error) {
        log(`Erro ao inicializar Mistral AI: ${error}`, 'ai-orchestrator');
      }
    }

    if (huggingfaceApiKey) {
      try {
        this.huggingfaceService = new HuggingFaceService(huggingfaceApiKey);
        log('Serviço HuggingFace inicializado com sucesso', 'ai-orchestrator');
      } catch (error) {
        log(`Erro ao inicializar HuggingFace: ${error}`, 'ai-orchestrator');
      }
    }

    if (openaiApiKey) {
      try {
        this.openaiService = new OpenAIService(openaiApiKey);
        log('Serviço OpenAI inicializado com sucesso', 'ai-orchestrator');
      } catch (error) {
        log(`Erro ao inicializar OpenAI: ${error}`, 'ai-orchestrator');
      }
    }

    if (geminiApiKey) {
      try {
        this.geminiService = new GeminiService(geminiApiKey);
        log('Serviço Gemini inicializado com sucesso', 'ai-orchestrator');
      } catch (error) {
        log(`Erro ao inicializar Gemini: ${error}`, 'ai-orchestrator');
      }
    }
  }

  /**
   * Gera um roteiro de vídeo usando múltiplos serviços de IA com fallback automático
   */
  async generateVideoScript(options: ScriptGenerationOptions): Promise<GeneratedScript> {
    // Limpa o registro de erros anteriores
    this.errors = {};
    
    // Cria uma cópia do tema para usar em fallbacks locais
    const fallbackTitle = `Vídeo sobre ${options.theme}`;
    
    // 1. Tenta com Mistral AI (mais completo para roteiros em português)
    if (this.mistralService) {
      try {
        log(`Tentando gerar roteiro com Mistral AI: ${options.theme}`, 'ai-orchestrator');
        const result = await this.mistralService.generateVideoScript(options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao gerar roteiro com Mistral AI: ${errorMessage}`, 'ai-orchestrator');
        this.errors['mistral'] = errorMessage;
      }
    }

    // 2. Tenta com HuggingFace
    if (this.huggingfaceService) {
      try {
        log(`Tentando gerar roteiro com HuggingFace: ${options.theme}`, 'ai-orchestrator');
        const result = await this.huggingfaceService.generateVideoScript(options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao gerar roteiro com HuggingFace: ${errorMessage}`, 'ai-orchestrator');
        this.errors['huggingface'] = errorMessage;
      }
    }

    // 3. Tenta com OpenAI (se disponível)
    if (this.openaiService) {
      try {
        log(`Tentando gerar roteiro com OpenAI: ${options.theme}`, 'ai-orchestrator');
        const result = await this.openaiService.generateVideoScript(options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao gerar roteiro com OpenAI: ${errorMessage}`, 'ai-orchestrator');
        this.errors['openai'] = errorMessage;
      }
    }

    // 4. Tenta com Gemini (se disponível)
    if (this.geminiService) {
      try {
        log(`Tentando gerar roteiro com Gemini: ${options.theme}`, 'ai-orchestrator');
        const result = await this.geminiService.generateVideoScript(options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao gerar roteiro com Gemini: ${errorMessage}`, 'ai-orchestrator');
        this.errors['gemini'] = errorMessage;
      }
    }

    // 5. Se todas as opções falharem, usar um roteiro básico baseado no tema
    log('Todos os serviços de IA falharam. Usando roteiro de emergência.', 'ai-orchestrator');
    
    const { 
      theme, 
      targetAudience = "geral", 
      duration = 60, 
      tone = "informativo",
      keywords = []
    } = options;
    
    // Roteiro básico de emergência com estrutura mínima
    return {
      title: fallbackTitle,
      introduction: `Bem-vindo a este vídeo sobre ${theme} para o público ${targetAudience}.`,
      mainPoints: [
        `${theme} é um tópico importante para considerar.`,
        `Existem vários aspectos a serem considerados sobre ${theme}.`,
        keywords.length > 0 ? `Alguns pontos-chave incluem: ${keywords.join(', ')}.` : `Vamos explorar mais sobre ${theme}.`
      ],
      conclusion: `Obrigado por assistir este vídeo sobre ${theme}. Não se esqueça de deixar seu comentário e se inscrever para mais conteúdo.`,
      fullScript: `Bem-vindo a este vídeo sobre ${theme} para o público ${targetAudience}.\n\n${theme} é um tópico importante para considerar.\nExistem vários aspectos a serem considerados sobre ${theme}.\n${keywords.length > 0 ? `Alguns pontos-chave incluem: ${keywords.join(', ')}.` : `Vamos explorar mais sobre ${theme}.`}\n\nObrigado por assistir este vídeo sobre ${theme}. Não se esqueça de deixar seu comentário e se inscrever para mais conteúdo.`
    };
  }

  /**
   * Gera conteúdo para mídias sociais usando múltiplos serviços de IA com fallback automático
   */
  async generateSocialMediaContent(
    videoScript: string,
    options: ContentGenerationOptions = {}
  ): Promise<GeneratedContent> {
    // Limpa o registro de erros anteriores
    this.errors = {};
    
    // Extrai o título provável do roteiro (primeira linha ou primeiras palavras)
    const scriptLines = videoScript.split('\n').filter(line => line.trim());
    const probableTitle = scriptLines[0]?.substring(0, 40) || 'Novo vídeo';
    
    // 1. Tenta com Mistral AI
    if (this.mistralService) {
      try {
        log(`Tentando gerar conteúdo para redes sociais com Mistral AI`, 'ai-orchestrator');
        const result = await this.mistralService.generateSocialMediaContent(videoScript, options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao gerar conteúdo com Mistral AI: ${errorMessage}`, 'ai-orchestrator');
        this.errors['mistral'] = errorMessage;
      }
    }

    // 2. Tenta com HuggingFace
    if (this.huggingfaceService) {
      try {
        log(`Tentando gerar conteúdo para redes sociais com HuggingFace`, 'ai-orchestrator');
        const result = await this.huggingfaceService.generateSocialMediaContent(videoScript, options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao gerar conteúdo com HuggingFace: ${errorMessage}`, 'ai-orchestrator');
        this.errors['huggingface'] = errorMessage;
      }
    }

    // 3. Tenta com OpenAI (se disponível)
    if (this.openaiService) {
      try {
        log(`Tentando gerar conteúdo para redes sociais com OpenAI`, 'ai-orchestrator');
        const result = await this.openaiService.generateSocialMediaContent(videoScript, options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao gerar conteúdo com OpenAI: ${errorMessage}`, 'ai-orchestrator');
        this.errors['openai'] = errorMessage;
      }
    }

    // 4. Tenta com Gemini (se disponível)
    if (this.geminiService) {
      try {
        log(`Tentando gerar conteúdo para redes sociais com Gemini`, 'ai-orchestrator');
        const result = await this.geminiService.generateSocialMediaContent(videoScript, options);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao gerar conteúdo com Gemini: ${errorMessage}`, 'ai-orchestrator');
        this.errors['gemini'] = errorMessage;
      }
    }

    // 5. Se todas as opções falharem, criar um conteúdo básico a partir do roteiro
    log('Todos os serviços de IA falharam. Usando geração de conteúdo de emergência.', 'ai-orchestrator');
    
    const { 
      title = true, 
      description = true, 
      hashtags = true, 
      count = 5 
    } = options;
    
    const scriptWords = videoScript.split(' ');
    
    // Extrair possíveis hashtags do roteiro (palavras com mais de 4 letras)
    const possibleTags = scriptWords
      .filter(word => word.length > 4)
      .map(word => word.replace(/[^a-zA-Z0-9áàâãéèêíìóòôõúùûç]/g, ''))
      .filter(word => word.length > 4)
      .slice(0, count);
    
    // Remover duplicados
    const uniqueTags = [...new Set(possibleTags)];
    
    // Construir resultado de emergência
    return {
      title: title ? probableTitle : undefined,
      description: description ? `Confira este vídeo sobre ${scriptLines[0] || 'este tema interessante'}. Não deixe de curtir e compartilhar!` : undefined,
      hashtags: hashtags ? uniqueTags : undefined
    };
  }

  /**
   * Sugere tópicos em tendência baseados em um tema usando múltiplos serviços de IA com fallback automático
   */
  async suggestTrendingTopics(theme: string, count: number = 5): Promise<string[]> {
    // Limpa o registro de erros anteriores
    this.errors = {};
    
    // 1. Tenta com Mistral AI
    if (this.mistralService) {
      try {
        log(`Tentando sugerir tópicos com Mistral AI: ${theme}`, 'ai-orchestrator');
        const result = await this.mistralService.suggestTrendingTopics(theme, count);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao sugerir tópicos com Mistral AI: ${errorMessage}`, 'ai-orchestrator');
        this.errors['mistral'] = errorMessage;
      }
    }

    // 2. Tenta com HuggingFace
    if (this.huggingfaceService) {
      try {
        log(`Tentando sugerir tópicos com HuggingFace: ${theme}`, 'ai-orchestrator');
        const result = await this.huggingfaceService.suggestTrendingTopics(theme, count);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao sugerir tópicos com HuggingFace: ${errorMessage}`, 'ai-orchestrator');
        this.errors['huggingface'] = errorMessage;
      }
    }

    // 3. Tenta com OpenAI (se disponível)
    if (this.openaiService) {
      try {
        log(`Tentando sugerir tópicos com OpenAI: ${theme}`, 'ai-orchestrator');
        const result = await this.openaiService.suggestTrendingTopics(theme, count);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao sugerir tópicos com OpenAI: ${errorMessage}`, 'ai-orchestrator');
        this.errors['openai'] = errorMessage;
      }
    }

    // 4. Tenta com Gemini (se disponível)
    if (this.geminiService) {
      try {
        log(`Tentando sugerir tópicos com Gemini: ${theme}`, 'ai-orchestrator');
        const result = await this.geminiService.suggestTrendingTopics(theme, count);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao sugerir tópicos com Gemini: ${errorMessage}`, 'ai-orchestrator');
        this.errors['gemini'] = errorMessage;
      }
    }

    // 5. Se todas as opções falharem, cria alguns tópicos genéricos baseados no tema
    log('Todos os serviços de IA falharam. Usando sugestão de tópicos de emergência.', 'ai-orchestrator');
    
    return [
      `${theme} para iniciantes`,
      `Como melhorar seus resultados com ${theme}`,
      `${theme} em 2024: tendências e novidades`,
      `Dicas essenciais sobre ${theme}`,
      `${theme}: melhores práticas e estratégias`
    ].slice(0, count);
  }

  /**
   * Retorna uma lista de erros encontrados nas últimas operações
   */
  getLastErrors(): Record<string, string> {
    return this.errors;
  }
}