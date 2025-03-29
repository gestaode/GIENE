import { 
  users, type User, type InsertUser,
  apiSettings, type ApiSetting, type InsertApiSetting,
  videos, type Video, type InsertVideo,
  leads, type Lead, type InsertLead,
  analytics, type Analytics, type InsertAnalytics,
  formConfig, type FormConfig, type InsertFormConfig,
} from "@shared/schema";

// Interface for all CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private apiSettings: Map<number, ApiSetting>;
  private videos: Map<number, Video>;
  private leads: Map<number, Lead>;
  private analytics: Map<number, Analytics>;
  private formConfigs: Map<number, FormConfig>;
  
  private userCurrentId: number;
  private apiSettingCurrentId: number;
  private videoCurrentId: number;
  private leadCurrentId: number;
  private analyticsCurrentId: number;
  private formConfigCurrentId: number;

  constructor() {
    this.users = new Map();
    this.apiSettings = new Map();
    this.videos = new Map();
    this.leads = new Map();
    this.analytics = new Map();
    this.formConfigs = new Map();
    
    this.userCurrentId = 1;
    this.apiSettingCurrentId = 1;
    this.videoCurrentId = 1;
    this.leadCurrentId = 1;
    this.analyticsCurrentId = 1;
    this.formConfigCurrentId = 1;

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
}

export const storage = new MemStorage();
