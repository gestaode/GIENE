/**
 * Orquestrador de Vídeo
 * 
 * Este serviço gerencia o processo de criação de vídeo usando múltiplos provedores
 * e fornece mecanismos de resiliência para garantir que o processo seja concluído
 * mesmo quando alguns serviços estão indisponíveis.
 */

import { log } from '../vite';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { resilienceService, ResilienceTestResult } from './resilience-service';
import { FFmpegService, ffmpegService } from './ffmpeg';
import { StorageProvider, storageProvider } from './storage-providers/CloudStorageProvider';

/**
 * Opções para geração de vídeo
 */
interface VideoGenerationOptions {
  title: string;
  script?: string;
  imagePaths?: string[];
  audio?: string;
  duration?: number;
  outputFormat?: 'mp4' | 'webm';
  resolution?: '720p' | '1080p' | 'vertical';
  transition?: string;
  transitionDuration?: number;
  textPosition?: string;
  textColor?: string;
  textAnimation?: string;
  voiceProvider?: 'google' | 'responsivevoice' | 'coqui' | 'auto';
  voice?: string;
  zoomEffect?: boolean;
  colorGrading?: string;
  autoSubtitle?: boolean;
  watermark?: string;
  outputQuality?: string;
  social?: string;
  useFallback?: boolean;
}

/**
 * Resultado da operação de vídeo
 */
interface VideoResult {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  usedService?: string;
  outputFormat: string;
  startTime: Date;
  endTime?: Date;
}

// Interfaces para serviços de TTS
interface TTSService {
  convertText(text: string, voice?: string): Promise<string>;
  convertTextToSpeech(text: string, voice?: string): Promise<string>;
  isAvailable(): Promise<boolean>;
  getVoices(): Promise<string[]>;
}

class GoogleCloudTTSService implements TTSService {
  async convertText(text: string, voice?: string): Promise<string> {
    return this.convertTextToSpeech(text, voice);
  }
  
