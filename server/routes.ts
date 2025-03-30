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
import videoAdvancedRoutes from './routes/video-advanced';
import testImagesApiRoutes from './routes/test-images-api';
import exportApiRoutes from './routes/export-api';
import googleExportApiRoutes from './routes/google-export-api';
import { storage } from './storage';
import { log } from './vite';

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
    log('Erro ao buscar vídeos:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeos' });
  }
});

// Configurar rotas para cada módulo da API
router.use(`${API_PREFIX}/settings`, settingsApiRoutes);
router.use(`${API_PREFIX}/content`, contentApiRoutes);
router.use(`${API_PREFIX}/free-tools`, freeToolsApiRoutes);
router.use(`${API_PREFIX}/tiktok-trends`, tiktokTrendsApiRoutes);
router.use(`${API_PREFIX}/video-advanced`, videoAdvancedRoutes);
router.use(`${API_PREFIX}/test-images`, testImagesApiRoutes);
router.use(`${API_PREFIX}/export`, exportApiRoutes);
router.use(`${API_PREFIX}/google-export`, googleExportApiRoutes);
// TODO: Adicionar outras rotas à medida que forem implementadas
// router.use(`${API_PREFIX}/social-media`, socialMediaApiRoutes);
// router.use(`${API_PREFIX}/sales`, salesAutomationApiRoutes);

export default router;