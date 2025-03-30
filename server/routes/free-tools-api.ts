/**
 * Rotas da API de Ferramentas Gratuitas
 * 
 * Este arquivo implementa os endpoints da API para o módulo de ferramentas gratuitas,
 * que fornece funcionalidades que não dependem de APIs externas.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as freeToolsModule from '../modules/free-tools';

const router = Router();

// Geração de texto genérico
router.post('/generate-text', async (req: Request, res: Response) => {
  try {
    const {
      theme,
      prompt,
      options
    } = req.body;
    
    if (!theme || !prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tema e prompt são obrigatórios' 
      });
    }
    
    const result = await freeToolsModule.generateText(theme, prompt, options);
    
    return res.json({
      content: result.content,
      usedProvider: 'local',
      usedFallback: true,
      tokensUsed: result.tokensUsed,
      estimatedDuration: result.estimatedDuration,
      requestId: result.requestId
    });
  } catch (error) {
    console.error('Erro ao gerar texto local:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao gerar texto local',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Geração de script para vídeo
router.post('/generate-script', async (req: Request, res: Response) => {
  try {
    const {
      theme,
      targetAudience,
      options
    } = req.body;
    
    if (!theme) {
      return res.status(400).json({ 
        success: false, 
        message: 'O tema é obrigatório' 
      });
    }
    
    const result = await freeToolsModule.generateVideoScript(
      theme, 
      targetAudience || 'geral',
      options
    );
    
    return res.json({
      script: result.script,
      title: result.title,
      sections: result.sections,
      usedProvider: 'local',
      usedFallback: true,
      estimatedDuration: result.estimatedDuration,
      requestId: result.requestId
    });
  } catch (error) {
    console.error('Erro ao gerar script local:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao gerar script local',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Geração de hashtags para redes sociais
router.post('/generate-hashtags', async (req: Request, res: Response) => {
  try {
    const {
      theme,
      content,
      options
    } = req.body;
    
    if (!theme || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tema e conteúdo são obrigatórios' 
      });
    }
    
    const result = await freeToolsModule.generateHashtags(theme, content, options);
    
    return res.json({
      hashtags: result.hashtags,
      categorized: result.categorized,
      usedProvider: 'local',
      usedFallback: true,
      requestId: result.requestId
    });
  } catch (error) {
    console.error('Erro ao gerar hashtags locais:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao gerar hashtags locais',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Obter estatísticas do módulo
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = freeToolsModule.getModuleStats();
    
    return res.json({
      status: 'online',
      stats,
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do módulo de ferramentas gratuitas:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao obter estatísticas',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Resetar estatísticas do módulo
router.post('/reset-stats', async (req: Request, res: Response) => {
  try {
    freeToolsModule.resetStats();
    
    return res.json({
      success: true,
      message: 'Estatísticas resetadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao resetar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao resetar estatísticas',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Verificar disponibilidade do módulo
router.get('/health', async (req: Request, res: Response) => {
  try {
    const available = freeToolsModule.checkAvailability();
    
    return res.json({
      status: available ? 'online' : 'offline',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao verificar disponibilidade',
      error: error instanceof Error ? error.stack : null
    });
  }
});

export default router;