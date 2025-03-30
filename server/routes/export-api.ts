import express from 'express';
import path from 'path';
import fs from 'fs';
import { exportService } from '../services/export-service';
import { log } from '../vite';
import archiver from 'archiver';
import { storage } from '../storage';

const router = express.Router();

/**
 * Endpoint para iniciar a exportação de código, vídeos ou dados
 * @route POST /api/export/start
 */
router.post('/start', async (req, res) => {
  try {
    const { type, format } = req.body;
    
    // Validação
    if (!type || !['code', 'videos', 'data', 'full'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de exportação inválido. Use "code", "videos", "data" ou "full"'
      });
    }
    
    if (!format || !['csv', 'zip', 'json'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Formato inválido. Use "csv", "zip" ou "json"'
      });
    }
    
    // Usar ID 1 como usuário padrão por simplicidade
    const userId = 1;
    
    // Se for exportação completa, inicie múltiplas exportações
    if (type === 'full') {
      // Criar trabalhos para cada tipo de exportação
      const codeJob = await exportService.createExportJob(userId, 'code', 'zip');
      const videosJob = await exportService.createExportJob(userId, 'videos', 'zip');
      const dataJob = await exportService.createExportJob(userId, 'data', 'json');
      
      res.status(202).json({
        success: true,
        message: 'Exportação completa iniciada',
        jobs: {
          code: { id: codeJob.id, status: codeJob.status },
          videos: { id: videosJob.id, status: videosJob.status },
          data: { id: dataJob.id, status: dataJob.status }
        }
      });
    } else {
      // Criar um único trabalho de exportação
      const job = await exportService.createExportJob(userId, type, format);
      
      // Aguardar a conclusão do trabalho
      await new Promise<void>((resolve) => {
        const checkStatus = async () => {
          const updatedJob = await storage.getExportJob(job.id);
          if (updatedJob && (updatedJob.status === 'completed' || updatedJob.status === 'failed')) {
            resolve();
          } else {
            setTimeout(checkStatus, 500); // verificar a cada 500ms
          }
        };
        
        // Iniciar verificação de status
        setTimeout(checkStatus, 500);
      });
      
      // Obter trabalho atualizado
      const updatedJob = await storage.getExportJob(job.id);
      
      if (updatedJob && updatedJob.status === 'completed' && updatedJob.filePath) {
        // Definir nome adequado para download
        const filename = path.basename(updatedJob.filePath);
        const downloadName = `export_${updatedJob.type}_${updatedJob.id}${path.extname(updatedJob.filePath)}`;
        
        // Configurar headers para download
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        
        if (updatedJob.format === 'json') {
          res.setHeader('Content-Type', 'application/json');
        } else if (updatedJob.format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
        } else {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
        
        // Streaming do arquivo para o cliente
        const fileStream = exportService.getExportFileStream(updatedJob.filePath);
        fileStream.pipe(res);
      } else {
        // Se o trabalho falhou ou não tem arquivo, retornar resposta JSON
        res.status(updatedJob?.status === 'failed' ? 500 : 202).json({
          success: updatedJob?.status === 'completed',
          message: `Exportação de ${type} ${updatedJob?.status}`,
          jobId: job.id,
          status: updatedJob?.status || job.status,
          error: updatedJob?.error || null,
          downloadUrl: updatedJob?.status === 'completed' ? `/api/export/download/${job.id}` : null
        });
      }
    }
  } catch (error) {
    log(`Erro ao iniciar exportação: ${error instanceof Error ? error.message : String(error)}`, 'export-api');
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar exportação'
    });
  }
});

/**
 * Endpoint para verificar o status de uma exportação
 * @route GET /api/export/status/:jobId
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    
    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do trabalho inválido'
      });
    }
    
    const job = await storage.getExportJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Trabalho de exportação não encontrado'
      });
    }
    
    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        type: job.type,
        format: job.format,
        fileSize: job.fileSize,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error
      }
    });
  } catch (error) {
    log(`Erro ao verificar status de exportação: ${error instanceof Error ? error.message : String(error)}`, 'export-api');
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status de exportação'
    });
  }
});

/**
 * Endpoint para baixar um arquivo de exportação
 * @route GET /api/export/download/:jobId
 */
router.get('/download/:jobId', async (req, res) => {
  try {
    const jobId = parseInt(req.params.jobId);
    
    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do trabalho inválido'
      });
    }
    
    const job = await storage.getExportJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Trabalho de exportação não encontrado'
      });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: `Exportação ainda não concluída. Status atual: ${job.status}`
      });
    }
    
    if (!job.filePath || !fs.existsSync(job.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo de exportação não encontrado'
      });
    }
    
    // Definir nome adequado para download
    let filename = path.basename(job.filePath);
    const downloadName = `export_${job.type}_${job.id}${path.extname(job.filePath)}`;
    
    // Configurar headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Streaming do arquivo para o cliente
    const fileStream = exportService.getExportFileStream(job.filePath);
    fileStream.pipe(res);
  } catch (error) {
    log(`Erro ao baixar arquivo de exportação: ${error instanceof Error ? error.message : String(error)}`, 'export-api');
    res.status(500).json({
      success: false,
      error: 'Erro ao baixar arquivo de exportação'
    });
  }
});

