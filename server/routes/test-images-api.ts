import express from 'express';
import path from 'path';
import { ColorBlockGenerator } from '../services/image-generators/ColorBlockGenerator';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Endpoint para gerar imagens de teste
 * @route POST /api/test-images/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { count = 3, text = 'Teste', bgColor = '#3498db', textColor = '#ffffff' } = req.body;
    
    // Validação básica
    const imageCount = parseInt(String(count));
    if (isNaN(imageCount) || imageCount < 1 || imageCount > 20) {
      return res.status(400).json({ 
        success: false, 
        error: 'Quantidade de imagens deve ser entre 1 e 20' 
      });
    }
    
    // Inicializa o gerador de imagens
    const generator = new ColorBlockGenerator();
    
    // Configura o diretório de saída
    const outputDir = path.join(uploadsDir, 'test_images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Gera as imagens
    const imagePaths: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      const timestamp = Date.now();
      const uniqueId = `${timestamp}_${i}`;
      const filename = `test_image_${uniqueId}.png`;
      const outputPath = path.join(outputDir, filename);
      
      await generator.generate({
        outputPath,
        text: text || `Teste ${i + 1}`,
        backgroundColor: bgColor,
        textColor: textColor,
        width: 800,
        height: 600
      });
      
      // Adiciona ao array de caminhos (caminho relativo a partir do diretório raiz)
      imagePaths.push(`/uploads/test_images/${filename}`);
    }
    
    res.json({ 
      success: true, 
      message: `${imageCount} imagens geradas com sucesso`, 
      imagePaths 
    });
  } catch (error) {
    console.error('Erro ao gerar imagens de teste:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar imagens' 
    });
  }
});

/**
 * Endpoint para verificar a disponibilidade do gerador de imagens
 * @route GET /api/test-images/status
 */
router.get('/status', (_req, res) => {
  try {
    // Verifica se podemos inicializar o gerador
    const generator = new ColorBlockGenerator();
    
    res.json({
      available: true,
      message: 'Gerador de imagens está disponível'
    });
  } catch (error) {
    console.error('Erro ao verificar status do gerador de imagens:', error);
    res.status(500).json({
      available: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;