import fs from "fs";
import path from "path";
import { createReadStream, createWriteStream } from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import { storage } from "../storage";
import { ExportJob } from "@shared/schema";
import { log } from "../vite";
import archiver from "archiver";
import { parse } from "json2csv";

const execAsync = promisify(exec);

// Diretórios para ignorar na exportação de código
const IGNORED_DIRS = [
  "node_modules",
  ".git",
  ".replit",
  "uploads",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".github",
  ".vscode",
  "test_videos"
];

// Extensões de arquivos a incluir na exportação de código
const CODE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".md",
  ".yaml",
  ".yml"
];

// Tamanho máximo de arquivo a incluir na exportação (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Service para gerenciar exportação de códigos e dados do sistema
 * Inclui funcionalidades para exportar em CSV e ZIP
 */
export class ExportService {
  private uploadsDir: string;
  private tempDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), "uploads");
    this.tempDir = path.join(this.uploadsDir, "temp");
    
    // Garantir que o diretório de uploads existe
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    
    // Garantir que o diretório temp existe
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Cria um trabalho de exportação e inicia o processo assíncrono
   * @param userId ID do usuário
   * @param type Tipo de exportação (code, videos, data)
   * @param format Formato de exportação (csv, zip)
   */
  async createExportJob(userId: number, type: string, format: string): Promise<ExportJob> {
    try {
      // Criar o job no banco de dados
      const job = await storage.createExportJob({
        userId,
        type,
        format,
        status: "processing"
      });

      // Iniciar o processamento assíncrono
      this.processExportJob(job).catch(error => {
        log(`Erro ao processar job de exportação ${job.id}: ${error.message}`, "export-service");
        this.updateJobAsFailed(job.id, error.message).catch(e => {
          log(`Erro ao atualizar status do job de exportação ${job.id}: ${e.message}`, "export-service");
        });
      });

      return job;
    } catch (error) {
      log(`Erro ao criar job de exportação: ${error.message}`, "export-service");
      throw new Error(`Falha ao criar trabalho de exportação: ${error.message}`);
    }
  }

  /**
   * Atualiza um job de exportação como falho
   * @param jobId ID do job de exportação
   * @param errorMessage Mensagem de erro
   */
  private async updateJobAsFailed(jobId: number, errorMessage: string): Promise<void> {
    await storage.updateExportJob(jobId, {
      status: "failed",
      error: errorMessage
    });
  }

  /**
   * Processa um job de exportação de forma assíncrona
   * @param job Job de exportação
   */
  private async processExportJob(job: ExportJob): Promise<void> {
    try {
      let filePath: string;
      
      // Definir nome de arquivo com timestamp para evitar colisões
      const timestamp = new Date().getTime();
      const exportDir = path.join(this.tempDir, `export_${job.id}_${timestamp}`);
      
      // Criar diretório temporário para a exportação
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      // Processar de acordo com o tipo e formato
      if (job.type === "code") {
        if (job.format === "zip") {
          filePath = await this.exportCodeAsZip(exportDir);
        } else {
          filePath = await this.exportCodeAsCsv(exportDir);
        }
      } else if (job.type === "videos") {
        filePath = await this.exportVideosAsZip(job.userId, exportDir);
      } else if (job.type === "data") {
        if (job.format === "csv") {
          filePath = await this.exportDataAsCsv(job.userId, exportDir);
        } else {
          filePath = await this.exportDataAsJson(job.userId, exportDir);
        }
      } else {
        throw new Error(`Tipo de exportação inválido: ${job.type}`);
      }
      
      // Obter tamanho do arquivo
      const stats = fs.statSync(filePath);
      
      // Atualizar job como concluído
      await storage.updateExportJob(job.id, {
        status: "completed",
        filePath,
        fileSize: stats.size,
        completedAt: new Date()
      });
      
      log(`Job de exportação ${job.id} concluído com sucesso. Arquivo: ${filePath}`, "export-service");
    } catch (error) {
      log(`Erro ao processar job de exportação ${job.id}: ${error.message}`, "export-service");
      await this.updateJobAsFailed(job.id, error.message);
    }
  }

  /**
   * Exporta o código-fonte do projeto como um arquivo ZIP
   * @param exportDir Diretório de exportação
   */
  private async exportCodeAsZip(exportDir: string): Promise<string> {
    const zipFilePath = path.join(exportDir, "codigo-fonte.zip");
    const output = createWriteStream(zipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 } // Nível máximo de compressão
    });
    
    archive.pipe(output);
    
    // Adicionar diretório raiz ao arquivo, excluindo diretórios ignorados
    await this.addDirectoryToArchive(archive, process.cwd(), "", IGNORED_DIRS);
    
    // Finalizar o arquivo
    await new Promise<void>((resolve, reject) => {
      output.on("close", () => resolve());
      archive.on("error", (err) => reject(err));
      archive.finalize();
    });
    
    return zipFilePath;
  }
  
  /**
   * Adiciona um diretório e seus arquivos/subdiretórios recursivamente a um arquivo ZIP
   * @param archive Arquivo ZIP
   * @param basePath Caminho base
   * @param relativePath Caminho relativo dentro do arquivo
   * @param ignoredDirs Diretórios a ignorar
   */
  private async addDirectoryToArchive(
    archive: archiver.Archiver,
    basePath: string,
    relativePath: string,
    ignoredDirs: string[]
  ): Promise<void> {
    const fullPath = path.join(basePath, relativePath);
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryRelativePath = path.join(relativePath, entry.name);
      const entryFullPath = path.join(fullPath, entry.name);
      
      if (entry.isDirectory()) {
        // Pular diretórios ignorados
        if (ignoredDirs.includes(entry.name)) {
          continue;
        }
        
        // Adicionar subdiretório recursivamente
        await this.addDirectoryToArchive(archive, basePath, entryRelativePath, ignoredDirs);
      } else if (entry.isFile()) {
        // Verificar extensão do arquivo para código fonte
        const ext = path.extname(entry.name).toLowerCase();
        
        if (CODE_EXTENSIONS.includes(ext)) {
          // Verificar tamanho do arquivo
          const stats = fs.statSync(entryFullPath);
          
          if (stats.size <= MAX_FILE_SIZE) {
            // Adicionar arquivo ao ZIP
            archive.file(entryFullPath, { name: entryRelativePath });
          }
        }
      }
    }
  }
  
  /**
   * Exporta o código-fonte do projeto como um arquivo CSV
   * @param exportDir Diretório de exportação
   */
  private async exportCodeAsCsv(exportDir: string): Promise<string> {
    const csvFilePath = path.join(exportDir, "codigo-fonte.csv");
    const codeFiles: Array<{ path: string, type: string, createdAt: string, modifiedAt: string, size: number }> = [];
    
    // Percorrer recursivamente os diretórios
    await this.collectCodeFilesInfo(process.cwd(), "", IGNORED_DIRS, codeFiles);
    
    // Converter para CSV
    const csv = parse(codeFiles, {
      fields: ["path", "type", "createdAt", "modifiedAt", "size"]
    });
    
    // Salvar CSV
    fs.writeFileSync(csvFilePath, csv);
    
    return csvFilePath;
  }
  
  /**
   * Coleta informações de arquivos de código recursivamente
   * @param basePath Caminho base
   * @param relativePath Caminho relativo
   * @param ignoredDirs Diretórios a ignorar
   * @param result Array para armazenar os resultados
   */
  private async collectCodeFilesInfo(
    basePath: string,
    relativePath: string,
    ignoredDirs: string[],
    result: Array<{ path: string, type: string, createdAt: string, modifiedAt: string, size: number }>
  ): Promise<void> {
    const fullPath = path.join(basePath, relativePath);
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryRelativePath = path.join(relativePath, entry.name);
      const entryFullPath = path.join(fullPath, entry.name);
      
      if (entry.isDirectory()) {
        // Pular diretórios ignorados
        if (ignoredDirs.includes(entry.name)) {
          continue;
        }
        
        // Processar subdiretório recursivamente
        await this.collectCodeFilesInfo(basePath, entryRelativePath, ignoredDirs, result);
      } else if (entry.isFile()) {
        // Verificar extensão do arquivo para código fonte
        const ext = path.extname(entry.name).toLowerCase();
        
        if (CODE_EXTENSIONS.includes(ext)) {
          // Verificar tamanho do arquivo
          const stats = fs.statSync(entryFullPath);
          
          if (stats.size <= MAX_FILE_SIZE) {
            // Determinar o tipo de código
            let type = "source";
            if (ext === ".json") type = "configuration";
            else if (ext === ".md") type = "documentation";
            else if (ext === ".css" || ext === ".scss") type = "style";
            else if (ext === ".html") type = "markup";
            else if (ext === ".yaml" || ext === ".yml") type = "configuration";
            
            // Adicionar informações do arquivo
            result.push({
              path: entryRelativePath,
              type,
              createdAt: new Date(stats.birthtime).toISOString(),
              modifiedAt: new Date(stats.mtime).toISOString(),
              size: stats.size
            });
          }
        }
      }
    }
  }

  /**
   * Exporta vídeos do usuário como um arquivo ZIP
   * @param userId ID do usuário
   * @param exportDir Diretório de exportação
   */
  private async exportVideosAsZip(userId: number, exportDir: string): Promise<string> {
    const zipFilePath = path.join(exportDir, "videos.zip");
    const output = createWriteStream(zipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 6 } // Nível médio de compressão para arquivos grandes
    });
    
    archive.pipe(output);
    
    // Obter todos os vídeos do usuário
    const videos = await storage.getVideos(userId);
    
    // Adicionar cada vídeo ao arquivo ZIP
    for (const video of videos) {
      if (video.videoUrl && fs.existsSync(video.videoUrl)) {
        try {
          // Usar nome de arquivo baseado no título para legibilidade
          const safeTitle = video.title
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()
            .substring(0, 50);
          
          const outputFilename = `${safeTitle}_${video.id}${path.extname(video.videoUrl)}`;
          
          // Adicionar arquivo ao ZIP
          archive.file(video.videoUrl, { name: outputFilename });
          
          // Adicionar thumbnail, se existir
          if (video.thumbnailUrl && fs.existsSync(video.thumbnailUrl)) {
            archive.file(video.thumbnailUrl, { 
              name: `thumbnails/${safeTitle}_${video.id}${path.extname(video.thumbnailUrl)}` 
            });
          }
        } catch (error) {
          log(`Erro ao adicionar vídeo ${video.id} ao arquivo ZIP: ${error.message}`, "export-service");
          // Continuar com os próximos vídeos
        }
      }
    }
    
    // Adicionar arquivo de metadados
    const metadataFilePath = path.join(exportDir, "metadata.json");
    fs.writeFileSync(metadataFilePath, JSON.stringify(videos, null, 2));
    archive.file(metadataFilePath, { name: "metadata.json" });
    
    // Finalizar o arquivo
    await new Promise<void>((resolve, reject) => {
      output.on("close", () => resolve());
      archive.on("error", (err) => reject(err));
      archive.finalize();
    });
    
    return zipFilePath;
  }

  /**
   * Exporta dados do usuário como um arquivo CSV
   * @param userId ID do usuário
   * @param exportDir Diretório de exportação
   */
  private async exportDataAsCsv(userId: number, exportDir: string): Promise<string> {
    // Criar pasta para armazenar os CSVs
    const csvDir = path.join(exportDir, "csv");
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    
    // Obter dados do usuário
    const videos = await storage.getVideos(userId);
    const leads = await storage.getLeads(userId);
    const funnels = await storage.getSalesFunnels(userId);
    const landingPages = await storage.getLandingPages(userId);
    const campaigns = await storage.getEmailCampaigns(userId);
    
    // Salvar cada conjunto de dados como um arquivo CSV separado
    const videosPath = path.join(csvDir, "videos.csv");
    const leadsPath = path.join(csvDir, "leads.csv");
    const funnelsPath = path.join(csvDir, "funnels.csv");
    const landingPagesPath = path.join(csvDir, "landing_pages.csv");
    const campaignsPath = path.join(csvDir, "email_campaigns.csv");
    
    fs.writeFileSync(videosPath, parse(videos));
    fs.writeFileSync(leadsPath, parse(leads));
    fs.writeFileSync(funnelsPath, parse(funnels));
    fs.writeFileSync(landingPagesPath, parse(landingPages));
    fs.writeFileSync(campaignsPath, parse(campaigns));
    
    // Criar arquivo ZIP com todos os CSVs
    const zipFilePath = path.join(exportDir, "dados.zip");
    const output = createWriteStream(zipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });
    
    archive.pipe(output);
    
    // Adicionar cada arquivo CSV ao ZIP
    archive.directory(csvDir, "csv");
    
    // Finalizar o arquivo
    await new Promise<void>((resolve, reject) => {
      output.on("close", () => resolve());
      archive.on("error", (err) => reject(err));
      archive.finalize();
    });
    
    return zipFilePath;
  }

  /**
   * Exporta dados do usuário como um arquivo JSON
   * @param userId ID do usuário
   * @param exportDir Diretório de exportação
   */
  private async exportDataAsJson(userId: number, exportDir: string): Promise<string> {
    // Obter dados do usuário
    const videos = await storage.getVideos(userId);
    const leads = await storage.getLeads(userId);
    const funnels = await storage.getSalesFunnels(userId);
    const landingPages = await storage.getLandingPages(userId);
    const campaigns = await storage.getEmailCampaigns(userId);
    
    // Construir estrutura de dados completa
    const data = {
      videos,
      leads,
      salesFunnels: funnels,
      landingPages,
      emailCampaigns: campaigns,
      exportDate: new Date().toISOString()
    };
    
    // Salvar como arquivo JSON
    const jsonFilePath = path.join(exportDir, "dados.json");
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
    
    return jsonFilePath;
  }

  /**
   * Obtém um stream de leitura para um arquivo de exportação
   * @param filePath Caminho do arquivo
   */
  getExportFileStream(filePath: string): fs.ReadStream {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de exportação não encontrado: ${filePath}`);
    }
    
    return createReadStream(filePath);
  }

  /**
   * Limpa arquivos de exportação antigos (mais de 24 horas)
   */
  async cleanupOldExports(): Promise<void> {
    try {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
      const entries = fs.readdirSync(this.tempDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith("export_")) {
          const dirPath = path.join(this.tempDir, entry.name);
          const stats = fs.statSync(dirPath);
          
          // Verificar se o diretório tem mais de 24 horas
          if (now - stats.mtimeMs > oneDay) {
            // Remover diretório e todo seu conteúdo
            await execAsync(`rm -rf "${dirPath}"`);
            log(`Removido diretório de exportação antigo: ${dirPath}`, "export-service");
          }
        }
      }
    } catch (error) {
      log(`Erro ao limpar arquivos de exportação antigos: ${error.message}`, "export-service");
    }
  }
}

// Instância única do serviço de exportação
export const exportService = new ExportService();

// Iniciar limpeza automática de arquivos antigos diariamente
setInterval(() => {
  exportService.cleanupOldExports().catch(error => {
    log(`Erro na limpeza automática de exportações: ${error.message}`, "export-service");
  });
}, 12 * 60 * 60 * 1000); // A cada 12 horas