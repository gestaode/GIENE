import { 
  users, type User, type InsertUser,
  apiSettings, type ApiSetting, type InsertApiSetting,
  videos, type Video, type InsertVideo,
  leads, type Lead, type InsertLead,
  analytics, type Analytics, type InsertAnalytics,
  formConfig, type FormConfig, type InsertFormConfig,
  emailCampaigns, type EmailCampaign, type InsertEmailCampaign,
  emailTemplates, type EmailTemplate, type InsertEmailTemplate,
  audienceSegments, type AudienceSegment, type InsertAudienceSegment,
  salesFunnels, type SalesFunnel, type InsertSalesFunnel,
  landingPages, type LandingPage, type InsertLandingPage,
  payments, type Payment, type InsertPayment,
  exportJobs, type ExportJob, type InsertExportJob,
  resilienceTests, type ResilienceTest, type InsertResilienceTest,
} from "@shared/schema";

// Interface for all CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // API settings methods
  getApiSettings(userId: number): Promise<ApiSetting[]>;
  getApiSettingByService(userId: number, service: string): Promise<ApiSetting | undefined>;
  createApiSetting(setting: InsertApiSetting): Promise<ApiSetting>;
  updateApiSetting(id: number, setting: Partial<InsertApiSetting>): Promise<ApiSetting>;
  
  // Video methods
  getVideos(userId: number): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video>;
  deleteVideo(id: number): Promise<boolean>;
  
  // Lead methods
  getLeads(userId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  // Analytics methods
  getVideoAnalytics(videoId: number): Promise<Analytics[]>;
  createOrUpdateAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  
  // Form config methods
  getFormConfig(userId: number): Promise<FormConfig | undefined>;
  createFormConfig(config: InsertFormConfig): Promise<FormConfig>;
  updateFormConfig(id: number, config: Partial<InsertFormConfig>): Promise<FormConfig>;
  
  // Email Campaign methods
  getEmailCampaigns(userId: number): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: number, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign>;
  deleteEmailCampaign(id: number): Promise<boolean>;
  
  // Email Template methods
  getEmailTemplates(userId: number): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  
  // Audience Segment methods
  getAudienceSegments(userId: number): Promise<AudienceSegment[]>;
  getAudienceSegment(id: number): Promise<AudienceSegment | undefined>;
  createAudienceSegment(segment: InsertAudienceSegment): Promise<AudienceSegment>;
  updateAudienceSegment(id: number, segment: Partial<InsertAudienceSegment>): Promise<AudienceSegment>;
  deleteAudienceSegment(id: number): Promise<boolean>;
  
  // Sales Funnel methods
  getSalesFunnels(userId: number): Promise<SalesFunnel[]>;
  getSalesFunnel(id: number): Promise<SalesFunnel | undefined>;
  createSalesFunnel(funnel: InsertSalesFunnel): Promise<SalesFunnel>;
  updateSalesFunnel(id: number, funnel: Partial<InsertSalesFunnel>): Promise<SalesFunnel>;
  deleteSalesFunnel(id: number): Promise<boolean>;
  
  // Landing Page methods
  getLandingPages(userId: number): Promise<LandingPage[]>;
  getLandingPage(id: number): Promise<LandingPage | undefined>;
  getLandingPageBySlug(slug: string): Promise<LandingPage | undefined>;
  createLandingPage(page: InsertLandingPage): Promise<LandingPage>;
  updateLandingPage(id: number, page: Partial<InsertLandingPage>): Promise<LandingPage>;
  deleteLandingPage(id: number): Promise<boolean>;
  incrementLandingPageViews(id: number): Promise<LandingPage>;
  incrementLandingPageConversions(id: number): Promise<LandingPage>;
  
  // Payment methods
  getPayments(userId: number): Promise<Payment[]>;
  getPaymentsByLead(leadId: number): Promise<Payment[]>;
  getPaymentsByFunnel(funnelId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  
  // Export Job methods
  getExportJobs(userId: number): Promise<ExportJob[]>;
  getExportJob(id: number): Promise<ExportJob | undefined>;
  createExportJob(job: InsertExportJob): Promise<ExportJob>;
  updateExportJob(id: number, job: Partial<InsertExportJob>): Promise<ExportJob>;
  
  // Resilience Test methods
  getResilienceTests(): Promise<ResilienceTest[]>;
  getResilienceTestsByService(service: string): Promise<ResilienceTest[]>;
  createResilienceTest(test: InsertResilienceTest): Promise<ResilienceTest>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private apiSettings: Map<number, ApiSetting>;
  private videos: Map<number, Video>;
  private leads: Map<number, Lead>;
  private analytics: Map<number, Analytics>;
  private formConfigs: Map<number, FormConfig>;
  private emailCampaigns: Map<number, EmailCampaign>;
  private emailTemplates: Map<number, EmailTemplate>;
  private audienceSegments: Map<number, AudienceSegment>;
  private salesFunnels: Map<number, SalesFunnel>;
  private landingPages: Map<number, LandingPage>;
  private payments: Map<number, Payment>;
  private exportJobs: Map<number, ExportJob>;
  private resilienceTests: Map<number, ResilienceTest>;
  
  private userCurrentId: number;
  private apiSettingCurrentId: number;
  private videoCurrentId: number;
  private leadCurrentId: number;
  private analyticsCurrentId: number;
  private formConfigCurrentId: number;
  private emailCampaignCurrentId: number;
  private emailTemplateCurrentId: number;
  private audienceSegmentCurrentId: number;
  private salesFunnelCurrentId: number;
  private landingPageCurrentId: number;
  private paymentCurrentId: number;
  private exportJobCurrentId: number;
  private resilienceTestCurrentId: number;

  constructor() {
    this.users = new Map();
    this.apiSettings = new Map();
    this.videos = new Map();
    this.leads = new Map();
    this.analytics = new Map();
    this.formConfigs = new Map();
    this.emailCampaigns = new Map();
    this.emailTemplates = new Map();
    this.audienceSegments = new Map();
    this.salesFunnels = new Map();
    this.landingPages = new Map();
    this.payments = new Map();
    this.exportJobs = new Map();
    this.resilienceTests = new Map();
    
    this.userCurrentId = 1;
    this.apiSettingCurrentId = 1;
    this.videoCurrentId = 1;
    this.leadCurrentId = 1;
    this.analyticsCurrentId = 1;
    this.formConfigCurrentId = 1;
    this.emailCampaignCurrentId = 1;
    this.emailTemplateCurrentId = 1;
    this.audienceSegmentCurrentId = 1;
    this.salesFunnelCurrentId = 1;
    this.landingPageCurrentId = 1;
    this.paymentCurrentId = 1;
    this.exportJobCurrentId = 1;
    this.resilienceTestCurrentId = 1;

    // Create a default user
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      name: "Demo User"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // API settings methods
  async getApiSettings(userId: number): Promise<ApiSetting[]> {
    return Array.from(this.apiSettings.values()).filter(
      (setting) => setting.userId === userId
    );
  }
  
  async getApiSettingByService(userId: number, service: string): Promise<ApiSetting | undefined> {
    return Array.from(this.apiSettings.values()).find(
      (setting) => setting.userId === userId && setting.service === service
    );
  }
  
  async createApiSetting(setting: InsertApiSetting): Promise<ApiSetting> {
    const id = this.apiSettingCurrentId++;
    const apiSetting: ApiSetting = { ...setting, id };
    this.apiSettings.set(id, apiSetting);
    return apiSetting;
  }
  
  async updateApiSetting(id: number, setting: Partial<InsertApiSetting>): Promise<ApiSetting> {
    const existing = this.apiSettings.get(id);
    if (!existing) {
      throw new Error(`API Setting with id ${id} not found`);
    }
    
    const updated = { ...existing, ...setting };
    this.apiSettings.set(id, updated);
    return updated;
  }
  
  // Video methods
  async getVideos(userId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }
  
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }
  
  async createVideo(video: InsertVideo): Promise<Video> {
    const id = this.videoCurrentId++;
    const createdAt = new Date();
    const newVideo: Video = { ...video, id, createdAt };
    this.videos.set(id, newVideo);
    return newVideo;
  }
  
  async updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video> {
    const existing = this.videos.get(id);
    if (!existing) {
      throw new Error(`Video with id ${id} not found`);
    }
    
    const updated = { ...existing, ...video };
    this.videos.set(id, updated);
    return updated;
  }
  
  async deleteVideo(id: number): Promise<boolean> {
    return this.videos.delete(id);
  }
  
  // Lead methods
  async getLeads(userId: number): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter(lead => lead.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.leadCurrentId++;
    const createdAt = new Date();
    const newLead: Lead = { ...lead, id, createdAt };
    this.leads.set(id, newLead);
    return newLead;
  }
  
  // Analytics methods
  async getVideoAnalytics(videoId: number): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(analytic => analytic.videoId === videoId);
  }
  
  async createOrUpdateAnalytics(analytic: InsertAnalytics): Promise<Analytics> {
    // Check if analytics already exist for this video and platform
    const existing = Array.from(this.analytics.values()).find(
      a => a.videoId === analytic.videoId && a.platform === analytic.platform
    );
    
    if (existing) {
      // Update existing analytics
      const updated: Analytics = {
        ...existing,
        views: analytic.views !== undefined ? analytic.views : existing.views,
        likes: analytic.likes !== undefined ? analytic.likes : existing.likes,
        comments: analytic.comments !== undefined ? analytic.comments : existing.comments,
        shares: analytic.shares !== undefined ? analytic.shares : existing.shares,
      };
      this.analytics.set(existing.id, updated);
      return updated;
    } else {
      // Create new analytics
      const id = this.analyticsCurrentId++;
      const date = new Date();
      const newAnalytic: Analytics = { ...analytic, id, date };
      this.analytics.set(id, newAnalytic);
      return newAnalytic;
    }
  }
  
  // Form config methods
  async getFormConfig(userId: number): Promise<FormConfig | undefined> {
    return Array.from(this.formConfigs.values()).find(
      config => config.userId === userId
    );
  }
  
  async createFormConfig(config: InsertFormConfig): Promise<FormConfig> {
    const id = this.formConfigCurrentId++;
    const formConfig: FormConfig = { ...config, id };
    this.formConfigs.set(id, formConfig);
    return formConfig;
  }
  
  async updateFormConfig(id: number, config: Partial<InsertFormConfig>): Promise<FormConfig> {
    const existing = this.formConfigs.get(id);
    if (!existing) {
      throw new Error(`Form config with id ${id} not found`);
    }
    
    const updated = { ...existing, ...config };
    this.formConfigs.set(id, updated);
    return updated;
  }

  // Email Campaign methods
  async getEmailCampaigns(userId: number): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values())
      .filter(campaign => campaign.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    return this.emailCampaigns.get(id);
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const id = this.emailCampaignCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newCampaign: EmailCampaign = { 
      ...campaign, 
      id, 
      createdAt, 
      updatedAt,
      sentAt: null,
      stats: null
    };
    this.emailCampaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateEmailCampaign(id: number, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign> {
    const existing = this.emailCampaigns.get(id);
    if (!existing) {
      throw new Error(`Email campaign with id ${id} not found`);
    }
    
    const updatedAt = new Date();
    const updated: EmailCampaign = { ...existing, ...campaign, updatedAt };
    this.emailCampaigns.set(id, updated);
    return updated;
  }

  async deleteEmailCampaign(id: number): Promise<boolean> {
    return this.emailCampaigns.delete(id);
  }

  // Email Template methods
  async getEmailTemplates(userId: number): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values())
      .filter(template => template.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.emailTemplateCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newTemplate: EmailTemplate = { ...template, id, createdAt, updatedAt };
    this.emailTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const existing = this.emailTemplates.get(id);
    if (!existing) {
      throw new Error(`Email template with id ${id} not found`);
    }
    
    const updatedAt = new Date();
    const updated: EmailTemplate = { ...existing, ...template, updatedAt };
    this.emailTemplates.set(id, updated);
    return updated;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }

  // Audience Segment methods
  async getAudienceSegments(userId: number): Promise<AudienceSegment[]> {
    return Array.from(this.audienceSegments.values())
      .filter(segment => segment.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getAudienceSegment(id: number): Promise<AudienceSegment | undefined> {
    return this.audienceSegments.get(id);
  }

  async createAudienceSegment(segment: InsertAudienceSegment): Promise<AudienceSegment> {
    const id = this.audienceSegmentCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newSegment: AudienceSegment = { ...segment, id, createdAt, updatedAt };
    this.audienceSegments.set(id, newSegment);
    return newSegment;
  }

  async updateAudienceSegment(id: number, segment: Partial<InsertAudienceSegment>): Promise<AudienceSegment> {
    const existing = this.audienceSegments.get(id);
    if (!existing) {
      throw new Error(`Audience segment with id ${id} not found`);
    }
    
    const updatedAt = new Date();
    const updated: AudienceSegment = { ...existing, ...segment, updatedAt };
    this.audienceSegments.set(id, updated);
    return updated;
  }

  async deleteAudienceSegment(id: number): Promise<boolean> {
    return this.audienceSegments.delete(id);
  }

  // Sales Funnel methods
  async getSalesFunnels(userId: number): Promise<SalesFunnel[]> {
    return Array.from(this.salesFunnels.values())
      .filter(funnel => funnel.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getSalesFunnel(id: number): Promise<SalesFunnel | undefined> {
    return this.salesFunnels.get(id);
  }

  async createSalesFunnel(funnel: InsertSalesFunnel): Promise<SalesFunnel> {
    const id = this.salesFunnelCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newFunnel: SalesFunnel = { 
      ...funnel, 
      id, 
      createdAt, 
      updatedAt,
      conversionRate: "0",
      revenue: "0"
    };
    this.salesFunnels.set(id, newFunnel);
    return newFunnel;
  }

  async updateSalesFunnel(id: number, funnel: Partial<InsertSalesFunnel>): Promise<SalesFunnel> {
    const existing = this.salesFunnels.get(id);
    if (!existing) {
      throw new Error(`Sales funnel with id ${id} not found`);
    }
    
    const updatedAt = new Date();
    const updated: SalesFunnel = { ...existing, ...funnel, updatedAt };
    this.salesFunnels.set(id, updated);
    return updated;
  }

  async deleteSalesFunnel(id: number): Promise<boolean> {
    return this.salesFunnels.delete(id);
  }

  // Landing Page methods
  async getLandingPages(userId: number): Promise<LandingPage[]> {
    return Array.from(this.landingPages.values())
      .filter(page => page.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getLandingPage(id: number): Promise<LandingPage | undefined> {
    return this.landingPages.get(id);
  }

  async getLandingPageBySlug(slug: string): Promise<LandingPage | undefined> {
    return Array.from(this.landingPages.values())
      .find(page => page.slug === slug);
  }

  async createLandingPage(page: InsertLandingPage): Promise<LandingPage> {
    const id = this.landingPageCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newPage: LandingPage = { 
      ...page, 
      id, 
      createdAt, 
      updatedAt,
      views: 0,
      conversions: 0
    };
    this.landingPages.set(id, newPage);
    return newPage;
  }

  async updateLandingPage(id: number, page: Partial<InsertLandingPage>): Promise<LandingPage> {
    const existing = this.landingPages.get(id);
    if (!existing) {
      throw new Error(`Landing page with id ${id} not found`);
    }
    
    const updatedAt = new Date();
    const updated: LandingPage = { ...existing, ...page, updatedAt };
    this.landingPages.set(id, updated);
    return updated;
  }

  async deleteLandingPage(id: number): Promise<boolean> {
    return this.landingPages.delete(id);
  }

  async incrementLandingPageViews(id: number): Promise<LandingPage> {
    const page = this.landingPages.get(id);
    if (!page) {
      throw new Error(`Landing page with id ${id} not found`);
    }
    
    const updated: LandingPage = { ...page, views: page.views + 1 };
    this.landingPages.set(id, updated);
    return updated;
  }

  async incrementLandingPageConversions(id: number): Promise<LandingPage> {
    const page = this.landingPages.get(id);
    if (!page) {
      throw new Error(`Landing page with id ${id} not found`);
    }
    
    const updated: LandingPage = { ...page, conversions: page.conversions + 1 };
    this.landingPages.set(id, updated);
    return updated;
  }

  // Payment methods
  async getPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getPaymentsByLead(leadId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.leadId === leadId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getPaymentsByFunnel(funnelId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.funnelId === funnelId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newPayment: Payment = { ...payment, id, createdAt, updatedAt };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const existing = this.payments.get(id);
    if (!existing) {
      throw new Error(`Payment with id ${id} not found`);
    }
    
    const updatedAt = new Date();
    const updated: Payment = { ...existing, ...payment, updatedAt };
    this.payments.set(id, updated);
    return updated;
  }

  // Export Job methods
  async getExportJobs(userId: number): Promise<ExportJob[]> {
    return Array.from(this.exportJobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => {
        // Sort by created date descending (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getExportJob(id: number): Promise<ExportJob | undefined> {
    return this.exportJobs.get(id);
  }

  async createExportJob(job: InsertExportJob): Promise<ExportJob> {
    const id = this.exportJobCurrentId++;
    const createdAt = new Date();
    const newJob: ExportJob = { 
      ...job, 
      id, 
      createdAt,
      completedAt: null,
      error: null
    };
    this.exportJobs.set(id, newJob);
    return newJob;
  }

  async updateExportJob(id: number, job: Partial<InsertExportJob>): Promise<ExportJob> {
    const existing = this.exportJobs.get(id);
    if (!existing) {
      throw new Error(`Export job with id ${id} not found`);
    }
    
    const updated: ExportJob = { ...existing, ...job };
    this.exportJobs.set(id, updated);
    return updated;
  }

  // Resilience Test methods
  async getResilienceTests(): Promise<ResilienceTest[]> {
    return Array.from(this.resilienceTests.values())
      .sort((a, b) => {
        // Sort by date descending (newest first)
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getResilienceTestsByService(service: string): Promise<ResilienceTest[]> {
    return Array.from(this.resilienceTests.values())
      .filter(test => test.service === service)
      .sort((a, b) => {
        // Sort by date descending (newest first)
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createResilienceTest(test: InsertResilienceTest): Promise<ResilienceTest> {
    const id = this.resilienceTestCurrentId++;
    const date = new Date();
    const newTest: ResilienceTest = { ...test, id, date };
    this.resilienceTests.set(id, newTest);
    return newTest;
  }
}

export const storage = new MemStorage();
