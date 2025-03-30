/**
 * Configuração central de rotas do servidor Express
 * 
 * Este arquivo configura todas as rotas do servidor Express, importando os
 * módulos de rotas específicos para cada função do sistema.
 */

import { Router } from 'express';
import contentApiRoutes from './routes/content-api';
import freeToolsApiRoutes from './routes/free-tools-api';
import tiktokTrendsApiRoutes from './routes/tiktok-trends-api';

// Prefixo padrão para APIs
const API_PREFIX = '/api';

const router = Router();

// TODO: Importar outras rotas à medida que forem implementadas
// import videoApiRoutes from './routes/video-api';
// import socialMediaApiRoutes from './routes/social-media-api';
// import salesAutomationApiRoutes from './routes/sales-automation-api';

// Rota base para verificar se o servidor está rodando
router.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Configurar rotas para cada módulo da API
router.use(`${API_PREFIX}/content`, contentApiRoutes);
router.use(`${API_PREFIX}/free-tools`, freeToolsApiRoutes);
router.use(`${API_PREFIX}/tiktok-trends`, tiktokTrendsApiRoutes);
// TODO: Adicionar outras rotas à medida que forem implementadas
// router.use(`${API_PREFIX}/video`, videoApiRoutes);
// router.use(`${API_PREFIX}/social-media`, socialMediaApiRoutes);
// router.use(`${API_PREFIX}/sales`, salesAutomationApiRoutes);

export default router;