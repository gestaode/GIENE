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
    // Redirecionar para o job de exportação completa
    const userId = 1; // Usuário padrão por simplicidade
    
    // Iniciar exportação como job em background
    const job = await exportService.createExportJob(userId, 'full_app', 'zip');
    
    log(`Iniciando exportação completa do aplicativo (Job ID: ${job.id})`, 'export-api');
    
    // Aguardar a conclusão do trabalho com timeout
    let completed = false;
    const timeout = setTimeout(() => {
      if (!completed) {
        log(`Timeout na exportação completa do aplicativo (Job ID: ${job.id})`, 'export-api');
        res.status(202).json({
          success: true,
          message: 'Exportação iniciada mas ainda em processamento',
          jobId: job.id,
          downloadUrl: `/api/export/download/${job.id}`
        });
      }
    }, 30000); // 30 segundos de timeout
    
    // Verificar status periodicamente
    await new Promise<void>((resolve) => {
      const checkStatus = async () => {
        const updatedJob = await storage.getExportJob(job.id);
        if (updatedJob && (updatedJob.status === 'completed' || updatedJob.status === 'failed')) {
          clearTimeout(timeout);
          completed = true;
          resolve();
        } else {
          setTimeout(checkStatus, 1000);
        }
      };
      
      setTimeout(checkStatus, 1000);
    });
    
    // Obter job atualizado
    const updatedJob = await storage.getExportJob(job.id);
    
    if (updatedJob && updatedJob.status === 'completed' && updatedJob.filePath) {
      // Definir nome adequado para download
      const stats = fs.statSync(updatedJob.filePath);
      const downloadName = `videogenie_app_export.zip`;
      
      // Definir cabeçalhos de download adequados
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Length', stats.size);
      
      // Enviar o arquivo como stream
      const fileStream = exportService.getExportFileStream(updatedJob.filePath);
      fileStream.pipe(res);
      
      // Configurar limpeza após download (temporizador está na exportService)
    } else {
      // Se falhou, informar ao usuário
      res.status(500).json({
        success: false,
        error: updatedJob?.error || 'Erro ao criar arquivo de exportação',
        jobId: job.id
      });
    }
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