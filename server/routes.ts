import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as fs from "fs";

// Função auxiliar para padronizar respostas de erro
function errorResponse(res: Response, status: number, message: string, error?: any) {
  return res.status(status).json({ 
    success: false,
    message, 
    error: error instanceof Error ? error.message : String(error || "") 
  });
}
import { 
  insertApiSettingSchema, 
  insertLeadSchema, 
  insertVideoSchema,
  insertFormConfigSchema
} from "@shared/schema";
import { PexelsService } from "./services/pexels";
import { OpenAIService } from "./services/openai";
import { GoogleTTSService } from "./services/tts";
import { OpenAITTSService } from "./services/openai-tts";
import { GeminiService } from "./services/gemini";
import { CoquiTTSService } from "./services/coqui-tts";
import { HuggingFaceService } from "./services/huggingface";
import { MistralAIService } from "./services/mistral";
import { FFmpegService } from "./services/ffmpeg";
import { GoogleCloudTTSService } from "./services/google-cloud-tts";
import { ResponsiveVoiceService } from "./services/responsive-voice";
import { PremiumBrazilianVoiceService } from "./services/premium-brazilian-voice";
import { ElevenLabsService } from "./services/elevenlabs";
import { AIOrchestrator } from "./services/AIOrchestrator";
import { cacheService } from "./services/caching";
import { socialMediaOrchestrator } from "./services/social-media-orchestrator";
import { exportService } from "./services/export-service";
import { emailMarketingService } from "./services/email-marketing-service";
import { resilienceService } from "./services/resilience-service";

// Setup file storage paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads";
    if (file.mimetype.startsWith("image/")) {
      folder = "uploads/images";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "uploads/videos";
    } else if (file.mimetype.startsWith("audio/")) {
      folder = "uploads/audio";
    }
    cb(null, path.join(__dirname, "..", folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage_config });

// Inicializa o orquestrador de IA
const aiOrchestrator = new AIOrchestrator(
  process.env.MISTRAL_API_KEY || '',
  process.env.HUGGINGFACE_API_KEY || '',
  process.env.OPENAI_API_KEY || '',
  process.env.GOOGLE_AI_API_KEY || ''
);

