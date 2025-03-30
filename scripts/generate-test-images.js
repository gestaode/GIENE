/**
 * Script para gerar imagens de teste para o VideoGenie
 * Este script cria imagens coloridas com textos que podem ser usadas para testar
 * a funcionalidade de geração de vídeo quando não há imagens reais disponíveis.
 */

import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const WIDTH = 1280;
const HEIGHT = 720;
const TEST_DIR = path.join(process.cwd(), 'uploads/test');

// Garantir que o diretório exista
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  console.log(`Diretório criado: ${TEST_DIR}`);
}

// Cores para cada imagem
const colors = [
  { bg: '#FF5733', text: '#FFFFFF' }, // Vermelho
  { bg: '#33FF57', text: '#000000' }, // Verde
  { bg: '#3357FF', text: '#FFFFFF' }, // Azul
];

// Textos para cada imagem
const texts = [
  'Marketing Digital',
  'Inteligência Artificial',
  'Gestão de Conteúdo'
];

// Gerar as imagens
for (let i = 0; i < colors.length; i++) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Desenhar fundo
  ctx.fillStyle = colors[i].bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Configurar texto
  ctx.fillStyle = colors[i].text;
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Desenhar texto
  ctx.fillText(texts[i], WIDTH / 2, HEIGHT / 2);
  
  // Adicionar número da imagem
  ctx.font = 'bold 32px Arial';
  ctx.fillText(`Imagem ${i + 1} de ${colors.length}`, WIDTH / 2, HEIGHT / 2 + 100);
  
  // Salvar imagem
  const outputPath = path.join(TEST_DIR, `image${i + 1}.jpg`);
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Imagem criada: ${outputPath}`);
}

console.log('Todas as imagens de teste foram geradas com sucesso.');