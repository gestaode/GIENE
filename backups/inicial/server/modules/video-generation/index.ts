/**
 * Módulo de Geração de Vídeo
 * 
 * Este módulo é responsável por todos os processos relacionados à geração de vídeos,
 * utilizando FFmpeg para processamento e composição.
 * 
 * Características principais:
 * - Geração de vídeos a partir de imagens e texto
 * - Adição de áudio a vídeos
 * - Implementação de resiliência para evitar erros de processamento
 * - Suporte à personalização e templates
 */

import { log } from '../../vite';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Canvas, createCanvas, loadImage } from 'canvas';
import { FFmpegService } from '../../services/ffmpeg';
import { cacheService } from '../../services/caching';
import { GoogleCloudTTSService } from '../../services/google-cloud-tts';
import { ResponsiveVoiceService } from '../../services/responsive-voice';
import { CoquiTTSService } from '../../services/coqui-tts';
import { PexelsService } from '../../services/pexels';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

// Interfaces e tipos
export interface VideoOptions {
  title: string;
  script: string;
  voice?: string;
  voiceProvider?: 'google' | 'responsivevoice' | 'coqui';
  duration?: number;
  resolution?: '720p' | '1080p' | 'vertical';
  style?: 'professional' | 'casual' | 'dramatic';
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  outputFormat?: 'mp4' | 'webm';
  includeWatermark?: boolean;
  backgroundImages?: string[];
  audioFile?: string;
}

export interface VideoStatus {
  id: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  outputPath?: string;
  startTime: Date;
  endTime?: Date;
  options: VideoOptions;
}

/**
 * Classe principal do módulo de geração de vídeo
 */
export class VideoGenerationModule {
  private ffmpegService: FFmpegService;
  private googleTTSService: GoogleCloudTTSService | null = null;
  private responsiveVoiceService: ResponsiveVoiceService | null = null;
  private coquiTTSService: CoquiTTSService | null = null;
  private pexelsService: PexelsService | null = null;
  private videoStatuses: Map<string, VideoStatus> = new Map();
  private tempDir: string = path.join(process.cwd(), 'temp');
  private outputDir: string = path.join(process.cwd(), 'uploads');
  
  constructor() {
    log('Inicializando módulo de geração de vídeo', 'video-module');
    
    // Inicializar serviço de FFmpeg
    this.ffmpegService = new FFmpegService();
    
    // Inicializar serviços de TTS se as chaves API estiverem disponíveis
    if (process.env.GOOGLE_TTS_API_KEY) {
      this.googleTTSService = new GoogleCloudTTSService(process.env.GOOGLE_TTS_API_KEY);
    }
    
    // Serviços que não precisam de chave API
    this.responsiveVoiceService = new ResponsiveVoiceService();
    this.coquiTTSService = new CoquiTTSService();
    
    // Inicializar Pexels se a chave API estiver disponível
    if (process.env.PEXELS_API_KEY) {
      this.pexelsService = new PexelsService(process.env.PEXELS_API_KEY);
    }
    
    // Criar diretórios temporários e de saída se não existirem
    this.ensureDirectories();
  }

  /**
   * Garante que os diretórios necessários existam
   */
  private async ensureDirectories(): Promise<void> {
    try {
      if (!fs.existsSync(this.tempDir)) {
        await mkdir(this.tempDir, { recursive: true });
      }
      
      if (!fs.existsSync(this.outputDir)) {
        await mkdir(this.outputDir, { recursive: true });
      }
    } catch (error) {
      log(`Erro ao criar diretórios: ${error instanceof Error ? error.message : String(error)}`, 'video-module');
    }
  }

