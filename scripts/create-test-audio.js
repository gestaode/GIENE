import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Simular um arquivo MP3 para testes
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Criar um arquivo binário simples que simula um MP3
// Este não é um MP3 real, mas será suficiente para testar o caminho do arquivo
const dummyMP3Data = Buffer.from([
  0xFF, 0xFB, 0x50, 0xC4, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Caminho para o diretório de áudios
const audioDir = path.join(__dirname, '../uploads/audios');

// Garantir que o diretório existe
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log(`Diretório criado: ${audioDir}`);
}

// Caminho para o arquivo de áudio de teste
const testAudioPath = path.join(audioDir, 'test-audio.mp3');

// Escrever o arquivo
fs.writeFileSync(testAudioPath, dummyMP3Data);
console.log(`Arquivo de áudio de teste criado em: ${testAudioPath}`);

// Definir permissões para garantir acesso
try {
  fs.chmodSync(testAudioPath, 0o666);
  console.log('Permissões definidas para o arquivo de áudio');
} catch (error) {
  console.error('Erro ao definir permissões:', error);
}