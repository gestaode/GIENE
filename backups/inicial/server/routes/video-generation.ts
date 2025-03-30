/**
 * Rotas para o módulo de geração de vídeo
 */

import { Router, Request, Response } from 'express';
import { videoGenerationModule } from '../modules/video-generation';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Configurar multer para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

const router = Router();

// Gerar um vídeo a partir de um roteiro
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      script, 
      voice, 
      voiceProvider, 
      resolution,
      style,
      backgroundColor,
      textColor,
      fontFamily,
      outputFormat
    } = req.body;
    
    if (!title || !script) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título e roteiro são obrigatórios' 
      });
    }
    
    const videoStatus = await videoGenerationModule.generateVideo({
      title,
      script,
      voice,
      voiceProvider,
      resolution,
      style,
      backgroundColor,
      textColor,
      fontFamily,
      outputFormat
    });
    
    return res.json({ 
      success: true, 
      videoId: videoStatus.id,
      status: videoStatus.status,
      progress: videoStatus.progress 
    });
  } catch (error) {
    console.error('Erro ao gerar vídeo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao gerar vídeo'
    });
  }
});

// Verificar o status de um vídeo
router.get('/:videoId/status', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    
    const videoStatus = videoGenerationModule.getVideoStatus(videoId);
    
    if (!videoStatus) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vídeo não encontrado' 
      });
    }
    
    return res.json({ 
      success: true, 
      status: videoStatus 
    });
  } catch (error) {
    console.error('Erro ao verificar status do vídeo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao verificar status do vídeo'
    });
  }
});

// Listar todos os vídeos
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const videos = videoGenerationModule.listVideos(
      status as 'processing' | 'completed' | 'failed'
    );
    
    return res.json({ 
      success: true, 
      videos 
    });
  } catch (error) {
    console.error('Erro ao listar vídeos:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao listar vídeos'
    });
  }
});

// Criar vídeo a partir de imagens com áudio
router.post('/create-with-images', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'audio', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    const { title, resolution, outputFormat } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!title || !files.images || !files.audio) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título, imagens e áudio são obrigatórios' 
      });
    }
    
    const imageFiles = files.images.map(file => file.path);
    const audioFile = files.audio[0].path;
    
    // Criar um "roteiro" vazio para satisfazer a API do gerador de vídeo
    const placeholderScript = ' ';
    
    const videoStatus = await videoGenerationModule.generateVideo({
      title,
      script: placeholderScript,
      resolution: resolution as '720p' | '1080p' | 'vertical',
      outputFormat: outputFormat as 'mp4' | 'webm',
      backgroundImages: imageFiles,
      audioFile
    });
    
    return res.json({ 
      success: true, 
      videoId: videoStatus.id,
      status: videoStatus.status,
      progress: videoStatus.progress 
    });
  } catch (error) {
    console.error('Erro ao criar vídeo com imagens:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao criar vídeo com imagens'
    });
  }
});

// Testar o FFmpeg
router.get('/test-ffmpeg', async (req: Request, res: Response) => {
  try {
    const ffmpegWorking = await videoGenerationModule.checkFFmpegStatus();
    
    return res.json({ 
      success: true, 
      ffmpegWorking 
    });
  } catch (error) {
    console.error('Erro ao testar FFmpeg:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao testar FFmpeg'
    });
  }
});

export default router;