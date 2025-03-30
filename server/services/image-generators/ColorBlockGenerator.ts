import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

interface ColorBlockOptions {
  outputPath: string;
  width?: number;
  height?: number;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * Gerador de imagens de blocos coloridos com texto
 * 
 * Esta classe cria imagens de blocos coloridos simples contendo texto.
 * É útil para gerar imagens de teste sem depender de APIs externas.
 */
export class ColorBlockGenerator {
  /**
   * Gera uma imagem de bloco colorido com texto
   * 
   * @param options - Opções de configuração para a imagem
   * @returns Promise<string> - Caminho da imagem gerada
   */
  async generate(options: ColorBlockOptions): Promise<string> {
    const {
      outputPath,
      width = 800,
      height = 600,
      text = 'Teste',
      backgroundColor = '#3498db',
      textColor = '#ffffff',
      fontSize = 48,
      fontFamily = 'Arial, sans-serif'
    } = options;
    
    // Cria o canvas com as dimensões especificadas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Preenche o background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Adiciona o texto
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Se o texto for longo, quebra em múltiplas linhas
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > width * 0.8 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    lines.push(currentLine);
    
    // Calcula o espaçamento entre linhas e centraliza verticalmente
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    let y = (height - totalHeight) / 2 + fontSize / 2;
    
    // Desenha cada linha de texto
    for (const line of lines) {
      ctx.fillText(line, width / 2, y);
      y += lineHeight;
    }
    
    // Adiciona um borda
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Adiciona um timestamp na imagem
    const timestamp = new Date().toISOString();
    ctx.font = `14px ${fontFamily}`;
    ctx.textAlign = 'right';
    ctx.fillText(timestamp, width - 20, height - 20);
    
    // Garante que o diretório de saída existe
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Salva a imagem no disco
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  }
}