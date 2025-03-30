import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { log } from '../vite';

/**
 * Serviço para operações com FFmpeg
 */
export class FFmpegService {
  constructor() {
    this.ensureDirectoriesExist();
  }

  /**
   * Garante que os diretórios necessários existam
   */
  private ensureDirectoriesExist() {
    const dirs = ['./uploads', './uploads/temp'];
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
}

// Instância singleton
export const ffmpegService = new FFmpegService();