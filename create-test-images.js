import fs from 'fs';
import { createCanvas } from 'canvas';

// Criando diretórios se eles não existirem
const imageDirPath = './uploads/images';
if (!fs.existsSync(imageDirPath)) {
  fs.mkdirSync(imageDirPath, { recursive: true });
}

// Função para criar uma imagem de teste
function createTestImage(filename, bgColor, text) {
  const width = 1080;
  const height = 1920;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Desenha o fundo
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Configura e desenha o texto
  ctx.fillStyle = 'white';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  // Salva a imagem como PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Imagem criada: ${filename}`);
}

// Cria as imagens de teste
createTestImage('./uploads/images/test-image.png', '#0056b3', 'VideoGenie Test');
createTestImage('./uploads/images/test-image2.png', '#28a745', 'VideoGenie Success');