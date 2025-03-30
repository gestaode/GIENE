/**
 * Rotas para o módulo de vídeo avançado
 * 
 * Este módulo permite criar vídeos usando o VideoOrchestrator, que orquestra múltiplos 
 * serviços e implementa mecanismos de resiliência para garantir que os vídeos sejam criados
 * mesmo quando alguns serviços estão indisponíveis.
 */

import { Router, Request, Response } from 'express';
import { videoOrchestrator } from '../services/VideoOrchestrator';
import { resilienceService } from '../services/resilience-service';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { log } from '../vite';

// Configurar multer para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(process.cwd(), 'uploads/temp');
    fs.mkdir(uploadsDir, { recursive: true })
      .then(() => cb(null, uploadsDir))
      .catch(err => cb(err, uploadsDir));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

const router = Router();

// Criar vídeo avançado
router.post('/create-advanced', async (req: Request, res: Response) => {
  try {
    const {
      title,
      outputFileName,
      text,
      duration,
      transition,
      transitionDuration,
      textPosition,
      textColor,
      textAnimation,
      zoomEffect,
      colorGrading,
      autoSubtitle,
      watermark,
      outputQuality,
      social,
      imagePaths
    } = req.body;
    
    // Verificar se as imagens estão definidas corretamente
    const imagesToUse = imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0 
      ? imagePaths 
      : ['uploads/test/image1.jpg', 'uploads/test/image2.jpg', 'uploads/test/image3.jpg'];
    
    log(`Requisição recebida para criar vídeo avançado: ${outputFileName}`, 'video-api');
    log(`Imagens a serem usadas: ${JSON.stringify(imagesToUse)}`, 'video-api');
    
    // Registrar o início da operação
    const videoRequestId = resilienceService.startOperation('create_advanced_video');
    
    try {
      // Criar vídeo usando o orquestrador
      const videoResult = await videoOrchestrator.createVideoFromImages({
        title: title || text?.substring(0, 30) || 'Vídeo sem título',
        imagePaths: imagesToUse,
        script: text,
        duration: Number(duration) || 3,
        transition: transition || 'fade',
        transitionDuration: Number(transitionDuration) || 0.5,
        textPosition: textPosition || 'bottom',
        textColor: textColor || '#FFFFFF',
        textAnimation: textAnimation || 'none',
        zoomEffect: Boolean(zoomEffect),
        colorGrading: colorGrading || 'none',
        autoSubtitle: Boolean(autoSubtitle),
        watermark: watermark,
        outputQuality: outputQuality || 'high',
        social: social || 'tiktok',
        outputFormat: outputFileName?.endsWith('.webm') ? 'webm' : 'mp4'
      });
      
      // Registrar conclusão da operação
      resilienceService.completeOperation(videoRequestId, {
        success: true,
        data: {
          videoId: videoResult.id,
          status: videoResult.status
        }
      });
      
      // Retornar resposta de sucesso
      return res.json({
        success: true,
        url: videoResult.videoUrl,
        id: videoResult.id,
        title: videoResult.title,
        thumbnailUrl: videoResult.thumbnailUrl,
        message: 'Vídeo criado com sucesso'
      });
    } catch (error) {
      // Registrar falha da operação
      resilienceService.completeOperation(videoRequestId, {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  } catch (error) {
    log(`Erro ao criar vídeo avançado: ${error instanceof Error ? error.message : String(error)}`, 'video-api');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao criar vídeo'
    });
  }
});

// Obter status de um vídeo
router.get('/status/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const videoStatus = videoOrchestrator.getVideoStatus(videoId);
    
    if (!videoStatus) {
      return res.status(404).json({
        success: false,
        error: 'Vídeo não encontrado'
      });
    }
    
    return res.json({
      success: true,
      videoId: videoStatus.id,
      title: videoStatus.title,
      status: videoStatus.status,
      progress: videoStatus.progress,
      url: videoStatus.videoUrl,
      thumbnailUrl: videoStatus.thumbnailUrl,
      error: videoStatus.error
    });
  } catch (error) {
    log(`Erro ao obter status do vídeo: ${error instanceof Error ? error.message : String(error)}`, 'video-api');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao obter status do vídeo'
    });
  }
});

// Listar todos os vídeos
router.get('/list', async (req: Request, res: Response) => {
  try {
    const videos = videoOrchestrator.getAllVideos()
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return res.json({
      success: true,
      videos: videos.map(v => ({
        id: v.id,
        title: v.title,
        status: v.status,
        progress: v.progress,
        url: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        createdAt: v.startTime.toISOString(),
        completedAt: v.endTime?.toISOString()
      }))
    });
  } catch (error) {
    log(`Erro ao listar vídeos: ${error instanceof Error ? error.message : String(error)}`, 'video-api');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao listar vídeos'
    });
  }
});

// Obter status do serviço
router.get('/service-status', async (req: Request, res: Response) => {
  try {
    const ffmpegStatus = await videoOrchestrator.checkFFmpegStatus();
    
    const ttsTestResults = await resilienceService.runTest('tts_orchestrator');
    const ffmpegTestResults = await resilienceService.runTest('ffmpeg_service');
    
    return res.json({
      success: true,
      status: ffmpegStatus ? 'online' : 'degraded',
      ffmpegAvailable: ffmpegStatus,
      processingCapacity: {
        availableSlots: 2 - videoOrchestrator.getQueueSize(),
        totalSlots: 2,
        queueSize: videoOrchestrator.getQueueSize()
      },
      ttsProviders: {
        google: ttsTestResults.success && !ttsTestResults.fallbackUsed,
        responsivevoice: ttsTestResults.success && ttsTestResults.fallbackService === 'responsivevoice',
        coqui: ttsTestResults.success && ttsTestResults.fallbackService === 'coqui',
        available: ttsTestResults.success
      },
      resilienceStatus: {
        ffmpeg: ffmpegTestResults.success,
        tts: ttsTestResults.success
      }
    });
  } catch (error) {
    log(`Erro ao obter status do serviço: ${error instanceof Error ? error.message : String(error)}`, 'video-api');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao obter status do serviço'
    });
  }
});

// Testar FFmpeg
router.get('/test-ffmpeg', async (req: Request, res: Response) => {
  try {
    const ffmpegWorking = await videoOrchestrator.checkFFmpegStatus();
    
    return res.json({ 
      success: true, 
      ffmpegWorking 
    });
  } catch (error) {
    log(`Erro ao testar FFmpeg: ${error instanceof Error ? error.message : String(error)}`, 'video-api');
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao testar FFmpeg'
    });
  }
});

export default router;