/**
 * Endpoint para exportar completamente o aplicativo (código fonte e dados) em um único arquivo
 * @route GET /api/export/app
 */
router.get('/app', async (req, res) => {
  try {
    // Criar diretório temporário para a exportação
    const timestamp = Date.now();
    const tempDir = path.join(process.cwd(), 'uploads/temp');
    const exportDir = path.join(tempDir, `app_export_${timestamp}`);
    
    // Criar diretório se não existir
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Caminho do arquivo ZIP final
    const zipFilePath = path.join(exportDir, 'videogenie_app_export.zip');
    
    // Configurar arquivo ZIP
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    // Configurar event handlers antes de finalizar o arquivo
    output.on('close', () => {
      // Verificar se o arquivo foi criado com sucesso
      if (fs.existsSync(zipFilePath)) {
        const stats = fs.statSync(zipFilePath);
        log(`Arquivo ZIP criado com sucesso: ${zipFilePath} (${stats.size} bytes)`, 'export-api');
        
        // Definir cabeçalhos de download adequados
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="videogenie_app_export.zip"');
        res.setHeader('Content-Length', stats.size);
        
        // Enviar o arquivo como stream
        const fileStream = fs.createReadStream(zipFilePath);
        fileStream.pipe(res);
        
        // Configurar limpeza após 5 minutos
        setTimeout(() => {
          try {
            if (fs.existsSync(zipFilePath)) {
              fs.unlinkSync(zipFilePath);
              log(`Arquivo ZIP removido após download: ${zipFilePath}`, 'export-api');
            }
            if (fs.existsSync(exportDir)) {
              fs.rmdirSync(exportDir, { recursive: true });
            }
          } catch (cleanupError) {
            log(`Erro ao limpar arquivos temporários: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`, 'export-api');
          }
        }, 5 * 60 * 1000); // Limpar depois de 5 minutos
      } else {
        log(`Erro: arquivo ZIP não encontrado após criação: ${zipFilePath}`, 'export-api');
        res.status(500).json({
          success: false,
          error: 'Erro ao criar arquivo de exportação'
        });
      }
    });
    
    archive.on('error', (err) => {
      log(`Erro ao criar arquivo ZIP: ${err.message}`, 'export-api');
      res.status(500).json({
        success: false,
        error: 'Erro ao criar arquivo de exportação'
      });
    });
    
    // Vincular arquivo e saída
    archive.pipe(output);
    
    // Diretórios a ignorar
    const ignoredDirs = [
      'node_modules',
      '.git',
      '.replit',
      'dist',
      'build',
      'coverage',
      '.cache',
      '.github',
      '.vscode',
      'test_videos'
    ];
    
    // Excluir diretórios grandes, mas incluir alguns arquivos de uploads para exemplo
    const specialDirs = ['uploads'];
    
    // Adicionar arquivos e diretórios ao ZIP
    const rootDir = process.cwd();
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    
    // Adicionar README com instruções
    const readmeContent = `# VideoGenie App Export
    
Data de exportação: ${new Date().toISOString()}

## Conteúdo deste arquivo
Este arquivo ZIP contém o código fonte completo do aplicativo VideoGenie, incluindo:

1. Todos os arquivos fonte (TypeScript, React, CSS, etc.)
2. Configurações e dependências
3. Amostras de dados
4. Estrutura de diretórios

## Como usar
Para usar este código:

1. Extraia o conteúdo deste arquivo ZIP
2. Instale as dependências com \`npm install\`
3. Inicie o servidor com \`npm run dev\`

## Módulos principais
- server/: Contém o código do backend (API Express)
- client/: Contém o código do frontend (React)
- shared/: Contém os tipos e schemas compartilhados
- uploads/: Contém amostras de arquivos gerados

## Configuração de APIs
Para usar completamente este aplicativo, você precisará configurar suas próprias chaves de API:

- OpenAI API
- Google TTS API
- HuggingFace API
- Mistral API
- Pexels API

## Suporte
Para mais informações, consulte a documentação incluída no diretório \`docs/\`.
`;
    
    // Adicionar arquivo README
    const readmePath = path.join(exportDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);
    archive.file(readmePath, { name: 'README.md' });
    
    // Adicionar cada entrada no diretório raiz
    for (const entry of entries) {
      const entryPath = path.join(rootDir, entry.name);
      
      // Pular diretórios ignorados
      if (ignoredDirs.includes(entry.name)) {
        continue;
      }
      
      // Tratar diretórios especiais
      if (specialDirs.includes(entry.name)) {
        if (entry.name === 'uploads') {
          // Apenas incluir alguns arquivos de amostra da pasta uploads
          try {
            // Criar diretório uploads no ZIP
            archive.append('', { name: 'uploads/' });
            
            // Adicionar subdiretórios vazios para manter a estrutura
            ['videos', 'images', 'audio', 'temp'].forEach(subdir => {
              archive.append('', { name: `uploads/${subdir}/` });
            });
            
            // Adicionar arquivo de espaço reservado
            const placeholderContent = 'Este diretório armazena arquivos gerados pelo aplicativo.';
            archive.append(placeholderContent, { name: 'uploads/README.txt' });
            
            // Adicionar alguns arquivos de amostra, se existirem
            const videoDir = path.join(rootDir, 'uploads/videos');
            const imageDir = path.join(rootDir, 'uploads/images');
            
            if (fs.existsSync(videoDir)) {
              const videoFiles = fs.readdirSync(videoDir).slice(0, 2); // Limitar a 2 vídeos
              videoFiles.forEach(file => {
                const filePath = path.join(videoDir, file);
                if (fs.statSync(filePath).isFile() && fs.statSync(filePath).size < 10 * 1024 * 1024) {
                  archive.file(filePath, { name: `uploads/videos/${file}` });
                }
              });
            }
            
            if (fs.existsSync(imageDir)) {
              const imageFiles = fs.readdirSync(imageDir).slice(0, 5); // Limitar a 5 imagens
              imageFiles.forEach(file => {
                const filePath = path.join(imageDir, file);
                if (fs.statSync(filePath).isFile()) {
                  archive.file(filePath, { name: `uploads/images/${file}` });
                }
              });
            }
          } catch (error) {
            log(`Erro ao processar diretório de uploads: ${error instanceof Error ? error.message : String(error)}`, 'export-api');
          }
          continue;
        }
      }
      
      // Adicionar arquivo ou diretório regular
      if (entry.isFile()) {
        archive.file(entryPath, { name: entry.name });
      } else if (entry.isDirectory()) {
        // Para diretórios, adicionar recursivamente sem os diretórios ignorados
        await addDirectoryToArchiveFiltered(archive, rootDir, entry.name, ignoredDirs);
      }
    }
    
    // Finalizar o arquivo
    archive.finalize();
  } catch (error) {
    log(`Erro na exportação do aplicativo: ${error instanceof Error ? error.message : String(error)}`, 'export-api');
    res.status(500).json({
      success: false,
      error: 'Erro ao exportar aplicativo'
    });
  }
});

