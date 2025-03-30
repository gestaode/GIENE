/**
 * Configuração central de rotas do servidor Express
 * 
 * Este arquivo configura todas as rotas do servidor Express, importando os
 * módulos de rotas específicos para cada função do sistema.
 */

import { Router, Request, Response } from 'express';
import contentApiRoutes from './routes/content-api';
import freeToolsApiRoutes from './routes/free-tools-api';
import tiktokTrendsApiRoutes from './routes/tiktok-trends-api';
import settingsApiRoutes from './routes/settings-api';
import { storage } from './storage';

// Prefixo padrão para APIs
const API_PREFIX = '/api';

const router = Router();

// Rota base para verificar se o servidor está rodando
router.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota para listar todos os vídeos
router.get(`${API_PREFIX}/videos`, async (req, res) => {
  try {
    // Para simplificar, usamos o ID 1 como ID de usuário padrão
    const videos = await storage.getVideos(1);
    res.json(videos);
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeos' });
  }
});

// Rota para criação avançada de vídeos (mock para testes)
router.post(`${API_PREFIX}/video/create-advanced`, async (req, res) => {
  try {
    const { 
      imagePaths, 
      outputFileName, 
      text, 
      duration, 
      transition, 
      social 
    } = req.body;
    
    console.log(`Requisição de criação de vídeo recebida:`, {
      imagePaths: Array.isArray(imagePaths) ? imagePaths.length : 'não é array',
      outputFileName,
      text: text?.substring(0, 20) + '...',
      duration,
      transition,
      social
    });
    
    const videoData = {
      userId: 1,
      title: text?.substring(0, 30) || 'Vídeo Teste',
      description: 'Vídeo criado com o sistema VideoGenie',
      status: 'completed',
      theme: 'business',
      tags: ['teste', 'video', social],
      thumbnailUrl: imagePaths && imagePaths.length > 0 ? imagePaths[0] : null,
      videoUrl: `/uploads/videos/${outputFileName || `test_video_${Date.now()}.mp4`}`,
      platform: [social || 'tiktok'],
      scriptContent: text || 'Conteúdo de teste para script',
      mediaRefs: imagePaths || []
    };
    
    const video = await storage.createVideo(videoData);
    
    // Retornar resposta formatada para compatibilidade com a interface
    res.json({
      success: true,
      url: video.videoUrl,
      id: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      message: 'Vídeo criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar vídeo avançado:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao criar vídeo avançado' 
    });
  }
});

// Configurar rotas para cada módulo da API
router.use(`${API_PREFIX}/settings`, settingsApiRoutes);
router.use(`${API_PREFIX}/content`, contentApiRoutes);
router.use(`${API_PREFIX}/free-tools`, freeToolsApiRoutes);
router.use(`${API_PREFIX}/tiktok-trends`, tiktokTrendsApiRoutes);
// TODO: Adicionar outras rotas à medida que forem implementadas
// router.use(`${API_PREFIX}/video`, videoApiRoutes);
// router.use(`${API_PREFIX}/social-media`, socialMediaApiRoutes);
// router.use(`${API_PREFIX}/sales`, salesAutomationApiRoutes);

export default router;