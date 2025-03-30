import { Mistral } from '@mistralai/mistralai';
import { log } from '../vite';

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

export class MistralAIService {
  private client: Mistral;
  private model: string = 'mistral-large-latest';  // Modelo padrão

  constructor(apiKey: string) {
    this.client = new Mistral({
      apiKey: apiKey
    });
  }

  /**
   * Generate a video script based on theme and options
   */
  async generateVideoScript(options: ScriptGenerationOptions): Promise<GeneratedScript> {
    try {
      const { 
        theme, 
        targetAudience = "geral", 
        duration = 60, 
        tone = "informativo", 
        keywords = [],
        additionalInstructions = ""
      } = options;

      // Construir um prompt para o modelo de linguagem
      const prompt = `
      Gere um roteiro de vídeo curto sobre ${theme}.
      
      Público alvo: ${targetAudience}
      Duração do vídeo: ${duration} segundos
      Tom: ${tone}
      Palavras-chave a incluir: ${keywords.join(', ')}
      Instruções adicionais: ${additionalInstructions}
      
      Por favor, estruture o roteiro da seguinte forma:
      1. Título atraente
      2. Introdução cativante (2-3 frases)
      3. Pontos principais (3-5 pontos)
      4. Conclusão com chamada para ação
      
      Responda em formato JSON conforme a estrutura abaixo:
      {
        "title": "Título do vídeo",
        "introduction": "Texto de introdução",
        "mainPoints": ["Ponto 1", "Ponto 2", "Ponto 3"],
        "conclusion": "Texto de conclusão",
        "fullScript": "Roteiro completo combinando todas as partes"
      }
      `;

      // Chamar a API do Mistral
      const response = await this.client.chat.complete({
        model: this.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 1024
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Unexpected response format from Mistral API');
      }

      try {
        // Extrair o JSON da resposta
        const jsonOutput = this.extractJsonFromText(content);
        const parsedResponse = JSON.parse(jsonOutput);
        
        return {
          title: parsedResponse.title || `Vídeo sobre ${theme}`,
          introduction: parsedResponse.introduction || '',
          mainPoints: parsedResponse.mainPoints || [],
          conclusion: parsedResponse.conclusion || '',
          fullScript: parsedResponse.fullScript || ''
        };
      } catch (parseError) {
        // Fallback para caso a resposta não seja um JSON válido
        log(`Error parsing JSON response: ${parseError}`, 'mistral');
        const lines = content.split('\n').filter(line => line.trim());

        return {
          title: lines[0] || `Vídeo sobre ${theme}`,
          introduction: lines.slice(1, 3).join('\n'),
          mainPoints: lines.slice(3, -1),
          conclusion: lines[lines.length - 1] || '',
          fullScript: lines.join('\n')
        };
      }
    } catch (error) {
      log(`Error generating video script with Mistral: ${error instanceof Error ? error.message : String(error)}`, 'mistral');
      throw error;
    }
  }

  /**
   * Generate content for social media post (titles, descriptions, hashtags)
   */
  async generateSocialMediaContent(
    videoScript: string,
    options: ContentGenerationOptions = {}
  ): Promise<GeneratedContent> {
    try {
      const { 
        title = true, 
        description = true, 
        hashtags = true, 
        count = 5 
      } = options;

      // Construir prompt para geração de conteúdo para mídias sociais
      const prompt = `
      Com base no seguinte roteiro de vídeo:
      "${videoScript}"
      
      Gere conteúdo para postagem em mídias sociais no formato JSON:
      {
        ${title ? '"title": "Título curto e atraente",' : ''}
        ${description ? '"description": "Descrição envolvente de 1-2 frases",' : ''}
        ${hashtags ? `"hashtags": ["hashtag1", "hashtag2", ... até ${count} hashtags relevantes]` : ''}
      }
      `;

      // Chamar a API do Mistral
      const response = await this.client.chat.complete({
        model: this.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 512
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Unexpected response format from Mistral API');
      }

      try {
        // Extrair o JSON da resposta
        const jsonOutput = this.extractJsonFromText(content);
        const parsedResponse = JSON.parse(jsonOutput);
        
        return {
          title: title ? parsedResponse.title : undefined,
          description: description ? parsedResponse.description : undefined,
          hashtags: hashtags ? parsedResponse.hashtags : undefined
        };
      } catch (parseError) {
        // Fallback para caso a resposta não seja um JSON válido
        log(`Error parsing JSON response: ${parseError}`, 'mistral');
        const lines = content.split('\n').filter(line => line.trim());
        
        return {
          title: title ? lines[0] : undefined,
          description: description ? lines[1] : undefined,
          hashtags: hashtags ? lines.slice(2).map(l => l.replace('#', '')) : undefined
        };
      }
    } catch (error) {
      log(`Error generating social media content with Mistral: ${error instanceof Error ? error.message : String(error)}`, 'mistral');
      throw error;
    }
  }

  /**
   * Suggest trending topics based on a theme
   */
  async suggestTrendingTopics(theme: string, count: number = 5): Promise<string[]> {
    try {
      // Construir prompt para sugestão de tópicos em tendência
      const prompt = `
      Sugira ${count} tópicos em tendência relacionados a "${theme}" para criação de conteúdo em redes sociais.
      
      Responda apenas com uma lista de tópicos, um por linha, sem numeração ou marcadores.
      `;

      // Chamar a API do Mistral
      const response = await this.client.chat.complete({
        model: this.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        maxTokens: 256
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Unexpected response format from Mistral API');
      }

      // Processar a resposta
      const topics = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, count);

      return topics;
    } catch (error) {
      log(`Error suggesting trending topics with Mistral: ${error instanceof Error ? error.message : String(error)}`, 'mistral');
      throw error;
    }
  }

  /**
   * Extract JSON from text that might have additional content
   */
  private extractJsonFromText(text: string): string {
    // Tentar encontrar um objeto JSON na string de resposta
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    return text;
  }
}