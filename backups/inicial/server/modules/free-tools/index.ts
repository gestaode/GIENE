/**
 * Módulo de Ferramentas Gratuitas
 * 
 * Este módulo fornece alternativas gratuitas e locais para geração de conteúdo,
 * sem depender de APIs externas pagas. Serve como um sistema de fallback robusto
 * e pode ser usado de forma autônoma quando APIs não estiverem disponíveis.
 */

import { log } from '../../vite';
import * as localGenerators from './content-generators';

/**
 * Interface para estatísticas de uso do módulo
 */
interface UsageStats {
  totalRequests: number;
  textGenerationRequests: number;
  scriptGenerationRequests: number;
  hashtagGenerationRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  lastUsed: Date;
}

// Estatísticas de uso do módulo
const moduleStats: UsageStats = {
  totalRequests: 0,
  textGenerationRequests: 0,
  scriptGenerationRequests: 0,
  hashtagGenerationRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageProcessingTime: 0,
  lastUsed: new Date()
};

// Tempos de processamento para cálculo de média
const processingTimes: number[] = [];

/**
 * Atualiza as estatísticas após uma requisição
 */
function updateStats(type: 'text' | 'script' | 'hashtag', success: boolean, processingTime: number): void {
  moduleStats.totalRequests++;
  moduleStats.lastUsed = new Date();
  
  if (type === 'text') {
    moduleStats.textGenerationRequests++;
  } else if (type === 'script') {
    moduleStats.scriptGenerationRequests++;
  } else if (type === 'hashtag') {
    moduleStats.hashtagGenerationRequests++;
  }
  
  if (success) {
    moduleStats.successfulRequests++;
  } else {
    moduleStats.failedRequests++;
  }
  
  // Atualizar tempo médio de processamento
  processingTimes.push(processingTime);
  if (processingTimes.length > 100) {
    processingTimes.shift(); // Manter apenas os últimos 100 valores
  }
  
  moduleStats.averageProcessingTime = 
    processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
}

/**
 * Gera texto utilizando apenas recursos locais
 */
export async function generateText(
  theme: string,
  prompt: string,
  options?: any
): Promise<any> {
  const startTime = Date.now();
  try {
    log(`Gerando texto local para tema: ${theme}`, 'info');
    
    const result = await localGenerators.generateLocalText(theme, prompt, options);
    
    const endTime = Date.now();
    updateStats('text', true, endTime - startTime);
    
    return {
      ...result,
      provider: 'local',
      usedFallback: true
    };
  } catch (error) {
    const endTime = Date.now();
    updateStats('text', false, endTime - startTime);
    
    log('Erro ao gerar texto local:', 'error');
    log(error, 'error');
    
    throw error;
  }
}

/**
 * Gera script de vídeo utilizando apenas recursos locais
 */
export async function generateVideoScript(
  theme: string,
  targetAudience: string = 'geral',
  options?: any
): Promise<any> {
  const startTime = Date.now();
  try {
    log(`Gerando script local para tema: ${theme}`, 'info');
    
    const result = await localGenerators.generateLocalScript(theme, targetAudience, options);
    
    const endTime = Date.now();
    updateStats('script', true, endTime - startTime);
    
    return {
      ...result,
      provider: 'local',
      usedFallback: true
    };
  } catch (error) {
    const endTime = Date.now();
    updateStats('script', false, endTime - startTime);
    
    log('Erro ao gerar script local:', 'error');
    log(error, 'error');
    
    throw error;
  }
}

/**
 * Gera hashtags utilizando apenas recursos locais
 */
export async function generateHashtags(
  theme: string,
  content: string,
  options?: any
): Promise<any> {
  const startTime = Date.now();
  try {
    log(`Gerando hashtags locais para tema: ${theme}`, 'info');
    
    const result = await localGenerators.generateLocalHashtags(theme, content, options);
    
    const endTime = Date.now();
    updateStats('hashtag', true, endTime - startTime);
    
    return {
      ...result,
      provider: 'local',
      usedFallback: true
    };
  } catch (error) {
    const endTime = Date.now();
    updateStats('hashtag', false, endTime - startTime);
    
    log('Erro ao gerar hashtags locais:', 'error');
    log(error, 'error');
    
    throw error;
  }
}

/**
 * Obtém estatísticas de uso do módulo
 */
export function getModuleStats(): UsageStats {
  return { ...moduleStats };
}

/**
 * Verifica a disponibilidade do módulo
 */
export function checkAvailability(): boolean {
  return true; // Este módulo sempre está disponível por ser local
}

/**
 * Reseta as estatísticas do módulo
 */
export function resetStats(): void {
  moduleStats.totalRequests = 0;
  moduleStats.textGenerationRequests = 0;
  moduleStats.scriptGenerationRequests = 0;
  moduleStats.hashtagGenerationRequests = 0;
  moduleStats.successfulRequests = 0;
  moduleStats.failedRequests = 0;
  moduleStats.averageProcessingTime = 0;
  moduleStats.lastUsed = new Date();
  
  processingTimes.length = 0;
  
  log('Estatísticas do módulo de ferramentas gratuitas resetadas', 'info');
}