import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FFmpegService } from '../server/services/ffmpeg.ts';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Verificar funcionamento do FFmpegService
async function testarAdicaoAudio() {
  try {
    console.log("Inicializando FFmpegService...");
    const ffmpegService = new FFmpegService();
    console.log("FFmpegService inicializado:", ffmpegService ? "OK" : "NULL");
    
    // Caminhos de teste
    const videoPath = path.join(rootDir, 'uploads/videos/advanced_video_1743291069161.mp4');
    const audioPath = path.join(rootDir, 'uploads/audios/sine_440hz.mp3');
    const outputFileName = `video_com_audio_${Date.now()}.mp4`;
    
    console.log(`Testando addAudioToVideo com:
      - Vídeo: ${videoPath} (existe: ${fs.existsSync(videoPath)})
      - Áudio: ${audioPath} (existe: ${fs.existsSync(audioPath)})
      - Output: ${outputFileName}
      - Loop: true
    `);
    
    // Tentar adicionar áudio ao vídeo
    const result = await ffmpegService.addAudioToVideo({
      videoPath,
      audioPath,
      outputFileName,
      loop: true
    });
    
    console.log("Resultado:", result);
    console.log("Operação concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante o teste:", error);
  }
}

// Executar teste
testarAdicaoAudio();