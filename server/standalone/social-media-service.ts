/**
 * Serviço independente para integração com redes sociais
 * 
 * Este arquivo implementa um servidor Express independente para o serviço de integração
 * com redes sociais, que pode ser executado como um microserviço separado.
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv-flow';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { log } from '../vite';
import { socialMediaModule } from '../modules/social-media';

// Carregar variáveis de ambiente
dotenv.config();

// Criar aplicação Express
const app = express();
const PORT = process.env.SOCIAL_MEDIA_SERVICE_PORT || 3003;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
    if (!apiKey || apiKey !== process.env.SOCIAL_MEDIA_SERVICE_API_KEY) {
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
    const platformStatus = await socialMediaModule.getPlatformConnections();
    
    res.json({
      service: 'social-media',
      status: Object.values(platformStatus).some(v => v) ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      platformConnections: platformStatus
    });
  } catch (error) {
    res.status(500).json({
      service: 'social-media',
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

// Rotas da API
app.post('/api/social-media/posts/schedule', async (req: Request, res: Response) => {
  try {
    const { 
      videoPath, 
      title, 
      description, 
      hashtags, 
      scheduledTime, 
      platforms, 
      options 
    } = req.body;
    
    if (!videoPath || !title || !platforms || !platforms.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Caminho do vídeo, título e plataformas são obrigatórios' 
      });
    }
    
    const result = await socialMediaModule.schedulePost({
      videoPath,
      title,
      description,
      hashtags,
      scheduledTime,
      platforms,
      options
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao agendar postagem:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao agendar postagem',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/social-media/posts', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const platform = req.query.platform as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    const result = await socialMediaModule.listPosts({
      status,
      platform,
      page,
      limit,
      startDate,
      endDate
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao listar postagens:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao listar postagens',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/social-media/posts/status', async (req: Request, res: Response) => {
  try {
    const postId = req.query.postId as string;
    
    if (!postId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da postagem é obrigatório' 
      });
    }
    
    const result = await socialMediaModule.getPostStatus(postId);
    
    return res.json(result);
  } catch (error) {
    log('Erro ao obter status da postagem:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao obter status da postagem',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.post('/api/social-media/posts/cancel', async (req: Request, res: Response) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da postagem é obrigatório' 
      });
    }
    
    const result = await socialMediaModule.cancelPost(postId);
    
    return res.json(result);
  } catch (error) {
    log('Erro ao cancelar postagem:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao cancelar postagem',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.put('/api/social-media/posts/update', async (req: Request, res: Response) => {
  try {
    const { 
      postId, 
      title, 
      description, 
      hashtags, 
      scheduledTime, 
      platforms 
    } = req.body;
    
    if (!postId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da postagem é obrigatório' 
      });
    }
    
    const result = await socialMediaModule.updatePost({
      postId,
      title,
      description,
      hashtags,
      scheduledTime,
      platforms
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao atualizar postagem:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao atualizar postagem',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/social-media/status', async (req: Request, res: Response) => {
  try {
    const platformStatus = await socialMediaModule.getPlatformConnections();
    const queueStatus = await socialMediaModule.getQueueStatus();
    const apiLimits = await socialMediaModule.getApiLimits();
    
    const status = {
      status: Object.values(platformStatus).some(v => v) ? 'online' : 'degraded',
      platformConnections: platformStatus,
      queueStatus,
      apiLimits,
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

app.get('/api/social-media/auth', async (req: Request, res: Response) => {
  try {
    const platform = req.query.platform as string;
    
    if (!platform) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plataforma é obrigatória' 
      });
    }
    
    const authUrl = await socialMediaModule.getAuthUrl(platform);
    
    return res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    log('Erro ao obter URL de autenticação:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao obter URL de autenticação',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/social-media/auth/callback', async (req: Request, res: Response) => {
  try {
    const platform = req.query.platform as string;
    const code = req.query.code as string;
    
    if (!platform || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plataforma e código são obrigatórios' 
      });
    }
    
    const result = await socialMediaModule.handleAuthCallback(platform, code);
    
    // Redirecionar para a página de configurações com status
    return res.redirect(`/settings?platform=${platform}&auth=${result.success ? 'success' : 'failed'}`);
  } catch (error) {
    log('Erro no callback de autenticação:', 'error');
    log(error, 'error');
    
    return res.redirect(`/settings?auth=error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Erro desconhecido')}`);
  }
});

// Middleware de tratamento de erros
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  log('Erro no serviço de redes sociais:', 'error');
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
    log(`Serviço de redes sociais rodando na porta ${PORT}`, 'info');
    
    // Verificar o status das plataformas ao iniciar
    socialMediaModule.getPlatformConnections()
      .then(status => {
        log('Status das conexões com plataformas:', 'info');
        log(JSON.stringify(status, null, 2), 'info');
      })
      .catch(err => {
        log('Erro ao verificar conexões com plataformas: ' + err.message, 'error');
      });
  });
}

export default app;