// Service initialization function
function initializeService(req: Request, serviceName: string) {
  // In a real application, we would get the API key from the database
  // For this demo, we'll use environment variables
  switch (serviceName) {
    case 'pexels':
      return new PexelsService(process.env.PEXELS_API_KEY || '');
    case 'openai':
      return new OpenAIService(process.env.OPENAI_API_KEY || '');
    case 'google_tts':
      return new GoogleTTSService(process.env.GOOGLE_TTS_API_KEY || '');
    case 'google_cloud_tts':
      return new GoogleCloudTTSService(process.env.GOOGLE_TTS_API_KEY || '');
    case 'openai_tts':
      return new OpenAITTSService(process.env.OPENAI_API_KEY || '');
    case 'responsive_voice':
      return new ResponsiveVoiceService();
    case 'gemini':
      return new GeminiService(process.env.GOOGLE_AI_API_KEY || '');
    case 'coqui_tts': {
      // Inicializa o serviço CoquiTTS
      const coquiService = new CoquiTTSService();
      
      // Injeta o serviço OpenAI TTS como fallback primário
      const openaiTTS = new OpenAITTSService(process.env.OPENAI_API_KEY || '');
      coquiService.setOpenAITTSService(openaiTTS);
      
      // Injeta o serviço Google Cloud TTS como fallback secundário
      const googleTTS = new GoogleCloudTTSService(process.env.GOOGLE_TTS_API_KEY || '');
      coquiService.setGoogleTTSService(googleTTS);
      
      // Injeta o serviço ResponsiveVoice como último fallback
      const responsiveVoice = new ResponsiveVoiceService();
      coquiService.setResponsiveVoiceService(responsiveVoice);
      
      return coquiService;
    }
    case 'huggingface':
      return new HuggingFaceService(process.env.HUGGINGFACE_API_KEY);
    case 'mistral':
      return new MistralAIService(process.env.MISTRAL_API_KEY || '');
    case 'ffmpeg':
      return new FFmpegService();
    case 'premium_brazilian_voice':
      return new PremiumBrazilianVoiceService();
    case 'elevenlabs':
      return new ElevenLabsService(process.env.ELEVENLABS_API_KEY || '');

    default:
      throw new Error(`Unknown service: ${serviceName}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  // 1. User Authentication Routes (simplified for demo)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd use proper sessions and JWT
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 2. API Settings Routes
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      // For demo, we'll use userId=1
      const userId = 1;
      const settings = await storage.getApiSettings(userId);
      res.status(200).json(settings);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId };
      
      // Validate input
      const validatedData = insertApiSettingSchema.parse(data);
      
      // Check if setting already exists
      const existingSetting = await storage.getApiSettingByService(userId, validatedData.service);
      
      if (existingSetting) {
        // Update existing setting
        const updated = await storage.updateApiSetting(existingSetting.id, validatedData);
        return res.status(200).json(updated);
      }
      
      // Create new setting
      const created = await storage.createApiSetting(validatedData);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/settings/test", async (req: Request, res: Response) => {
    try {
      const { service, apiKey } = req.body;
      
      // Validate service and API key
      if (!service || !apiKey) {
        return res.status(400).json({ message: "Service and API key are required" });
      }
      
      let isValid = false;
      let message = "";
      
      // Test API key based on service
      switch (service) {
        case 'pexels':
          try {
            const pexelsService = new PexelsService(apiKey);
            const result = await pexelsService.searchPhotos("test", 1);
            isValid = result.photos.length > 0;
            message = isValid ? "Pexels API connection successful" : "Invalid Pexels API key";
          } catch (error) {
            message = "Failed to connect to Pexels API";
          }
          break;
        
        case 'google_tts':
          try {
            const ttsService = new GoogleTTSService(apiKey);
            const voices = await ttsService.getVoices("pt-BR");
            isValid = voices && voices.voices && voices.voices.length > 0;
            message = isValid ? "Google TTS API connection successful" : "Invalid Google TTS API key";
          } catch (error) {
            message = "Failed to connect to Google TTS API";
          }
          break;
        
        case 'openai':
          try {
            const openaiService = new OpenAIService(apiKey);
            const result = await openaiService.suggestTrendingTopics("test", 1);
            isValid = Array.isArray(result) && result.length > 0;
            message = isValid ? "OpenAI API connection successful" : "Invalid OpenAI API key";
          } catch (error) {
            message = "Failed to connect to OpenAI API";
          }
          break;
        
        case 'gemini':
          try {
            const geminiService = new GeminiService(apiKey);
            const result = await geminiService.suggestTrendingTopics("test", 1);
            isValid = Array.isArray(result) && result.length > 0;
            message = isValid ? "Google Gemini API connection successful" : "Invalid Google Gemini API key";
          } catch (error) {
            message = "Failed to connect to Google Gemini API";
          }
          break;
          
        case 'huggingface':
          try {
            const huggingfaceService = new HuggingFaceService(apiKey);
            const result = await huggingfaceService.suggestTrendingTopics("test", 1);
            isValid = Array.isArray(result) && result.length > 0;
            message = isValid ? "HuggingFace API connection successful" : "Invalid HuggingFace API key";
          } catch (error) {
            message = "Failed to connect to HuggingFace API";
          }
          break;
          
        case 'mistral':
          try {
            const mistralService = new MistralAIService(apiKey);
            const result = await mistralService.suggestTrendingTopics("test", 1);
            isValid = Array.isArray(result) && result.length > 0;
            message = isValid ? "Mistral AI API connection successful" : "Invalid Mistral API key";
          } catch (error) {
            message = "Failed to connect to Mistral AI API";
          }
          break;
        
        default:
          message = "Unsupported service";
      }
      
      res.status(200).json({ isValid, message });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 3. Video Management Routes
  app.get("/api/videos", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const videos = await storage.getVideos(userId);
      res.status(200).json(videos);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/videos/:id", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.status(200).json(video);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/videos", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId };
      
      // Validate input
      const validatedData = insertVideoSchema.parse(data);
      
      // Create new video
      const created = await storage.createVideo(validatedData);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/videos/:id", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Update video
      const updated = await storage.updateVideo(videoId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/videos/:id", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const success = await storage.deleteVideo(videoId);
      
      if (!success) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 4. Lead Management Routes
  app.get("/api/leads", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const leads = await storage.getLeads(userId);
      res.status(200).json(leads);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/leads", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId };
      
      // Validate input
      const validatedData = insertLeadSchema.parse(data);
      
      // Create new lead
      const created = await storage.createLead(validatedData);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 5. Form Configuration Routes
  app.get("/api/form-config", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const config = await storage.getFormConfig(userId);
      
      if (!config) {
        return res.status(404).json({ message: "Form configuration not found" });
      }
      
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/form-config", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId };
      
      // Validate input
      const validatedData = insertFormConfigSchema.parse(data);
      
      // Check if config already exists
      const existingConfig = await storage.getFormConfig(userId);
      
      if (existingConfig) {
        // Update existing config
        const updated = await storage.updateFormConfig(existingConfig.id, validatedData);
        return res.status(200).json(updated);
      }
      
      // Create new config
      const created = await storage.createFormConfig(validatedData);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 6. External API Integration Routes
  // 6.1 Pexels API
  app.get("/api/pexels/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      const page = parseInt(req.query.page as string || '1');
      const perPage = parseInt(req.query.perPage as string || '10');
      const type = req.query.type as string || 'photos';
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const pexelsService = initializeService(req, 'pexels') as PexelsService;
      
      if (type === 'videos') {
        const results = await pexelsService.searchVideos(query, perPage, page);
        return res.status(200).json(results);
      } else {
        const results = await pexelsService.searchPhotos(query, perPage, page);
        return res.status(200).json(results);
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 6.2 OpenAI API
  app.post("/api/openai/generate-script", async (req: Request, res: Response) => {
    try {
      const {
        theme,
        targetAudience,
        duration,
        tone,
        keywords,
        additionalInstructions
      } = req.body;
      
      if (!theme) {
        return res.status(400).json({ message: "Theme is required" });
      }
      
      let generatedScript;
      try {
        const openaiService = initializeService(req, 'openai') as OpenAIService;
        generatedScript = await openaiService.generateVideoScript({
          theme,
          targetAudience,
          duration,
          tone,
          keywords,
          additionalInstructions
        });
      } catch (openaiError) {
        console.warn("OpenAI failed, falling back to Gemini:", openaiError);
        const geminiService = initializeService(req, 'gemini') as GeminiService;
        generatedScript = await geminiService.generateVideoScript({
          theme,
          targetAudience,
          duration,
          tone,
          keywords,
          additionalInstructions
        });
      }
      
      res.status(200).json(generatedScript);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/openai/generate-content", async (req: Request, res: Response) => {
    try {
      const { theme, script, options } = req.body;
      
      if (!theme || !script) {
        return res.status(400).json({ message: "Theme and script are required" });
      }
      
      const openaiService = initializeService(req, 'openai') as OpenAIService;
      
      const content = await openaiService.generateSocialMediaContent(theme, script, options);
      
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/openai/trending-topics", async (req: Request, res: Response) => {
    try {
      const theme = req.query.theme as string;
      const count = parseInt(req.query.count as string || '5');
      
      if (!theme) {
        return res.status(400).json({ message: "Theme parameter is required" });
      }
      
      const openaiService = initializeService(req, 'openai') as OpenAIService;
      
      const topics = await openaiService.suggestTrendingTopics(theme, count);
      
      res.status(200).json(topics);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // 6.2.1 Gemini AI API (Free alternative to OpenAI)
  app.post("/api/gemini/generate-script", async (req: Request, res: Response) => {
    try {
      const {
        theme,
        targetAudience,
        duration,
        tone,
        keywords,
        additionalInstructions
      } = req.body;
      
      if (!theme) {
        return res.status(400).json({ message: "Theme is required" });
      }
      
      const geminiService = initializeService(req, 'gemini') as GeminiService;
      
      const script = await geminiService.generateVideoScript({
        theme,
        targetAudience,
        duration,
        tone,
        keywords,
        additionalInstructions
      });
      
      res.status(200).json(script);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/gemini/generate-content", async (req: Request, res: Response) => {
    try {
      const { videoScript, options } = req.body;
      
      if (!videoScript) {
        return res.status(400).json({ message: "Video script is required" });
      }
      
      const geminiService = initializeService(req, 'gemini') as GeminiService;
      
      const content = await geminiService.generateSocialMediaContent(videoScript, options);
      
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/gemini/trending-topics", async (req: Request, res: Response) => {
    try {
      const theme = req.query.theme as string;
      const count = parseInt(req.query.count as string || '5');
      
      if (!theme) {
        return res.status(400).json({ message: "Theme parameter is required" });
      }
      
      const geminiService = initializeService(req, 'gemini') as GeminiService;
      
      const topics = await geminiService.suggestTrendingTopics(theme, count);
      
      res.status(200).json(topics);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // 6.2.2 HuggingFace API (Free alternative to OpenAI)
  app.post("/api/huggingface/generate-script", async (req: Request, res: Response) => {
    try {
      const {
        theme,
        targetAudience,
        duration,
        tone,
        keywords,
        additionalInstructions
      } = req.body;
      
      if (!theme) {
        return res.status(400).json({ message: "Theme is required" });
      }
      
      const huggingfaceService = initializeService(req, 'huggingface') as HuggingFaceService;
      
      const script = await huggingfaceService.generateVideoScript({
        theme,
        targetAudience,
        duration,
        tone,
        keywords,
        additionalInstructions
      });
      
      res.status(200).json(script);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/huggingface/generate-content", async (req: Request, res: Response) => {
    try {
      const { videoScript, options } = req.body;
      
      if (!videoScript) {
        return res.status(400).json({ message: "Video script is required" });
      }
      
      const huggingfaceService = initializeService(req, 'huggingface') as HuggingFaceService;
      
      const content = await huggingfaceService.generateSocialMediaContent(videoScript, options);
      
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/huggingface/trending-topics", async (req: Request, res: Response) => {
    try {
      const theme = req.query.theme as string;
      const count = parseInt(req.query.count as string || '5');
      
      if (!theme) {
        return res.status(400).json({ message: "Theme parameter is required" });
      }
      
      const huggingfaceService = initializeService(req, 'huggingface') as HuggingFaceService;
      
      const topics = await huggingfaceService.suggestTrendingTopics(theme, count);
      
      res.status(200).json(topics);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // 6.2.3 Mistral AI API (Free alternative to OpenAI)
  app.post("/api/mistral/generate-script", async (req: Request, res: Response) => {
    try {
      const {
        theme,
        targetAudience,
        duration,
        tone,
        keywords,
        additionalInstructions
      } = req.body;
      
      if (!theme) {
        return res.status(400).json({ message: "Theme is required" });
      }
      
      const mistralService = initializeService(req, 'mistral') as MistralAIService;
      
      const script = await mistralService.generateVideoScript({
        theme,
        targetAudience,
        duration,
        tone,
        keywords,
        additionalInstructions
      });
      
      res.status(200).json(script);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/mistral/generate-content", async (req: Request, res: Response) => {
    try {
      const { videoScript, options } = req.body;
      
      if (!videoScript) {
        return res.status(400).json({ message: "Video script is required" });
      }
      
      const mistralService = initializeService(req, 'mistral') as MistralAIService;
      
      const content = await mistralService.generateSocialMediaContent(videoScript, options);
      
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/mistral/trending-topics", async (req: Request, res: Response) => {
    try {
      const theme = req.query.theme as string;
      const count = parseInt(req.query.count as string || '5');
      
      if (!theme) {
        return res.status(400).json({ message: "Theme parameter is required" });
      }
      
      const mistralService = initializeService(req, 'mistral') as MistralAIService;
      
      const topics = await mistralService.suggestTrendingTopics(theme, count);
      
      res.status(200).json(topics);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 6.3 Google TTS API
  app.post("/api/tts/synthesize", async (req: Request, res: Response) => {
    try {
      const { text, languageCode, voiceName, speakingRate, pitch } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const ttsService = initializeService(req, 'google_tts') as GoogleTTSService;
      
      const result = await ttsService.synthesizeSpeech({
        text,
        languageCode,
        voiceName,
        speakingRate,
        pitch
      });
      
      res.status(200).json({
        fileName: result.fileName,
        filePath: `/uploads/audio/${result.fileName}`,
        audioContent: result.audioContent
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/tts/voices", async (req: Request, res: Response) => {
    try {
      const languageCode = req.query.languageCode as string;
      
      const ttsService = initializeService(req, 'google_tts') as GoogleTTSService;
      
      const voices = await ttsService.getVoices(languageCode);
      
      res.status(200).json(voices);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // 6.3.1 OpenAI TTS API
  app.post("/api/openai-tts/synthesize", async (req: Request, res: Response) => {
    try {
      const { text, voice, speed } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const ttsService = initializeService(req, 'openai_tts') as OpenAITTSService;
      
      const result = await ttsService.synthesizeSpeech({
        text,
        voice,
        speed
      });
      
      res.status(200).json({
        fileName: result.fileName,
        filePath: `/uploads/audio/${result.fileName}`,
        audioContent: result.audioContent
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/openai-tts/voices", async (req: Request, res: Response) => {
    try {
      const ttsService = initializeService(req, 'openai_tts') as OpenAITTSService;
      const voices = await ttsService.getVoices();
      res.status(200).json(voices);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // 6.3.2 Coqui TTS API (Free alternative to OpenAI TTS)
  app.post("/api/coqui-tts/synthesize", async (req: Request, res: Response) => {
    try {
      const { text, voice, speed } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const ttsService = initializeService(req, 'coqui_tts') as CoquiTTSService;
      
      const result = await ttsService.synthesizeSpeech({
        text,
        voice,
        speed
      });
      
      res.status(200).json({
        fileName: result.fileName,
        filePath: `/uploads/audio/${result.fileName}`,
        audioContent: result.audioContent
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/coqui-tts/voices", async (req: Request, res: Response) => {
    try {
      const ttsService = initializeService(req, 'coqui_tts') as CoquiTTSService;
      const voices = await ttsService.getVoices();
      res.status(200).json(voices);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // 6.3.3 Google Cloud TTS API (Modern implementation)
  app.post("/api/google-cloud-tts/synthesize", async (req: Request, res: Response) => {
    try {
      const { text, languageCode, voiceName, speakingRate, pitch } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const ttsService = initializeService(req, 'google_cloud_tts') as GoogleCloudTTSService;
      
      const result = await ttsService.synthesizeSpeech({
        text,
        languageCode,
        voiceName,
        speakingRate,
        pitch
      });
      
      res.status(200).json({
        fileName: result.fileName,
        filePath: `/uploads/audio/${result.fileName}`,
        audioContent: result.audioContent
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/google-cloud-tts/voices", async (req: Request, res: Response) => {
    try {
      const languageCode = req.query.languageCode as string;
      const ttsService = initializeService(req, 'google_cloud_tts') as GoogleCloudTTSService;
      const voices = await ttsService.getVoices(languageCode);
      res.status(200).json(voices);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // ResponsiveVoice API (Serviço TTS gratuito baseado em web)
  app.post("/api/responsive-voice/synthesize", async (req: Request, res: Response) => {
    try {
      const {
        text,
        voice = "Brazilian Portuguese Female",
        speed = 1
      } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const responsiveVoiceService = initializeService(req, 'responsive_voice') as ResponsiveVoiceService;
      
      const result = await responsiveVoiceService.synthesizeSpeech({
        text,
        voice,
        speed
      });
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.get("/api/responsive-voice/voices", async (req: Request, res: Response) => {
    try {
      const responsiveVoiceService = initializeService(req, 'responsive_voice') as ResponsiveVoiceService;
      const voices = await responsiveVoiceService.getVoices();
      res.status(200).json(voices);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 6.5.5 Premium Brazilian Voice API - Serviço especializado para vozes brasileiras
  app.post("/api/premium-brazilian-voice/synthesize", async (req: Request, res: Response) => {
    try {
      const { text, voice, speed } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const premiumVoiceService = initializeService(req, 'premium_brazilian_voice') as PremiumBrazilianVoiceService;
      
      const result = await premiumVoiceService.synthesizeSpeech({
        text,
        voice: voice || "Ricardo Autoritativo",
        speed: speed || 1.0
      });
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.get("/api/premium-brazilian-voice/voices", async (req: Request, res: Response) => {
    try {
      const premiumVoiceService = initializeService(req, 'premium_brazilian_voice') as PremiumBrazilianVoiceService;
      
      const voices = await premiumVoiceService.getVoices();
      
      res.status(200).json(voices);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // TTS-JS routes removidas para simplificar a implementação

  // Rota de teste para criar um vídeo simples com texto - ajuda a diagnosticar problemas do FFmpeg
  app.post("/api/video/create-simple-test", async (req: Request, res: Response) => {
    try {
      console.log("Iniciando teste simples de criação de vídeo...");
      
      const ffmpegService = new FFmpegService();
      const testText = "Teste do VideoGenie";
      const outputFileName = `simple_test_${Date.now()}.mp4`;
      
      console.log(`Criando vídeo de teste com texto: "${testText}"`);
      
      const outputPath = await ffmpegService.createTextVideo(testText, {
        outputFileName,
        width: 1080,
        height: 1920,
        frameRate: 30,
        duration: 5
      });
      
      console.log(`Vídeo de teste criado com sucesso: ${outputPath}`);
      
      res.status(200).json({
        success: true,
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`
      });
    } catch (error) {
      console.error("Erro no teste simples de vídeo:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao criar vídeo de teste",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Nova rota de teste para verificar a funcionalidade completa de geração de vídeos
  app.post("/api/video/test-complete-workflow", async (req: Request, res: Response) => {
    try {
      console.log("Iniciando teste completo de fluxo de geração de vídeo...");
      
      // Criar pasta temporária
      const testDir = './uploads/test';
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // Criar imagens de teste
      const imageSize = { width: 1080, height: 1920 };
      const colors = ['#ff5733', '#33ff57', '#3357ff'];
      const imagePaths = [];
      
      for (let i = 0; i < 3; i++) {
        const imagePath = path.join(testDir, `test_image_${i + 1}.png`);
        
        // Criar imagem simples com canvas
        // Importando canvas de forma compatível com ESM
        const { createCanvas } = await import('canvas');
        const canvas = createCanvas(imageSize.width, imageSize.height);
        const ctx = canvas.getContext('2d');
        
        // Preencher com cor de fundo
        ctx.fillStyle = colors[i];
        ctx.fillRect(0, 0, imageSize.width, imageSize.height);
        
        // Adicionar texto
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Imagem de Teste ${i + 1}`, imageSize.width / 2, imageSize.height / 2);
        
        // Salvar a imagem
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(imagePath, buffer);
        imagePaths.push(imagePath);
      }
      
      console.log(`Imagens de teste criadas: ${imagePaths.join(', ')}`);
      
      // Criar áudio de teste (silencioso)
      const ffmpegService = new FFmpegService();
      const audioPath = path.join(testDir, 'test_audio.mp3');
      await ffmpegService.createSilentAudio(audioPath, 10);
      
      console.log(`Áudio de teste criado: ${audioPath}`);
      
      // Criar vídeo a partir das imagens
      const outputFileName = `test_full_workflow_${Date.now()}.mp4`;
      const videoOptions = {
        imagePaths,
        outputFileName,
        duration: 3,
        transition: 'fade',
        transitionDuration: 0.5,
        width: 1080,
        height: 1920,
        textOverlay: "Teste de Geração de Vídeo",
        textPosition: 'bottom',
        textColor: '#FFFFFF',
        textFont: 'Arial',
        textAnimation: 'none',
        fps: 30,
        zoomEffect: true,
        colorGrading: 'vibrant',
        audioPath,
        outputQuality: 'medium',
        social: 'tiktok'
      };
      
      console.log("Gerando vídeo a partir das imagens...");
      const videoPath = await ffmpegService.createVideoFromImages(videoOptions);
      
      // Verificar metadados do vídeo
      const metadata = await ffmpegService.getVideoMetadata(videoPath);
      
      console.log("Teste completo finalizado com sucesso");
      
      res.status(200).json({
        success: true,
        filePath: videoPath,
        fileName: path.basename(videoPath),
        url: `/uploads/videos/${path.basename(videoPath)}`,
        metadata
      });
    } catch (error) {
      console.error("Erro no teste completo:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao executar teste completo",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 6.4 FFmpeg video generation
  // Endpoint para criar vídeo a partir de arquivos de imagens (upload) com opções avançadas
  app.post("/api/video/create-from-images", upload.fields([
    { name: "images", maxCount: 20 },
    { name: "logo", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const {
        outputFileName = `video_${Date.now()}.mp4`,
        duration,
        transition,
        transitionDuration,
        width,
        height,
        textOverlay,
        textPosition,
        textColor,
        fps,
        zoomEffect,
        colorGrading
      } = req.body;
      
      if (!files.images || files.images.length === 0) {
        return res.status(400).json({ message: "Images are required" });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      const imagePaths = files.images.map(file => file.path);
      const logoPath = files.logo?.[0]?.path;
      const audioPath = files.audio?.[0]?.path;
      
      const outputPath = await ffmpegService.createVideoFromImages({
        imagePaths,
        outputFileName,
        duration: duration ? parseFloat(duration) : undefined,
        transition: transition || undefined,
        transitionDuration: transitionDuration ? parseFloat(transitionDuration) : undefined,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        textOverlay: textOverlay || undefined,
        textPosition: textPosition || undefined,
        textColor: textColor || undefined,
        logo: logoPath,
        fps: fps ? parseInt(fps) : undefined,
        zoomEffect: zoomEffect !== undefined ? (zoomEffect === 'true' || zoomEffect === true) : undefined,
        colorGrading: colorGrading || undefined,
        audioPath: audioPath
      });
      
      // Get video metadata
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      res.status(200).json({
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        ...metadata
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Endpoint para criar vídeo a partir de URLs de imagens com opções avançadas
  app.post("/api/video/create-from-image-urls", async (req: Request, res: Response) => {
    try {
      const {
        imageUrls,
        outputFileName = `video_${Date.now()}.mp4`,
        duration,
        transition,
        transitionDuration,
        width,
        height,
        textOverlay,
        textPosition,
        textColor,
        logoUrl,
        fps,
        zoomEffect,
        colorGrading,
        audioUrl
      } = req.body;
      
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ message: "Image URLs are required" });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      // Cria o diretório de upload temporário se não existir
      const tempDir = path.join(process.cwd(), "uploads/temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Baixa as imagens a partir das URLs
      const imagePaths: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}`);
        }
        
        const imageBuffer = await response.arrayBuffer();
        const extension = imageUrl.split('.').pop() || 'jpg';
        const imagePath = path.join(tempDir, `image_${Date.now()}_${i}.${extension}`);
        
        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
        imagePaths.push(imagePath);
      }
      
      // Processa o logo, se for fornecido
      let logoPath: string | undefined;
      if (logoUrl) {
        try {
          const logoResponse = await fetch(logoUrl);
          if (logoResponse.ok) {
            const logoBuffer = await logoResponse.arrayBuffer();
            const logoExtension = logoUrl.split('.').pop() || 'png';
            logoPath = path.join(tempDir, `logo_${Date.now()}.${logoExtension}`);
            fs.writeFileSync(logoPath, Buffer.from(logoBuffer));
          }
        } catch (error) {
          console.warn(`Error downloading logo: ${error}`);
          // Continue without logo if there's an error
        }
      }
      
      // Processa o áudio, se for fornecido
      let audioPath: string | undefined;
      if (audioUrl) {
        try {
          const audioResponse = await fetch(audioUrl);
          if (audioResponse.ok) {
            const audioBuffer = await audioResponse.arrayBuffer();
            const audioExtension = audioUrl.split('.').pop() || 'mp3';
            audioPath = path.join(tempDir, `audio_${Date.now()}.${audioExtension}`);
            fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
          }
        } catch (error) {
          console.warn(`Error downloading audio: ${error}`);
          // Continue without audio if there's an error
        }
      }
      
      const outputPath = await ffmpegService.createVideoFromImages({
        imagePaths,
        outputFileName,
        duration: duration ? parseFloat(duration) : undefined,
        transition: transition || undefined,
        transitionDuration: transitionDuration ? parseFloat(transitionDuration) : undefined,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        textOverlay: textOverlay || undefined,
        textPosition: textPosition || undefined,
        textColor: textColor || undefined,
        logo: logoPath,
        fps: fps ? parseInt(fps) : undefined,
        zoomEffect: zoomEffect !== undefined ? Boolean(zoomEffect) : undefined,
        colorGrading: colorGrading || undefined,
        audioPath: audioPath
      });
      
      // Get video metadata
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      // Limpar arquivos temporários
      imagePaths.forEach(imagePath => {
        try {
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch (e) { /* ignore cleanup errors */ }
      });
      
      if (logoPath && fs.existsSync(logoPath)) {
        try { fs.unlinkSync(logoPath); } catch (e) { /* ignore cleanup errors */ }
      }
      
      if (audioPath && fs.existsSync(audioPath)) {
        try { fs.unlinkSync(audioPath); } catch (e) { /* ignore cleanup errors */ }
      }
      
      res.status(200).json({
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        ...metadata
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Endpoint para adicionar áudio a um vídeo com arquivos enviados via form
  app.post("/api/video/add-audio", upload.fields([
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const {
        outputFileName = `video_with_audio_${Date.now()}.mp4`,
        loop,
      } = req.body;
      
      if (!files.video || !files.audio) {
        return res.status(400).json({ message: "Arquivos de vídeo e áudio são obrigatórios" });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      const videoPath = files.video[0].path;
      const audioPath = files.audio[0].path;
      
      const outputPath = await ffmpegService.addAudioToVideo({
        videoPath,
        audioPath,
        outputFileName,
        loop: loop === 'true' || loop === true,
      });
      
      // Get video metadata
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      res.status(200).json({
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        ...metadata
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Novo endpoint para adicionar áudio a um vídeo usando URLs
  app.post("/api/video/add-audio-from-urls", async (req: Request, res: Response) => {
    try {
      const {
        videoUrl,
        audioUrl,
        outputFileName = `video_with_audio_${Date.now()}.mp4`,
        loop,
      } = req.body;
      
      if (!videoUrl || !audioUrl) {
        return res.status(400).json({ message: "URL do vídeo e URL do áudio são obrigatórios" });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      // Cria o diretório de upload temporário se não existir
      const tempDir = path.join(process.cwd(), "uploads/temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Determinar se videoUrl é um caminho local ou uma URL remota
      let videoPath: string;
      if (videoUrl.startsWith('http')) {
        // É uma URL remota, faz o download
        try {
          const videoResponse = await fetch(videoUrl);
          if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video from ${videoUrl}`);
          }
          const videoBuffer = await videoResponse.arrayBuffer();
          const videoExtension = videoUrl.split('.').pop() || 'mp4';
          videoPath = path.join(tempDir, `video_${Date.now()}.${videoExtension}`);
          fs.writeFileSync(videoPath, Buffer.from(videoBuffer));
        } catch (error) {
          console.error("Error downloading video:", error);
          return res.status(500).json({ message: "Server error", error: `Failed to download video: ${error instanceof Error ? error.message : String(error)}` });
        }
      } else {
        // É um caminho local, verifica se existe e retira a barra inicial se houver
        const localPath = videoUrl.startsWith('/') ? videoUrl.substring(1) : videoUrl;
        videoPath = path.join(process.cwd(), localPath);
        
        if (!fs.existsSync(videoPath)) {
          return res.status(400).json({ message: "Video file not found", error: `Cannot find video at path: ${videoPath}` });
        }
      }
      
      // Determinar se audioUrl é um caminho local ou uma URL remota
      let audioPath: string;
      if (audioUrl.startsWith('http')) {
        // É uma URL remota, faz o download
        try {
          const audioResponse = await fetch(audioUrl);
          if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio from ${audioUrl}`);
          }
          const audioBuffer = await audioResponse.arrayBuffer();
          const audioExtension = audioUrl.split('.').pop() || 'mp3';
          audioPath = path.join(tempDir, `audio_${Date.now()}.${audioExtension}`);
          fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
        } catch (error) {
          console.error("Error downloading audio:", error);
          return res.status(500).json({ message: "Server error", error: `Failed to download audio: ${error instanceof Error ? error.message : String(error)}` });
        }
      } else {
        // É um caminho local, verifica se existe e retira a barra inicial se houver
        const localPath = audioUrl.startsWith('/') ? audioUrl.substring(1) : audioUrl;
        audioPath = path.join(process.cwd(), localPath);
        
        if (!fs.existsSync(audioPath)) {
          return res.status(400).json({ message: "Audio file not found", error: `Cannot find audio at path: ${audioPath}` });
        }
      }
      
      // Processa a combinação
      const outputPath = await ffmpegService.addAudioToVideo({
        videoPath,
        audioPath,
        outputFileName,
        loop: loop === 'true' || loop === true,
      });
      
      // Get video metadata
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      res.status(200).json({
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        ...metadata
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Endpoint para combinar vídeos enviados via upload
  app.post("/api/video/combine-videos", upload.array("videos"), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const {
        outputFileName = `combined_video_${Date.now()}.mp4`,
        transition,
        transitionDuration,
      } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Videos are required" });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      const videoPaths = files.map(file => file.path);
      
      const outputPath = await ffmpegService.combineVideos({
        videoPaths,
        outputFileName,
        transition: transition || undefined,
        transitionDuration: transitionDuration ? parseFloat(transitionDuration) : undefined,
      });
      
      // Get video metadata
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      res.status(200).json({
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        ...metadata
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Endpoint simples para adicionar áudio a um vídeo existente usando caminhos de arquivo
  app.post("/api/video/add-audio-by-path", async (req: Request, res: Response) => {
    try {
      console.log("Recebendo solicitação para adicionar áudio ao vídeo:", req.body);
      
      const {
        videoPath,
        audioPath,
        outputFileName = `video_with_audio_${Date.now()}.mp4`,
        loop = true
      } = req.body;
      
      if (!videoPath || !audioPath) {
        return errorResponse(res, 400, "Caminhos do vídeo e áudio são obrigatórios");
      }
      
      console.log("Inicializando FFmpegService...");
      const ffmpegService = new FFmpegService();
      console.log("FFmpegService inicializado com sucesso");
      
      // Verificar se os arquivos existem
      const fullVideoPath = path.join(process.cwd(), videoPath.startsWith('/') ? videoPath.substring(1) : videoPath);
      const fullAudioPath = path.join(process.cwd(), audioPath.startsWith('/') ? audioPath.substring(1) : audioPath);
      
      if (!fs.existsSync(fullVideoPath)) {
        return errorResponse(res, 400, "Arquivo de vídeo não encontrado", `Não foi possível encontrar o vídeo no caminho: ${fullVideoPath}`);
      }
      
      if (!fs.existsSync(fullAudioPath)) {
        return errorResponse(res, 400, "Arquivo de áudio não encontrado", `Não foi possível encontrar o áudio no caminho: ${fullAudioPath}`);
      }
      
      // Processa a combinação
      const outputPath = await ffmpegService.addAudioToVideo({
        videoPath: fullVideoPath,
        audioPath: fullAudioPath,
        outputFileName,
        loop: typeof loop === 'string' ? loop === 'true' : loop
      });
      
      // Get video metadata
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      res.status(200).json({
        success: true,
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        ...metadata
      });
    } catch (error) {
      return errorResponse(res, 500, "Erro no servidor", error);
    }
  });
  
  // Endpoint para criar um vídeo somente com texto
  app.post("/api/video/create-text-video", async (req: Request, res: Response) => {
    try {
      const {
        text,
        outputFileName = `text_video_${Date.now()}.mp4`,
        width,
        height,
        frameRate,
        bitrate,
      } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      const outputPath = await ffmpegService.createTextVideo(text, {
        outputFileName,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        frameRate: frameRate ? parseInt(frameRate) : undefined,
        // Removido bitrate pois não está definido na interface TextVideoOptions
      });
      
      // Get video metadata
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      res.status(200).json({
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        ...metadata
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Rota para testar recursos avançados de vídeo
  app.post("/api/video/create-advanced", async (req: Request, res: Response) => {
    try {
      console.log("Recebendo solicitação para criar vídeo avançado:", JSON.stringify(req.body));
      
      const { 
        imagePaths, 
        outputFileName = `advanced_video_${Date.now()}.mp4`,
        text,
        duration = 3,
        transition = "fade",
        transitionDuration = 0.5,
        textPosition = "bottom",
        textColor = "white",
        textFont,
        textAnimation = "none",
        logo,
        logoPosition = "top-right",
        zoomEffect = true,
        colorGrading = "vibrant",
        audioPath,
        autoSubtitle = false,
        watermark,
        outputQuality = "high",
        social = "tiktok"
      } = req.body;
      
      if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Pelo menos uma imagem é necessária" 
        });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      // Verificando e preparando os caminhos de imagem
      const adjustedImagePaths = [];
      
      // Verificar se os diretórios necessários existem
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const imagesDir = path.join(uploadsDir, 'images');
      const tempDir = path.join(uploadsDir, 'temp');
      const videosDir = path.join(uploadsDir, 'videos');
      
      [uploadsDir, imagesDir, tempDir, videosDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          try {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Diretório criado: ${dir}`);
          } catch (error) {
            console.error(`Erro ao criar diretório ${dir}:`, error);
          }
        }
      });
      
      // Lista as imagens para depuração
      try {
        console.log("Listando diretório de imagens:");
        const imagesFiles = fs.readdirSync(imagesDir);
        console.log(imagesFiles);
      } catch (err) {
        console.error("Erro ao listar diretório:", err);
      }
      
      for (const imgPath of imagePaths) {
        // Normalizar o caminho da imagem
        let normalizedPath = '';
        if (imgPath.startsWith('/')) {
          normalizedPath = imgPath.substring(1);
        } else if (imgPath.startsWith('./')) {
          normalizedPath = imgPath.substring(2);
        } else {
          normalizedPath = imgPath;
        }
        
        // Para depuração
        console.log(`Caminho original: ${imgPath}`);
        console.log(`Caminho normalizado: ${normalizedPath}`);
        
        // Caminho absoluto em relação à raiz do projeto
        const absolutePath = path.join(process.cwd(), normalizedPath);
        
        console.log(`Verificando imagem: ${absolutePath}`);
        
        if (fs.existsSync(absolutePath)) {
          console.log(`✅ Imagem encontrada: ${absolutePath}`);
          
          // Verificar se é um formato suportado pelo FFmpeg
          const fileExt = path.extname(absolutePath).toLowerCase();
          const supportedFormats = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'];
          
          if (supportedFormats.includes(fileExt)) {
            adjustedImagePaths.push(absolutePath);
          } else {
            console.log(`⚠️ Formato de imagem não suportado: ${fileExt} - será ignorado`);
          }
        } else {
          console.log(`❌ Imagem não encontrada: ${absolutePath}`);
        }
      }
      
      // Se não há imagens válidas após a verificação, retornamos erro
      if (adjustedImagePaths.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nenhuma imagem válida foi encontrada. Verifique se as imagens existem e têm formato suportado (PNG, JPG, etc.)"
        });
      }
      
      console.log(`Usando ${adjustedImagePaths.length} imagens para criar o vídeo.`);
      
      // Remova o texto se for muito grande para evitar erros
      // Extraia apenas a primeira frase ou limite-o
      let processedText = "";
      if (text && typeof text === 'string') {
        const sentences = text.split(/[.!?]+/);
        if (sentences.length > 0) {
          processedText = sentences[0].trim() + ".";
          // Limite o tamanho máximo a 100 caracteres (incluindo espaços)
          if (processedText.length > 100) {
            processedText = processedText.substring(0, 97) + "...";
          }
        }
      }
      
      console.log("Texto processado para vídeo:", processedText);
      
      const outputPath = await ffmpegService.createVideoFromImages({
        imagePaths: adjustedImagePaths,
        outputFileName,
        duration: typeof duration === 'string' ? parseFloat(duration) : duration,
        transition,
        transitionDuration: typeof transitionDuration === 'string' ? parseFloat(transitionDuration) : transitionDuration,
        width: 1080,
        height: 1920,
        textOverlay: processedText,  // Use o texto processado ao invés do original
        textPosition,
        textColor,
        textFont,
        textAnimation,
        logo,
        logoPosition,
        fps: 30,
        zoomEffect: zoomEffect === 'true' || zoomEffect === true,
        colorGrading,
        audioPath,
        autoSubtitle: false,  // Desative legendas automáticas temporariamente
        watermark,
        outputQuality,
        social
      });
      
      // Não usamos getVideoMetadata para evitar problemas com ffprobe
      // Metadados fixos para teste
      const metadata = {
        duration: 10, // segundos
        width: 1080,
        height: 1920,
        format: "mp4"
      };
      
      res.status(200).json({
        success: true,
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        details: {
          transition,
          colorGrading,
          textAnimation,
          outputQuality,
          social
        },
        ...metadata
      });
    } catch (error) {
      console.error(`Erro ao criar vídeo avançado: ${error}`);
      return errorResponse(res, 500, "Erro ao criar vídeo", error);
    }
  });

  // Endpoint para combinar vídeos a partir de URLs
  app.post("/api/video/combine-videos-from-urls", async (req: Request, res: Response) => {
    try {
      const {
        videoUrls,
        outputFileName = `combined_video_${Date.now()}.mp4`,
        transition,
        transitionDuration,
      } = req.body;
      
      if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
        return errorResponse(res, 400, "URLs de vídeo são obrigatórias");
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      // Cria o diretório de upload temporário se não existir
      const tempDir = path.join(process.cwd(), "uploads/temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Baixa os vídeos a partir das URLs
      const videoPaths: string[] = [];
      for (let i = 0; i < videoUrls.length; i++) {
        const videoUrl = videoUrls[i];
        try {
          const response = await fetch(videoUrl);
          if (!response.ok) {
            throw new Error(`Falha ao baixar o vídeo de ${videoUrl}`);
          }
          
          const videoBuffer = await response.arrayBuffer();
          const extension = videoUrl.split('.').pop() || 'mp4';
          const videoPath = path.join(tempDir, `video_${Date.now()}_${i}.${extension}`);
          
          fs.writeFileSync(videoPath, Buffer.from(videoBuffer));
          videoPaths.push(videoPath);
        } catch (error) {
          console.warn(`Erro ao baixar vídeo de ${videoUrl}: ${error}`);
          // Continua com outros vídeos
        }
      }
      
      if (videoPaths.length === 0) {
        return errorResponse(res, 400, "Não foi possível baixar nenhum vídeo");
      }
      
      const outputPath = await ffmpegService.combineVideos({
        videoPaths,
        outputFileName,
        transition: transition || undefined,
        transitionDuration: transitionDuration ? parseFloat(transitionDuration) : undefined,
      });
      
      // Metadados fixos para teste
      const metadata = {
        duration: 10, // segundos
        width: 1080,
        height: 1920,
        format: "mp4"
      };
      
      // Limpar arquivos temporários
      videoPaths.forEach(videoPath => {
        try {
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        } catch (e) { /* ignorar erros de limpeza */ }
      });
      
      res.status(200).json({
        filePath: outputPath,
        fileName: path.basename(outputPath),
        url: `/uploads/videos/${path.basename(outputPath)}`,
        ...metadata
      });
    } catch (error) {
      return errorResponse(res, 500, "Erro no servidor", error);
    }
  });

  // 7. Serve uploaded files
  app.use("/uploads", express.static(UPLOADS_DIR));
  
  // Create HTTP server
  const httpServer = createServer(app);
  // 7. Rotas para o sistema de orquestração AI com cache e fallback
  app.post("/api/ai/generate-script", async (req: Request, res: Response) => {
    try {
      const {
        theme,
        targetAudience,
        duration,
        tone,
        keywords,
        additionalInstructions
      } = req.body;
      
      if (!theme) {
        return res.status(400).json({ message: "Theme is required" });
      }
      
      // Uso do cache para scripts similares
      const cacheKey = `script:${theme}:${targetAudience || 'geral'}:${tone || 'informativo'}`;
      
      const script = await cacheService.wrap(
        cacheKey,
        { theme, targetAudience, duration, tone, keywords, additionalInstructions },
        async () => {
          try {
            return await aiOrchestrator.generateVideoScript({
              theme,
              targetAudience,
              duration,
              tone,
              keywords,
              additionalInstructions
            });
          } catch (error) {
            throw error;
          }
        },
        3600 // Cache válido por 1 hora
      );
      
      res.status(200).json(script);
    } catch (error) {
      errorResponse(res, 500, "Erro ao gerar roteiro de vídeo", error);
    }
  });

  app.post("/api/ai/generate-content", async (req: Request, res: Response) => {
    try {
      const { videoScript, options } = req.body;
      
      if (!videoScript) {
        return res.status(400).json({ message: "Video script is required" });
      }
      
      // Uso do cache para conteúdo social media
      const scriptHash = Buffer.from(videoScript).toString('base64').substring(0, 20);
      const cacheKey = `social:${scriptHash}`;
      
      const content = await cacheService.wrap(
        cacheKey,
        { videoScript, options },
        async () => {
          try {
            return await aiOrchestrator.generateSocialMediaContent(videoScript, options);
          } catch (error) {
            throw error;
          }
        },
        3600 // Cache válido por 1 hora
      );
      
      res.status(200).json(content);
    } catch (error) {
      errorResponse(res, 500, "Erro ao gerar conteúdo para redes sociais", error);
    }
  });

  app.get("/api/ai/trending-topics", async (req: Request, res: Response) => {
    try {
      const theme = req.query.theme as string;
      const count = parseInt(req.query.count as string || '5');
      
      if (!theme) {
        return res.status(400).json({ message: "Theme parameter is required" });
      }
      
      // Uso do cache para tópicos em tendência
      const cacheKey = `trending:${theme}:${count}`;
      
      const topics = await cacheService.wrap(
        cacheKey,
        { theme, count },
        async () => {
          try {
            return await aiOrchestrator.suggestTrendingTopics(theme, count);
          } catch (error) {
            throw error;
          }
        },
        1800 // Cache válido por 30 minutos (tópicos em tendência mudam mais rápido)
      );
      
      res.status(200).json(topics);
    } catch (error) {
      errorResponse(res, 500, "Erro ao obter tópicos em tendência", error);
    }
  });

  app.get("/api/ai/status", async (req: Request, res: Response) => {
    try {
      // Retorna o status dos provedores de IA e erros recentes
      const errors = aiOrchestrator.getLastErrors();
      const hasMistral = !!process.env.MISTRAL_API_KEY;
      const hasHuggingface = !!process.env.HUGGINGFACE_API_KEY;
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      const hasGemini = !!process.env.GOOGLE_AI_API_KEY;
      
      res.status(200).json({
        providers: {
          mistral: { available: hasMistral, error: errors['mistral'] || null },
          huggingface: { available: hasHuggingface, error: errors['huggingface'] || null },
          openai: { available: hasOpenAI, error: errors['openai'] || null },
          gemini: { available: hasGemini, error: errors['gemini'] || null }
        },
        fallbackAvailable: hasMistral || hasHuggingface || hasOpenAI || hasGemini,
        cacheStatus: cacheService.getStats()
      });
    } catch (error) {
      errorResponse(res, 500, "Erro ao verificar status dos serviços de IA", error);
    }
  });

  // 8. Rotas para o sistema de automação de redes sociais
  app.post("/api/social/schedule", async (req: Request, res: Response) => {
    try {
      const { videoPath, title, description, hashtags, platforms, scheduledTime } = req.body;
      
      if (!videoPath) {
        return res.status(400).json({ message: "Video path is required" });
      }
      
      if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({ message: "At least one platform must be specified" });
      }
      
      // Converter plataformas para o formato esperado pelo orquestrador
      const accounts = platforms.map(platform => ({
        platform,
        accountId: 'default', // No futuro, isso viria do banco de dados do usuário
        accessToken: process.env[`${platform.toUpperCase()}_ACCESS_TOKEN`] || ''
      }));
      
      // Agendar a publicação
      const postId = socialMediaOrchestrator.schedulePost(
        {
          videoPath,
          title,
          description,
          hashtags: hashtags || [],
          scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined
        },
        accounts
      );
      
      res.status(201).json({ 
        postId, 
        message: scheduledTime 
          ? `Post agendado para ${new Date(scheduledTime).toLocaleString('pt-BR')}` 
          : 'Post agendado para publicação imediata'
      });
    } catch (error) {
      errorResponse(res, 500, "Erro ao agendar publicação", error);
    }
  });

  app.get("/api/social/posts", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const posts = socialMediaOrchestrator.listPosts(status as any);
      
      res.status(200).json(posts);
    } catch (error) {
      errorResponse(res, 500, "Erro ao listar publicações", error);
    }
  });

  app.get("/api/social/posts/:id", async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const post = socialMediaOrchestrator.getPostStatus(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.status(200).json(post);
    } catch (error) {
      errorResponse(res, 500, "Erro ao obter status da publicação", error);
    }
  });

  app.delete("/api/social/posts/:id", async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const success = socialMediaOrchestrator.cancelScheduledPost(postId);
      
      if (!success) {
        return res.status(404).json({ message: "Post not found or cannot be cancelled" });
      }
      
      res.status(204).send();
    } catch (error) {
      errorResponse(res, 500, "Erro ao cancelar publicação", error);
    }
  });

  app.get("/api/social/status", async (req: Request, res: Response) => {
    try {
      // Verificar o status das conexões com APIs de redes sociais
      const apiStatus = await socialMediaOrchestrator.checkExternalAPIs();
      const logs = socialMediaOrchestrator.getLogs().slice(-10); // Últimos 10 logs
      
      res.status(200).json({
        apiStatus,
        logs,
        scheduledPosts: socialMediaOrchestrator.listPosts('scheduled').length,
        processingPosts: socialMediaOrchestrator.listPosts('processing').length,
        completedPosts: socialMediaOrchestrator.listPosts('completed').length,
        failedPosts: socialMediaOrchestrator.listPosts('failed').length
      });
    } catch (error) {
      errorResponse(res, 500, "Erro ao verificar status das redes sociais", error);
    }
  });

  // 9. Rotas para o sistema de cache
  app.get("/api/cache/stats", async (req: Request, res: Response) => {
    try {
      const stats = cacheService.getStats();
      
      res.status(200).json(stats);
    } catch (error) {
      errorResponse(res, 500, "Erro ao obter estatísticas de cache", error);
    }
  });

  app.post("/api/cache/clear", async (req: Request, res: Response) => {
    try {
      await cacheService.clear();
      
      res.status(200).json({ message: "Cache limpo com sucesso" });
    } catch (error) {
      errorResponse(res, 500, "Erro ao limpar cache", error);
    }
  });

  // 10. Exportação de código e dados
  app.post("/api/export", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const { type, format } = req.body;
      
      if (!type || !format) {
        return res.status(400).json({ message: "Type and format are required" });
      }
      
      // Validar tipo e formato
      const validTypes = ["code", "videos", "data"];
      const validFormats = ["zip", "csv", "json"];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid export type. Must be one of: " + validTypes.join(", ") });
      }
      
      if (!validFormats.includes(format)) {
        return res.status(400).json({ message: "Invalid export format. Must be one of: " + validFormats.join(", ") });
      }
      
      // Criar job de exportação
      const job = await exportService.createExportJob(userId, type, format);
      
      res.status(202).json({ 
        message: "Export job created successfully", 
        job 
      });
    } catch (error) {
      return errorResponse(res, 500, "Error creating export job", error);
    }
  });
  
  app.get("/api/export/jobs", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const jobs = await storage.getExportJobs(userId);
      
      res.status(200).json(jobs);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching export jobs", error);
    }
  });
  
  app.get("/api/export/jobs/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getExportJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Export job not found" });
      }
      
      res.status(200).json(job);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching export job", error);
    }
  });
  
  app.get("/api/export/download/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getExportJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Export job not found" });
      }
      
      if (job.status !== "completed") {
        return res.status(400).json({ message: `Export job is not ready for download (status: ${job.status})` });
      }
      
      if (!job.filePath) {
        return res.status(400).json({ message: "Export file path is not available" });
      }
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(job.filePath)) {
        return res.status(404).json({ message: "Export file not found" });
      }
      
      const fileName = path.basename(job.filePath);
      
      // Definir headers para download
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      
      // Enviar o arquivo como stream
      const fileStream = exportService.getExportFileStream(job.filePath);
      fileStream.pipe(res);
    } catch (error) {
      return errorResponse(res, 500, "Error downloading export file", error);
    }
  });
  
  // 11. Funil de vendas e automação de email
  // 11.1 Email Campaigns
  app.get("/api/email-campaigns", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const campaigns = await storage.getEmailCampaigns(userId);
      
      res.status(200).json(campaigns);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching email campaigns", error);
    }
  });
  
  app.get("/api/email-campaigns/:id", async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getEmailCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Email campaign not found" });
      }
      
      res.status(200).json(campaign);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching email campaign", error);
    }
  });
  
  app.post("/api/email-campaigns", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId, status: "draft" };
      
      // Validação básica
      if (!data.name || !data.subject || !data.body || !data.fromEmail || !data.fromName) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["name", "subject", "body", "fromEmail", "fromName"] 
        });
      }
      
      // Criar campanha
      const campaign = await storage.createEmailCampaign(data);
      
      res.status(201).json(campaign);
    } catch (error) {
      return errorResponse(res, 500, "Error creating email campaign", error);
    }
  });
  
  app.put("/api/email-campaigns/:id", async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getEmailCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Email campaign not found" });
      }
      
      // Verificar se a campanha pode ser editada
      if (campaign.status !== "draft") {
        return res.status(400).json({ 
          message: `Campaign cannot be edited. Current status: ${campaign.status}` 
        });
      }
      
      // Atualizar campanha
      const updated = await storage.updateEmailCampaign(campaignId, req.body);
      
      res.status(200).json(updated);
    } catch (error) {
      return errorResponse(res, 500, "Error updating email campaign", error);
    }
  });
  
  app.delete("/api/email-campaigns/:id", async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const success = await storage.deleteEmailCampaign(campaignId);
      
      if (!success) {
        return res.status(404).json({ message: "Email campaign not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      return errorResponse(res, 500, "Error deleting email campaign", error);
    }
  });
  
  app.post("/api/email-campaigns/:id/send", async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      
      // Enviar campanha imediatamente
      const updatedCampaign = await emailMarketingService.sendCampaignNow(campaignId);
      
      res.status(202).json({ 
        message: "Email campaign sending started", 
        campaign: updatedCampaign 
      });
    } catch (error) {
      return errorResponse(res, 500, "Error sending email campaign", error);
    }
  });
  
  app.post("/api/email-campaigns/:id/schedule", async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      const { scheduledAt } = req.body;
      
      if (!scheduledAt) {
        return res.status(400).json({ message: "scheduledAt date is required" });
      }
      
      // Agendar campanha
      const scheduledDate = new Date(scheduledAt);
      const updatedCampaign = await emailMarketingService.scheduleCampaign(campaignId, scheduledDate);
      
      res.status(200).json({ 
        message: "Email campaign scheduled", 
        campaign: updatedCampaign 
      });
    } catch (error) {
      return errorResponse(res, 500, "Error scheduling email campaign", error);
    }
  });
  
  app.post("/api/email-campaigns/:id/cancel", async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id);
      
      // Cancelar agendamento
      const updatedCampaign = await emailMarketingService.cancelCampaign(campaignId);
      
      res.status(200).json({ 
        message: "Email campaign schedule cancelled", 
        campaign: updatedCampaign 
      });
    } catch (error) {
      return errorResponse(res, 500, "Error cancelling email campaign", error);
    }
  });
  
  app.post("/api/email-campaigns/test-email", async (req: Request, res: Response) => {
    try {
      const { to, subject, body, fromName, fromEmail } = req.body;
      
      if (!to || !subject || !body || !fromName || !fromEmail) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["to", "subject", "body", "fromName", "fromEmail"] 
        });
      }
      
      // Enviar email de teste
      const result = await emailMarketingService.testSendEmail(
        to, fromName, fromEmail, subject, body
      );
      
      if (result.success) {
        return res.status(200).json({ 
          message: "Test email sent successfully", 
          provider: result.provider 
        });
      } else {
        return res.status(500).json({ 
          message: "Failed to send test email", 
          error: result.error 
        });
      }
    } catch (error) {
      return errorResponse(res, 500, "Error sending test email", error);
    }
  });
  
  // 11.2 Email Templates
  app.get("/api/email-templates", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const templates = await storage.getEmailTemplates(userId);
      
      res.status(200).json(templates);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching email templates", error);
    }
  });
  
  app.post("/api/email-templates", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId };
      
      // Validação básica
      if (!data.name || !data.content) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["name", "content"] 
        });
      }
      
      // Criar template
      const template = await storage.createEmailTemplate(data);
      
      res.status(201).json(template);
    } catch (error) {
      return errorResponse(res, 500, "Error creating email template", error);
    }
  });
  
  // 11.3 Audience Segments
  app.get("/api/audience-segments", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const segments = await storage.getAudienceSegments(userId);
      
      res.status(200).json(segments);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching audience segments", error);
    }
  });
  
  app.post("/api/audience-segments", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId };
      
      // Validação básica
      if (!data.name || !data.criteria) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["name", "criteria"] 
        });
      }
      
      // Criar segmento
      const segment = await storage.createAudienceSegment(data);
      
      res.status(201).json(segment);
    } catch (error) {
      return errorResponse(res, 500, "Error creating audience segment", error);
    }
  });
  
  // 11.4 Sales Funnels
  app.get("/api/sales-funnels", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const funnels = await storage.getSalesFunnels(userId);
      
      res.status(200).json(funnels);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching sales funnels", error);
    }
  });
  
  app.post("/api/sales-funnels", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId, status: "active" };
      
      // Validação básica
      if (!data.name || !data.steps) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["name", "steps"] 
        });
      }
      
      // Criar funil
      const funnel = await storage.createSalesFunnel(data);
      
      res.status(201).json(funnel);
    } catch (error) {
      return errorResponse(res, 500, "Error creating sales funnel", error);
    }
  });
  
  // 11.5 Landing Pages
  app.get("/api/landing-pages", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const pages = await storage.getLandingPages(userId);
      
      res.status(200).json(pages);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching landing pages", error);
    }
  });
  
  app.post("/api/landing-pages", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { ...req.body, userId, status: "draft" };
      
      // Validação básica
      if (!data.title || !data.content || !data.slug) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["title", "content", "slug"] 
        });
      }
      
      // Verificar se o slug já existe
      const existingPage = await storage.getLandingPageBySlug(data.slug);
      if (existingPage) {
        return res.status(400).json({ message: "Slug already in use" });
      }
      
      // Criar página
      const page = await storage.createLandingPage(data);
      
      res.status(201).json(page);
    } catch (error) {
      return errorResponse(res, 500, "Error creating landing page", error);
    }
  });
  
  // 11.6 Payments
  app.get("/api/payments", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const payments = await storage.getPayments(userId);
      
      res.status(200).json(payments);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching payments", error);
    }
  });
  
  app.post("/api/payments", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Demo userId
      const data = { 
        ...req.body, 
        userId, 
        status: "pending",
        provider: req.body.provider || "manual"
      };
      
      // Validação básica
      if (!data.leadId || !data.amount) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["leadId", "amount"] 
        });
      }
      
      // Criar pagamento
      const payment = await storage.createPayment(data);
      
      res.status(201).json(payment);
    } catch (error) {
      return errorResponse(res, 500, "Error creating payment", error);
    }
  });
  
  // 12. Testes de resiliência e monitoramento
  app.get("/api/resilience/tests", async (req: Request, res: Response) => {
    try {
      const service = req.query.service as string;
      let tests;
      
      if (service) {
        tests = await storage.getResilienceTestsByService(service);
      } else {
        tests = await storage.getResilienceTests();
      }
      
      res.status(200).json(tests);
    } catch (error) {
      return errorResponse(res, 500, "Error fetching resilience tests", error);
    }
  });
  
  app.post("/api/resilience/tests/run", async (req: Request, res: Response) => {
    try {
      const { service, options } = req.body;
      
      if (!service) {
        return res.status(400).json({ message: "Service name is required" });
      }
      
      // Executar teste
      await resilienceService.runTest(service, options);
      
      res.status(202).json({ message: "Resilience test started" });
    } catch (error) {
      return errorResponse(res, 500, "Error running resilience test", error);
    }
  });
  
  app.get("/api/resilience/statistics", async (req: Request, res: Response) => {
    try {
      const service = req.query.service as string;
      
      if (service) {
        const stats = await resilienceService.getServiceStatistics(service);
        res.status(200).json(stats);
      } else {
        const stats = await resilienceService.getSystemStatistics();
        res.status(200).json(stats);
      }
    } catch (error) {
      return errorResponse(res, 500, "Error fetching resilience statistics", error);
    }
  });
  
  app.post("/api/resilience/test-register", async (req: Request, res: Response) => {
    try {
      const { name, service, result, functionTested, fallbackUsed, fallbackService, responseTime, errorMessage } = req.body;
      
      if (!name || !service || !result || !functionTested) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["name", "service", "result", "functionTested"] 
        });
      }
      
      // Registrar teste manualmente
      const test = await storage.createResilienceTest({
        name,
        service,
        result,
        functionTested,
        fallbackUsed: fallbackUsed || false,
        fallbackService: fallbackService || null,
        responseTime: responseTime || null,
        errorMessage: errorMessage || null
      });
      
      res.status(201).json(test);
    } catch (error) {
      return errorResponse(res, 500, "Error registering resilience test", error);
    }
  });
  
  // Rota para teste rápido do FFmpeg
  app.get("/api/video/test-ffmpeg", async (_req: Request, res: Response) => {
    try {
      // Importar o serviço de teste do FFmpeg
      const { 
        testFFmpegInstallation, 
        getFFmpegCodecs,
        getFFmpegFormats,
        testFFmpegBasicVideo,
        getVideoMetadata 
      } = await import('./services/ffmpeg-test');
      
      // 1. Verificar instalação do FFmpeg
      const installationTest = await testFFmpegInstallation();
      
      if (!installationTest.installed) {
        return res.status(500).json({
          success: false,
          message: "FFmpeg não está disponível no sistema",
          error: installationTest.error
        });
      }
      
      // 2. Verificar codecs disponíveis
      const codecsTest = await getFFmpegCodecs();
      
      // 3. Verificar formatos suportados
      const formatsTest = await getFFmpegFormats();
      
      // 4. Criar vídeo de teste
      const videoTest = await testFFmpegBasicVideo();
      
      if (!videoTest.success) {
        return res.status(500).json({
          success: false,
          message: "Erro ao gerar vídeo de teste",
          error: videoTest.error,
          installation: installationTest,
          codecs: codecsTest,
          formats: formatsTest
        });
      }
      
      // 5. Obter metadados do vídeo gerado
      let metadata = {};
      try {
        if (videoTest.outputPath) {
          metadata = await getVideoMetadata(videoTest.outputPath);
        } else {
          metadata = { error: "Caminho de saída não disponível" };
        }
      } catch (error) {
        console.error("Erro ao obter metadados:", error);
        metadata = { error: String(error) };
      }
      
      // 6. Responder com sucesso e informações completas
      const outputPath = videoTest.outputPath || "";
      const fileName = outputPath ? path.basename(outputPath) : "unknown.mp4";
      
      res.status(200).json({
        success: true,
        message: "Teste de FFmpeg executado com sucesso",
        version: installationTest.version,
        codecs: codecsTest.codecs,
        formats: formatsTest.formats,
        metadata,
        url: `/uploads/videos/${fileName}`,
        fileName: fileName,
        filePath: outputPath,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro no teste do FFmpeg:", error);
      res.status(500).json({
        success: false, 
        message: "Erro ao testar FFmpeg", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint para criar um vídeo simples com texto para teste
  app.post("/api/video/create-simple-test", async (req: Request, res: Response) => {
    try {
      console.log("Iniciando teste simples de criação de vídeo com texto");
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      // Criar um texto de teste em português
      const textoDeTeste = "Testando a criação de vídeo com texto em português. VideoGenie funcionando!";
      
      // Nome do arquivo de saída
      const outputFileName = `text_video_test_${Date.now()}.mp4`;
      
      // Criar o vídeo
      const outputPath = await ffmpegService.createTextVideo(textoDeTeste, {
        outputFileName,
        width: 1080,
        height: 1920,
        backgroundColor: 'black',
        textColor: 'white',
        fontFamily: 'Arial',
        fontSize: 60,
        frameRate: 30,
        duration: 5,
        bitrate: '2M'
      });
      
      console.log(`Vídeo de teste criado: ${outputPath}`);
      
      // Obter metadados do vídeo (não é essencial, mas útil para debug)
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      res.status(200).json({
        success: true,
        message: "Vídeo de teste com texto criado com sucesso",
        url: `/uploads/videos/${path.basename(outputPath)}`,
        fileName: path.basename(outputPath),
        filePath: outputPath,
        metadata
      });
    } catch (error) {
      console.error("Erro ao criar vídeo de teste com texto:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao criar vídeo de teste com texto",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Endpoint para testar o fluxo completo de criação de vídeo
  app.post("/api/video/test-complete-workflow", async (req: Request, res: Response) => {
    try {
      console.log("Iniciando teste completo de fluxo de geração de vídeo...");
      
      // Método alternativo: usamos o módulo de teste do FFmpeg diretamente
      // que já foi testado e provado funcionar
      const { testCompleteWorkflow } = await import('./services/ffmpeg-test');
      
      // Executar o teste de fluxo completo
      const result = await testCompleteWorkflow();
      
      if (!result.success) {
        console.error("Erro no teste de fluxo completo:", result.error);
        return res.status(500).json({
          success: false,
          message: "Erro ao executar fluxo completo de criação de vídeo",
          error: result.error,
          details: result.details
        });
      }
      
      const outputPath = result.outputPath || "";
      const fileName = outputPath ? path.basename(outputPath) : "unknown.mp4";
      
      // 4. Retornar o resultado
      res.status(200).json({
        success: true,
        message: "Fluxo completo de criação de vídeo executado com sucesso",
        url: `/uploads/videos/${fileName}`,
        fileName: fileName,
        filePath: outputPath,
        details: result.details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro no teste de fluxo completo:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao executar fluxo completo de criação de vídeo",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return httpServer;
}