  /**
   * Gera um ID único para o vídeo
   */
  private generateVideoId(): string {
    return `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Converte texto para fala usando um dos serviços disponíveis
   */
  private async textToSpeech(text: string, options: {
    voiceProvider?: 'google' | 'responsivevoice' | 'coqui';
    voice?: string;
    outputPath: string;
  }): Promise<string> {
    const { voiceProvider = 'responsivevoice', voice = 'pt-BR-Standard-B', outputPath } = options;
    
    log(`Convertendo texto para fala usando ${voiceProvider}`, 'video-module');
    
    try {
      // Tentar converter texto para fala com o provedor especificado
      if (voiceProvider === 'google' && this.googleTTSService) {
        const result = await this.googleTTSService.synthesize({
          text,
          voice,
          audioConfig: {
            audioEncoding: 'MP3',
          }
        });
        
        if (result && result.audioContent) {
          await writeFile(outputPath, Buffer.from(result.audioContent, 'base64'));
          return outputPath;
        }
        throw new Error('Falha ao sintetizar áudio com Google TTS');
      } 
      else if (voiceProvider === 'responsivevoice' && this.responsiveVoiceService) {
        const audioData = await this.responsiveVoiceService.synthesize(text, {
          voice: voice || 'Brazilian Portuguese Female',
          rate: 0.9,
          pitch: 1.0
        });
        
        if (audioData) {
          await writeFile(outputPath, audioData);
          return outputPath;
        }
        throw new Error('Falha ao sintetizar áudio com ResponsiveVoice');
      }
      else if (voiceProvider === 'coqui' && this.coquiTTSService) {
        const audioData = await this.coquiTTSService.synthesize(text, {
          speaker: voice || 'pt_br_female'
        });
        
        if (audioData) {
          await writeFile(outputPath, audioData);
          return outputPath;
        }
        throw new Error('Falha ao sintetizar áudio com Coqui TTS');
      }
    } catch (error) {
      log(`Erro no provedor ${voiceProvider}, tentando fallback: ${error instanceof Error ? error.message : String(error)}`, 'video-module');
    }
    
    // Fallback para ResponsiveVoice se ainda não tentamos
    if (voiceProvider !== 'responsivevoice' && this.responsiveVoiceService) {
      try {
        log('Usando ResponsiveVoice como fallback', 'video-module');
        const audioData = await this.responsiveVoiceService.synthesize(text, {
          voice: 'Brazilian Portuguese Female',
          rate: 0.9,
          pitch: 1.0
        });
        
        if (audioData) {
          await writeFile(outputPath, audioData);
          return outputPath;
        }
      } catch (fallbackError) {
        log(`Erro no fallback ResponsiveVoice: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`, 'video-module');
      }
    }
    
    throw new Error('Todos os serviços de TTS falharam');
  }

  /**
   * Busca imagens relevantes para o vídeo
   */
  private async getBackgroundImages(options: {
    query: string;
    count: number;
    resolution?: '720p' | '1080p' | 'vertical';
    cacheKey?: string;
  }): Promise<string[]> {
    const { query, count, resolution = '1080p', cacheKey } = options;
    
    // Se o cache estiver habilitado e houver uma chave de cache, tentar buscar do cache
    if (cacheKey) {
      const cached = await cacheService.get(`bg-images:${cacheKey}`);
      if (cached && Array.isArray(cached) && cached.length >= count) {
        return cached;
      }
    }
    
    // Determinar orientação e dimensões com base na resolução
    let orientation = 'landscape';
    if (resolution === 'vertical') {
      orientation = 'portrait';
    }
    
    // Tentar obter imagens do Pexels
    if (this.pexelsService) {
      try {
        const result = await this.pexelsService.searchPhotos(query, count, { orientation });
        
        if (result && result.photos && result.photos.length > 0) {
          const imageUrls = result.photos.map(photo => {
            // Escolher o tamanho da imagem com base na resolução
            if (resolution === '720p') {
              return photo.src.large;
            } else if (resolution === 'vertical') {
              return photo.src.portrait;
            } else {
              return photo.src.original || photo.src.large2x || photo.src.large;
            }
          });
          
          // Se o cache estiver habilitado e houver uma chave de cache, armazenar no cache
          if (cacheKey) {
            await cacheService.set(`bg-images:${cacheKey}`, imageUrls, 24 * 60 * 60); // 24 horas
          }
          
          return imageUrls;
        }
      } catch (error) {
        log(`Erro ao buscar imagens do Pexels: ${error instanceof Error ? error.message : String(error)}`, 'video-module');
      }
    }
    
    // Fallback: usar imagens locais de exemplo ou gerar slides em branco
    log('Usando imagens de fallback local', 'video-module');
    
    // Buscar imagens de exemplo na pasta de exemplos, se existirem
    const exampleImagesDir = path.join(process.cwd(), 'example-images');
    const fallbackImages: string[] = [];
    
    if (fs.existsSync(exampleImagesDir)) {
      try {
        const files = fs.readdirSync(exampleImagesDir);
        const imageFiles = files.filter(file => 
          file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
        );
        
        for (let i = 0; i < Math.min(count, imageFiles.length); i++) {
          fallbackImages.push(path.join(exampleImagesDir, imageFiles[i]));
        }
        
        // Se encontramos imagens suficientes, retornar
        if (fallbackImages.length >= count) {
          return fallbackImages;
        }
      } catch (error) {
        log(`Erro ao buscar imagens de exemplo: ${error instanceof Error ? error.message : String(error)}`, 'video-module');
      }
    }
    
    // Se não houver imagens suficientes, gerar slides em branco
    const slidesNeeded = count - fallbackImages.length;
    
    // Determinar tamanho das imagens
    let width = 1920;
    let height = 1080;
    
    if (resolution === '720p') {
      width = 1280;
      height = 720;
    } else if (resolution === 'vertical') {
      width = 1080;
      height = 1920;
    }
    
    // Gerar slides em branco
    for (let i = 0; i < slidesNeeded; i++) {
      const slideTitle = `Slide ${i + 1}`;
      
      try {
        // Criar um canvas e desenhar o slide
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Fundo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        
        // Adicionar um título ao slide
        ctx.fillStyle = '#333333';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(slideTitle, width / 2, height / 2);
        
        // Salvar o slide como imagem
        const slideFileName = path.join(this.tempDir, `slide_${i + 1}.png`);
        const buffer = canvas.toBuffer('image/png');
        await writeFile(slideFileName, buffer);
        
        fallbackImages.push(slideFileName);
      } catch (error) {
        log(`Erro ao gerar slide: ${error instanceof Error ? error.message : String(error)}`, 'video-module');
      }
    }
    
    return fallbackImages;
  }

  /**
   * Cria imagens com texto para o vídeo
   */
  private async createTextSlides(options: {
    text: string;
    outputDir: string;
    resolution?: '720p' | '1080p' | 'vertical';
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  }): Promise<string[]> {
    const { 
      text,
      outputDir,
      resolution = '1080p',
      backgroundColor = '#ffffff',
      textColor = '#333333',
      fontFamily = 'Arial'
    } = options;
    
    // Determinar tamanho das imagens
    let width = 1920;
    let height = 1080;
    
    if (resolution === '720p') {
      width = 1280;
      height = 720;
    } else if (resolution === 'vertical') {
      width = 1080;
      height = 1920;
    }
    
    // Dividir o texto em parágrafos
    const paragraphs = text.split('\n\n').filter(paragraph => paragraph.trim().length > 0);
    
    // Criar um slide para cada parágrafo
    const slideFiles: string[] = [];
    
    for (let i = 0; i < paragraphs.length; i++) {
      try {
        // Criar um canvas e desenhar o slide
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Fundo
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Configurar o texto
        ctx.fillStyle = textColor;
        ctx.font = `32px ${fontFamily}`;
        ctx.textAlign = 'center';
        
        // Quebrar o texto em linhas
        const maxLineLength = width * 0.8; // 80% da largura
        const lines = this.getTextLines(paragraphs[i], ctx, maxLineLength);
        
        // Calcular altura total do texto
        const lineHeight = 40;
        const textHeight = lines.length * lineHeight;
        
        // Posicionar o texto no centro vertical
        let y = (height - textHeight) / 2;
        
        // Desenhar cada linha de texto
        for (const line of lines) {
          ctx.fillText(line, width / 2, y);
          y += lineHeight;
        }
        
        // Salvar o slide como imagem
        const slideFileName = path.join(outputDir, `text_slide_${i + 1}.png`);
        const buffer = canvas.toBuffer('image/png');
        await writeFile(slideFileName, buffer);
        
        slideFiles.push(slideFileName);
      } catch (error) {
        log(`Erro ao criar slide de texto: ${error instanceof Error ? error.message : String(error)}`, 'video-module');
      }
    }
    
    return slideFiles;
  }

  /**
   * Quebra o texto em múltiplas linhas para caber na largura máxima
   */
  private getTextLines(text: string, ctx: any, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines;
  }

  /**
   * Gera um vídeo a partir de um roteiro
   */
  async generateVideo(options: VideoOptions): Promise<VideoStatus> {
    // Validar parâmetros obrigatórios
    if (!options.title || !options.script) {
      throw new Error('Título e roteiro são obrigatórios');
    }
    
    // Gerar ID único para o vídeo
    const videoId = this.generateVideoId();
    
    // Criar diretório temporário para os arquivos do vídeo
    const videoTempDir = path.join(this.tempDir, videoId);
    await mkdir(videoTempDir, { recursive: true });
    
    // Criar e armazenar objeto de status para o vídeo
    const videoStatus: VideoStatus = {
      id: videoId,
      title: options.title,
      status: 'processing',
      progress: 0,
      startTime: new Date(),
      options
    };
    
    this.videoStatuses.set(videoId, videoStatus);
    
    // Iniciar o processo de geração em background
    this.processVideo(videoId, videoStatus, videoTempDir)
      .catch(error => {
        log(`Erro ao processar vídeo ${videoId}: ${error.message}`, 'video-module');
        
        // Atualizar status em caso de erro
        videoStatus.status = 'failed';
        videoStatus.errorMessage = error.message;
        videoStatus.endTime = new Date();
        this.videoStatuses.set(videoId, videoStatus);
      });
    
    return videoStatus;
  }

  /**
   * Processa o vídeo em background
   */
  private async processVideo(videoId: string, status: VideoStatus, tempDir: string): Promise<void> {
    const options = status.options;
    
    try {
      log(`Iniciando processamento do vídeo ${videoId}: ${options.title}`, 'video-module');
      
      // Etapa 1: Sintetizar áudio do roteiro
      status.progress = 10;
      this.videoStatuses.set(videoId, status);
      
      const audioFilePath = options.audioFile || path.join(tempDir, 'audio.mp3');
      
      if (!options.audioFile) {
        log(`Sintetizando áudio para o vídeo ${videoId}`, 'video-module');
        
        await this.textToSpeech(options.script, {
          voiceProvider: options.voiceProvider,
          voice: options.voice,
          outputPath: audioFilePath
        });
      }
      
      // Etapa 2: Obter imagens de fundo ou criar slides de texto
      status.progress = 30;
      this.videoStatuses.set(videoId, status);
      
      let imageFiles: string[] = [];
      
      if (options.backgroundImages && options.backgroundImages.length > 0) {
        // Usar imagens fornecidas
        imageFiles = options.backgroundImages;
      } else {
        // Criar imagens com o texto do roteiro
        log(`Criando slides de texto para o vídeo ${videoId}`, 'video-module');
        
        const scriptTextSlides = await this.createTextSlides({
          text: options.script,
          outputDir: tempDir,
          resolution: options.resolution,
          backgroundColor: options.backgroundColor,
          textColor: options.textColor,
          fontFamily: options.fontFamily
        });
        
        imageFiles = scriptTextSlides;
      }
      
      // Etapa 3: Determinar a duração do áudio
      status.progress = 50;
      this.videoStatuses.set(videoId, status);
      
      const audioDuration = await this.ffmpegService.getAudioDuration(audioFilePath);
      
      // Etapa 4: Criar slideshow de imagens
      log(`Criando slideshow para o vídeo ${videoId}`, 'video-module');
      status.progress = 70;
      this.videoStatuses.set(videoId, status);
      
      let slidesPerImage = audioDuration / imageFiles.length;
      if (!Number.isFinite(slidesPerImage) || slidesPerImage <= 0) {
        slidesPerImage = 5; // Fallback de 5 segundos por imagem
      }
      
      const slideshowPath = path.join(tempDir, 'slideshow.mp4');
      await this.ffmpegService.createSlideshowFromImages(imageFiles, slideshowPath, slidesPerImage, {
        resolution: options.resolution
      });
      
      // Etapa 5: Adicionar áudio ao slideshow
      log(`Adicionando áudio ao vídeo ${videoId}`, 'video-module');
      status.progress = 85;
      this.videoStatuses.set(videoId, status);
      
      const outputFormat = options.outputFormat || 'mp4';
      const outputFileName = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${videoId}.${outputFormat}`;
      const outputPath = path.join(this.outputDir, outputFileName);
      
      await this.ffmpegService.addAudioToVideo(slideshowPath, audioFilePath, outputPath);
      
      // Etapa 6: Finalização e limpeza
      log(`Concluindo processamento do vídeo ${videoId}`, 'video-module');
      status.progress = 100;
      status.status = 'completed';
      status.outputPath = outputPath;
      status.endTime = new Date();
      this.videoStatuses.set(videoId, status);
      
      // Limpar arquivos temporários
      try {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          await unlink(path.join(tempDir, file));
        }
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        log(`Erro ao limpar arquivos temporários: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`, 'video-module');
      }
      
