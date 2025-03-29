import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
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
import { FFmpegService } from "./services/ffmpeg";

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
    case 'openai_tts':
      return new OpenAITTSService(process.env.OPENAI_API_KEY || '');
    case 'ffmpeg':
      return new FFmpegService();
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

  // 6.4 FFmpeg video generation
  app.post("/api/video/create-from-images", upload.array("images"), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const {
        outputFileName = `video_${Date.now()}.mp4`,
        duration,
        transition,
        transitionDuration,
        width,
        height,
      } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Images are required" });
      }
      
      const ffmpegService = initializeService(req, 'ffmpeg') as FFmpegService;
      
      const imagePaths = files.map(file => file.path);
      
      const outputPath = await ffmpegService.createVideoFromImages({
        imagePaths,
        outputFileName,
        duration: duration ? parseFloat(duration) : undefined,
        transition: transition || undefined,
        transitionDuration: transitionDuration ? parseFloat(transitionDuration) : undefined,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
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

  // 7. Serve uploaded files
  app.use("/uploads", express.static(UPLOADS_DIR));
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
