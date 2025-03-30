/**
 * Interface de API para o Módulo de Integração com Redes Sociais
 * 
 * Este arquivo define contratos claros para as operações de integração com redes sociais,
 * permitindo que este módulo possa ser extraído como um microserviço independente.
 */

// Interfaces para requisições
export interface SchedulePostRequest {
  videoPath: string;
  title: string;
  description: string;
  hashtags: string[];
  scheduledTime?: string; // ISO date string
  platforms: ('instagram' | 'tiktok' | 'facebook' | 'youtube' | 'twitter')[];
  options?: {
    priority?: 'high' | 'normal' | 'low';
    promotionBudget?: number;
    targetAudience?: string;
    includeAnalytics?: boolean;
    notifyOnPublish?: boolean;
    accessTokens?: Record<string, string>;
  };
}

export interface ListPostsRequest {
  status?: 'scheduled' | 'processing' | 'completed' | 'failed';
  platform?: string;
  page?: number;
  limit?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface GetPostStatusRequest {
  postId: string;
}

export interface CancelPostRequest {
  postId: string;
}

export interface UpdatePostRequest {
  postId: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  scheduledTime?: string; // ISO date string
  platforms?: string[];
}

// Interfaces para respostas
export interface SchedulePostResponse {
  postId: string;
  status: 'scheduled';
  scheduledTime?: string; // ISO date string
  platforms: string[];
  message: string;
}

export interface PostStatusResponse {
  postId: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
  title: string;
  description: string;
  hashtags: string[];
  scheduledTime?: string; // ISO date string
  publishedTime?: string; // ISO date string
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

export interface ListPostsResponse {
  posts: {
    postId: string;
    title: string;
    status: 'scheduled' | 'processing' | 'completed' | 'failed';
    scheduledTime?: string; // ISO date string
    publishedTime?: string; // ISO date string
    platforms: string[];
    thumbnailUrl?: string;
  }[];
  total: number;
  page: number;
  limit: number;
}

export interface CancelPostResponse {
  success: boolean;
  postId: string;
  message: string;
}

export interface UpdatePostResponse {
  success: boolean;
  postId: string;
  message: string;
}

// Interface de status do serviço
export interface SocialMediaServiceStatusResponse {
  status: 'online' | 'degraded' | 'offline';
  platformConnections: {
    instagram: boolean;
    tiktok: boolean;
    facebook: boolean;
    youtube: boolean;
    twitter: boolean;
  };
  queueStatus: {
    scheduledCount: number;
    processingCount: number;
    recentFailures: number;
  };
  apiLimits: {
    instagram?: {
      remaining: number;
      reset: string; // ISO date string
    };
    tiktok?: {
      remaining: number;
      reset: string; // ISO date string
    };
    facebook?: {
      remaining: number;
      reset: string; // ISO date string
    };
    youtube?: {
      remaining: number;
      reset: string; // ISO date string
    };
    twitter?: {
      remaining: number;
      reset: string; // ISO date string
    };
  };
  version: string;
}

// URLs de endpoints
export const SOCIAL_MEDIA_API_ENDPOINTS = {
  schedulePost: '/api/social-media/posts/schedule',
  listPosts: '/api/social-media/posts',
  getPostStatus: '/api/social-media/posts/status',
  cancelPost: '/api/social-media/posts/cancel',
  updatePost: '/api/social-media/posts/update',
  serviceStatus: '/api/social-media/status',
  platformAuth: '/api/social-media/auth'
};