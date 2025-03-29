
import { FFmpegService } from './ffmpeg';

export class VideoCompressor {
  private ffmpeg: FFmpegService;

  constructor(ffmpeg: FFmpegService) {
    this.ffmpeg = ffmpeg;
  }

  async compress(inputPath: string, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
    const outputPath = inputPath.replace('.mp4', '_compressed.mp4');
    
    const crf = quality === 'low' ? '28' : quality === 'medium' ? '23' : '18';
    
    await this.ffmpeg.runCommand([
      '-i', inputPath,
      '-c:v', 'libx264',
      '-crf', crf,
      '-preset', 'medium',
      '-c:a', 'aac',
      '-b:a', '128k',
      outputPath
    ]);

    return outputPath;
  }
}
