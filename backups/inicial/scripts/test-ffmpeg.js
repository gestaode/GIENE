import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const audiosDir = path.join(uploadsDir, 'audios');
const outputDir = path.join(uploadsDir, 'output');

// Ensure directories exist
[uploadsDir, videosDir, audiosDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Diretório criado: ${dir}`);
  }
});

console.log('FFmpeg path:', ffmpegStatic);

// Test video path
const testVideo = path.join(videosDir, 'advanced_video_1743291069161.mp4');
const testAudio = path.join(audiosDir, 'sine_440hz.mp3');
const outputPath = path.join(outputDir, 'test_combined.mp4');

// Check if files exist
console.log('Verificando arquivos:');
console.log(`Vídeo (${testVideo}): ${fs.existsSync(testVideo) ? 'Existe' : 'Não existe'}`);
console.log(`Áudio (${testAudio}): ${fs.existsSync(testAudio) ? 'Existe' : 'Não existe'}`);

// Execute FFmpeg command
function executeFFmpegCommand(args) {
  return new Promise((resolve, reject) => {
    console.log('Executando comando FFmpeg:', args.join(' '));
    
    const ffmpeg = spawn(ffmpegStatic, args);
    
    let stderrData = "";
    
    ffmpeg.stderr.on("data", (data) => {
      stderrData += data.toString();
      console.log('FFmpeg log:', data.toString().trim());
    });
    
    ffmpeg.on("error", (err) => {
      console.error('Erro ao iniciar o processo FFmpeg:', err);
      reject(err);
    });
    
    ffmpeg.on("close", (code) => {
      console.log(`FFmpeg encerrado com código ${code}`);
      if (code !== 0) {
        reject(new Error(`FFmpeg process exited with code ${code}: ${stderrData}`));
        return;
      }
      
      resolve();
    });
  });
}

// Test adding audio to video
async function testAddAudioToVideo() {
  try {
    // Simple FFmpeg command to test functionality
    const args = [
      "-i", testVideo,
      "-i", testAudio,
      "-c:v", "copy",
      "-c:a", "aac",
      "-shortest",
      "-y", outputPath
    ];
    
    await executeFFmpegCommand(args);
    console.log('Teste concluído com sucesso. Arquivo gerado:', outputPath);
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Run the test
testAddAudioToVideo();