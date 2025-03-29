import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
