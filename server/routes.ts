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
import { MemStorage } from './storage';
import { APIServiceStatus, insertApiSettingSchema } from '@shared/schema';
import { resilienceService } from './services/resilience-service';

// Prefixo padrão para APIs
const API_PREFIX = '/api';

const router = Router();
const storage = new MemStorage();

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

// Rotas para configurações de API
router.get(`${API_PREFIX}/settings`, async (req, res) => {
  try {
    // Para simplificar, usamos o ID 1 como ID de usuário padrão
    const apiSettings = await storage.getApiSettings(1);
    res.json(apiSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações de API:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações de API' });
  }
});

router.post(`${API_PREFIX}/settings`, async (req, res) => {
  try {
    const data = insertApiSettingSchema.parse(req.body);
    
    // Verificar se já existe uma configuração para este serviço
    const existingSetting = await storage.getApiSettingByService(data.userId, data.service);
    
    let result;
    if (existingSetting) {
      result = await storage.updateApiSetting(existingSetting.id, data);
    } else {
      result = await storage.createApiSetting(data);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao salvar configuração de API:', error);
    res.status(400).json({ error: 'Dados inválidos para configuração de API' });
  }
});

router.post(`${API_PREFIX}/settings/test`, async (req, res) => {
  try {
    const { service, apiKey } = req.body;
    
    if (!service || !apiKey) {
      return res.status(400).json({
        isValid: false,
        message: 'Serviço e chave API são obrigatórios'
      });
    }
    
    // Realizamos um teste do serviço usando o sistema de resiliência
    const testResult = await resilienceService.runTest(service);
    
    if (testResult.success) {
      return res.json({
        isValid: true,
        message: `Conexão com ${service} estabelecida com sucesso!`
      });
    } else {
      return res.json({
        isValid: false,
        message: `Falha ao conectar com ${service}: ${testResult.errorMessage || 'Erro desconhecido'}`
      });
    }
  } catch (error) {
    console.error('Erro ao testar configuração de API:', error);
    res.status(500).json({
      isValid: false,
      message: 'Erro ao testar configuração de API'
    });
  }
});

// Rota para obter o status de todos os serviços
router.get(`${API_PREFIX}/services/status`, async (req, res) => {
  try {
    const serviceResults = await resilienceService.getServiceStatus();
    
    const serviceStatus: APIServiceStatus = {
      status: 'online',
      timestamp: new Date().toISOString(),
      services: Object.entries(serviceResults).map(([service, result]) => ({
        name: service,
        status: result.success ? 'connected' : 'error',
        message: result.errorMessage || '',
        lastChecked: new Date().toISOString()
      }))
    };
    
    res.json(serviceStatus);
  } catch (error) {
    console.error('Erro ao obter status dos serviços:', error);
    res.status(500).json({ error: 'Erro ao obter status dos serviços' });
  }
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
    const { title, options } = req.body;
    
    const videoData = {
      userId: 1,
      title: title || 'Vídeo Teste',
      description: 'Descrição de teste',
      status: 'draft',
      theme: 'business',
      tags: ['teste', 'video'],
      thumbnailUrl: null,
      videoUrl: null,
      platform: ['tiktok'],
      scriptContent: 'Conteúdo de teste para script',
      mediaRefs: []
    };
    
    const video = await storage.createVideo(videoData);
    res.json(video);
  } catch (error) {
    console.error('Erro ao criar vídeo avançado:', error);
    res.status(500).json({ error: 'Erro ao criar vídeo avançado' });
  }
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