/**
 * Serviço de exportação para Google Drive
 * Este módulo permite exportar arquivos diretamente para o Google Drive do usuário
 */

import fs from 'fs';
import path from 'path';
import { log } from '../vite';
import axios from 'axios';
import FormData from 'form-data';

// Interface para resposta da API do Google Drive
interface GoogleDriveUploadResponse {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
}

/**
 * Exporta um arquivo para o Google Drive
 * @param filePath Caminho local do arquivo a ser exportado
 * @param accessToken Token de acesso OAuth do Google
 * @param folderName Nome da pasta no Google Drive (opcional)
 * @returns Objeto com informações sobre o arquivo enviado
 */
export async function exportToGoogleDrive(
  filePath: string,
  accessToken: string,
  folderName?: string
): Promise<{
  success: boolean;
  fileId?: string;
  viewLink?: string;
  downloadLink?: string;
  error?: string;
}> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Verificar tamanho do arquivo
    const stats = fs.statSync(filePath);
    if (stats.size > 100 * 1024 * 1024) { // Limite de 100MB
      throw new Error('Arquivo muito grande para upload (máximo 100MB)');
    }

    let folderId: string | undefined;
    
    // Se um nome de pasta foi fornecido, criar ou localizar a pasta
    if (folderName) {
      try {
        folderId = await findOrCreateFolder(accessToken, folderName);
      } catch (error) {
        log(`Erro ao criar/encontrar pasta: ${error instanceof Error ? error.message : String(error)}`, 'google-drive');
      }
    }

    // Criar metadados do arquivo
    const fileName = path.basename(filePath);
    const metadata = {
      name: fileName,
      mimeType: getMimeType(fileName),
      parents: folderId ? [folderId] : undefined
    };

    // Criar FormData
    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata), {
      contentType: 'application/json',
    });
    
    // Adicionar o arquivo
    formData.append('file', fs.createReadStream(filePath));

    // Enviar para o Google Drive
    const response = await axios.post(
      'https://www.googleapis.com/upload/drive/v3?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const result = response.data as GoogleDriveUploadResponse;
    
    return {
      success: true,
      fileId: result.id,
      viewLink: result.webViewLink,
      downloadLink: result.webContentLink,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Erro ao exportar para Google Drive: ${errorMessage}`, 'google-drive');
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Encontra ou cria uma pasta no Google Drive
 * @param accessToken Token de acesso OAuth do Google
 * @param folderName Nome da pasta a ser encontrada ou criada
 * @returns ID da pasta
 */
async function findOrCreateFolder(accessToken: string, folderName: string): Promise<string> {
  try {
    // Primeiro, tentar encontrar a pasta
    const findResponse = await axios.get(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (findResponse.data.files && findResponse.data.files.length > 0) {
      return findResponse.data.files[0].id;
    }

    // Se a pasta não existir, criar uma nova
    const createResponse = await axios.post(
      'https://www.googleapis.com/drive/v3/files',
      {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return createResponse.data.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Erro ao encontrar/criar pasta no Google Drive: ${errorMessage}`, 'google-drive');
    throw error;
  }
}

/**
 * Obtém o tipo MIME com base na extensão do arquivo
 * @param fileName Nome do arquivo
 * @returns Tipo MIME
 */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.zip': 'application/zip',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}