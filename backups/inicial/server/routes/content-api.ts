/**
 * Rotas da API de Geração de Conteúdo
 * 
 * Este arquivo implementa os endpoints da API para o módulo de geração de conteúdo.
 * Pode ser usado tanto como parte do aplicativo monolítico quanto como um serviço independente.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { contentGenerationModule } from '../modules/content-generation';
import { GenerateScriptRequest, GenerateContentRequest, GenerateSocialMediaContentRequest, TrendingTopicsRequest } from '../../api-interfaces/content-generation-api';

const router = Router();

// Geração de script para vídeo
router.post('/script', async (req: Request, res: Response) => {
  try {
    const {
      theme,
      targetAudience,
      duration,
      tone,
      keywords,
      additionalInstructions,
      provider,
      useFallback = true
    } = req.body as GenerateScriptRequest;
    
    if (!theme) {
      return res.status(400).json({ 
        success: false, 
        message: 'O tema é obrigatório' 
      });
    }
    
    const requestId = uuidv4();
    
    const result = await contentGenerationModule.generateVideoScript({
      theme,
      targetAudience: targetAudience || 'geral',
      duration: duration || 60,
      tone: tone || 'informativo',
      keywords: keywords || [],
      additionalInstructions
    }, useFallback);
    
    return res.json({
      script: result.script || result.content,
      title: result.title,
      sections: result.sections,
      usedProvider: result.provider || 'fallback',
      usedFallback: result.usedFallback || false,
      estimatedDuration: duration,
      requestId
    });
  } catch (error) {
    console.error('Erro ao gerar script:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao gerar script',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Geração de conteúdo genérico
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      maxTokens,
      temperature,
      provider,
      format,
      useFallback = true
    } = req.body as GenerateContentRequest;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'O prompt é obrigatório' 
      });
    }
    
    const requestId = uuidv4();
    const formattedPrompt = format === 'json' 
      ? `${prompt}\n\nResponda em formato JSON.` 
      : prompt;
    
    const content = await contentGenerationModule.generateContent(formattedPrompt, {
      maxTokens,
      temperature,
      topic: 'geral'
    });
    
    return res.json({
      content,
      usedProvider: 'auto', // Na implementação real, viria do módulo
      usedFallback: false,   // Na implementação real, viria do módulo
      tokensUsed: Math.floor(content.length / 4), // Estimativa simples
      requestId
    });
  } catch (error) {
    console.error('Erro ao gerar conteúdo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao gerar conteúdo',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Geração de conteúdo para redes sociais
router.post('/social-media', async (req: Request, res: Response) => {
  try {
    const {
      theme,
      script,
      platforms,
      contentTypes,
      useFallback = true
    } = req.body as GenerateSocialMediaContentRequest;
    
    if (!theme || !script) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tema e script são obrigatórios' 
      });
    }
    
    const requestId = uuidv4();
    
    const options = {
      platforms: platforms || ['instagram', 'tiktok'],
      contentTypes: contentTypes || ['caption', 'hashtags']
    };
    
    const result = await contentGenerationModule.generateSocialMediaContent(script, options);
    
    // Estruturar a resposta de acordo com a interface
    const responseContent: any = {};
    
    // Na implementação real, isso seria processado de forma mais adequada
    // Aqui é apenas uma adaptação simples
    if (result.instagram) {
      responseContent.instagram = result.instagram;
    }
    
    if (result.tiktok) {
      responseContent.tiktok = result.tiktok;
    }
    
    return res.json({
      content: responseContent,
      usedProvider: result.provider || 'auto',
      usedFallback: result.usedFallback || false,
      requestId
    });
  } catch (error) {
    console.error('Erro ao gerar conteúdo para redes sociais:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao gerar conteúdo para redes sociais',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Obtenção de tópicos em tendência
router.get('/trending-topics', async (req: Request, res: Response) => {
  try {
    const theme = req.query.theme as string;
    const count = parseInt(req.query.count as string || '5');
    const useFallback = req.query.useFallback !== 'false';
    
    if (!theme) {
      return res.status(400).json({ 
        success: false, 
        message: 'O tema é obrigatório' 
      });
    }
    
    const requestId = uuidv4();
    
    const result = await contentGenerationModule.getTrendingTopics(theme, count, useFallback);
    
    return res.json({
      topics: Array.isArray(result) ? result : result.topics,
      usedProvider: result.provider || 'auto',
      usedFallback: result.usedFallback || false,
      requestId
    });
  } catch (error) {
    console.error('Erro ao obter tópicos em tendência:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao obter tópicos em tendência',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Status do serviço
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = contentGenerationModule.getAIServicesStatus();
    
    return res.json({
      status: status.providers.openai.available || 
             status.providers.mistral.available || 
             status.providers.huggingface.available || 
             status.providers.gemini.available
               ? 'online' 
               : (status.fallbackAvailable ? 'degraded' : 'offline'),
      providers: status.providers,
      fallbackAvailable: status.fallbackAvailable,
      cacheStatus: status.cacheStatus,
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao verificar status',
      error: error instanceof Error ? error.stack : null
    });
  }
});

export default router;