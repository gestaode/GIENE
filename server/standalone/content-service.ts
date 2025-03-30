/**
 * Serviço independente para geração de conteúdo
 * 
 * Este arquivo implementa um servidor Express independente para o serviço de geração de conteúdo,
 * que pode ser executado como um microserviço separado.
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv-flow';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import contentApiRoutes from '../routes/content-api';
import { contentGenerationModule } from '../modules/content-generation';
import { log } from '../vite';

// Carregar variáveis de ambiente
dotenv.config();

// Criar aplicação Express
const app = express();
const PORT = process.env.CONTENT_SERVICE_PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                 // Limite por IP
  standardHeaders: true,    // Return rate limit info in headers
  legacyHeaders: false,     // Disable legacy headers
  message: 'Muitas requisições deste IP, por favor tente novamente mais tarde'
});

// Aplicar rate limiting a todas as rotas da API
app.use('/api', apiLimiter);

// Middleware de autenticação
app.use((req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  // Em produção, verificar a chave API em um armazenamento seguro
  // Para desenvolvimento, aceitar qualquer chave ou uma chave fixa
  if (process.env.NODE_ENV === 'production') {
    if (!apiKey || apiKey !== process.env.CONTENT_SERVICE_API_KEY) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'API key inválida ou ausente'
      });
    }
  }
  
  next();
});

// Rota de saúde para verificar se o serviço está rodando
app.get('/health', (req: Request, res: Response) => {
  const status = contentGenerationModule.getAIServicesStatus();
  
  res.json({
    service: 'content-generation',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    providers: {
      openai: status.providers.openai.available,
      mistral: status.providers.mistral.available,
      huggingface: status.providers.huggingface.available,
      gemini: status.providers.gemini.available
    },
    fallbackAvailable: status.fallbackAvailable
  });
});

// Rotas da API
app.use('/api/content', contentApiRoutes);

// Middleware de tratamento de erros
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  log('Erro no serviço de geração de conteúdo:', 'error');
  log(err.stack, 'error');
  
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    success: false
  });
});

// 404 - Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Não encontrado',
    message: `Rota ${req.method} ${req.url} não encontrada`
  });
});

// Iniciar o servidor
if (require.main === module) {
  app.listen(PORT, () => {
    log(`Serviço de geração de conteúdo rodando na porta ${PORT}`, 'info');
    
    // Iniciar testes de resiliência
    contentGenerationModule.getAIServicesStatus();
  });
}

export default app;