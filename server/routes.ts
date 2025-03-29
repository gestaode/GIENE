import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
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

      let script;
      try {
        const openaiService = initializeService(req, 'openai') as OpenAIService;
        script = await openaiService.generateVideoScript({
          theme,
          targetAudience,
          duration,
          tone,
          keywords,
          additionalInstructions
        });
      } catch (error) {
        // Fallback para Gemini se OpenAI falhar
        const geminiService = initializeService(req, 'gemini') as GeminiService;
        script = await geminiService.generateVideoScript({
          theme,
          targetAudience,
          duration,
          tone,
          keywords,
          additionalInstructions
        });
      }
      
      if (!theme) {
        return res.status(400).json({ message: "Theme is required" });
      }
      
      const openaiService = initializeService(req, 'openai') as OpenAIService;
      
      const script = await openaiService.generateVideoScript({
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
        return res.status(400).json({ message: "Video and audio files are required" });
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
        return res.status(400).json({ message: "Video URL and audio URL are required" });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      // Cria o diretório de upload temporário se não existir
      const tempDir = path.join(process.cwd(), "uploads/temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Baixa o vídeo
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video from ${videoUrl}`);
      }
      const videoBuffer = await videoResponse.arrayBuffer();
      const videoExtension = videoUrl.split('.').pop() || 'mp4';
      const videoPath = path.join(tempDir, `video_${Date.now()}.${videoExtension}`);
      fs.writeFileSync(videoPath, Buffer.from(videoBuffer));
      
      // Baixa o áudio
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio from ${audioUrl}`);
      }
      const audioBuffer = await audioResponse.arrayBuffer();
      const audioExtension = audioUrl.split('.').pop() || 'mp3';
      const audioPath = path.join(tempDir, `audio_${Date.now()}.${audioExtension}`);
      fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
      
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
        bitrate: bitrate || undefined,
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
        return res.status(400).json({ message: "Video URLs are required" });
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
            throw new Error(`Failed to fetch video from ${videoUrl}`);
          }
          
          const videoBuffer = await response.arrayBuffer();
          const extension = videoUrl.split('.').pop() || 'mp4';
          const videoPath = path.join(tempDir, `video_${Date.now()}_${i}.${extension}`);
          
          fs.writeFileSync(videoPath, Buffer.from(videoBuffer));
          videoPaths.push(videoPath);
        } catch (error) {
          console.warn(`Error downloading video from ${videoUrl}: ${error}`);
          // Continue with other videos
        }
      }
      
      if (videoPaths.length === 0) {
        return res.status(400).json({ message: "Failed to download any videos" });
      }
      
      const outputPath = await ffmpegService.combineVideos({
        videoPaths,
        outputFileName,
        transition: transition || undefined,
        transitionDuration: transitionDuration ? parseFloat(transitionDuration) : undefined,
      });
      
      // Get video metadata
      const metadata = await ffmpegService.getVideoMetadata(outputPath);
      
      // Limpar arquivos temporários
      videoPaths.forEach(videoPath => {
        try {
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        } catch (e) { /* ignore cleanup errors */ }
      });
      
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

  // 7. Serve uploaded files
  app.use("/uploads", express.static(UPLOADS_DIR));
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
