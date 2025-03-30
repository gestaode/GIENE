/**
 * API de Tendências do TikTok
 * 
 * Este módulo expõe endpoints para acesso às tendências detectadas do TikTok,
 * incluindo hashtags populares, sons em alta e desafios virais.
 */

import express from 'express';
import { log } from '../vite';
import { 
  getTrendingHashtags, 
  getTrendingSounds, 
  getTrendingChallenges,
  getAllTrends,
  getModuleStats,
  resetStats
} from '../modules/trends/tiktok-trends';

const router = express.Router();

/**
 * GET /api/tiktok-trends/hashtags
 * Retorna hashtags populares no TikTok
 * 
 * Query params:
 * - category: opcional, filtra por categoria
 * - limit: opcional, limita o número de resultados
 */
router.get('/hashtags', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const result = await getTrendingHashtags(category, limit);
    
    res.json({
      success: true,
      data: result.trends,
      meta: {
        source: result.source,
        count: result.trends.length,
        requestId: result.requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    log(`Erro ao obter hashtags populares: ${error}`, 'error');
    res.status(500).json({
      success: false,
      error: 'Erro ao obter tendências',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/tiktok-trends/sounds
 * Retorna sons/músicas em alta no TikTok
 * 
 * Query params:
 * - limit: opcional, limita o número de resultados
 */
router.get('/sounds', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const result = await getTrendingSounds(limit);
    
    res.json({
      success: true,
      data: result.trends,
      meta: {
        source: result.source,
        count: result.trends.length,
        requestId: result.requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    log(`Erro ao obter sons populares: ${error}`, 'error');
    res.status(500).json({
      success: false,
      error: 'Erro ao obter tendências de sons',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/tiktok-trends/challenges
 * Retorna desafios populares no TikTok
 * 
 * Query params:
 * - limit: opcional, limita o número de resultados
 */
router.get('/challenges', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const result = await getTrendingChallenges(limit);
    
    res.json({
      success: true,
      data: result.trends,
      meta: {
        source: result.source,
        count: result.trends.length,
        requestId: result.requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    log(`Erro ao obter desafios populares: ${error}`, 'error');
    res.status(500).json({
      success: false,
      error: 'Erro ao obter tendências de desafios',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/tiktok-trends/all
 * Retorna todas as tendências (hashtags, sons e desafios)
 * 
 * Query params:
 * - limit: opcional, limita o número de resultados por categoria
 */
router.get('/all', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const result = await getAllTrends(limit);
    
    res.json({
      success: true,
      data: {
        hashtags: result.hashtags,
        sounds: result.sounds,
        challenges: result.challenges
      },
      meta: {
        sources: result.sources,
        counts: {
          hashtags: result.hashtags.length,
          sounds: result.sounds.length,
          challenges: result.challenges.length
        },
        requestId: result.requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    log(`Erro ao obter tendências: ${error}`, 'error');
    res.status(500).json({
      success: false,
      error: 'Erro ao obter todas as tendências',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/tiktok-trends/stats
 * Retorna estatísticas do módulo de tendências
 * Acesso restrito a administradores
 */
router.get('/stats', (req, res) => {
  try {
    // Em produção, adicionar verificação de autenticação/autorização
    const stats = getModuleStats();
    
    res.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    log(`Erro ao obter estatísticas do módulo: ${error}`, 'error');
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/tiktok-trends/reset-stats
 * Reseta as estatísticas do módulo
 * Acesso restrito a administradores
 */
router.post('/reset-stats', (req, res) => {
  try {
    // Em produção, adicionar verificação de autenticação/autorização
    resetStats();
    
    res.json({
      success: true,
      message: 'Estatísticas resetadas com sucesso',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    log(`Erro ao resetar estatísticas: ${error}`, 'error');
    res.status(500).json({
      success: false,
      error: 'Erro ao resetar estatísticas',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;