      log(`Vídeo ${videoId} gerado com sucesso: ${outputPath}`, 'video-module');
    } catch (error) {
      status.status = 'failed';
      status.errorMessage = error instanceof Error ? error.message : String(error);
      status.endTime = new Date();
      this.videoStatuses.set(videoId, status);
      
      log(`Erro ao processar vídeo ${videoId}: ${status.errorMessage}`, 'video-module');
      throw error;
    }
  }

  /**
   * Obtém o status de um vídeo específico
   */
  getVideoStatus(videoId: string): VideoStatus | null {
    return this.videoStatuses.get(videoId) || null;
  }

  /**
   * Lista todos os vídeos gerados
   */
  listVideos(status?: 'processing' | 'completed' | 'failed'): VideoStatus[] {
    let videos = Array.from(this.videoStatuses.values());
    
    if (status) {
      videos = videos.filter(video => video.status === status);
    }
    
    return videos;
  }

  /**
   * Verifica se o FFmpeg está disponível e funcionando
   */
  async checkFFmpegStatus(): Promise<boolean> {
    try {
      const version = await this.ffmpegService.getVersion();
      return version.includes('ffmpeg');
    } catch (error) {
      log(`Erro ao verificar FFmpeg: ${error instanceof Error ? error.message : String(error)}`, 'video-module');
      return false;
    }
  }
}

// Exportar instância singleton do módulo
export const videoGenerationModule = new VideoGenerationModule();