  async convertTextToSpeech(text: string, voice?: string): Promise<string> {
    try {
      if (!process.env.GOOGLE_TTS_API_KEY) {
        throw new Error('API do Google TTS não configurada');
      }
      
      log(`Convertendo texto para fala usando Google TTS: ${text.slice(0, 50)}...`, 'tts');
      
      // Implementação básica de fallback - na prática, usaria a API real
      const outputPath = path.join(process.cwd(), 'uploads/audio', `google_tts_${Date.now()}.mp3`);
      
      // Simulação - em produção, esta função seria implementada corretamente
      await fs.writeFile(outputPath, 'Conteúdo simulado de áudio');
      
      return outputPath;
    } catch (error) {
      log(`Erro no Google TTS: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return !!process.env.GOOGLE_TTS_API_KEY;
  }
  
  async getVoices(): Promise<string[]> {
    return ['pt-BR-Standard-A', 'pt-BR-Wavenet-A', 'pt-BR-Neural2-A'];
  }
}

class ResponsiveVoiceService implements TTSService {
  async convertText(text: string, voice?: string): Promise<string> {
    return this.convertTextToSpeech(text, voice);
  }

  async convertTextToSpeech(text: string, voice?: string): Promise<string> {
    try {
      log(`Convertendo texto para fala usando ResponsiveVoice: ${text.slice(0, 50)}...`, 'tts');
      
      // Implementação básica de fallback
      const outputPath = path.join(process.cwd(), 'uploads/audio', `responsive_voice_${Date.now()}.mp3`);
      
      // Simulação - em produção, esta função seria implementada corretamente
      await fs.writeFile(outputPath, 'Conteúdo simulado de áudio');
      
      return outputPath;
    } catch (error) {
      log(`Erro no ResponsiveVoice: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return true; // ResponsiveVoice é sempre disponível como fallback
  }
  
  async getVoices(): Promise<string[]> {
    return ['Brazilian Portuguese Male', 'Brazilian Portuguese Female'];
  }
}

class CoquiTTSService implements TTSService {
  async convertText(text: string, voice?: string): Promise<string> {
    return this.convertTextToSpeech(text, voice);
  }

  async convertTextToSpeech(text: string, voice?: string): Promise<string> {
    try {
      log(`Convertendo texto para fala usando Coqui TTS: ${text.slice(0, 50)}...`, 'tts');
      
      // Implementação básica de fallback
      const outputPath = path.join(process.cwd(), 'uploads/audio', `coqui_tts_${Date.now()}.mp3`);
      
      // Simulação - em produção, esta função seria implementada corretamente
      await fs.writeFile(outputPath, 'Conteúdo simulado de áudio');
      
      return outputPath;
    } catch (error) {
      log(`Erro no Coqui TTS: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }
  
  async isAvailable(): Promise<boolean> {
    // Verificar disponibilidade
    return true; // Assume disponível para este exemplo
  }
  
  async getVoices(): Promise<string[]> {
    return ['pt_BR_male', 'pt_BR_female'];
  }
}

// Implementação do serviço de imagens Pexels
class PexelsService {
  private apiKey: string | undefined;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PEXELS_API_KEY;
  }
  
  async searchImages(query: string, count: number = 5): Promise<string[]> {
    try {
      if (!this.apiKey) {
        throw new Error('API do Pexels não configurada');
      }
      
      log(`Buscando ${count} imagens para "${query}" via Pexels`, 'pexels');
      
      // Implementação básica de fallback para teste
      // Em produção, usaria a API real do Pexels
      return [
        path.join(process.cwd(), 'uploads/temp', 'test_image_1.jpg'),
        path.join(process.cwd(), 'uploads/temp', 'test_image_2.jpg'),
        path.join(process.cwd(), 'uploads/temp', 'test_image_3.jpg')
      ].slice(0, count);
    } catch (error) {
      log(`Erro no Pexels: ${error instanceof Error ? error.message : String(error)}`, 'pexels');
      throw error;
    }
  }
  
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

/**
 * Orquestrador principal de vídeo
 */
export class VideoOrchestrator {
  private ffmpegService: FFmpegService;
  private googleTTSService?: GoogleCloudTTSService;
  private responsiveVoiceService: ResponsiveVoiceService;
  private coquiTTSService: CoquiTTSService;
  private pexelsService?: PexelsService;
  private storageProvider?: StorageProvider;
  private videoStatuses: Map<string, VideoResult> = new Map();
  private processingQueue: string[] = [];
  private maxConcurrentProcessing: number = 2;
  private currentlyProcessing: number = 0;
  
  constructor(
    ffmpegService: FFmpegService,
    pexelsApiKey?: string,
    googleTTSApiKey?: string,
    storageProvider?: StorageProvider
  ) {
    this.ffmpegService = ffmpegService;
    
    // Inicializar serviços
    if (googleTTSApiKey || process.env.GOOGLE_TTS_API_KEY) {
      this.googleTTSService = new GoogleCloudTTSService();
    }
    
    this.responsiveVoiceService = new ResponsiveVoiceService();
    this.coquiTTSService = new CoquiTTSService();
    
    if (pexelsApiKey || process.env.PEXELS_API_KEY) {
      this.pexelsService = new PexelsService(pexelsApiKey || process.env.PEXELS_API_KEY);
    }
    
    this.storageProvider = storageProvider;
    
    // Iniciar processador de fila
    this.startQueueProcessor();
    
    // O registro de testes de resiliência foi movido para o serviço de resiliência
    
    // Criar diretórios necessários
    this.ensureDirectoriesExist();
  }
  
  /**
   * Verifica a disponibilidade do FFmpeg
   */
  async checkFFmpegStatus(): Promise<boolean> {
    try {
      const isAvailable = await this.ffmpegService.isAvailable();
      return isAvailable;
    } catch (error) {
      log(`Erro ao verificar FFmpeg: ${error instanceof Error ? error.message : String(error)}`, 'video-orchestrator');
      return false;
    }
  }
  
  /**
   * Cria um vídeo a partir de imagens
   */
  async createVideoFromImages(options: VideoGenerationOptions): Promise<VideoResult> {
    const videoId = uuidv4();
    
    // Preparar título
    const title = options.title || 'Vídeo sem título';
    
    // Definir formato de saída
    const outputFormat = options.outputFormat || 'mp4';
    
    // Registrar vídeo no status
    const videoDetails: VideoResult = {
      id: videoId,
      title,
      videoUrl: '', // Será definido após processamento
      status: 'processing',
      progress: 0,
      outputFormat,
      startTime: new Date()
    };
    
    this.videoStatuses.set(videoId, videoDetails);
    
    // Adicionar à fila de processamento
    this.processingQueue.push(videoId);
    log(`Vídeo "${title}" (${videoId}) adicionado à fila de processamento`, 'video-orchestrator');
    
    // Retornar referência para o cliente acompanhar status
    return {
      ...videoDetails
    };
  }
  
  /**
   * Obtém o status atual de um vídeo
   */
  getVideoStatus(videoId: string): VideoResult | null {
    const status = this.videoStatuses.get(videoId);
    return status || null;
  }
  
  /**
   * Retorna o tamanho atual da fila
   */
  getQueueSize(): number {
    return this.processingQueue.length;
  }
  
  /**
   * Retorna todos os vídeos criados
   */
  getAllVideos(): VideoResult[] {
    return Array.from(this.videoStatuses.values());
  }
  
  /**
   * Inicializa o processador de fila
   */
  private async startQueueProcessor() {
    // Verificar periodicamente a fila
    setInterval(async () => {
      if (this.processingQueue.length > 0 && this.currentlyProcessing < this.maxConcurrentProcessing) {
        const videoId = this.processingQueue.shift();
        if (videoId) {
          this.currentlyProcessing++;
          
          // Obter detalhes do vídeo
          const videoStatus = this.videoStatuses.get(videoId);
          
          if (videoStatus) {
            try {
              // Atualizar progresso
              this.updateVideoStatus(videoId, { progress: 10 });
              
              // Obter opções do vídeo do armazenamento ou repositório
              const options: VideoGenerationOptions = {
                title: videoStatus.title,
                outputFormat: videoStatus.outputFormat as 'mp4' | 'webm'
              };
              
              // Processar o vídeo em background
              this.processVideoInBackground(videoId, options)
                .catch(error => {
                  log(`Erro ao processar vídeo ${videoId}: ${error}`, 'video-orchestrator');
                  this.updateVideoStatus(videoId, {
                    status: 'failed',
                    error: error instanceof Error ? error.message : String(error),
                    progress: 0,
                    endTime: new Date()
                  });
                })
                .finally(() => {
                  this.currentlyProcessing--;
                });
            } catch (error) {
              log(`Erro ao iniciar processamento de vídeo ${videoId}: ${error}`, 'video-orchestrator');
              this.updateVideoStatus(videoId, {
                status: 'failed',
                error: error instanceof Error ? error.message : String(error),
                progress: 0,
                endTime: new Date()
              });
              this.currentlyProcessing--;
            }
          } else {
            log(`ID de vídeo ${videoId} não encontrado nos status`, 'video-orchestrator');
            this.currentlyProcessing--;
          }
        }
      }
    }, 1000); // Verificar a cada 1 segundo
  }
  
  /**
   * Processa o vídeo em background
   */
  private async processVideoInBackground(videoId: string, options: VideoGenerationOptions) {
    try {
      // Atualizar progresso
      this.updateVideoStatus(videoId, { progress: 15 });
      
      // Garantir que temos imagens
      const imagePaths = await this.ensureImages(options.imagePaths, options.title);
      
      // Atualizar progresso
      this.updateVideoStatus(videoId, { progress: 30 });
      
      // Gerar áudio se houver script
      let audioPath: string | undefined = options.audio;
      if (options.script && !audioPath) {
        audioPath = await this.generateAudio(options.script, options.voiceProvider, options.voice);
      }
      
      // Atualizar progresso
      this.updateVideoStatus(videoId, { progress: 50 });
      
      // Determinar resolução
      const resolution = this.getResolutionDimensions(options.resolution || 'vertical');
      
      // Atualizar progresso
      this.updateVideoStatus(videoId, { progress: 60 });
      
      // Criar vídeo a partir das imagens
      const outputFileName = `video_${videoId}.${options.outputFormat || 'mp4'}`;
      const outputPath = await this.ffmpegService.createVideoFromImages({
        imagePaths,
        outputFileName,
        duration: options.duration || 3,
        transition: options.transition || 'fade',
        transitionDuration: options.transitionDuration || 0.5,
        width: resolution.width,
        height: resolution.height,
        textOverlay: options.script,
        textPosition: options.textPosition || 'bottom',
        textColor: options.textColor || '#FFFFFF',
        textAnimation: options.textAnimation,
        zoomEffect: options.zoomEffect || false,
        colorGrading: options.colorGrading,
        audioPath,
        autoSubtitle: options.autoSubtitle || false,
        watermark: options.watermark,
        outputQuality: options.outputQuality || 'medium',
        social: options.social
      });
      
      // Atualizar progresso
      this.updateVideoStatus(videoId, { progress: 90 });
      
      // Se temos um provedor de armazenamento, fazer upload do vídeo
      let videoUrl = outputPath;
      if (this.storageProvider) {
        videoUrl = await this.storageProvider.uploadVideo(outputPath, path.basename(outputPath));
      }
      
      // Usar a primeira imagem como thumbnail por padrão
      let thumbnailUrl: string | undefined;
      if (imagePaths.length > 0) {
        if (this.storageProvider) {
          thumbnailUrl = await this.storageProvider.uploadImage(imagePaths[0], `thumb_${videoId}${path.extname(imagePaths[0])}`);
        } else {
          thumbnailUrl = imagePaths[0];
        }
      }
      
      // Atualizar status para concluído
      this.updateVideoStatus(videoId, {
        status: 'completed',
        progress: 100,
        videoUrl,
        thumbnailUrl,
        endTime: new Date(),
        usedService: 'ffmpeg'
      });
      
      return videoUrl;
    } catch (error) {
      log(`Erro no processamento de vídeo ${videoId}: ${error instanceof Error ? error.message : String(error)}`, 'video-orchestrator');
      
      // Atualizar status para falha
      this.updateVideoStatus(videoId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        progress: 0,
        endTime: new Date()
      });
      
      throw error;
    }
  }
  
  /**
   * Garante que temos imagens para o vídeo
   */
  private async ensureImages(images?: string[], title?: string): Promise<string[]> {
    if (images && images.length > 0) {
      return this.prepareLocalImages(images);
    }
    
    // Se não temos imagens, temos que gerar ou obter
    if (this.pexelsService && title) {
      try {
        const searchTerms = title.replace(/[^\w\s]/g, '').trim();
        return await this.pexelsService.searchImages(searchTerms, 5);
      } catch (error) {
        log(`Erro ao buscar imagens no Pexels: ${error instanceof Error ? error.message : String(error)}`, 'video-orchestrator');
        // Fallback para imagens de teste
        return this.useTestImages();
      }
    } else {
      // Sem Pexels, usar imagens de teste
      return this.useTestImages();
    }
  }
  
  /**
   * Prepara imagens locais para uso
   */
  private async prepareLocalImages(imagePaths: string[]): Promise<string[]> {
    const validImages: string[] = [];
    
    for (const imgPath of imagePaths) {
      try {
        // Verificar se o caminho existe
        await fs.access(imgPath);
        validImages.push(imgPath);
      } catch (error) {
        log(`Imagem não encontrada: ${imgPath}`, 'video-orchestrator');
      }
    }
    
    if (validImages.length === 0) {
      log('Nenhuma imagem válida fornecida, usando imagens de teste', 'video-orchestrator');
      return this.useTestImages();
    }
    
    return validImages;
  }
  
  /**
   * Usa imagens de teste como fallback
   */
  private async useTestImages(): Promise<string[]> {
    const testImagesDir = path.join(process.cwd(), 'uploads/temp');
    
    try {
      // Verificar se o diretório existe
      await fs.access(testImagesDir);
    } catch (error) {
      // Criar diretório se não existir
      await fs.mkdir(testImagesDir, { recursive: true });
    }
    
    // Criar 3 imagens de teste coloridas para usar como fallback
    const colors = ['#FF5733', '#33FF57', '#3357FF'];
    const imagePaths: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const imgPath = path.join(testImagesDir, `test_image_${i + 1}.jpg`);
      
      // Verificar se a imagem já existe
      try {
        await fs.access(imgPath);
        imagePaths.push(imgPath);
      } catch (error) {
        // Se não existir, seria criada uma imagem de teste
        // Para simplicidade, vamos apenas simular isso
        await fs.writeFile(imgPath, `Conteúdo simulado de imagem ${i + 1}`);
        imagePaths.push(imgPath);
      }
    }
    
    return imagePaths;
  }
  
  /**
   * Gera imagens simples baseadas em texto
   */
  private async generateSimpleImages(): Promise<string[]> {
    const tempDir = path.join(process.cwd(), 'uploads/temp');
    
    try {
      // Verificar se o diretório existe
      await fs.access(tempDir);
    } catch (error) {
      // Criar diretório se não existir
      await fs.mkdir(tempDir, { recursive: true });
    }
    
    // Gerar 3 imagens simples com textos
    const texts = ['Inovação', 'Crescimento', 'Sucesso'];
    const imagePaths: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const imgPath = path.join(tempDir, `generated_image_${i + 1}.jpg`);
      
      // Verificar se a imagem já existe
      try {
        await fs.access(imgPath);
        imagePaths.push(imgPath);
      } catch (error) {
        // Se não existir, seria criada uma imagem
        // Para simplicidade, vamos apenas simular isso
        await fs.writeFile(imgPath, `Conteúdo simulado de imagem com texto "${texts[i]}"`);
        imagePaths.push(imgPath);
      }
    }
    
    return imagePaths;
  }
  
  /**
   * Gera áudio a partir de texto
   */
  private async generateAudio(text: string, provider?: string, voice?: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'uploads/audio');
    const outputPath = path.join(outputDir, `audio_${Date.now()}.mp3`);
    
    try {
      // Verificar se o diretório existe
      await fs.access(outputDir);
    } catch (error) {
      // Criar diretório se não existir
      await fs.mkdir(outputDir, { recursive: true });
    }
    
    return this.generateAudioWithProvider(text, provider || 'auto', voice, outputPath);
  }
  
  /**
   * Gera áudio com um provedor específico
   */
  private async generateAudioWithProvider(text: string, provider: string, voice: string | undefined, outputPath: string): Promise<string> {
    try {
      switch (provider.toLowerCase()) {
        case 'google':
          if (this.googleTTSService) {
            return await this.googleTTSService.convertText(text, voice);
          }
          throw new Error('Serviço Google TTS não disponível');
          
        case 'coqui':
          return await this.coquiTTSService.convertText(text, voice);
          
        case 'responsivevoice':
          return await this.responsiveVoiceService.convertText(text, voice);
          
        case 'auto':
        default:
          // Tentar cada serviço na ordem de preferência
          try {
            if (this.googleTTSService) {
              return await this.googleTTSService.convertText(text, voice);
            }
          } catch (error) {
            log(`Erro no Google TTS: ${error}. Tentando Coqui.`, 'tts');
          }
          
          try {
            return await this.coquiTTSService.convertText(text, voice);
          } catch (error) {
            log(`Erro no Coqui TTS: ${error}. Tentando ResponsiveVoice.`, 'tts');
          }
          
          return await this.responsiveVoiceService.convertText(text, voice);
      }
    } catch (error) {
      log(`Erro na geração de áudio: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      
      // Criar áudio silencioso como fallback
      await this.ffmpegService.createSilentAudio(outputPath, 10);
      return outputPath;
    }
  }
  
  /**
   * Baixa uma imagem de uma URL
   */
  private async downloadImage(url: string, outputPath: string): Promise<void> {
    // Implementação simulada para simplificar
    await fs.writeFile(outputPath, `Imagem baixada de ${url}`);
  }
  
  /**
   * Atualiza o status de um vídeo
   */
  private updateVideoStatus(videoId: string, updates: Partial<VideoResult>) {
    const status = this.videoStatuses.get(videoId);
    
    if (status) {
      this.videoStatuses.set(videoId, {
        ...status,
        ...updates
      });
    }
  }
  
  /**
   * Garante que os diretórios necessários existam
   */
  private async ensureDirectoriesExist() {
    const directories = [
      path.join(process.cwd(), 'uploads'),
      path.join(process.cwd(), 'uploads/videos'),
      path.join(process.cwd(), 'uploads/audio'),
      path.join(process.cwd(), 'uploads/temp'),
      path.join(process.cwd(), 'uploads/images')
    ];
    
    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch (error) {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }
  
  /**
   * Retorna as dimensões com base na resolução
   */
  private getResolutionDimensions(resolution: string): { width: number, height: number } {
    const resolutions: Record<string, { width: number, height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      'vertical': { width: 1080, height: 1920 },
    };
    
    return resolutions[resolution] || resolutions['vertical'];
  }
  
  /**
   * Registra testes de resiliência para este serviço
   */
  private registerResilienceTests() {
    // Testar TTS
    const testTTS = async (): Promise<ResilienceTestResult> => {
      const startTime = Date.now();
      
      // Testar Google TTS
      if (this.googleTTSService) {
        try {
          const isAvailable = await this.googleTTSService.isAvailable();
          if (isAvailable) {
            return {
              success: true,
              responseTime: Date.now() - startTime,
              fallbackUsed: false,
              fallbackService: undefined
            };
          }
        } catch (error) {
          log(`Erro ao testar Google TTS: ${error}`, 'resilience');
        }
      }
      
      // Testar Coqui TTS
      try {
        const isAvailable = await this.coquiTTSService.isAvailable();
        if (isAvailable) {
          return {
            success: true,
            responseTime: Date.now() - startTime,
            fallbackUsed: true,
            fallbackService: 'coqui'
          };
        }
      } catch (error) {
        log(`Erro ao testar Coqui TTS: ${error}`, 'resilience');
      }
      
      // Testar ResponsiveVoice como último fallback
      try {
        const isAvailable = await this.responsiveVoiceService.isAvailable();
        if (isAvailable) {
          return {
            success: true,
            responseTime: Date.now() - startTime,
            fallbackUsed: true,
            fallbackService: 'responsivevoice'
          };
        }
      } catch (error) {
        log(`Erro ao testar ResponsiveVoice: ${error}`, 'resilience');
      }
      
      // Todos os serviços falharam
      return {
        success: false,
        responseTime: Date.now() - startTime,
        fallbackUsed: true,
        errorMessage: 'Todos os serviços de TTS estão indisponíveis'
      };
    };
    
    // A cada 10 minutos, testar serviços
    setInterval(async () => {
      try {
        // Testar FFmpeg
        const ffmpegWorking = await this.ffmpegService.isAvailable();
        
        // Testar TTS
        const ttsResult = await testTTS();
        
        log(`Teste de resiliência: FFmpeg=${ffmpegWorking ? 'OK' : 'FALHA'}, TTS=${ttsResult.success ? 'OK' : 'FALHA'}`, 'resilience');
      } catch (error) {
        log(`Erro ao testar resiliência: ${error instanceof Error ? error.message : String(error)}`, 'resilience');
      }
    }, 10 * 60 * 1000); // 10 minutos
  }
}

// Criar instância singleton para uso em toda a aplicação
export const videoOrchestrator = new VideoOrchestrator(
  ffmpegService,
  process.env.PEXELS_API_KEY,
  process.env.GOOGLE_TTS_API_KEY,
  storageProvider
);