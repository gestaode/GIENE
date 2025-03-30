/**
 * Interface de API para o Módulo de Automação de Vendas
 * 
 * Este arquivo define contratos claros para as operações de automação de vendas,
 * funil de vendas, segmentação e gestão de leads, permitindo que este módulo 
 * possa ser extraído como um microserviço independente.
 */

// Interfaces para requisições
export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  segmentId?: string;
  funnelId?: string;
  consent?: boolean;
}

export interface AddToSegmentRequest {
  leadIds: string[];
  segmentId: string;
}

export interface CreateSegmentRequest {
  name: string;
  description?: string;
  criteria?: {
    tags?: string[];
    source?: string[];
    funnelStage?: string;
    customFields?: Record<string, any>;
    joinCondition?: 'AND' | 'OR';
  };
}

export interface CreateEmailCampaignRequest {
  name: string;
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  segmentId?: string;
  scheduledTime?: string; // ISO date string
  testEmails?: string[];
}

export interface SendTestEmailRequest {
  campaignId: string;
  testEmails: string[];
}

export interface CreateFunnelRequest {
  name: string;
  description?: string;
  steps: {
    id: string;
    name: string;
    type: 'email' | 'landing' | 'video' | 'checkout' | 'custom';
    content?: any;
    delay?: number; // Em horas
    conditions?: {
      field: string;
      operator: '=' | '!=' | '>' | '<' | 'contains' | 'not_contains';
      value: any;
    }[];
  }[];
}

// Interfaces para respostas
export interface CreateLeadResponse {
  leadId: string;
  status: 'success' | 'duplicate' | 'error';
  message?: string;
}

export interface AddToSegmentResponse {
  success: boolean;
  segmentId: string;
  addedCount: number;
  failedCount: number;
  failedLeadIds?: string[];
}

export interface CreateSegmentResponse {
  segmentId: string;
  name: string;
  estimatedSize: number;
}

export interface CreateEmailCampaignResponse {
  campaignId: string;
  status: 'draft' | 'scheduled';
  scheduledTime?: string; // ISO date string
  recipientCount?: number;
}

export interface SendTestEmailResponse {
  success: boolean;
  message: string;
  sentTo: string[];
}

export interface CreateFunnelResponse {
  funnelId: string;
  name: string;
  status: 'active' | 'draft';
  stepCount: number;
}

export interface LeadListResponse {
  leads: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    source?: string;
    tags?: string[];
    segments?: {
      id: string;
      name: string;
    }[];
    funnelStage?: {
      funnelId: string;
      funnelName: string;
      currentStep: string;
    };
    createdAt: string; // ISO date string
    lastActivity?: string; // ISO date string
  }[];
  total: number;
  page: number;
  limit: number;
}

export interface SegmentListResponse {
  segments: {
    id: string;
    name: string;
    description?: string;
    leadCount: number;
    createdAt: string; // ISO date string
  }[];
  total: number;
}

export interface FunnelListResponse {
  funnels: {
    id: string;
    name: string;
    description?: string;
    stepCount: number;
    activeLeads: number;
    completedLeads: number;
    conversionRate: number;
    revenue: number;
    status: 'active' | 'draft' | 'paused';
    createdAt: string; // ISO date string
  }[];
  total: number;
}

export interface EmailCampaignListResponse {
  campaigns: {
    id: string;
    name: string;
    subject: string;
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    scheduledTime?: string; // ISO date string
    sentTime?: string; // ISO date string
    recipientCount: number;
    openRate?: number;
    clickRate?: number;
  }[];
  total: number;
}

// Interface de status do serviço
export interface SalesAutomationStatusResponse {
  status: 'online' | 'degraded' | 'offline';
  components: {
    database: boolean;
    emailService: boolean;
    automationEngine: boolean;
    paymentProcessing: boolean;
  };
  metrics: {
    activeLeads: number;
    activeFunnels: number;
    emailsSentToday: number;
    totalRevenue: number;
  };
  queueStatus: {
    emailsInQueue: number;
    automationsInQueue: number;
  };
  version: string;
}

// URLs de endpoints
export const SALES_AUTOMATION_API_ENDPOINTS = {
  // Leads
  createLead: '/api/sales/leads',
  getLeads: '/api/sales/leads',
  getLead: '/api/sales/leads/{id}',
  updateLead: '/api/sales/leads/{id}',
  deleteLead: '/api/sales/leads/{id}',
  
  // Segments
  createSegment: '/api/sales/segments',
  getSegments: '/api/sales/segments',
  getSegment: '/api/sales/segments/{id}',
  updateSegment: '/api/sales/segments/{id}',
  deleteSegment: '/api/sales/segments/{id}',
  addToSegment: '/api/sales/segments/{id}/add',
  
  // Email Campaigns
  createEmailCampaign: '/api/sales/campaigns',
  getEmailCampaigns: '/api/sales/campaigns',
  getEmailCampaign: '/api/sales/campaigns/{id}',
  updateEmailCampaign: '/api/sales/campaigns/{id}',
  deleteEmailCampaign: '/api/sales/campaigns/{id}',
  sendTestEmail: '/api/sales/campaigns/{id}/test',
  
  // Funnels
  createFunnel: '/api/sales/funnels',
  getFunnels: '/api/sales/funnels',
  getFunnel: '/api/sales/funnels/{id}',
  updateFunnel: '/api/sales/funnels/{id}',
  deleteFunnel: '/api/sales/funnels/{id}',
  
  // Status
  serviceStatus: '/api/sales/status'
};