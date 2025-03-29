import { spawn } from "child_process";
import { log } from "../vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

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
  transition?: 'fade' | 'wipe' | 'slide' | 'zoom' | 'radial' | 'none'; // Mais opções de transição
  transitionDuration?: number;
  width?: number;
  height?: number;
  textOverlay?: string; // Texto para sobrepor às imagens
  textPosition?: 'top' | 'center' | 'bottom'; // Posição do texto
  textColor?: string; // Cor do texto
  logo?: string; // Caminho para logotipo a ser exibido
  fps?: number; // Taxa de quadros por segundo
  audioPath?: string; // Caminho para áudio a ser adicionado diretamente
  zoomEffect?: boolean; // Aplicar efeito Ken Burns (zoom suave)
  colorGrading?: 'vibrant' | 'moody' | 'warm' | 'cool' | 'none'; // Ajustes de cor
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
      logo,
      fps = 30,
      zoomEffect = true,
      colorGrading = 'vibrant',
      audioPath
    } = options;

    if (imagePaths.length === 0) {
      throw new Error("No image paths provided");
    }

    try {
      const outputPath = path.join(OUTPUT_DIR, outputFileName);
      const tempVideoPath = path.join(TEMP_DIR, `temp_${Date.now()}.mp4`);
      
      // Create a temporary file for the list of images
      const listFile = path.join(TEMP_DIR, `list_${Date.now()}.txt`);
      
      // Create the content for the list file with durations
      let listContent = "";
      for (const imagePath of imagePaths) {
        listContent += `file '${imagePath}'\nduration ${duration}\n`;
      }
      // Add the last image again (needed for the end)
      listContent += `file '${imagePaths[imagePaths.length - 1]}'`;
      
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
        case 'none':
        default:
          colorFilter = "";
          break;
      }
      
      // Combina os filtros
      filters.push(scaleFilter);
      if (colorFilter) filters.push(colorFilter);
      
      // Adiciona texto se fornecido
      if (textOverlay) {
        let yPos = "(h-text_h-25)"; // posição inferior
        if (textPosition === 'top') yPos = "25";
        else if (textPosition === 'center') yPos = "(h-text_h)/2";
        
        // Texto com sombra e fundo
        filters.push(`drawtext=text='${textOverlay.replace(/'/g, "'\\\\''")}':fontsize=48:fontcolor=${textColor}:x=(w-text_w)/2:y=${yPos}:shadowcolor=black@0.5:shadowx=2:shadowy=2:box=1:boxcolor=black@0.4:boxborderw=10`);
      }
      
      // Adiciona logo se fornecido
      if (logo) {
        // Aplica o logo no canto superior direito
        filters.push(`movie=${logo}[watermark];[v][watermark]overlay=W-w-10:10`);
      }
      
      // Finaliza com fade in/out
      filters.push("fade=in:0:30,fade=out:st=" + (imagePaths.length * duration - 1) + ":d=1");
      
      // Execute FFmpeg command com configurações de alta qualidade
      const ffmpegArgs = [
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-filter_complex", filters.join(","),
        "-c:v", "libx264",
        "-preset", "slow", // Usa 'slow' em vez de 'medium' para melhor qualidade
        "-crf", "18", // Valor menor = melhor qualidade (18 é considerado visualmente sem perdas)
        "-profile:v", "high", // Utiliza o profile High para melhor compressão
        "-level", "4.2", // Compatível com a maioria dos dispositivos modernos
        "-bf", "2", // Número de B-frames
        "-r", fps.toString(), // Define a taxa de quadros
        "-movflags", "+faststart", // Permite que o vídeo comece a reproduzir antes de ser totalmente baixado
        "-pix_fmt", "yuv420p", // Formato de pixel para compatibilidade
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
      for (const videoPath of videoPaths) {
        listContent += `file '${videoPath}'\n`;
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
          fontcolor=white:
          fontsize=72:
          x=(w-text_w)/2:
          y=(h-text_h)/2:
          shadowcolor=black@0.5:
          shadowx=2:
          shadowy=2:
          fontfile=/System/Library/Fonts/Helvetica.ttc:
          box=1:
          boxcolor=black@0.4:
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
      const ffmpeg = spawn("ffmpeg", args);
      
      let stderrData = "";
      
      ffmpeg.stderr.on("data", (data) => {
        stderrData += data.toString();
        // Log progress for debugging
        log(data.toString().trim(), 'ffmpeg');
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
