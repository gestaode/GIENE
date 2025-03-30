/**
 * Interface de API para o Módulo de Geração de Vídeo
 * 
 * Este arquivo define contratos claros para as operações de geração de vídeo,
 * permitindo que este módulo possa ser extraído como um microserviço independente.
 */

// Interfaces para requisições
export interface GenerateVideoRequest {
  title: string;
  script: string;
  options?: {
    voice?: string;
    voiceProvider?: 'google' | 'responsivevoice' | 'coqui' | 'auto';
    resolution?: '720p' | '1080p' | 'vertical';
    style?: 'professional' | 'casual' | 'dramatic';
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    outputFormat?: 'mp4' | 'webm';
    includeWatermark?: boolean;
  };
  backgroundImages?: string[];
  audioUrl?: string;
  useFallback?: boolean;
}

export interface CreateVideoFromImagesRequest {
  title: string;
  images: string[]; // URLs ou base64
  audio?: string; // URL ou base64
  duration?: number; // Duração total do vídeo em segundos
  options?: {
    resolution?: '720p' | '1080p' | 'vertical';
    outputFormat?: 'mp4' | 'webm';
    transitionEffect?: 'fade' | 'slide' | 'zoom' | 'none';
    includeBranding?: boolean;
  };
}

export interface AddAudioToVideoRequest {
  videoUrl: string;
  audioUrl: string;
  outputFormat?: 'mp4' | 'webm';
  startTime?: number; // Tempo de início em segundos
  fadeIn?: boolean;
  fadeOut?: boolean;
}

export interface VideoStatusRequest {
  videoId: string;
}

// Interfaces para respostas
export interface GenerateVideoResponse {
  videoId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedCompletionTime?: number; // Em segundos
  message?: string;
}

export interface VideoStatusResponse {
  videoId: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  startTime: string; // ISO date string
  endTime?: string; // ISO date string
  duration?: number; // Em segundos
  fileSize?: number; // Em bytes
}

export interface VideoListResponse {
  videos: {
    videoId: string;
    title: string;
    status: 'processing' | 'completed' | 'failed';
    thumbnailUrl?: string;
    createdAt: string; // ISO date string
    duration?: number; // Em segundos
  }[];
  total: number;
  page: number;
  pageSize: number;
}

// Interface de status do serviço
export interface VideoServiceStatusResponse {
  status: 'online' | 'degraded' | 'offline';
  ffmpegAvailable: boolean;
  processingCapacity: {
    availableSlots: number;
    totalSlots: number;
    queueSize: number;
  };
  storage: {
    available: boolean;
    totalStorageBytes: number;
    usedStorageBytes: number;
  };
  ttsProviders: {
    google: boolean;
    responsivevoice: boolean;
    coqui: boolean;
  };
  version: string;
}

// URLs de endpoints
export const VIDEO_API_ENDPOINTS = {
  generateVideo: '/api/video/generate',
  createFromImages: '/api/video/create-from-images',
  addAudioToVideo: '/api/video/add-audio',
  videoStatus: '/api/video/status',
  listVideos: '/api/video/list',
  testFfmpeg: '/api/video/test-ffmpeg',
  videoServiceStatus: '/api/video/service-status'
};