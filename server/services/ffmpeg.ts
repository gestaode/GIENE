import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { log } from '../vite';

/**
 * Interface para configuração de criação de vídeo a partir de imagens
 */
export interface CreateVideoOptions {
  imagePaths: string[];
  outputFileName: string;
  duration?: number;
  transition?: string;
  transitionDuration?: number;
  width?: number;
  height?: number;
  textOverlay?: string;
  textPosition?: string;
  textColor?: string;
  textFont?: string;
  textAnimation?: string;
  logo?: string;
  logoPosition?: string;
  fps?: number;
  zoomEffect?: boolean;
  colorGrading?: string;
  audioPath?: string;
  autoSubtitle?: boolean;
  watermark?: string;
  outputQuality?: string;
  social?: string;
}

/**
 * Interface para configuração de adição de áudio a vídeo
 */
export interface AddAudioOptions {
  videoPath: string;
  audioPath: string;
  outputFileName: string;
  loop?: boolean;
}

/**
 * Interface para configuração de combinação de vídeos
 */
export interface CombineVideosOptions {
  videoPaths: string[];
  outputFileName: string;
  transition?: string;
  transitionDuration?: number;
}

/**
 * Interface para opções de criação de vídeo com texto
 */
export interface TextVideoOptions {
  outputFileName: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  frameRate?: number;
  duration?: number;
  bitrate?: string;
}

/**
 * Serviço para operações com FFmpeg
 */
export class FFmpegService {
  private readonly videoOutputDir = './uploads/videos';
  
  constructor() {
    this.ensureDirectoriesExist();
  }

