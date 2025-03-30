/**
 * Módulo de Integração com Redes Sociais
 * 
 * Este módulo é responsável por gerenciar todas as operações relacionadas com redes sociais,
 * incluindo agendamento e publicação de conteúdo, monitoramento de desempenho e interações.
 * 
 * Características principais:
 * - Agendamento de posts para múltiplas plataformas
 * - Monitoramento de métricas de engajamento
 * - Fallback para publicação manual quando as APIs falham
 * - Relatórios de desempenho de conteúdo
 */

import { log } from '../../vite';
import fs from 'fs';
import path from 'path';
import { socialMediaOrchestrator } from '../../services/social-media-orchestrator';

// Tipos para o módulo
export interface SocialMediaAccount {
  platform: string;
  accountId: string;
  accessToken: string;
}

export interface ScheduledPost {
  id: string;
  videoPath: string;
  title: string;
  description: string;
  hashtags: string[];
  scheduledTime?: Date;
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
  platforms: string[];
  error?: string;
  postUrls?: Record<string, string>;
  metrics?: Record<string, {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
}

/**
 * Classe principal do módulo de redes sociais
 */
export class SocialMediaModule {
  constructor() {
    log('Inicializando módulo de integração com redes sociais', 'social-media-module');
  }

  /**
   * Agenda um post para publicação em redes sociais
   */
  schedulePost(postData: {
    videoPath: string;
    title: string;
    description: string;
    hashtags: string[];
    scheduledTime?: Date;
  }, platforms: string[]): string {
    // Verificar se o arquivo de vídeo existe
    if (!fs.existsSync(postData.videoPath)) {
      throw new Error(`Arquivo de vídeo não encontrado: ${postData.videoPath}`);
    }
    
    // Verificar se pelo menos uma plataforma foi especificada
    if (!platforms.length) {
      throw new Error('Pelo menos uma plataforma deve ser especificada');
    }
    
    log(`Agendando post "${postData.title}" para ${platforms.join(', ')}`, 'social-media-module');
    
    // Converter plataformas para o formato esperado pelo orquestrador
    const accounts = platforms.map(platform => ({
      platform,
      accountId: 'default', // No futuro, isso viria do banco de dados do usuário
      accessToken: process.env[`${platform.toUpperCase()}_ACCESS_TOKEN`] || ''
    }));
    
    // Agendar a publicação
    const postId = socialMediaOrchestrator.schedulePost(
      {
        videoPath: postData.videoPath,
        title: postData.title,
        description: postData.description,
        hashtags: postData.hashtags || [],
        scheduledTime: postData.scheduledTime
      },
      accounts
    );
    
    return postId;
  }

  /**
   * Lista todos os posts com base no status
   */
  listPosts(status?: 'scheduled' | 'processing' | 'completed' | 'failed'): ScheduledPost[] {
    return socialMediaOrchestrator.listPosts(status);
  }

  /**
   * Obtém detalhes de um post específico
   */
  getPost(postId: string): ScheduledPost | null {
    return socialMediaOrchestrator.getPostStatus(postId);
  }

  /**
   * Cancela um post agendado que ainda não foi publicado
   */
  cancelScheduledPost(postId: string): boolean {
    return socialMediaOrchestrator.cancelScheduledPost(postId);
  }

  /**
   * Verifica o status de conexão com as APIs de redes sociais
   */
  async checkExternalAPIs(): Promise<Record<string, boolean>> {
    return await socialMediaOrchestrator.checkExternalAPIs();
  }

  /**
   * Obtém logs das operações de redes sociais
   */
  getLogs(count: number = 10): string[] {
    return socialMediaOrchestrator.getLogs().slice(-count);
  }

  /**
   * Obtém métricas resumidas de desempenho nas redes sociais
   */
  getMetricsSummary(): any {
    const posts = this.listPosts('completed');
    
    // Calcular métricas por plataforma
    const platformMetrics: Record<string, {
      totalPosts: number;
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
    }> = {};
    
    // Calcular métricas totais
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    
    for (const post of posts) {
      if (post.metrics) {
        for (const [platform, metrics] of Object.entries(post.metrics)) {
          if (!platformMetrics[platform]) {
            platformMetrics[platform] = {
              totalPosts: 0,
              totalViews: 0,
              totalLikes: 0,
              totalComments: 0,
              totalShares: 0
            };
          }
          
          platformMetrics[platform].totalPosts++;
          platformMetrics[platform].totalViews += metrics.views || 0;
          platformMetrics[platform].totalLikes += metrics.likes || 0;
          platformMetrics[platform].totalComments += metrics.comments || 0;
          platformMetrics[platform].totalShares += metrics.shares || 0;
          
          totalViews += metrics.views || 0;
          totalLikes += metrics.likes || 0;
          totalComments += metrics.comments || 0;
          totalShares += metrics.shares || 0;
        }
      }
    }
    
    return {
      platformMetrics,
      totalStats: {
        posts: posts.length,
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares
      },
      scheduledPosts: this.listPosts('scheduled').length,
      processingPosts: this.listPosts('processing').length,
      completedPosts: posts.length,
      failedPosts: this.listPosts('failed').length
    };
  }

  /**
   * Obtém status geral do sistema de redes sociais
   */
  async getSystemStatus(): Promise<any> {
    const apiStatus = await this.checkExternalAPIs();
    const logs = this.getLogs(10);
    
    return {
      apiStatus,
      logs,
      scheduledPosts: this.listPosts('scheduled').length,
      processingPosts: this.listPosts('processing').length,
      completedPosts: this.listPosts('completed').length,
      failedPosts: this.listPosts('failed').length
    };
  }
}

// Exportar instância singleton do módulo
export const socialMediaModule = new SocialMediaModule();