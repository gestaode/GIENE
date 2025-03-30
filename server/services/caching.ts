import { log } from '../vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Sistema avançado de cache para todos os tipos de requests da aplicação
 * Suporta cache em memória e em disco para persistência entre reinicializações
 */
export class CachingService {
  private memoryCache: Map<string, {data: any, timestamp: number}> = new Map();
  private cacheDir: string;
  private defaultTTL: number; // Tempo de vida do cache em milissegundos
  private diskCacheEnabled: boolean;

  constructor(options: {
    diskCacheEnabled?: boolean,
    defaultTTL?: number, // em segundos
    cacheDirName?: string
  } = {}) {
    this.defaultTTL = (options.defaultTTL || 3600) * 1000; // Padrão: 1 hora
    this.diskCacheEnabled = options.diskCacheEnabled !== false;
    
    // Diretório de cache
    this.cacheDir = path.join(process.cwd(), options.cacheDirName || '.cache');
    
    // Cria o diretório de cache se não existir e estiver habilitado
    if (this.diskCacheEnabled) {
      this.ensureCacheDir();
    }
    
    log(`Serviço de cache inicializado. Disk cache: ${this.diskCacheEnabled ? 'ativado' : 'desativado'}. TTL: ${this.defaultTTL/1000}s`, 'cache');
  }
  
  /**
   * Gera uma chave de cache baseada nos parâmetros da requisição
   */
  private generateKey(prefix: string, params: any): string {
    // Remove funções, objetos complexos e dados sensíveis
    const cleanParams = this.sanitizeParams(params);
    
    // Gera um hash baseado nos parâmetros
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(cleanParams))
      .digest('hex');
      
