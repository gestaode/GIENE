/**
 * Serviço independente para automação de vendas
 * 
 * Este arquivo implementa um servidor Express independente para o serviço de automação de vendas,
 * que pode ser executado como um microserviço separado.
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv-flow';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { log } from '../vite';
import { salesAutomationModule } from '../modules/sales-automation';

// Carregar variáveis de ambiente
dotenv.config();

// Criar aplicação Express
const app = express();
const PORT = process.env.SALES_AUTOMATION_SERVICE_PORT || 3004;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                 // Limite por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, por favor tente novamente mais tarde'
});

// Aplicar rate limiting a todas as rotas da API
app.use('/api', apiLimiter);

// Middleware de autenticação
app.use((req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (process.env.NODE_ENV === 'production') {
    if (!apiKey || apiKey !== process.env.SALES_AUTOMATION_SERVICE_API_KEY) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'API key inválida ou ausente'
      });
    }
  }
  
  next();
});

// Rota de saúde
app.get('/health', async (req: Request, res: Response) => {
  try {
    const componentsStatus = await salesAutomationModule.getComponentsStatus();
    
    res.json({
      service: 'sales-automation',
      status: componentsStatus.database ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      components: componentsStatus
    });
  } catch (error) {
    res.status(500).json({
      service: 'sales-automation',
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

// Rotas para gerenciamento de leads
app.post('/api/sales/leads', async (req: Request, res: Response) => {
  try {
    const leadData = req.body;
    
    if (!leadData.name || !leadData.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome e email são obrigatórios' 
      });
    }
    
    const result = await salesAutomationModule.createLead(leadData);
    
    return res.json(result);
  } catch (error) {
    log('Erro ao criar lead:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao criar lead',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/sales/leads', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    
    const result = await salesAutomationModule.getLeads(page, limit);
    
    return res.json(result);
  } catch (error) {
    log('Erro ao listar leads:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao listar leads',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/sales/leads/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do lead é obrigatório' 
      });
    }
    
    const lead = await salesAutomationModule.getLead(id);
    
    if (!lead) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lead não encontrado' 
      });
    }
    
    return res.json(lead);
  } catch (error) {
    log('Erro ao obter lead:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao obter lead',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Rotas para segmentos
app.post('/api/sales/segments', async (req: Request, res: Response) => {
  try {
    const { name, description, criteria } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome do segmento é obrigatório' 
      });
    }
    
    const result = await salesAutomationModule.createSegment({
      name,
      description,
      criteria
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao criar segmento:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao criar segmento',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/sales/segments', async (req: Request, res: Response) => {
  try {
    const segments = await salesAutomationModule.getSegments();
    
    return res.json({
      segments,
      total: segments.length
    });
  } catch (error) {
    log('Erro ao listar segmentos:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao listar segmentos',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.post('/api/sales/segments/:id/add', async (req: Request, res: Response) => {
  try {
    const segmentId = req.params.id;
    const { leadIds } = req.body;
    
    if (!segmentId || !leadIds || !Array.isArray(leadIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do segmento e IDs dos leads são obrigatórios' 
      });
    }
    
    const result = await salesAutomationModule.addToSegment(segmentId, leadIds);
    
    return res.json(result);
  } catch (error) {
    log('Erro ao adicionar leads ao segmento:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao adicionar leads ao segmento',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Rotas para campanhas de email
app.post('/api/sales/campaigns', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      subject, 
      body, 
      fromName, 
      fromEmail, 
      segmentId, 
      scheduledTime,
      testEmails
    } = req.body;
    
    if (!name || !subject || !body || !fromName || !fromEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome, assunto, corpo, nome do remetente e email do remetente são obrigatórios' 
      });
    }
    
    const result = await salesAutomationModule.createEmailCampaign({
      name,
      subject,
      body,
      fromName,
      fromEmail,
      segmentId,
      scheduledTime,
      testEmails
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao criar campanha de email:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao criar campanha de email',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/sales/campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = await salesAutomationModule.getEmailCampaigns();
    
    return res.json({
      campaigns,
      total: campaigns.length
    });
  } catch (error) {
    log('Erro ao listar campanhas de email:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao listar campanhas de email',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.post('/api/sales/campaigns/:id/test', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const { testEmails } = req.body;
    
    if (!campaignId || !testEmails || !Array.isArray(testEmails)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da campanha e emails de teste são obrigatórios' 
      });
    }
    
    const result = await salesAutomationModule.sendTestEmail(campaignId, testEmails);
    
    return res.json(result);
  } catch (error) {
    log('Erro ao enviar email de teste:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao enviar email de teste',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Rotas para funis
app.post('/api/sales/funnels', async (req: Request, res: Response) => {
  try {
    const { name, description, steps } = req.body;
    
    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome e passos do funil são obrigatórios' 
      });
    }
    
    const result = await salesAutomationModule.createFunnel({
      name,
      description,
      steps
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao criar funil:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao criar funil',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/sales/funnels', async (req: Request, res: Response) => {
  try {
    const funnels = await salesAutomationModule.getFunnels();
    
    return res.json({
      funnels,
      total: funnels.length
    });
  } catch (error) {
    log('Erro ao listar funis:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao listar funis',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Status do serviço
app.get('/api/sales/status', async (req: Request, res: Response) => {
  try {
    const componentsStatus = await salesAutomationModule.getComponentsStatus();
    const metrics = await salesAutomationModule.getMetrics();
    const queueStatus = await salesAutomationModule.getQueueStatus();
    
    const status = {
      status: componentsStatus.database ? 'online' : 'degraded',
      components: componentsStatus,
      metrics,
      queueStatus,
      version: '1.0.0'
    };
    
    return res.json(status);
  } catch (error) {
    log('Erro ao obter status do serviço:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao obter status do serviço',
      error: error instanceof Error ? error.stack : null
    });
  }
});

// Middleware de tratamento de erros
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  log('Erro no serviço de automação de vendas:', 'error');
  log(err.stack, 'error');
  
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    success: false
  });
});

// 404 - Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Não encontrado',
    message: `Rota ${req.method} ${req.url} não encontrada`
  });
});

// Iniciar o servidor
if (require.main === module) {
  app.listen(PORT, () => {
    log(`Serviço de automação de vendas rodando na porta ${PORT}`, 'info');
    
    // Verificar o status dos componentes ao iniciar
    salesAutomationModule.getComponentsStatus()
      .then(status => {
        log('Status dos componentes:', 'info');
        log(JSON.stringify(status, null, 2), 'info');
      })
      .catch(err => {
        log('Erro ao verificar componentes: ' + err.message, 'error');
      });
  });
}

export default app;