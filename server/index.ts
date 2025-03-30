import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { cacheService } from "./services/caching";
import { AIOrchestrator } from "./services/AIOrchestrator";
import { resilienceService } from "./services/resilience-service";
import { OpenAIService } from "./services/openai";
import { MistralAIService } from "./services/mistral";
import { HuggingFaceService } from "./services/huggingface";
import { GoogleCloudTTSService } from "./services/google-cloud-tts";
import { CoquiTTSService } from "./services/coqui-tts";
import { ResponsiveVoiceService } from "./services/responsive-voice";
import { PexelsService } from "./services/pexels";
import { FFmpegService } from "./services/ffmpeg";
import { emailMarketingService } from "./services/email-marketing-service";
import { exportService } from "./services/export-service";
import { socialMediaOrchestrator } from "./services/social-media-orchestrator";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Registrar testes de resiliência para todos os serviços
async function registerResilienceTests() {
  try {
    log("Registrando testes de resiliência para serviços", "resilience-setup");
    
    // Teste para OpenAI
    resilienceService.registerTest("openai", async () => {
      try {
        const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || "");
        const startTime = Date.now();
        const result = await openaiService.suggestTrendingTopics("test", 1);
        const endTime = Date.now();
        
        return {
          success: Array.isArray(result) && result.length > 0,
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para Mistral AI
    resilienceService.registerTest("mistral", async () => {
      try {
        const mistralService = new MistralAIService(process.env.MISTRAL_API_KEY || "");
        const startTime = Date.now();
        const result = await mistralService.suggestTrendingTopics("test", 1);
        const endTime = Date.now();
        
        return {
          success: Array.isArray(result) && result.length > 0,
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para HuggingFace
    resilienceService.registerTest("huggingface", async () => {
      try {
        const huggingfaceService = new HuggingFaceService(process.env.HUGGINGFACE_API_KEY || "");
        const startTime = Date.now();
        const result = await huggingfaceService.suggestTrendingTopics("test", 1);
        const endTime = Date.now();
        
        return {
          success: Array.isArray(result) && result.length > 0,
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para Google TTS
    resilienceService.registerTest("google_tts", async () => {
      try {
        const ttsService = new GoogleTTSService(process.env.GOOGLE_TTS_API_KEY || "");
        const startTime = Date.now();
        const result = await ttsService.getVoices("pt-BR");
        const endTime = Date.now();
        
        return {
          success: result && Array.isArray(result.voices) && result.voices.length > 0,
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para Coqui TTS
    resilienceService.registerTest("tts_service", async () => {
      try {
        const coquiService = new CoquiTTSService();
        const startTime = Date.now();
        let fallbackUsed = false;
        let fallbackService = null;
        
        try {
          await coquiService.convertTextToSpeech("Teste de conversão de texto para fala", "pt-BR");
        } catch (coquiError) {
          fallbackUsed = true;
          fallbackService = "responsive_voice";
          const rvService = new ResponsiveVoiceService();
          await rvService.convertTextToSpeech("Teste de conversão de texto para fala", "pt-BR");
        }
        
        const endTime = Date.now();
        
        return {
          success: true,
          responseTime: endTime - startTime,
          fallbackUsed,
          fallbackService
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para Pexels API
    resilienceService.registerTest("pexels", async () => {
      try {
        const pexelsService = new PexelsService(process.env.PEXELS_API_KEY || "");
        const startTime = Date.now();
        const result = await pexelsService.searchPhotos("test", 1);
        const endTime = Date.now();
        
        return {
          success: result && Array.isArray(result.photos) && result.photos.length > 0,
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para FFmpeg
    resilienceService.registerTest("ffmpeg", async () => {
      try {
        const ffmpegService = new FFmpegService();
        const startTime = Date.now();
        const version = await ffmpegService.getVersion();
        const endTime = Date.now();
        
        return {
          success: version && version.includes("ffmpeg"),
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para Cache Service
    resilienceService.registerTest("cache_service", async () => {
      try {
        const startTime = Date.now();
        // Testar operações básicas do cache
        await cacheService.set("test_key", "test_value", 60);
        const value = await cacheService.get("test_key");
        await cacheService.delete("test_key");
        const endTime = Date.now();
        
        return {
          success: value === "test_value",
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para Email Marketing Service
    resilienceService.registerTest("email_service", async () => {
      try {
        const startTime = Date.now();
        // Apenas verificar se o serviço está inicializado, sem enviar emails reais
        const active = emailMarketingService !== undefined;
        const endTime = Date.now();
        
        return {
          success: active,
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para Export Service
    resilienceService.registerTest("export_service", async () => {
      try {
        const startTime = Date.now();
        // Verificar se o serviço está inicializado
        const active = exportService !== undefined;
        const endTime = Date.now();
        
        return {
          success: active,
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    // Teste para Social Media Orchestrator
    resilienceService.registerTest("social_media", async () => {
      try {
        const startTime = Date.now();
        // Verificar se o serviço está inicializado
        const active = socialMediaOrchestrator !== undefined;
        const endTime = Date.now();
        
        return {
          success: active,
          responseTime: endTime - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        return {
          success: false,
          responseTime: 0,
          fallbackUsed: false,
          errorMessage: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    log("Testes de resiliência registrados com sucesso", "resilience-setup");
    
    // Executar testes iniciais
    await resilienceService.runAllTests();
  } catch (error) {
    log(`Erro ao registrar testes de resiliência: ${error instanceof Error ? error.message : String(error)}`, "resilience-setup");
  }
}

(async () => {
  // Iniciar o registro de testes de resiliência para monitoramento
  registerResilienceTests();
  
  // Iniciar a aplicação
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
