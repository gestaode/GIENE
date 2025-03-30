import { Router } from 'express';
import { storage } from '../storage';
import { insertApiSettingSchema } from '@shared/schema';
import { resilienceService } from '../services/resilience-service';

const router = Router();

// Buscar todas as configurações de API
router.get('/', async (req, res) => {
  try {
    // Por padrão, usamos o ID 1 como ID de usuário
    const apiSettings = await storage.getApiSettings(1);
    res.json(apiSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações de API:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações de API' });
  }
});

// Criar ou atualizar uma configuração de API
router.post('/', async (req, res) => {
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

// Testar uma configuração de API
router.post('/test', async (req, res) => {
  try {
    const { service, apiKey } = req.body;
    
    if (!service || !apiKey) {
      return res.status(400).json({
        isValid: false,
        message: 'Serviço e chave API são obrigatórios'
      });
    }
    
    // Armazenar temporariamente a chave API
    const userId = 1; // ID de usuário padrão
    const existingSetting = await storage.getApiSettingByService(userId, service);
    
    if (existingSetting) {
      await storage.updateApiSetting(existingSetting.id, {
        userId,
        service,
        apiKey,
        isActive: true
      });
    } else {
      await storage.createApiSetting({
        userId,
        service,
        apiKey,
        isActive: true
      });
    }
    
    // Agora que a chave API está armazenada, podemos testar o serviço
    const testResult = await resilienceService.runTest(service);
    
    return res.json({
      isValid: testResult.success,
      message: testResult.success 
        ? `Conexão com ${service} estabelecida com sucesso!` 
        : `Falha ao conectar com ${service}: ${testResult.errorMessage || 'Erro desconhecido'}`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao testar configuração de API:', errorMessage);
    
    res.status(500).json({
      isValid: false,
      message: `Erro ao testar configuração de API: ${errorMessage}`
    });
  }
});

// Obter o status de todos os serviços
router.get('/services/status', async (req, res) => {
  try {
    const serviceResults = await resilienceService.getServiceStatus();
    
    const status = Object.entries(serviceResults).length > 0 ? 'online' : 'degraded';
    
    const services = Object.entries(serviceResults).map(([name, result]) => ({
      name,
      status: result.success ? 'connected' : 'error',
      message: result.errorMessage || '',
      lastChecked: new Date().toISOString()
    }));
    
    res.json({
      status,
      timestamp: new Date().toISOString(),
      services
    });
  } catch (error) {
    console.error('Erro ao obter status dos serviços:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Erro ao obter status dos serviços',
      timestamp: new Date().toISOString(),
      services: []
    });
  }
});

export default router;