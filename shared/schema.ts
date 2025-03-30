import { pgTable, text, serial, integer, boolean, timestamp, json, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name"),
});

export const apiSettings = pgTable("api_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  service: text("service").notNull(), // pexels, google_tts, openai, tiktok, instagram
  apiKey: text("api_key").notNull(),
  isActive: boolean("is_active").default(true),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, processing, ready, published
  theme: text("theme").notNull(),
  tags: text("tags").array().notNull(),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  platform: text("platform").array(), // tiktok, instagram
  scriptContent: text("script_content"),
  mediaRefs: text("media_refs").array(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  interest: text("interest"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  platform: text("platform").notNull(), // tiktok, instagram
  date: timestamp("date").defaultNow(),
});

export const formConfig = pgTable("form_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fields: json("fields").notNull(),
  styles: json("styles"),
  isActive: boolean("is_active").default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export const insertApiSettingSchema = createInsertSchema(apiSettings).pick({
  userId: true,
  service: true,
  apiKey: true,
  isActive: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  userId: true,
  title: true,
  description: true,
  status: true,
  theme: true,
  tags: true,
  thumbnailUrl: true,
  videoUrl: true,
  scheduledAt: true,
  platform: true,
  scriptContent: true,
  mediaRefs: true,
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  userId: true,
  name: true,
  email: true,
  phone: true,
  interest: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  videoId: true,
  views: true,
  likes: true,
  comments: true,
  shares: true,
  platform: true,
});

export const insertFormConfigSchema = createInsertSchema(formConfig).pick({
  userId: true,
  title: true,
  description: true,
  fields: true,
  styles: true,
  isActive: true,
});

// Types for use in application
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertApiSetting = z.infer<typeof insertApiSettingSchema>;
export type ApiSetting = typeof apiSettings.$inferSelect;

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

export type InsertFormConfig = z.infer<typeof insertFormConfigSchema>;
export type FormConfig = typeof formConfig.$inferSelect;

// Voice schema
export const voices = pgTable("voices", {
  id: serial("id").primaryKey(),
  voiceId: text("voice_id").notNull().unique(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  samples: text("samples").array(),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVoiceSchema = createInsertSchema(voices);
export type InsertVoice = z.infer<typeof insertVoiceSchema>;
export type Voice = typeof voices.$inferSelect;

// Email Marketing Schema
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  status: text("status").notNull().default("draft"), // draft, scheduled, sending, sent, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  segmentId: integer("segment_id"), // Link to audience segment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  stats: json("stats"), // open_rate, click_rate, etc.
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(), // welcome, follow-up, promotion, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const audienceSegments = pgTable("audience_segments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: json("criteria").notNull(), // JSON with filter criteria
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales Funnel Schema
export const salesFunnels = pgTable("sales_funnels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, paused, archived
  steps: json("steps").notNull(), // JSON with funnel steps
  conversionRate: decimal("conversion_rate").default("0"),
  revenue: decimal("revenue").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const landingPages = pgTable("landing_pages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  funnelId: integer("funnel_id"),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: json("content").notNull(), // JSON with page content
  styles: json("styles"), // JSON with custom CSS
  settings: json("settings"), // JSON with page settings
  status: text("status").notNull().default("draft"), // draft, published, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  views: integer("views").default(0),
  conversions: integer("conversions").default(0),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  leadId: integer("lead_id").notNull(),
  funnelId: integer("funnel_id"),
  amount: decimal("amount").notNull(),
  currency: text("currency").notNull().default("BRL"),
  status: text("status").notNull(), // pending, completed, failed, refunded
  provider: text("provider").notNull(), // stripe, paypal, mercadopago, etc.
  providerPaymentId: text("provider_payment_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Export Schema
export const exportJobs = pgTable("export_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // code, data, videos, etc.
  format: text("format").notNull(), // csv, zip, json, etc.
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
});

// Test Results Schema
export const resilienceTests = pgTable("resilience_tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  service: text("service").notNull(), // AI, video, TTS, social, etc.
  functionTested: text("function_tested").notNull(),
  result: text("result").notNull(), // passed, failed, partial
  fallbackUsed: boolean("fallback_used").default(false),
  fallbackService: text("fallback_service"),
  responseTime: integer("response_time"), // in ms
  errorMessage: text("error_message"),
  date: timestamp("date").defaultNow(),
});

// Insert schemas for new tables
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).pick({
  userId: true,
  name: true,
  subject: true,
  body: true,
  fromEmail: true,
  fromName: true,
  status: true,
  scheduledAt: true,
  segmentId: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).pick({
  userId: true,
  name: true,
  subject: true,
  body: true,
  category: true,
});

export const insertAudienceSegmentSchema = createInsertSchema(audienceSegments).pick({
  userId: true,
  name: true,
  description: true,
  criteria: true,
});

export const insertSalesFunnelSchema = createInsertSchema(salesFunnels).pick({
  userId: true,
  name: true,
  description: true,
  status: true,
  steps: true,
});

export const insertLandingPageSchema = createInsertSchema(landingPages).pick({
  userId: true,
  funnelId: true,
  title: true,
  slug: true,
  content: true,
  styles: true,
  settings: true,
  status: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  leadId: true,
  funnelId: true,
  amount: true,
  currency: true,
  status: true,
  provider: true,
  providerPaymentId: true,
});

export const insertExportJobSchema = createInsertSchema(exportJobs).pick({
  userId: true,
  type: true,
  format: true,
  status: true,
  filePath: true,
  fileSize: true,
});

export const insertResilienceTestSchema = createInsertSchema(resilienceTests).pick({
  name: true,
  service: true,
  functionTested: true,
  result: true,
  fallbackUsed: true,
  fallbackService: true,
  responseTime: true,
  errorMessage: true,
});

// Types for new schemas
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertAudienceSegment = z.infer<typeof insertAudienceSegmentSchema>;
export type AudienceSegment = typeof audienceSegments.$inferSelect;

export type InsertSalesFunnel = z.infer<typeof insertSalesFunnelSchema>;
export type SalesFunnel = typeof salesFunnels.$inferSelect;

export type InsertLandingPage = z.infer<typeof insertLandingPageSchema>;
export type LandingPage = typeof landingPages.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertExportJob = z.infer<typeof insertExportJobSchema>;
export type ExportJob = typeof exportJobs.$inferSelect;

export type InsertResilienceTest = z.infer<typeof insertResilienceTestSchema>;
export type ResilienceTest = typeof resilienceTests.$inferSelect;
