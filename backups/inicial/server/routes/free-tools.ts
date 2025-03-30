/**
 * Rotas para o módulo de ferramentas gratuitas
 */

import { Router, Request, Response } from 'express';
import { freeToolsModule } from '../modules/free-tools';

const router = Router();

// Gerar conteúdo usando HuggingFace ou fallback local
router.post('/content', async (req: Request, res: Response) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'O prompt é obrigatório' 
      });
    }
    
    const content = await freeToolsModule.generateContent(
      prompt, 
      options || {}
    );
    
    return res.json({ 
      success: true, 
      content 
    });
  } catch (error) {
    console.error('Erro ao gerar conteúdo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao gerar conteúdo'
    });
  }
});

// Gerar roteiro de vídeo sobre finanças
router.post('/financial-script', async (req: Request, res: Response) => {
  try {
    const { topic, audience, duration, includeCallToAction, style } = req.body;
    
    if (!topic || !audience || !duration) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tópico, público-alvo e duração são obrigatórios' 
      });
    }
    
    const script = await freeToolsModule.generateFinancialVideoScript({
      topic,
      audience,
      duration,
      includeCallToAction,
      style
    });
    
    return res.json({ 
      success: true, 
      script 
    });
  } catch (error) {
    console.error('Erro ao gerar roteiro:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao gerar roteiro'
    });
  }
});

// Obter sugestões de palavras-chave para SEO
router.get('/seo/keywords', async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword as string;
    const language = req.query.language as string || 'pt-br';
    
    if (!keyword) {
      return res.status(400).json({ 
        success: false, 
        message: 'A palavra-chave é obrigatória' 
      });
    }
    
    const seoData = await freeToolsModule.getKeywordSuggestions(keyword, language);
    
    return res.json({ 
      success: true, 
      data: seoData 
    });
  } catch (error) {
    console.error('Erro ao obter sugestões de palavras-chave:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao obter sugestões de SEO'
    });
  }
});

// Obter perguntas populares sobre um tópico
router.get('/popular-questions', async (req: Request, res: Response) => {
  try {
    const topic = req.query.topic as string;
    const language = req.query.language as string || 'pt-br';
    
    if (!topic) {
      return res.status(400).json({ 
        success: false, 
        message: 'O tópico é obrigatório' 
      });
    }
    
    const questions = await freeToolsModule.getPopularQuestions(topic, language);
    
    return res.json({ 
      success: true, 
      questions 
    });
  } catch (error) {
    console.error('Erro ao obter perguntas populares:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao obter perguntas populares'
    });
  }
});

// Criar campanha de email
router.post('/email-campaign', async (req: Request, res: Response) => {
  try {
    const { name, subject, content, recipients, scheduled } = req.body;
    
    if (!name || !subject || !content || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos para criação de campanha de email' 
      });
    }
    
    const scheduledDate = scheduled ? new Date(scheduled) : undefined;
    
    const campaign = await freeToolsModule.createEmailCampaign({
      name,
      subject,
      content,
      recipients,
      scheduled: scheduledDate
    });
    
    return res.json({ 
      success: true, 
      campaign 
    });
  } catch (error) {
    console.error('Erro ao criar campanha de email:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao criar campanha de email'
    });
  }
});

// Listar campanhas de email
router.get('/email-campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = await freeToolsModule.listEmailCampaigns();
    
    return res.json({ 
      success: true, 
      campaigns 
    });
  } catch (error) {
    console.error('Erro ao listar campanhas de email:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao listar campanhas de email'
    });
  }
});

// Enviar webhook (simulação de integração com Zapier)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { webhookUrl, data } = req.body;
    
    if (!webhookUrl || !data) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL de webhook e dados são obrigatórios' 
      });
    }
    
    const success = await freeToolsModule.sendWebhook(webhookUrl, data);
    
    return res.json({ 
      success 
    });
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao enviar webhook'
    });
  }
});

// Gerar questionário interativo (chatbot simples)
router.post('/questionnaire', async (req: Request, res: Response) => {
  try {
    const { topic, numQuestions } = req.body;
    
    if (!topic) {
      return res.status(400).json({ 
        success: false, 
        message: 'O tópico é obrigatório' 
      });
    }
    
    const questionnaire = await freeToolsModule.generateInteractiveQuestionnaire(
      topic, 
      numQuestions || 5
    );
    
    return res.json({ 
      success: true, 
      questionnaire 
    });
  } catch (error) {
    console.error('Erro ao gerar questionário:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao gerar questionário'
    });
  }
});

// Verificar o status das integrações
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = freeToolsModule.getStatus();
    
    return res.json({ 
      success: true, 
      status 
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno ao verificar status'
    });
  }
});

export default router;