    return `${prefix}:${hash}`;
  }
  
  /**
   * Limpa os parâmetros para geração segura de chaves
   */
  private sanitizeParams(params: any): any {
    if (!params) return {};
    
    // Se for um string, array ou número, retorna diretamente
    if (typeof params !== 'object' || Array.isArray(params)) {
      return params;
    }
    
    // Copia o objeto para não modificar o original
    const result: Record<string, any> = {};
    
    // Lista de chaves que podem conter dados sensíveis
    const sensitiveKeys = ['apiKey', 'password', 'token', 'secret', 'authorization'];
    
    // Processa cada propriedade
    for (const key in params) {
      // Pula propriedades herdadas
      if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
      
      // Pula funções
      if (typeof params[key] === 'function') continue;
      
      // Mascara dados sensíveis
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        result[key] = '[MASKED]';
        continue;
      }
      
      // Processa recursivamente objetos aninhados
      if (typeof params[key] === 'object' && params[key] !== null) {
        result[key] = this.sanitizeParams(params[key]);
        continue;
      }
      
      // Copia valores normais
      result[key] = params[key];
    }
    
    return result;
  }
  
  /**
   * Garante que o diretório de cache exista
   */
  private ensureCacheDir(): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
        log(`Diretório de cache criado: ${this.cacheDir}`, 'cache');
      }
    } catch (error) {
      log(`Erro ao criar diretório de cache: ${error}`, 'cache');
      this.diskCacheEnabled = false;
    }
  }
  
  /**
   * Salva dados em cache
   */
  async set(key: string, data: any, ttl?: number): Promise<void> {
    const timestamp = Date.now() + (ttl || this.defaultTTL);
    
    // Cache em memória
    this.memoryCache.set(key, { data, timestamp });
    
    // Cache em disco (se habilitado)
    if (this.diskCacheEnabled) {
      try {
        const cacheFile = path.join(this.cacheDir, `${key.replace(/:/g, '_')}.json`);
        const cacheData = JSON.stringify({ data, timestamp });
        await fs.promises.writeFile(cacheFile, cacheData);
      } catch (error) {
        log(`Erro ao escrever cache em disco: ${error}`, 'cache');
      }
    }
  }
  
  /**
   * Recupera dados do cache
   */
  async get(key: string): Promise<any | null> {
    // Primeiro verifica o cache em memória
    const memCache = this.memoryCache.get(key);
    
    if (memCache) {
      // Verifica se o cache expirou
      if (memCache.timestamp > Date.now()) {
        return memCache.data;
      }
      
      // Remove do cache se expirou
      this.memoryCache.delete(key);
    }
    
    // Se não encontrou em memória e o cache em disco está habilitado
    if (this.diskCacheEnabled) {
      try {
        const cacheFile = path.join(this.cacheDir, `${key.replace(/:/g, '_')}.json`);
        
        if (fs.existsSync(cacheFile)) {
          const cacheData = JSON.parse(await fs.promises.readFile(cacheFile, 'utf8'));
          
          // Verifica se o cache expirou
          if (cacheData.timestamp > Date.now()) {
            // Atualiza o cache em memória
            this.memoryCache.set(key, cacheData);
            return cacheData.data;
          }
          
          // Remove o arquivo de cache expirado
          await fs.promises.unlink(cacheFile);
        }
      } catch (error) {
        log(`Erro ao ler cache em disco: ${error}`, 'cache');
      }
    }
    
    return null;
  }
  
  /**
   * Remove um item específico do cache
   */
  async invalidate(key: string): Promise<void> {
    // Remove do cache em memória
    this.memoryCache.delete(key);
    
    // Remove do cache em disco
    if (this.diskCacheEnabled) {
      try {
        const cacheFile = path.join(this.cacheDir, `${key.replace(/:/g, '_')}.json`);
        
        if (fs.existsSync(cacheFile)) {
          await fs.promises.unlink(cacheFile);
        }
      } catch (error) {
        log(`Erro ao remover cache em disco: ${error}`, 'cache');
      }
    }
  }
  
  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    // Limpa o cache em memória
    this.memoryCache.clear();
    
    // Limpa o cache em disco
    if (this.diskCacheEnabled) {
      try {
        const files = await fs.promises.readdir(this.cacheDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            await fs.promises.unlink(path.join(this.cacheDir, file));
          }
        }
      } catch (error) {
        log(`Erro ao limpar cache em disco: ${error}`, 'cache');
      }
    }
  }
  
  /**
   * Wrapper para função que automaticamente utiliza e atualiza o cache
   */
  async wrap<T>(
    prefix: string,
    params: any,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(prefix, params);
    
    // Tenta obter do cache
    const cached = await this.get(key);
    if (cached !== null) {
      log(`Cache hit: ${prefix}`, 'cache');
      return cached as T;
    }
    
    // Não encontrado no cache, executa a função
    log(`Cache miss: ${prefix}`, 'cache');
    const result = await fn();
    
    // Salva o resultado no cache
    await this.set(key, result, ttl);
    
    return result;
  }
  
  /**
   * Obtém estatísticas do uso do cache
   */
  getStats(): { 
    memoryEntries: number, 
    memorySize: string,
    diskEntries?: number,
    diskSize?: string
  } {
    // Estatísticas do cache em memória
    const memoryEntries = this.memoryCache.size;
    let memorySize = 0;
    
    // Usando Array.from para evitar o uso direto do iterador
    Array.from(this.memoryCache).forEach(([key, value]) => {
      memorySize += key.length;
      memorySize += JSON.stringify(value).length;
    });
    
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };
    
    const stats: any = {
      memoryEntries,
      memorySize: formatSize(memorySize)
    };
    
    // Estatísticas do cache em disco (se habilitado)
    if (this.diskCacheEnabled) {
      try {
        const files = fs.readdirSync(this.cacheDir);
        const diskEntries = files.filter(f => f.endsWith('.json')).length;
        
        let diskSize = 0;
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(this.cacheDir, file);
            const stat = fs.statSync(filePath);
            diskSize += stat.size;
          }
        }
        
        stats.diskEntries = diskEntries;
        stats.diskSize = formatSize(diskSize);
      } catch (error) {
        log(`Erro ao obter estatísticas de disco: ${error}`, 'cache');
      }
    }
    
    return stats;
  }
}

// Exporta uma instância única para uso em toda a aplicação
export const cacheService = new CachingService({
  diskCacheEnabled: true,
  defaultTTL: 3600, // 1 hora em segundos
  cacheDirName: '.cache'
});