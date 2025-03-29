import { spawn } from "child_process";
import { log } from "../vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ffmpegStatic from "ffmpeg-static";

// Garantir que temos o caminho do ffmpeg
const ffmpegPath = ffmpegStatic;
console.log("FFmpeg path:", ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make sure output directories exist
const OUTPUT_DIR = path.join(__dirname, "../../uploads/videos");
const TEMP_DIR = path.join(__dirname, "../../uploads/temp");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

interface VideoOptions {
  outputFileName: string;
  width?: number;
  height?: number;
  frameRate?: number;
  bitrate?: string;
}

interface AddAudioOptions {
  videoPath: string;
  audioPath: string;
  outputFileName: string;
  loop?: boolean;
}

interface ImageToVideoOptions {
  imagePaths: string[];
  outputFileName: string;
  duration?: number;
  transition?: 'fade' | 'wipe' | 'slide' | 'zoom' | 'radial' | 'crosszoom' | 'dissolve' | 'pixelize' | 'none'; // Opções expandidas de transição
  transitionDuration?: number;
  width?: number;
  height?: number;
  textOverlay?: string; // Texto para sobrepor às imagens
  textPosition?: 'top' | 'center' | 'bottom'; // Posição do texto
  textColor?: string; // Cor do texto
  textFont?: string; // Fonte do texto
  textAnimation?: 'none' | 'typewriter' | 'fadein' | 'slidein'; // Animação para o texto
  logo?: string; // Caminho para logotipo a ser exibido
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // Posição do logo
  fps?: number; // Taxa de quadros por segundo
  audioPath?: string; // Caminho para áudio a ser adicionado diretamente
  zoomEffect?: boolean; // Aplicar efeito Ken Burns (zoom suave)
  colorGrading?: 'vibrant' | 'moody' | 'warm' | 'cool' | 'cinematic' | 'vintage' | 'none'; // Mais opções de ajustes de cor
  subtitleFile?: string; // Arquivo SRT para legendas
  autoSubtitle?: boolean; // Gerar legendas automaticamente
  watermark?: string; // Texto ou imagem para marca d'água
  beatSync?: boolean; // Sincronizar transições com batidas da música
  filterGraph?: string; // Filtergraph FFmpeg avançado personalizado (para usuários avançados)
  customOverlays?: Array<{path: string, position: string, duration: number}>; // Elementos de sobreposição adicionais (emojis, stickers)
  outputQuality?: 'draft' | 'standard' | 'high' | 'ultra'; // Presets de qualidade pré-configurados
  social?: 'tiktok' | 'instagram' | 'youtube' | 'facebook'; // Otimizar para plataforma específica
}

interface CombineVideosOptions {
  videoPaths: string[];
  outputFileName: string;
  transition?: string;
  transitionDuration?: number;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format: string;
}

export class FFmpegService {
  /**
   * Create video from a series of images com efeitos avançados para maior engajamento e conversão
   * Versão otimizada para máximo engajamento em redes sociais
   */
  async createVideoFromImages(options: ImageToVideoOptions): Promise<string> {
    const {
      imagePaths,
      outputFileName,
      duration = 3,
      transition = "fade",
      transitionDuration = 0.5,
      width = 1080,
      height = 1920,
      textOverlay,
      textPosition = 'bottom',
      textColor = 'white',
      textFont,
      textAnimation = 'none',
      logo,
      logoPosition = 'top-right',
      fps = 30,
      zoomEffect = true,
      colorGrading = 'vibrant',
      audioPath,
      subtitleFile,
      autoSubtitle = false,
      watermark,
      beatSync = false,
      filterGraph = '',
      customOverlays = [],
      outputQuality = 'high',
      social = 'tiktok'
    } = options;

    if (imagePaths.length === 0) {
      throw new Error("No image paths provided");
    }

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      const tempVideoPath = path.join(TEMP_DIR, `temp_${Date.now()}.mp4`);
      
      // Gera arquivo de legendas se autoSubtitle estiver ativado e textOverlay for fornecido
      let subtitlePath = "";
      if (autoSubtitle && textOverlay) {
        // Duração total do vídeo em segundos
        const videoTotalDuration = imagePaths.length * duration;
        // Gera arquivo SRT de legendas
        subtitlePath = await this.generateSubtitleFile(
          textOverlay, 
          videoTotalDuration, 
          `subtitles_${Date.now()}.srt`
        );
      }
      
      // Create a temporary file for the list of images
      const listFile = path.join(TEMP_DIR, `list_${Date.now()}.txt`);
      
      // Create the content for the list file with durations
      let listContent = "";
      console.log('Processing images for video creation:');
      for (const imagePath of imagePaths) {
        // Escape single quotes in the path
        const escapedPath = imagePath.replace(/'/g, "'\\''");
        console.log(`- Using image: ${escapedPath}`);
        listContent += `file '${escapedPath}'\nduration ${duration}\n`;
      }
      // Add the last image again (needed for the end)
      if (imagePaths.length > 0) {
        const lastImagePath = imagePaths[imagePaths.length - 1].replace(/'/g, "'\\''");
        listContent += `file '${lastImagePath}'`;
      }
      
      // Write the list file
      fs.writeFileSync(listFile, listContent);
      
      // Construir filtros de vídeo complexos
      let filters = [];
      
      // Escala básica
      let scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
      
      // Adiciona efeito Ken Burns (zoom suave) se solicitado
      if (zoomEffect) {
        scaleFilter += `,zoompan=z='min(zoom+0.0015,1.5)':d=${fps*duration}:s=${width}x${height}`;
      }
      
      // Adiciona o filtro de transição com base no tipo selecionado
      let transitionFilter = "";
      switch (transition) {
        case 'wipe':
          transitionFilter = `xfade=transition=wipeleft:duration=${transitionDuration}`;
          break;
        case 'slide':
          transitionFilter = `xfade=transition=slideright:duration=${transitionDuration}`;
          break;
        case 'zoom':
          transitionFilter = `xfade=transition=zoomin:duration=${transitionDuration}`;
          break;
        case 'radial':
          transitionFilter = `xfade=transition=circleclose:duration=${transitionDuration}`;
          break;
        case 'crosszoom':
          transitionFilter = `xfade=transition=squeezeh:duration=${transitionDuration}`;
          break;
        case 'dissolve':
          transitionFilter = `xfade=transition=dissolve:duration=${transitionDuration}`;
          break;
        case 'pixelize':
          transitionFilter = `xfade=transition=pixelize:duration=${transitionDuration}`;
          break;
        case 'fade':
        default:
          transitionFilter = `xfade=transition=fade:duration=${transitionDuration}`;
          break;
      }
      
      // Adiciona efeitos de cor com base no colorGrading selecionado
      let colorFilter = "";
      switch (colorGrading) {
        case 'vibrant':
          colorFilter = "eq=saturation=1.3:contrast=1.1:brightness=1.05";
          break;
        case 'moody':
          colorFilter = "eq=saturation=0.85:contrast=1.2:brightness=0.95";
          break;
        case 'warm':
          colorFilter = "eq=saturation=1.1:gamma_r=1.1:gamma_b=0.9";
          break;
        case 'cool':
          colorFilter = "eq=saturation=1.1:gamma_b=1.1:gamma_r=0.9";
          break;
        case 'cinematic':
          colorFilter = "eq=saturation=0.9:contrast=1.25:brightness=0.95,curves=master='0/0 0.25/0.15 0.5/0.5 0.75/0.85 1/1'";
          break;
        case 'vintage':
          colorFilter = "eq=saturation=0.75:contrast=1.15:brightness=1.05,colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3";
          break;
        case 'none':
        default:
          colorFilter = "";
          break;
      }
      
      // Combina os filtros
      filters.push(scaleFilter);
      if (colorFilter) filters.push(colorFilter);
      
      // Adiciona texto se fornecido, com suporte a animações
      if (textOverlay) {
        let yPos = "(h-text_h-25)"; // posição inferior
        if (textPosition === 'top') yPos = "25";
        else if (textPosition === 'center') yPos = "(h-text_h)/2";
        
        // Seleção de fonte personalizada ou padrão
        // Usa apenas textFont se fornecido - sem valor padrão que pode não existir no ambiente
        const fontFile = textFont || "";
        
        // Define a animação de texto com base na seleção
        let textExpression = "";
        switch (textAnimation) {
          case 'typewriter':
            // Efeito de digitação, revela o texto caractere por caractere
            textExpression = `:enable='between(t,0,${duration})':x=(w-text_w)/2:y=${yPos}:fontcolor_expr=alpha('${textColor}', min(1, (t*3)))`;
            break;
          case 'fadein':
            // Efeito de fade in para o texto
            textExpression = `:enable='between(t,0,${duration})':x=(w-text_w)/2:y=${yPos}:alpha='if(lt(t,1),t,1)'`;
            break;
          case 'slidein':
            // Efeito de deslize para o texto
            textExpression = `:enable='between(t,0,${duration})':x='min((w-text_w)/2, w*t/2)':y=${yPos}`;
            break;
          default:
            // Sem animação, texto estático
            textExpression = `:x=(w-text_w)/2:y=${yPos}`;
        }
        
        // Texto com sombra e fundo, incluindo suporte para animações
        let textFilter = `drawtext=text='${textOverlay.replace(/'/g, "'\\\\''")}':fontsize=48:fontcolor='${textColor}'${textExpression}:shadowcolor='black@0.5':shadowx=2:shadowy=2:box=1:boxcolor='black@0.4':boxborderw=10`;
        
        // Adiciona fontfile apenas se for fornecido
        if (fontFile) {
          textFilter = `drawtext=text='${textOverlay.replace(/'/g, "'\\\\''")}':fontfile='${fontFile}':fontsize=48:fontcolor='${textColor}'${textExpression}:shadowcolor='black@0.5':shadowx=2:shadowy=2:box=1:boxcolor='black@0.4':boxborderw=10`;
        }
        
        filters.push(textFilter);
      }
      
      // Adiciona logo se fornecido com suporte a diferentes posições
      if (logo) {
        let overlayPos = "";
        switch (logoPosition) {
          case 'top-left':
            overlayPos = "10:10";
            break;
          case 'top-right':
            overlayPos = "W-w-10:10";
            break;
          case 'bottom-left':
            overlayPos = "10:H-h-10";
            break;
          case 'bottom-right':
            overlayPos = "W-w-10:H-h-10";
            break;
          default:
            overlayPos = "W-w-10:10"; // Padrão: canto superior direito
        }
        
        filters.push(`movie=${logo}[watermark];[v][watermark]overlay=${overlayPos}`);
      }
      
      // Adiciona marca d'água se fornecida
      if (watermark) {
        filters.push(`drawtext=text='${watermark.replace(/'/g, "'\\\\''")}':fontsize=24:fontcolor='white@0.5':x=(w-text_w)/2:y=(h-text_h-10)`);
      }
      
      // Adiciona subtítulos de arquivo externo ou automaticamente gerados
      if (subtitleFile) {
        // Usa o arquivo de legendas fornecido pelo usuário
        filters.push(`subtitles=${subtitleFile}`);
      } else if (subtitlePath) {
        // Usa o arquivo de legendas gerado automaticamente
        filters.push(`subtitles=${subtitlePath}`);
      }
      
      // Finaliza com fade in/out
      filters.push("fade=in:0:30,fade=out:st=" + (imagePaths.length * duration - 1) + ":d=1");
      
      // Determina o preset de qualidade com base na opção selecionada
      let preset = "medium";
      let crf = "23";
      
      switch (outputQuality) {
        case 'draft':
          preset = "ultrafast";
          crf = "28";
          break;
        case 'standard':
          preset = "medium";
          crf = "23";
          break;
        case 'high':
          preset = "slow";
          crf = "18";
          break;
        case 'ultra':
          preset = "veryslow";
          crf = "16";
          break;
      }
      
      // Otimiza os parâmetros para plataformas específicas
      let socialMediaOptimization = [];
      switch (social) {
        case 'tiktok':
          // Otimização para TikTok: relação 9:16, compressão eficiente
          socialMediaOptimization = [
            "-profile:v", "high", // Perfil de vídeo para melhor compressão
            "-level", "4.2",
            "-movflags", "+faststart",
            "-metadata", "title=Criado com VideoGenie AI"
          ];
          break;
        case 'instagram':
          // Otimização para Instagram: qualidade maior
          socialMediaOptimization = [
            "-profile:v", "high",
            "-level", "4.2",
            "-movflags", "+faststart",
            "-metadata", "title=Criado com VideoGenie AI"
          ];
          break;
        case 'youtube':
          // YouTube: melhor qualidade, com configurações para streaming
          socialMediaOptimization = [
            "-profile:v", "high",
            "-level", "4.2",
            "-movflags", "+faststart",
            "-g", "60", // Keyframes a cada 2 segundos para streaming
            "-metadata", "title=Criado com VideoGenie AI"
          ];
          break;
        case 'facebook':
          // Facebook: otimização para engajamento móvel
          socialMediaOptimization = [
            "-profile:v", "main",
            "-level", "3.1", // Mais compatibilidade com dispositivos antigos
            "-movflags", "+faststart",
            "-metadata", "title=Criado com VideoGenie AI"
          ];
          break;
        default:
          // Default: configurações para qualquer plataforma
          socialMediaOptimization = [
            "-profile:v", "high",
            "-level", "4.2",
            "-movflags", "+faststart"
          ];
      }
      
      // Execute FFmpeg command com configurações de alta qualidade
      const ffmpegArgs = [
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-filter_complex", filters.join(","),
        "-c:v", "libx264",
        "-preset", preset, // Usa o preset determinado pelo nível de qualidade solicitado
        "-crf", crf, // Valor do CRF baseado na qualidade solicitada
        "-bf", "2", // Número de B-frames
        "-r", fps.toString(), // Define a taxa de quadros
        "-pix_fmt", "yuv420p", // Formato de pixel para compatibilidade
        ...socialMediaOptimization, // Adiciona as configurações específicas para a plataforma
        "-y", audioPath ? tempVideoPath : outputPath
      ];
      
      await this.executeFFmpegCommand(ffmpegArgs);
      
      // Se um áudio foi fornecido, adiciona-o ao vídeo
      if (audioPath) {
        await this.addAudioToVideo({
          videoPath: tempVideoPath,
          audioPath,
          outputFileName,
          loop: true
        });
        
        // Remove o arquivo temporário
        if (fs.existsSync(tempVideoPath)) {
          fs.unlinkSync(tempVideoPath);
        }
      }
      
      // Clean up the list file
      fs.unlinkSync(listFile);
      // Limpa o arquivo de legendas temporário se existir
      if (subtitlePath && fs.existsSync(subtitlePath)) {
        fs.unlinkSync(subtitlePath);
      }
      
      return outputPath;
    } catch (error) {
      log(`Error creating video from images: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Add audio to video
   */
  async addAudioToVideo(options: AddAudioOptions): Promise<string> {
    const {
      videoPath,
      audioPath,
      outputFileName,
      loop = true,
    } = options;

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      // Get video duration
      const videoMetadata = await this.getVideoMetadata(videoPath);
      
      // Execute FFmpeg command com alta qualidade de áudio
      const ffmpegArgs = [
        "-i", videoPath,
        "-i", audioPath,
        "-c:v", "copy", // Mantém o vídeo inalterado
        "-c:a", "aac", // Codec de áudio AAC (boa qualidade e compatibilidade)
        "-b:a", "192k", // Bitrate de áudio aumentado para 192kbps (qualidade superior)
        "-ar", "48000", // Taxa de amostragem de 48kHz (padrão para vídeo profissional)
        "-af", "dynaudnorm=f=150:g=15", // Normalização dinâmica de áudio para nivelamento
        "-map", "0:v:0", // Pega a primeira stream de vídeo
        "-map", "1:a:0", // Pega a primeira stream de áudio
      ];
      
      // Se loop for true, atualizamos os filtros de áudio para incluir também o loop
      if (loop) {
        // Removemos o filtro dynaudnorm anterior (índice 11 e 12 no array)
        ffmpegArgs.splice(11, 2);
        
        // Adicionamos um filtro combinado
        ffmpegArgs.push(
          "-af", `aloop=loop=-1:size=2e+09,atrim=duration=${videoMetadata.duration},dynaudnorm=f=150:g=15`
        );
      }
      
      ffmpegArgs.push(
        "-shortest",
        "-y", outputPath
      );
      
      await this.executeFFmpegCommand(ffmpegArgs);
      
      return outputPath;
    } catch (error) {
      log(`Error adding audio to video: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Combine multiple videos into one
   */
  async combineVideos(options: CombineVideosOptions): Promise<string> {
    const {
      videoPaths,
      outputFileName,
      transition = "fade",
      transitionDuration = 0.5,
    } = options;

    if (videoPaths.length === 0) {
      throw new Error("No video paths provided");
    }

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      // Create a temporary file for the list of videos
      const listFile = path.join(TEMP_DIR, `list_${Date.now()}.txt`);
      
      // Create the content for the list file
      let listContent = "";
      console.log('Processing videos for combination:');
      for (const videoPath of videoPaths) {
        // Escape single quotes in the path
        const escapedPath = videoPath.replace(/'/g, "'\\''");
        console.log(`- Using video: ${escapedPath}`);
        listContent += `file '${escapedPath}'\n`;
      }
      
      // Write the list file
      fs.writeFileSync(listFile, listContent);
      
      // Execute FFmpeg command com alta qualidade
      const ffmpegArgs = [
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-c:v", "libx264",
        "-preset", "slow", // Usa 'slow' em vez de 'medium' para melhor qualidade
        "-crf", "18", // Valor menor = melhor qualidade (18 é considerado visualmente sem perdas)
        "-profile:v", "high", // Utiliza o profile High para melhor compressão
        "-level", "4.2", // Compatível com a maioria dos dispositivos modernos
        "-bf", "2", // Número de B-frames
        "-c:a", "aac", // Codec de áudio AAC
        "-b:a", "192k", // Bitrate de áudio aumentado
        "-ar", "48000", // Taxa de amostragem de áudio
        "-af", "dynaudnorm=f=150:g=15", // Normalização dinâmica de áudio
        "-movflags", "+faststart", // Permite reprodução enquanto carrega
        "-pix_fmt", "yuv420p", // Formato de pixel para compatibilidade
        "-y", outputPath
      ];
      
      await this.executeFFmpegCommand(ffmpegArgs);
      
      // Clean up the list file
      fs.unlinkSync(listFile);
      
      return outputPath;
    } catch (error) {
      log(`Error combining videos: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Create a basic video with text overlay
   */
  async createTextVideo(text: string, options: VideoOptions): Promise<string> {
    const {
      outputFileName,
      width = 1080,
      height = 1920,
      frameRate = 30,
      bitrate = "2M",
    } = options;

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      
      // Cria um degradê de fundo gradiente em vez de cor sólida
      const gradientColor = "0x1A1A2Eff-0x4361EEff";
      
      // Execute FFmpeg command com efeitos avançados para maior engajamento
      const ffmpegArgs = [
        "-f", "lavfi",
        // Fundo gradiente em vez de cor sólida
        "-i", `gradients=s=${width}x${height}:c1=${gradientColor}:d=10`,
        // Filtros de vídeo avançados: texto com fontes de alta qualidade, sombra, animações
        "-vf", `
          drawtext=text='${text.replace(/'/g, "'\\\\''")}':
          fontcolor='white':
          fontsize=72:
          x=(w-text_w)/2:
          y=(h-text_h)/2:
          shadowcolor='black@0.5':
          shadowx=2:
          shadowy=2:
          box=1:
          boxcolor='black@0.4':
          boxborderw=10,
          fade=in:0:30,
          fade=out:270:30
        `.replace(/\s+/g, ''),
        "-c:v", "libx264",
        "-t", "10",
        "-r", frameRate.toString(),
        "-b:v", "8M", // Bitrate mais alto para maior qualidade
        "-preset", "slow", // Preset de qualidade mais alto
        "-crf", "18", // Valor menor = melhor qualidade
        "-profile:v", "high",
        "-level", "4.2",
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
        "-y", outputPath
      ];
      
      await this.executeFFmpegCommand(ffmpegArgs);
      
      return outputPath;
    } catch (error) {
      log(`Error creating text video: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      throw error;
    }
  }

  /**
   * Gera arquivo de legendas SRT a partir de um texto
   * Utilizado para sincronizar texto com vídeo automaticamente
   */
  async generateSubtitleFile(text: string, duration: number, outputFileName: string): Promise<string> {
    try {
      // Quebra o texto em linhas para criar legendas
      const lines = text.split(/[.!?]+/).filter(line => line.trim().length > 0);
      const subtitleFilePath = path.join(TEMP_DIR, outputFileName);
      
      // Se não houver texto, retorna vazio
      if (lines.length === 0) {
        return "";
      }
      
      // Calcula o tempo por linha para distribuir as legendas uniformemente
      const timePerLine = duration / lines.length;
      
      // Gera o conteúdo SRT
      let srtContent = "";
      lines.forEach((line, index) => {
        const startTime = index * timePerLine;
        const endTime = (index + 1) * timePerLine;
        
        // Formata os tempos no formato SRT (HH:MM:SS,ms)
        const startFormatted = this.formatSRTTime(startTime);
        const endFormatted = this.formatSRTTime(endTime);
        
        // Adiciona a entrada SRT
        srtContent += `${index + 1}\n`;
        srtContent += `${startFormatted} --> ${endFormatted}\n`;
        srtContent += `${line.trim()}\n\n`;
      });
      
      // Escreve o arquivo SRT
      fs.writeFileSync(subtitleFilePath, srtContent);
      
      return subtitleFilePath;
    } catch (error) {
      log(`Error generating subtitle file: ${error instanceof Error ? error.message : String(error)}`, 'ffmpeg');
      return "";
    }
  }
  
  /**
   * Formata o tempo em segundos para o formato SRT (HH:MM:SS,ms)
   */
  private formatSRTTime(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    
    return `${hours}:${minutes}:${secs},${ms}`;
  }

  /**
   * Get video metadata (duration, dimensions, etc.)
   */
  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v", "error",
        "-show_entries", "format=duration:stream=width,height,codec_name",
        "-of", "json",
        videoPath
      ]);
      
      let stdoutData = "";
      let stderrData = "";
      
      ffprobe.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });
      
      ffprobe.stderr.on("data", (data) => {
        stderrData += data.toString();
      });
      
      ffprobe.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe process exited with code ${code}: ${stderrData}`));
          return;
        }
        
        try {
          const parsedData = JSON.parse(stdoutData);
          const streams = parsedData.streams || [];
          const format = parsedData.format || {};
          
          // Find the video stream
          const videoStream = streams.find((stream: any) => stream.codec_name && stream.width && stream.height);
          
          if (!videoStream) {
            reject(new Error("No video stream found"));
            return;
          }
          
          resolve({
            duration: parseFloat(format.duration || "0"),
            width: videoStream.width,
            height: videoStream.height,
            format: format.format_name || "",
          });
        } catch (error) {
          reject(new Error(`Failed to parse ffprobe output: ${error instanceof Error ? error.message : String(error)}`));
        }
      });
    });
  }

  /**
   * Execute FFmpeg command
   */
  private executeFFmpegCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Utilize o pacote ffmpeg-static para maior compatibilidade
      if (!ffmpegPath) {
        reject(new Error("FFmpeg path not found. Please install ffmpeg-static package."));
        return;
      }
      
      const ffmpeg = spawn(ffmpegPath, args);
      
      let stderrData = "";
      
      ffmpeg.stderr.on("data", (data) => {
        stderrData += data.toString();
        // Log progress for debugging
        log(data.toString().trim(), 'ffmpeg');
      });
      
      ffmpeg.on("error", (err) => {
        reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
      });
      
      ffmpeg.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg process exited with code ${code}: ${stderrData}`));
          return;
        }
        
        resolve();
      });
    });
  }
}
