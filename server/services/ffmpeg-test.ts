import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

// Função segura para executar comandos
const execFilePromise = util.promisify(execFile);

export async function testFFmpegInstallation(): Promise<{
  installed: boolean;
  version: string;
  error?: string;
}> {
  try {
    const { stdout } = await execFilePromise('ffmpeg', ['-version']);
    const version = stdout.split('\n')[0] || 'FFmpeg instalado, mas não foi possível detectar a versão';
    return { installed: true, version };
  } catch (error) {
    return { 
      installed: false, 
      version: '', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function getFFmpegCodecs(): Promise<{
  success: boolean;
  codecs: { hasH264: boolean; hasAAC: boolean; hasPNG: boolean; total: number };
  raw?: string;
  error?: string;
}> {
  try {
    const { stdout } = await execFilePromise('ffmpeg', ['-hide_banner', '-codecs']);
    return { 
      success: true, 
      codecs: {
        hasH264: stdout.includes('h264'),
        hasAAC: stdout.includes('aac'),
        hasPNG: stdout.includes('png'),
        total: (stdout.match(/--/g) || []).length
      },
      raw: stdout
    };
  } catch (error) {
    return { 
      success: false, 
      codecs: { hasH264: false, hasAAC: false, hasPNG: false, total: 0 },
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getFFmpegFormats(): Promise<{
  success: boolean;
  formats: { hasMP4: boolean; hasMOV: boolean; hasWebM: boolean; total: number };
  raw?: string;
  error?: string;
}> {
  try {
    const { stdout } = await execFilePromise('ffmpeg', ['-hide_banner', '-formats']);
    return { 
      success: true, 
      formats: {
        hasMP4: stdout.includes('mp4'),
        hasMOV: stdout.includes('mov'),
        hasWebM: stdout.includes('webm'),
        total: (stdout.match(/--/g) || []).length
      },
      raw: stdout
    };
  } catch (error) {
    return { 
      success: false, 
      formats: { hasMP4: false, hasMOV: false, hasWebM: false, total: 0 },
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function testFFmpegBasicVideo(): Promise<{
  success: boolean;
  outputPath?: string;
  error?: string;
}> {
  // Garantir que os diretórios necessários existam
  const dirs = ['./uploads', './uploads/videos', './uploads/test'];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Criar uma imagem de teste
  const testImagePath = path.join('./uploads/test', 'test-solid-color.png');
  try {
    await execFilePromise('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'color=c=blue:s=640x480:d=1',
      '-frames:v', '1',
      testImagePath
    ]);
  } catch (error) {
    return {
      success: false,
      error: `Erro ao criar imagem de teste: ${error instanceof Error ? error.message : String(error)}`
    };
  }
  
  // Criar um vídeo de teste a partir da imagem
  const outputFileName = `test_ffmpeg_${Date.now()}.mp4`;
  const outputFilePath = path.join('./uploads/videos', outputFileName);
  
  try {
    await execFilePromise('ffmpeg', [
      '-loop', '1',
      '-i', testImagePath,
      '-c:v', 'libx264',
      '-t', '5',
      '-pix_fmt', 'yuv420p',
      '-y',
      outputFilePath
    ]);
    
    return {
      success: true,
      outputPath: outputFilePath
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro ao criar vídeo de teste: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function testCompleteWorkflow(): Promise<{
  success: boolean;
  outputPath?: string;
  error?: string;
  details?: {
    imageGeneration: boolean;
    videoCreation: boolean;
    audioAddition: boolean;
  }
}> {
  const details = {
    imageGeneration: false,
    videoCreation: false,
    audioAddition: false
  };
  
  // Garantir diretórios
  const dirs = ['./uploads', './uploads/videos', './uploads/test', './uploads/temp', './uploads/audio'];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // 1. Gerar várias imagens de teste com cores diferentes
  const imagePaths: string[] = [];
  const colors = ['blue', 'red', 'green', 'yellow', 'purple'];
  
  try {
    for (let i = 0; i < colors.length; i++) {
      const imagePath = path.join('./uploads/test', `test-${colors[i]}.png`);
      await execFilePromise('ffmpeg', [
        '-f', 'lavfi',
        '-i', `color=c=${colors[i]}:s=1280x720:d=1`,
        '-vf', `drawtext=text='Slide ${i+1}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2`,
        '-frames:v', '1',
        imagePath
      ]);
      imagePaths.push(imagePath);
    }
    details.imageGeneration = true;
  } catch (error) {
    return {
      success: false,
      error: `Erro ao gerar imagens de teste: ${error instanceof Error ? error.message : String(error)}`,
      details
    };
  }
  
  // 2. Criar vídeo a partir das imagens
  const videoPath = path.join('./uploads/videos', `test_workflow_${Date.now()}.mp4`);
  try {
    // Criar arquivo de entrada para o FFmpeg (lista de imagens)
    const inputFile = path.join('./uploads/temp', `input_${Date.now()}.txt`);
    let fileContent = '';
    
    // Usar caminhos absolutos para evitar problemas com caminhos relativos
    const absoluteImagePaths = imagePaths.map(imgPath => path.resolve(imgPath));
    
    // Para cada imagem, adicionar entrada no arquivo
    for (const imgPath of absoluteImagePaths) {
      fileContent += `file '${imgPath.replace(/\\/g, '/')}'\n`;
      fileContent += `duration 3\n`; // Cada imagem dura 3 segundos
    }
    
    // Adicionar a última imagem novamente para o último segmento
    fileContent += `file '${absoluteImagePaths[absoluteImagePaths.length - 1].replace(/\\/g, '/')}'\n`;
    
    fs.writeFileSync(inputFile, fileContent);
    
    console.log(`Arquivo de entrada criado em ${inputFile} com conteúdo:\n${fileContent}`);
    
    // Abordagem alternativa usando entradas diretas de imagens em vez de concat
    // Criar vídeo diretamente das imagens em sequência sem usar concat
    const ffmpegArgs = [];
    
    // Adicionar cada imagem como entrada
    for (const imgPath of imagePaths) {
      ffmpegArgs.push('-loop', '1', '-t', '3', '-i', imgPath);
    }
    
    // Configurar filtro de concatenação
    const filterComplex = absoluteImagePaths.map((_, i) => `[${i}:v]`).join('') + 
                        `concat=n=${absoluteImagePaths.length}:v=1:a=0[outv]`;
    
    ffmpegArgs.push(
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-pix_fmt', 'yuv420p',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-y',
      videoPath
    );
    
    console.log(`Executando FFmpeg com argumentos: ${ffmpegArgs.join(' ')}`);
    
    await execFilePromise('ffmpeg', ffmpegArgs);
    
    // Limpar arquivo temporário
    if (fs.existsSync(inputFile)) {
      fs.unlinkSync(inputFile);
    }
    
    details.videoCreation = true;
  } catch (error) {
    return {
      success: false,
      error: `Erro ao criar vídeo: ${error instanceof Error ? error.message : String(error)}`,
      details
    };
  }
  
  // 3. Criar áudio de teste (tom de 440Hz)
  const audioPath = path.join('./uploads/audio', `test_tone_${Date.now()}.mp3`);
  try {
    await execFilePromise('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=15',
      '-c:a', 'libmp3lame',
      '-y',
      audioPath
    ]);
  } catch (error) {
    return {
      success: true, // Continuamos mesmo se falhar a geração de áudio
      outputPath: videoPath,
      error: `Vídeo criado, mas falha ao gerar áudio: ${error instanceof Error ? error.message : String(error)}`,
      details
    };
  }
  
  // 4. Adicionar áudio ao vídeo
  const finalVideoPath = path.join('./uploads/videos', `test_workflow_audio_${Date.now()}.mp4`);
  try {
    await execFilePromise('ffmpeg', [
      '-i', videoPath,
      '-i', audioPath,
      '-map', '0:v',
      '-map', '1:a',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      '-y',
      finalVideoPath
    ]);
    
    details.audioAddition = true;
    
    return {
      success: true,
      outputPath: finalVideoPath,
      details
    };
  } catch (error) {
    return {
      success: true, // Continuamos mesmo se falhar a adição de áudio
      outputPath: videoPath,
      error: `Vídeo criado, mas falha ao adicionar áudio: ${error instanceof Error ? error.message : String(error)}`,
      details
    };
  }
}

// Função para obter metadados do vídeo
export async function getVideoMetadata(videoPath: string): Promise<any> {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Arquivo não encontrado: ${videoPath}`);
  }
  
  try {
    const { stdout } = await execFilePromise('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath
    ]);
    
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Erro ao obter metadados do vídeo: ${error instanceof Error ? error.message : String(error)}`);
  }
}