/**
 * Endpoint para listar todas as exportações
 * @route GET /api/export/list
 */
router.get('/list', async (req, res) => {
  try {
    // Usar ID 1 como usuário padrão por simplicidade
    const userId = 1;
    const jobs = await storage.getExportJobs(userId);
    
    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        type: job.type,
        format: job.format,
        status: job.status,
        fileSize: job.fileSize,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      }))
    });
  } catch (error) {
    log(`Erro ao listar exportações: ${error instanceof Error ? error.message : String(error)}`, 'export-api');
    res.status(500).json({
      success: false,
      error: 'Erro ao listar exportações'
    });
  }
});

/**
 * Adiciona um diretório ao arquivo zip, filtrando diretórios ignorados
 * @param archive Instância do Archiver
 * @param basePath Caminho base
 * @param relativePath Caminho relativo
 * @param ignoredDirs Diretórios a ignorar
 */
async function addDirectoryToArchiveFiltered(
  archive: archiver.Archiver,
  basePath: string,
  relativePath: string,
  ignoredDirs: string[]
): Promise<void> {
  const fullPath = path.join(basePath, relativePath);
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryRelativePath = path.join(relativePath, entry.name);
    const entryFullPath = path.join(basePath, entryRelativePath);
    
    if (entry.isDirectory()) {
      // Pular diretórios ignorados
      if (ignoredDirs.includes(entry.name)) {
        continue;
      }
      
      // Criar diretório no ZIP
      archive.append('', { name: entryRelativePath + '/' });
      
      // Adicionar conteúdo do diretório recursivamente
      await addDirectoryToArchiveFiltered(archive, basePath, entryRelativePath, ignoredDirs);
    } else if (entry.isFile()) {
      // Verificar tamanho do arquivo (limitar a 10MB)
      try {
        const stats = fs.statSync(entryFullPath);
        if (stats.size <= 10 * 1024 * 1024) {
          archive.file(entryFullPath, { name: entryRelativePath });
        }
      } catch (error) {
        log(`Erro ao adicionar arquivo ${entryRelativePath}: ${error instanceof Error ? error.message : String(error)}`, 'export-api');
      }
    }
  }
}

export default router;