  /**
   * Garante que os diretórios necessários existam
   */
  private ensureDirectoriesExist() {
    const dirs = ['./uploads', './uploads/temp', './uploads/videos', './uploads/audio'];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Cria um arquivo de áudio silencioso com a duração especificada
   */
  async createSilentAudio(outputPath: string, durationSeconds: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      execFile('ffmpeg', [
        '-f', 'lavfi',
        '-i', `anullsrc=r=44100:cl=stereo`,
        '-t', durationSeconds.toString(),
        '-c:a', 'libmp3lame',
        '-q:a', '2',
        outputPath
      ], (error, stdout, stderr) => {
        if (error) {
          log(`Erro ao criar áudio silencioso: ${error.message}`, 'ffmpeg');
          log(`FFmpeg stderr: ${stderr}`, 'ffmpeg');
          return reject(error);
        }
        resolve();
      });
    });
  }

  /**
   * Converte um arquivo de áudio para outro formato
   */
  async convertAudioFormat(inputPath: string, outputPath: string, outputFormat: string): Promise<void> {
    return new Promise((resolve, reject) => {
      execFile('ffmpeg', [
        '-i', inputPath,
        '-c:a', this.getAudioCodecForFormat(outputFormat),
        '-q:a', '2',
        outputPath
      ], (error, stdout, stderr) => {
        if (error) {
          log(`Erro ao converter áudio: ${error.message}`, 'ffmpeg');
          log(`FFmpeg stderr: ${stderr}`, 'ffmpeg');
          return reject(error);
        }
        resolve();
      });
    });
  }

  /**
   * Retorna o codec apropriado para o formato de áudio especificado
   */
  private getAudioCodecForFormat(format: string): string {
    const codecMap: Record<string, string> = {
      'mp3': 'libmp3lame',
      'wav': 'pcm_s16le',
      'ogg': 'libvorbis',
      'aac': 'aac'
    };
    return codecMap[format.toLowerCase()] || 'libmp3lame';
  }

  /**
   * Cria um vídeo a partir de uma lista de imagens
   */
  async createVideoFromImages(options: CreateVideoOptions): Promise<string> {
    const {
      imagePaths,
      outputFileName,
      duration = 3,
      transition = 'fade',
      transitionDuration = 0.5,
      width = 1080,
      height = 1920,
      textOverlay,
      textPosition = 'bottom',
      textColor = '#FFFFFF',
      textFont = 'Arial',
      textAnimation = 'none',
      logo,
      logoPosition = 'bottomright',
      fps = 30,
      zoomEffect = false,
      colorGrading = 'normal',
      audioPath,
      autoSubtitle = false,
      watermark,
      outputQuality = 'medium',
      social = 'tiktok'
    } = options;

    // Validação básica
    if (!imagePaths || imagePaths.length === 0) {
      throw new Error('Pelo menos uma imagem é necessária para criar o vídeo');
    }

    // Para cada imagem, verificar se ela existe
    const existingImagePaths = [];
    for (const imgPath of imagePaths) {
      if (fs.existsSync(imgPath)) {
        existingImagePaths.push(imgPath);
      } else {
        log(`Imagem não encontrada: ${imgPath}`, 'ffmpeg');
      }
    }

    if (existingImagePaths.length === 0) {
      throw new Error('Nenhuma das imagens fornecidas existe.');
    }

    // Configurar nome e caminho de saída
    const safeOutputFileName = this.sanitizeFileName(outputFileName || `video_${Date.now()}.mp4`);
    const outputPath = path.join(this.videoOutputDir, safeOutputFileName);

    // Preparar configurações de qualidade
    const qualitySettings = this.getQualitySettings(outputQuality, social);
    const bitrate = qualitySettings.bitrate;
    const preset = qualitySettings.preset;

    // Determinar o tamanho correto para a rede social
    const dimensions = this.getSocialMediaDimensions(social);
    const finalWidth = dimensions.width || width;
    const finalHeight = dimensions.height || height;

    try {
      log(`Iniciando criação de vídeo a partir de ${existingImagePaths.length} imagens`, 'ffmpeg');

      // Definir filtros para cada imagem
      const filters = [];
      const inputs = [];
      const inputMapping = [];
      
      for (let i = 0; i < existingImagePaths.length; i++) {
        const imgPath = existingImagePaths[i];
        inputs.push('-loop', '1', '-t', duration.toString(), '-i', imgPath);
        
        // Aplicar filtros à imagem (zoom, color grading, etc)
        let filterStr = `[${i}:v]scale=${finalWidth}:${finalHeight}:force_original_aspect_ratio=decrease,pad=${finalWidth}:${finalHeight}:(ow-iw)/2:(oh-ih)/2`;
        
        // Aplicar efeito de zoom se solicitado
        if (zoomEffect) {
          filterStr += `,zoompan=z='min(zoom+0.0015,1.5)':d=${Math.round(fps * duration)}:s=${finalWidth}x${finalHeight}`;
        }
        
        // Aplicar colorização
        if (colorGrading && colorGrading !== 'normal') {
          filterStr += `,${this.getColorGradingFilter(colorGrading)}`;
        }

        // Adicionar texto se especificado
        if (textOverlay) {
          const textPositionFilter = this.getTextPositionFilter(textPosition || 'bottom', finalWidth, finalHeight);
          filterStr += `,drawtext=text='${textOverlay}':fontcolor=${textColor}:fontsize=${finalHeight/20}:${textPositionFilter}`;
        }
        
        // Nomear o output do filtro
        filterStr += `[v${i}]`;
        filters.push(filterStr);
        inputMapping.push(`[v${i}]`);
      }
      
      // Concatenar todas as imagens com transições
      if (existingImagePaths.length > 1) {
        const concatFilter = this.createConcatFilter(existingImagePaths.length, transition, transitionDuration, fps);
        filters.push(concatFilter);
      }
      
      // Construir comando FFmpeg
      const filterComplex = filters.join(';');
      
      // Configurar áudio
      let audioOptions = [];
      if (audioPath && fs.existsSync(audioPath)) {
        audioOptions = ['-i', audioPath, '-c:a', 'aac', '-b:a', '192k', '-shortest'];
      } else {
        // Criar áudio silencioso como fallback
        const silentAudioPath = path.join('./uploads/temp', `silent_${Date.now()}.mp3`);
        await this.createSilentAudio(silentAudioPath, duration * existingImagePaths.length);
        audioOptions = ['-i', silentAudioPath, '-c:a', 'aac', '-b:a', '192k'];
      }
      
      // Construir comando final
      const ffmpegArgs = [
        ...inputs,
        ...audioOptions,
        '-filter_complex', filterComplex,
        '-map', '[outv]',     // Mapear o vídeo
        '-map', audioPath ? '1:a' : `${existingImagePaths.length}:a`,  // Mapear o áudio
        '-c:v', 'libx264',
        '-preset', preset,
        '-b:v', bitrate,
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-y',  // Sobrescrever arquivo se existir
        outputPath
      ];
      
      log(`Comando FFmpeg: ffmpeg ${ffmpegArgs.join(' ')}`, 'ffmpeg');
      
      // Executar comando FFmpeg
      await new Promise<void>((resolve, reject) => {
        execFile('ffmpeg', ffmpegArgs, (error, stdout, stderr) => {
          if (error) {
            log(`Erro ao criar vídeo: ${error.message}`, 'ffmpeg');
            log(`FFmpeg stderr: ${stderr}`, 'ffmpeg');
            return reject(error);
          }
          resolve();
        });
      });
      
      log(`Vídeo criado com sucesso: ${outputPath}`, 'ffmpeg');
      
      return outputPath;
    } catch (error) {
      log(`Erro durante a criação do vídeo: ${error}`, 'ffmpeg');
      
      // Tentar uma abordagem mais simples como fallback
      log('Tentando abordagem alternativa mais simples como fallback...', 'ffmpeg');
      
      return this.createSimpleVideoFromImages(existingImagePaths, outputPath, duration);
    }
  }

  /**
   * Fallback: Cria um vídeo simples a partir de imagens, com menos opções
   */
  private async createSimpleVideoFromImages(
    imagePaths: string[], 
    outputPath: string, 
    duration: number = 3
  ): Promise<string> {
    // Gerar arquivo de entrada para o FFmpeg (lista de imagens)
    const inputFile = path.join('./uploads/temp', `input_${Date.now()}.txt`);
    const fileContent = imagePaths
      .map(imgPath => `file '${imgPath.replace(/'/g, "\\'")}'`)
      .map(line => `${line}\nduration ${duration}`)
      .join('\n');
      
    fs.writeFileSync(inputFile, fileContent);
    
    return new Promise<string>((resolve, reject) => {
      execFile('ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', inputFile,
        '-vsync', 'vfr',
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-y',
        outputPath
      ], (error, stdout, stderr) => {
        // Remover arquivo temporário
        try {
          if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
        } catch (e) { /* ignorar erros de limpeza */ }
        
        if (error) {
          log(`Erro no fallback para criar vídeo: ${error.message}`, 'ffmpeg');
          return reject(error);
        }
        
        log('Vídeo criado com sucesso usando método alternativo', 'ffmpeg');
        resolve(outputPath);
      });
    });
  }

  /**
   * Adiciona áudio a um vídeo
   */
  async addAudioToVideo(options: AddAudioOptions): Promise<string> {
    const {
      videoPath,
      audioPath,
      outputFileName,
      loop = true
    } = options;

    // Validar entradas
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Vídeo não encontrado: ${videoPath}`);
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error(`Áudio não encontrado: ${audioPath}`);
    }

    // Preparar caminho de saída
    const safeOutputFileName = this.sanitizeFileName(outputFileName || `video_with_audio_${Date.now()}.mp4`);
    const outputPath = path.join(this.videoOutputDir, safeOutputFileName);

    try {
      log(`Adicionando áudio '${audioPath}' ao vídeo '${videoPath}'`, 'ffmpeg');

      const ffmpegArgs = [
        '-i', videoPath,
        '-i', audioPath,
        '-map', '0:v',
        '-map', '1:a',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
      ];

      // Adicionar loop de áudio se necessário
      if (loop) {
        ffmpegArgs.push('-shortest');
      }

      // Adicionar o arquivo de saída
      ffmpegArgs.push('-y', outputPath);

      // Executar comando FFmpeg
      await new Promise<void>((resolve, reject) => {
        execFile('ffmpeg', ffmpegArgs, (error, stdout, stderr) => {
          if (error) {
            log(`Erro ao adicionar áudio ao vídeo: ${error.message}`, 'ffmpeg');
            log(`FFmpeg stderr: ${stderr}`, 'ffmpeg');
            return reject(error);
          }
          resolve();
        });
      });

      log(`Vídeo com áudio criado com sucesso: ${outputPath}`, 'ffmpeg');
      return outputPath;
    } catch (error) {
      log(`Erro ao adicionar áudio: ${error}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Combina múltiplos vídeos em um único arquivo
   */
  async combineVideos(options: CombineVideosOptions): Promise<string> {
    const {
      videoPaths,
      outputFileName,
      transition,
      transitionDuration = 0.5
    } = options;

    // Validação básica
    if (!videoPaths || videoPaths.length === 0) {
      throw new Error('Pelo menos um vídeo é necessário');
    }

    // Verificar vídeos
    const existingVideoPaths = [];
    for (const vidPath of videoPaths) {
      if (fs.existsSync(vidPath)) {
        existingVideoPaths.push(vidPath);
      } else {
        log(`Vídeo não encontrado: ${vidPath}`, 'ffmpeg');
      }
    }

    if (existingVideoPaths.length === 0) {
      throw new Error('Nenhum dos vídeos fornecidos existe');
    }

    // Preparar caminho de saída
    const safeOutputFileName = this.sanitizeFileName(outputFileName || `combined_${Date.now()}.mp4`);
    const outputPath = path.join(this.videoOutputDir, safeOutputFileName);

    try {
      if (existingVideoPaths.length === 1) {
        // Se houver apenas um vídeo, simplesmente copie-o
        fs.copyFileSync(existingVideoPaths[0], outputPath);
        return outputPath;
      }

      // Para múltiplos vídeos, combinar com FFmpeg
      log(`Combinando ${existingVideoPaths.length} vídeos`, 'ffmpeg');

      // Gerar arquivo de entrada para o FFmpeg
      const concatFile = path.join('./uploads/temp', `concat_${Date.now()}.txt`);
      const fileContent = existingVideoPaths
        .map(vidPath => `file '${vidPath.replace(/'/g, "\\'")}'`)
        .join('\n');
        
      fs.writeFileSync(concatFile, fileContent);

      // Executar comando FFmpeg
      await new Promise<void>((resolve, reject) => {
        execFile('ffmpeg', [
          '-f', 'concat',
          '-safe', '0',
          '-i', concatFile,
          '-c', 'copy',
          '-y',
          outputPath
        ], (error, stdout, stderr) => {
          // Remover arquivo temporário
          try {
            if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);
          } catch (e) { /* ignorar erros de limpeza */ }
          
          if (error) {
            log(`Erro ao combinar vídeos: ${error.message}`, 'ffmpeg');
            log(`FFmpeg stderr: ${stderr}`, 'ffmpeg');
            return reject(error);
          }
          resolve();
        });
      });

      log(`Vídeos combinados com sucesso: ${outputPath}`, 'ffmpeg');
      return outputPath;
    } catch (error) {
      log(`Erro ao combinar vídeos: ${error}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Cria um vídeo simples com texto
   */
  async createTextVideo(text: string, options: TextVideoOptions): Promise<string> {
    const {
      outputFileName,
      width = 1080,
      height = 1920,
      backgroundColor = 'black',
      textColor = 'white',
      fontFamily = 'Arial',
      fontSize = 60,
      frameRate = 30,
      duration = 5,
      bitrate = '1M'
    } = options;

    // Preparar caminho de saída
    const safeOutputFileName = this.sanitizeFileName(outputFileName || `text_video_${Date.now()}.mp4`);
    const outputPath = path.join(this.videoOutputDir, safeOutputFileName);

    try {
      log(`Criando vídeo de texto: "${text}"`, 'ffmpeg');

      // Calcular posição do texto
      const textPositionX = width / 2;
      const textPositionY = height / 2;

      // Executar comando FFmpeg
      await new Promise<void>((resolve, reject) => {
        execFile('ffmpeg', [
          '-f', 'lavfi',
          '-i', `color=c=${backgroundColor}:s=${width}x${height}:d=${duration}`,
          '-vf', `drawtext=text='${text}':fontcolor=${textColor}:fontsize=${fontSize}:fontfile=${fontFamily}:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=${backgroundColor}@0.5:boxborderw=10`,
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-r', frameRate.toString(),
          '-b:v', bitrate,
          '-y',
          outputPath
        ], (error, stdout, stderr) => {
          if (error) {
            log(`Erro ao criar vídeo de texto: ${error.message}`, 'ffmpeg');
            log(`FFmpeg stderr: ${stderr}`, 'ffmpeg');
            return reject(error);
          }
          resolve();
        });
      });

      log(`Vídeo de texto criado com sucesso: ${outputPath}`, 'ffmpeg');
      return outputPath;
    } catch (error) {
      log(`Erro ao criar vídeo de texto: ${error}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Obtém a versão do FFmpeg
   */
  async getVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile('ffmpeg', ['-version'], (error, stdout, stderr) => {
        if (error) {
          log(`Erro ao obter versão do FFmpeg: ${error.message}`, 'ffmpeg');
          return reject(error);
        }
        const version = stdout.split('\n')[0] || 'Versão desconhecida';
        resolve(version);
      });
    });
  }
  
  /**
   * Obtém metadados de um arquivo de vídeo
   */
  async getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    format: string;
  }> {
    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`O arquivo de vídeo não existe: ${videoPath}`);
      }
      
      // Tentar obter metadados com ffprobe
      return new Promise((resolve, reject) => {
        execFile('ffprobe', [
          '-v', 'error',
          '-select_streams', 'v:0',
          '-show_entries', 'stream=width,height,duration,codec_name:format=duration',
          '-of', 'json',
          videoPath
        ], (error, stdout, stderr) => {
          if (error) {
            log(`Erro ao obter metadados: ${error.message}`, 'ffmpeg');
            
            // Fornecer valores padrão em caso de falha
            return resolve({
              duration: 10, // segundos
              width: 1080,
              height: 1920,
              format: 'mp4'
            });
          }
          
          try {
            const data = JSON.parse(stdout);
            const stream = data.streams && data.streams[0] ? data.streams[0] : {};
            const format = data.format || {};
            
            // Obter duração, preferindo do stream, mas usando format como fallback
            const duration = stream.duration 
              ? parseFloat(stream.duration) 
              : (format.duration ? parseFloat(format.duration) : 10);
            
            return resolve({
              duration: isNaN(duration) ? 10 : duration,
              width: stream.width || 1080,
              height: stream.height || 1920,
              format: stream.codec_name || 'h264'
            });
          } catch (parseError) {
            log(`Erro ao analisar metadados: ${parseError}`, 'ffmpeg');
            
            // Fornecer valores padrão em caso de erro de análise
            return resolve({
              duration: 10, // segundos
              width: 1080,
              height: 1920,
              format: 'mp4'
            });
          }
        });
      });
    } catch (error) {
      log(`Erro ao obter metadados do vídeo: ${error}`, 'ffmpeg');
      
      // Retornar valores padrão em caso de exceção
      return {
        duration: 10, // segundos
        width: 1080,
        height: 1920,
        format: 'mp4'
      };
    }
  }

  /**
   * Cria o filtro de concatenação para transições entre imagens
   */
  private createConcatFilter(numInputs: number, transition: string, transitionDuration: number, fps: number): string {
    if (numInputs <= 1) return '';
    
    const transitionFrames = Math.round(fps * transitionDuration);
    const inputRefs = Array.from({length: numInputs}, (_, i) => `[v${i}]`).join('');
    
    // Para cada transição, definir o tipo (dissolve, wipe, etc.)
    let transitionFilter = '';
    switch (transition) {
      case 'fade':
        transitionFilter = `xfade=transition=fade:duration=${transitionDuration}`;
        break;
      case 'wipe':
        transitionFilter = `xfade=transition=wiperight:duration=${transitionDuration}`;
        break;
      case 'slide':
        transitionFilter = `xfade=transition=slideright:duration=${transitionDuration}`;
        break;
      case 'zoom':
        transitionFilter = `xfade=transition=zoomin:duration=${transitionDuration}`;
        break;
      default:
        transitionFilter = `xfade=transition=fade:duration=${transitionDuration}`;
    }
    
    // Para simplificar, vamos usar uma abordagem mais básica para evitar erros em transições complexas
    const filter = `${inputRefs}concat=n=${numInputs}:v=1:a=0[outv]`;
    return filter;
  }
  
  /**
   * Retorna as configurações de qualidade baseadas no nível solicitado
   */
  private getQualitySettings(quality: string, social: string): {bitrate: string, preset: string} {
    const qualityPresets: Record<string, {bitrate: string, preset: string}> = {
      low: {bitrate: '1500k', preset: 'ultrafast'},
      medium: {bitrate: '3000k', preset: 'medium'},
      high: {bitrate: '5000k', preset: 'slow'},
      ultra: {bitrate: '8000k', preset: 'veryslow'}
    };
    
    // Usar configurações com base no destino social (TikTok, Instagram, etc)
    if (social === 'tiktok' || social === 'instagram') {
      const socialPresets: Record<string, {bitrate: string, preset: string}> = {
        low: {bitrate: '2000k', preset: 'fast'},
        medium: {bitrate: '4000k', preset: 'medium'},
        high: {bitrate: '6000k', preset: 'slow'},
        ultra: {bitrate: '10000k', preset: 'slower'}
      };
      
      return socialPresets[quality] || qualityPresets.medium;
    }
    
    return qualityPresets[quality] || qualityPresets.medium;
  }
  
  /**
   * Retorna as dimensões recomendadas para cada rede social
   */
  private getSocialMediaDimensions(social: string): {width: number, height: number} {
    const dimensions: Record<string, {width: number, height: number}> = {
      tiktok: {width: 1080, height: 1920},      // 9:16
      instagram: {width: 1080, height: 1920},   // 9:16
      youtube: {width: 1920, height: 1080},     // 16:9
      facebook: {width: 1280, height: 720},     // 16:9
      twitter: {width: 1280, height: 720}       // 16:9
    };
    
    return dimensions[social] || {width: 1080, height: 1920};
  }
  
  /**
   * Retorna o filtro para posicionamento de texto
   */
  private getTextPositionFilter(position: string, width: number, height: number): string {
    const positions: Record<string, string> = {
      top: `x=(w-text_w)/2:y=h/10`,
      middle: `x=(w-text_w)/2:y=(h-text_h)/2`,
      bottom: `x=(w-text_w)/2:y=h-h/10-text_h`,
      topleft: `x=w/10:y=h/10`,
      topright: `x=w-w/10-text_w:y=h/10`,
      bottomleft: `x=w/10:y=h-h/10-text_h`,
      bottomright: `x=w-w/10-text_w:y=h-h/10-text_h`
    };
    
    return positions[position] || positions.bottom;
  }
  
  /**
   * Retorna o filtro para colorização de vídeo
   */
  private getColorGradingFilter(colorGrade: string): string {
    const colorFilters: Record<string, string> = {
      vibrant: 'eq=brightness=0.06:saturation=1.3:contrast=1.1',
      warm: 'colorchannelmixer=rr=1.2:gg=1.0:bb=0.8',
      cool: 'colorchannelmixer=rr=0.8:gg=1.0:bb=1.2',
      vintage: 'colorchannelmixer=rr=1.3:bb=0.8:gg=0.9,curves=r=0.2/0:0.8/1:g=0.2/0:0.8/1:b=0.2/0:0.8/1',
      bw: 'hue=s=0',
      sepia: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
      dramatic: 'eq=contrast=1.5:brightness=0.05:saturation=1.2'
    };
    
    return colorFilters[colorGrade] || '';
  }
  
  /**
   * Sanitiza o nome do arquivo para evitar problemas no sistema de arquivos
   */
  private sanitizeFileName(fileName: string): string {
    // Remover caracteres inválidos para sistemas de arquivos
    let sanitized = fileName.replace(/[^\w\s.-]/g, '_');
    
    // Garantir que o arquivo termine em .mp4
    if (!sanitized.toLowerCase().endsWith('.mp4')) {
      sanitized = `${sanitized}.mp4`;
    }
    
    return sanitized;
  }
}

// Instância singleton
export const ffmpegService = new FFmpegService();