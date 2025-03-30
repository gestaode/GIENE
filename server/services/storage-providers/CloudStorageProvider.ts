/**
 * Provedor de Armazenamento em Nuvem para Vídeos e Imagens
 * 
 * Este serviço fornece uma interface para armazenar vídeos e imagens
 * em serviços de nuvem como AWS S3, Google Cloud Storage ou similares.
 * 
 * No momento, implementa apenas o armazenamento local simulado, mas pode ser
 * estendido para usar provedores reais de nuvem conforme necessário.
 */

import { log } from '../../vite';
import fs from 'fs/promises';
import path from 'path';

// Interface para o provedor de armazenamento
export interface StorageProvider {
  uploadVideo(videoPath: string, fileName: string): Promise<string>;
  uploadImage(imagePath: string, fileName: string): Promise<string>;
  getVideoUrl(fileName: string): string;
  getImageUrl(fileName: string): string;
}

// Implementação local que simula uma nuvem (usa o sistema de arquivos local)
export class LocalStorageProvider implements StorageProvider {
  private videosDir: string;
  private imagesDir: string;
  private publicBaseUrl: string;
  
  constructor() {
    // Diretórios para armazenamento local
    this.videosDir = path.join(process.cwd(), 'uploads/videos');
    this.imagesDir = path.join(process.cwd(), 'uploads/images');
    this.publicBaseUrl = '/uploads'; // URL base pública acessível pelo frontend
    
    // Garantir que os diretórios existam
    this.ensureDirectoriesExist();
  }
  
  async uploadVideo(videoPath: string, fileName: string): Promise<string> {
    try {
      const destPath = path.join(this.videosDir, fileName);
      
      // Se o arquivo já estiver no destino, apenas retornar o URL
      if (videoPath === destPath) {
        return `${this.publicBaseUrl}/videos/${fileName}`;
      }
      
      // Copiar o arquivo para o destino
      await fs.copyFile(videoPath, destPath);
      log(`Vídeo copiado para ${destPath}`, 'storage-provider');
      
      return `${this.publicBaseUrl}/videos/${fileName}`;
    } catch (error) {
      log(`Erro ao fazer upload de vídeo: ${error instanceof Error ? error.message : String(error)}`, 'storage-provider');
      throw new Error(`Falha ao armazenar vídeo: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async uploadImage(imagePath: string, fileName: string): Promise<string> {
    try {
      const destPath = path.join(this.imagesDir, fileName);
      
      // Se o arquivo já estiver no destino, apenas retornar o URL
      if (imagePath === destPath) {
        return `${this.publicBaseUrl}/images/${fileName}`;
      }
      
      // Copiar o arquivo para o destino
      await fs.copyFile(imagePath, destPath);
      log(`Imagem copiada para ${destPath}`, 'storage-provider');
      
      return `${this.publicBaseUrl}/images/${fileName}`;
    } catch (error) {
      log(`Erro ao fazer upload de imagem: ${error instanceof Error ? error.message : String(error)}`, 'storage-provider');
      throw new Error(`Falha ao armazenar imagem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  getVideoUrl(fileName: string): string {
    return `${this.publicBaseUrl}/videos/${fileName}`;
  }
  
  getImageUrl(fileName: string): string {
    return `${this.publicBaseUrl}/images/${fileName}`;
  }
  
  private async ensureDirectoriesExist() {
    try {
      await fs.mkdir(this.videosDir, { recursive: true });
      await fs.mkdir(this.imagesDir, { recursive: true });
      log('Diretórios de armazenamento criados com sucesso', 'storage-provider');
    } catch (error) {
      log(`Erro ao criar diretórios de armazenamento: ${error instanceof Error ? error.message : String(error)}`, 'storage-provider');
    }
  }
}

// Implementação para AWS S3 (a ser implementado quando necessário)
export class S3StorageProvider implements StorageProvider {
  private bucketName: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  
  constructor(
    bucketName: string, 
    region: string,
    accessKeyId: string,
    secretAccessKey: string
  ) {
    this.bucketName = bucketName;
    this.region = region;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
  }
  
  // Implementação a ser adicionada quando houver necessidade
  async uploadVideo(videoPath: string, fileName: string): Promise<string> {
    throw new Error('AWS S3 upload ainda não implementado');
  }
  
  async uploadImage(imagePath: string, fileName: string): Promise<string> {
    throw new Error('AWS S3 upload ainda não implementado');
  }
  
  getVideoUrl(fileName: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/videos/${fileName}`;
  }
  
  getImageUrl(fileName: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/images/${fileName}`;
  }
}

// Implementação para Google Cloud Storage (a ser implementado quando necessário)
export class GCSStorageProvider implements StorageProvider {
  private bucketName: string;
  
  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }
  
  // Implementação a ser adicionada quando houver necessidade
  async uploadVideo(videoPath: string, fileName: string): Promise<string> {
    throw new Error('Google Cloud Storage upload ainda não implementado');
  }
  
  async uploadImage(imagePath: string, fileName: string): Promise<string> {
    throw new Error('Google Cloud Storage upload ainda não implementado');
  }
  
  getVideoUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/videos/${fileName}`;
  }
  
  getImageUrl(fileName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/images/${fileName}`;
  }
}

// Factory para criar o provedor de armazenamento apropriado com base na configuração
export function createStorageProvider(): StorageProvider {
  // Por padrão, usar o provedor local
  const storageType = process.env.STORAGE_PROVIDER || 'local';
  
  switch (storageType.toLowerCase()) {
    case 's3':
      if (
        process.env.AWS_S3_BUCKET && 
        process.env.AWS_REGION && 
        process.env.AWS_ACCESS_KEY_ID && 
        process.env.AWS_SECRET_ACCESS_KEY
      ) {
        return new S3StorageProvider(
          process.env.AWS_S3_BUCKET,
          process.env.AWS_REGION,
          process.env.AWS_ACCESS_KEY_ID,
          process.env.AWS_SECRET_ACCESS_KEY
        );
      } else {
        log('Configurações AWS S3 incompletas, usando armazenamento local', 'storage-provider');
        return new LocalStorageProvider();
      }
      
    case 'gcs':
      if (process.env.GCS_BUCKET) {
        return new GCSStorageProvider(process.env.GCS_BUCKET);
      } else {
        log('Configurações Google Cloud Storage incompletas, usando armazenamento local', 'storage-provider');
        return new LocalStorageProvider();
      }
      
    case 'local':
    default:
      return new LocalStorageProvider();
  }
}

// Singleton para uso em toda a aplicação
export const storageProvider = createStorageProvider();