/**
 * Serviço independente para geração de vídeo
 * 
 * Este arquivo implementa um servidor Express independente para o serviço de geração de vídeo,
 * que pode ser executado como um microserviço separado.
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv-flow';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { log } from '../vite';
import { videoGenerationModule } from '../modules/video-generation';

// Carregar variáveis de ambiente
dotenv.config();

// Criar aplicação Express
const app = express();
const PORT = process.env.VIDEO_SERVICE_PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Limite maior para uploads de imagens
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50,                  // Limite por IP
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
    if (!apiKey || apiKey !== process.env.VIDEO_SERVICE_API_KEY) {
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
    const ffmpegAvailable = await videoGenerationModule.checkFfmpegInstallation();
    
    res.json({
      service: 'video-generation',
      status: ffmpegAvailable ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      ffmpegAvailable,
      ttsProviders: {
        google: process.env.GOOGLE_TTS_API_KEY ? true : false,
        responsivevoice: true, // Assume-se que está sempre disponível
        coqui: false // Implementação futura
      }
    });
  } catch (error) {
    res.status(500).json({
      service: 'video-generation',
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

// Rotas da API
app.post('/api/video/generate', async (req: Request, res: Response) => {
  try {
    const { title, script, options, backgroundImages, audioUrl, useFallback } = req.body;
    
    if (!title || !script) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título e script são obrigatórios' 
      });
    }
    
    const result = await videoGenerationModule.generateVideo({
      title,
      script,
      options,
      backgroundImages,
      audioUrl,
      useFallback
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao gerar vídeo:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao gerar vídeo',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.post('/api/video/create-from-images', async (req: Request, res: Response) => {
  try {
    const { title, images, audio, duration, options } = req.body;
    
    if (!title || !images || !images.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título e imagens são obrigatórios' 
      });
    }
    
    const result = await videoGenerationModule.createVideoFromImages({
      title,
      images,
      audio,
      duration,
      options
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao criar vídeo a partir de imagens:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao criar vídeo a partir de imagens',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.post('/api/video/add-audio', async (req: Request, res: Response) => {
  try {
    const { videoUrl, audioUrl, outputFormat, startTime, fadeIn, fadeOut } = req.body;
    
    if (!videoUrl || !audioUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'URLs de vídeo e áudio são obrigatórios' 
      });
    }
    
    const result = await videoGenerationModule.addAudioToVideo({
      videoUrl,
      audioUrl,
      outputFormat,
      startTime,
      fadeIn,
      fadeOut
    });
    
    return res.json(result);
  } catch (error) {
    log('Erro ao adicionar áudio ao vídeo:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao adicionar áudio ao vídeo',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/video/status', async (req: Request, res: Response) => {
  try {
    const videoId = req.query.videoId as string;
    
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do vídeo é obrigatório' 
      });
    }
    
    const status = await videoGenerationModule.getVideoStatus(videoId);
    
    return res.json(status);
  } catch (error) {
    log('Erro ao obter status do vídeo:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao obter status do vídeo',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/video/list', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    
    const videos = await videoGenerationModule.listVideos(status, page, limit);
    
    return res.json(videos);
  } catch (error) {
    log('Erro ao listar vídeos:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao listar vídeos',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/video/test-ffmpeg', async (req: Request, res: Response) => {
  try {
    const result = await videoGenerationModule.checkFfmpegInstallation();
    
    return res.json({
      success: result,
      message: result ? 'FFmpeg instalado e funcionando' : 'FFmpeg não encontrado ou com erro'
    });
  } catch (error) {
    log('Erro ao testar FFmpeg:', 'error');
    log(error, 'error');
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro ao testar FFmpeg',
      error: error instanceof Error ? error.stack : null
    });
  }
});

app.get('/api/video/service-status', async (req: Request, res: Response) => {
  try {
    const ffmpegAvailable = await videoGenerationModule.checkFfmpegInstallation();
    
    const status = {
      status: ffmpegAvailable ? 'online' : 'degraded',
      ffmpegAvailable,
      processingCapacity: {
        availableSlots: 3,
        totalSlots: 5,
        queueSize: videoGenerationModule.getQueueSize()
      },
      storage: {
        available: true,
        totalStorageBytes: 1024 * 1024 * 1024 * 10, // 10 GB (exemplo)
        usedStorageBytes: 1024 * 1024 * 100 // 100 MB (exemplo)
      },
      ttsProviders: {
        google: process.env.GOOGLE_TTS_API_KEY ? true : false,
        responsivevoice: true,
        coqui: false
      },
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
  log('Erro no serviço de geração de vídeo:', 'error');
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
    log(`Serviço de geração de vídeo rodando na porta ${PORT}`, 'info');
    
    // Verificar o status do FFmpeg ao iniciar
    videoGenerationModule.checkFfmpegInstallation()
      .then(available => {
        if (!available) {
          log('AVISO: FFmpeg não encontrado ou não funcionando corretamente!', 'warn');
        } else {
          log('FFmpeg instalado e funcionando corretamente', 'info');
        }
      })
      .catch(err => {
        log('Erro ao verificar FFmpeg: ' + err.message, 'error');
      });
  });
}

export default app;