/**
 * API para exportação para o Google Drive
 * Este módulo permite exportar arquivos do sistema para o Google Drive
 */

import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { exportToGoogleDrive } from '../services/google-drive-export';
import { log } from '../vite';
import { storage } from '../storage';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Endpoint para exportar um arquivo para o Google Drive
 * @route POST /api/google-export/export
 */
router.post('/export', async (req, res) => {
  try {
    const { accessToken, fileType, folderName } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Token de acesso do Google é obrigatório'
      });
    }

    // Usar ID 1 como usuário padrão por simplicidade
    const userId = 1;

    // Criar diretório temporário para exportação
    const exportId = uuidv4();
    const exportDir = path.join(process.cwd(), 'temp', `export-${exportId}`);
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Nome do arquivo de exportação
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `videogenie-export-${timestamp}.zip`;
    const outputPath = path.join(exportDir, fileName);

    // Criar um job de exportação no banco de dados
    const exportJob = await storage.createExportJob({
      userId,
      type: 'app',
      format: 'zip',
      status: 'processing',
      filePath: outputPath,
      parameters: {
        exportToGoogle: true,
        folderName
      },
      createdAt: new Date()
    });

    // Criar arquivo ZIP
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 5 }
    });

    output.on('close', async () => {
      try {
        // Atualizar tamanho do arquivo
        const stats = fs.statSync(outputPath);
        await storage.updateExportJob(exportJob.id, {
          fileSize: stats.size,
          status: 'uploading'
        });

        // Exportar para o Google Drive
        const googleResult = await exportToGoogleDrive(
          outputPath,
          accessToken,
          folderName || 'VideoGenie Exports'
        );

        if (googleResult.success) {
          await storage.updateExportJob(exportJob.id, {
            status: 'completed',
            parameters: {
              ...exportJob.parameters,
              googleDriveId: googleResult.fileId,
              googleDriveLink: googleResult.viewLink
            },
            completedAt: new Date()
          });

          res.json({
            success: true,
            jobId: exportJob.id,
            googleDriveId: googleResult.fileId,
            viewLink: googleResult.viewLink,
            downloadLink: googleResult.downloadLink
          });
        } else {
          await storage.updateExportJob(exportJob.id, {
            status: 'error',
            error: googleResult.error
          });

          res.status(500).json({
            success: false,
            jobId: exportJob.id,
            error: googleResult.error
          });
        }

        // Limpar arquivos depois de um tempo
        setTimeout(() => {
          try {
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath);
            }
            if (fs.existsSync(exportDir)) {
              fs.rmdirSync(exportDir, { recursive: true });
            }
          } catch (cleanupError) {
            log(`Erro ao limpar arquivos temporários do Google Drive: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`, 'google-export-api');
          }
        }, 5 * 60 * 1000); // Limpar depois de 5 minutos
      } catch (error) {
        log(`Erro ao finalizar exportação para Google Drive: ${error instanceof Error ? error.message : String(error)}`, 'google-export-api');
        
        await storage.updateExportJob(exportJob.id, {
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });

        res.status(500).json({
          success: false,
          error: 'Erro ao exportar para Google Drive'
        });
      }
    });

    archive.on('error', async (err) => {
      log(`Erro ao criar arquivo ZIP para Google Drive: ${err.message}`, 'google-export-api');
      
      await storage.updateExportJob(exportJob.id, {
        status: 'error',
        error: `Erro ao criar arquivo ZIP: ${err.message}`
      });

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

    // Função para adicionar diretórios recursivamente
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
            log(`Erro ao adicionar arquivo ${entryRelativePath}: ${error instanceof Error ? error.message : String(error)}`, 'google-export-api');
          }
        }
      }
    }

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
            log(`Erro ao processar diretório de uploads: ${error instanceof Error ? error.message : String(error)}`, 'google-export-api');
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
    log(`Erro na exportação para Google Drive: ${error instanceof Error ? error.message : String(error)}`, 'google-export-api');
    res.status(500).json({
      success: false,
      error: 'Erro ao exportar para Google Drive'
    });
  }
});

/**
 * Endpoint para verificar o status de uma exportação para o Google Drive
 * @route GET /api/google-export/status/:jobId
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await storage.getExportJob(parseInt(jobId));
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job de exportação não encontrado'
      });
    }
    
    // Extrair informações relevantes do Google Drive
    const googleDriveInfo = job.parameters as {
      exportToGoogle?: boolean;
      folderName?: string;
      googleDriveId?: string;
      googleDriveLink?: string;
    };
    
    res.json({
      success: true,
      status: job.status,
      fileSize: job.fileSize,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error,
      googleDriveId: googleDriveInfo.googleDriveId,
      googleDriveLink: googleDriveInfo.googleDriveLink
    });
  } catch (error) {
    log(`Erro ao obter status da exportação para Google Drive: ${error instanceof Error ? error.message : String(error)}`, 'google-export-api');
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status da exportação'
    });
  }
});

/**
 * Endpoint para listar as exportações do Google Drive
 * @route GET /api/google-export/list
 */
router.get('/list', async (req, res) => {
  try {
    // Usar ID 1 como usuário padrão por simplicidade
    const userId = 1;
    const allJobs = await storage.getExportJobs(userId);
    
    // Filtrar apenas exportações para Google Drive
    const googleJobs = allJobs.filter(job => {
      const params = job.parameters as any;
      return params && params.exportToGoogle === true;
    });
    
    res.json({
      success: true,
      jobs: googleJobs.map(job => {
        const googleParams = job.parameters as {
          exportToGoogle?: boolean;
          folderName?: string;
          googleDriveId?: string;
          googleDriveLink?: string;
        };
        
        return {
          id: job.id,
          status: job.status,
          fileSize: job.fileSize,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
          googleDriveId: googleParams.googleDriveId,
          googleDriveLink: googleParams.googleDriveLink,
          folderName: googleParams.folderName
        };
      })
    });
  } catch (error) {
    log(`Erro ao listar exportações para Google Drive: ${error instanceof Error ? error.message : String(error)}`, 'google-export-api');
    res.status(500).json({
      success: false,
      error: 'Erro ao listar exportações'
    });
  }
});

export default router;