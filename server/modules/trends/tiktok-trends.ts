/**
 * Módulo de Detecção de Tendências do TikTok
 * 
 * Este módulo integra múltiplas APIs para detectar tendências atuais no TikTok,
 * incluindo hashtags populares, músicas em alta e desafios virais.
 */

import { log } from '../../vite';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { Mistral } from '@mistralai/mistralai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HfInference } from '@huggingface/inference';

// Inicializar clientes de IA
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

const mistral = process.env.MISTRAL_API_KEY ? new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
}) : null;

const gemini = process.env.GEMINI_API_KEY ? 
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const huggingface = process.env.HUGGINGFACE_API_KEY ?
  new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

// Cache em memória
const trendsCache: {
  hashtags: { data: TikTokTrend[] | null, timestamp: number },
  sounds: { data: TikTokTrend[] | null, timestamp: number },
  challenges: { data: TikTokTrend[] | null, timestamp: number }
} = {
  hashtags: {
    data: null,
    timestamp: 0
  },
  sounds: {
    data: null,
    timestamp: 0
  },
  challenges: {
    data: null,
    timestamp: 0
  }
};

// Cache TTL em segundos (6 horas para tendências)
const TREND_CACHE_TTL = 6 * 60 * 60 * 1000; // em milissegundos

/**
 * Interface para tendências do TikTok
 */
export interface TikTokTrend {
  id: string;
  name: string;
  description?: string;
  views?: number;
  posts?: number;
  engagement?: number;
  rank?: number;
  growthRate?: number;
  url?: string;
  thumbnailUrl?: string;
  category?: string;
  lastUpdated: Date;
}

/**
 * Interface para estatísticas do módulo
 */
interface ModuleStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  lastUpdated: Date;
  averageResponseTime: number;
  providerUsage: {
    tiktokApi: number;
    openai: number;
    mistral: number;
    gemini: number;
    huggingface: number;
    rapidapi: number;
    scraping: number;
  };
}

// Estatísticas do módulo
const moduleStats: ModuleStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  lastUpdated: new Date(),
  averageResponseTime: 0,
  providerUsage: {
    tiktokApi: 0,
    openai: 0,
    mistral: 0,
    gemini: 0,
    huggingface: 0,
    rapidapi: 0,
    scraping: 0
  }
};

// Armazenar tempos de resposta para cálculo de média
const responseTimes: number[] = [];

/**
 * Atualiza as estatísticas do módulo
 */
function updateStats(success: boolean, cacheHit: boolean, responseTime: number, provider?: string): void {
  moduleStats.totalRequests++;
  moduleStats.lastUpdated = new Date();
  
  if (success) {
    moduleStats.successfulRequests++;
  } else {
    moduleStats.failedRequests++;
  }
  
  if (cacheHit) {
    moduleStats.cacheHits++;
  } else {
    moduleStats.cacheMisses++;
  }
  
  // Atualizar tempo médio de resposta
  responseTimes.push(responseTime);
  if (responseTimes.length > 100) {
    responseTimes.shift(); // Manter apenas os últimos 100 valores
  }
  
  moduleStats.averageResponseTime = 
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
  // Atualizar uso de provedor
  if (provider && !cacheHit) {
    switch (provider) {
      case 'tiktokApi':
      case 'openai':
      case 'mistral':
      case 'gemini':
      case 'huggingface':
      case 'rapidapi':
      case 'scraping':
        moduleStats.providerUsage[provider]++;
        break;
    }
  }
}

/**
 * Verifica o cache e retorna os dados se forem válidos
 */
function checkCache<T extends TikTokTrend[]>(cacheKey: 'hashtags' | 'sounds' | 'challenges'): T | null {
  const cacheEntry = trendsCache[cacheKey];
  
  if (cacheEntry.data && (Date.now() - cacheEntry.timestamp) < TREND_CACHE_TTL) {
    return cacheEntry.data as T;
  }
  
  return null;
}

/**
 * Atualiza o cache com novos dados
 */
function updateCache<T extends TikTokTrend[]>(cacheKey: 'hashtags' | 'sounds' | 'challenges', data: T): void {
  trendsCache[cacheKey] = {
    data: data,
    timestamp: Date.now()
  };
}

/**
 * Obtém hashtags em alta no TikTok
 * Esta função implementa uma cascata de alternativas para obter os dados
 */
export async function getTrendingHashtags(
  category?: string,
  limit: number = 20
): Promise<{
  trends: TikTokTrend[],
  source: string,
  requestId: string
}> {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  try {
    // Verificar cache primeiro
    const cachedData = checkCache<TikTokTrend[]>('hashtags');
    
    if (cachedData) {
      log(`Tendências do TikTok encontradas no cache`, 'info');
      
      // Filtrar por categoria se especificado
      const filteredTrends = category 
        ? cachedData.filter(trend => trend.category === category)
        : cachedData;
        
      // Aplicar limite
      const limitedTrends = filteredTrends.slice(0, limit);
      
      const endTime = Date.now();
      updateStats(true, true, endTime - startTime);
      
      return {
        trends: limitedTrends,
        source: 'cache',
        requestId
      };
    }
    
    // Cache não encontrado, tentar obter dados atualizados
    log(`Cache de tendências não encontrado ou expirado, buscando dados atualizados`, 'info');
    
    // Tentativa 1: API RapidAPI TikTok
    try {
      log('Tentando obter tendências via RapidAPI TikTok', 'info');
      const trends = await getTrendsFromRapidAPI();
      updateCache('hashtags', trends);
      
      // Filtrar e limitar resultados
      const filteredTrends = category 
        ? trends.filter(trend => trend.category === category)
        : trends;
      const limitedTrends = filteredTrends.slice(0, limit);
      
      const endTime = Date.now();
      updateStats(true, false, endTime - startTime, 'rapidapi');
      
      return {
        trends: limitedTrends,
        source: 'rapidapi',
        requestId
      };
    } catch (rapidApiError) {
      log(`Erro ao buscar tendências via RapidAPI: ${rapidApiError}`, 'warning');
      
      // Tentativa 2: Web Scraping
      try {
        log('Tentando obter tendências via web scraping', 'info');
        const trends = await getTrendsFromScraping();
        updateCache('hashtags', trends);
        
        // Filtrar e limitar resultados
        const filteredTrends = category 
          ? trends.filter(trend => trend.category === category)
          : trends;
        const limitedTrends = filteredTrends.slice(0, limit);
        
        const endTime = Date.now();
        updateStats(true, false, endTime - startTime, 'scraping');
        
        return {
          trends: limitedTrends,
          source: 'scraping',
          requestId
        };
      } catch (scrapingError) {
        log(`Erro ao buscar tendências via scraping: ${scrapingError}`, 'warning');
        
        // Tentativa 3: OpenAI para gerar tendências baseadas em conhecimento atual
        try {
          log('Tentando gerar tendências via OpenAI', 'info');
          const trends = await getTrendsFromOpenAI(category);
          updateCache('hashtags', trends);
          
          // Aplicar limite
          const limitedTrends = trends.slice(0, limit);
          
          const endTime = Date.now();
          updateStats(true, false, endTime - startTime, 'openai');
          
          return {
            trends: limitedTrends,
            source: 'openai',
            requestId
          };
        } catch (openaiError) {
          log(`Erro ao gerar tendências via OpenAI: ${openaiError}`, 'warning');
          
          // Tentativa 4: Mistral como fallback para OpenAI
          try {
            log('Tentando gerar tendências via Mistral', 'info');
            const trends = await getTrendsFromMistral(category);
            updateCache('hashtags', trends);
            
            // Aplicar limite
            const limitedTrends = trends.slice(0, limit);
            
            const endTime = Date.now();
            updateStats(true, false, endTime - startTime, 'mistral');
            
            return {
              trends: limitedTrends,
              source: 'mistral',
              requestId
            };
          } catch (mistralError) {
            log(`Erro ao gerar tendências via Mistral: ${mistralError}`, 'warning');
            
            // Tentativa 5: Gemini como alternativa final
            try {
              log('Tentando gerar tendências via Gemini', 'info');
              const trends = await getTrendsFromGemini(category);
              updateCache('hashtags', trends);
              
              // Aplicar limite
              const limitedTrends = trends.slice(0, limit);
              
              const endTime = Date.now();
              updateStats(true, false, endTime - startTime, 'gemini');
              
              return {
                trends: limitedTrends,
                source: 'gemini',
                requestId
              };
            } catch (geminiError) {
              log(`Erro ao gerar tendências via Gemini: ${geminiError}`, 'error');
              // Se todas as opções falharem, usar os dados mockados do nosso dataset local
              throw new Error("Todas as fontes de dados falharam");
            }
          }
        }
      }
    }
  } catch (error) {
    // Todas as tentativas falharam, usar nosso dataset local
    log(`Erro ao buscar tendências do TikTok de todas as fontes, usando dataset local: ${error}`, 'error');
    
    const trends = getHashtagsFromLocalDataset(category, limit);
    
    const endTime = Date.now();
    updateStats(false, false, endTime - startTime);
    
    return {
      trends,
      source: 'local_dataset',
      requestId
    };
  }
}

/**
 * Busca tendências do TikTok via RapidAPI
 * Requer uma chave de API válida para RapidAPI
 */
async function getTrendsFromRapidAPI(): Promise<TikTokTrend[]> {
  // Verificar se existe uma chave API em variáveis de ambiente para RapidAPI
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    throw new Error('RapidAPI key não disponível');
  }
  
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://tiktok-trends.p.rapidapi.com/trending/hashtags',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'tiktok-trends.p.rapidapi.com'
      }
    });
    
    if (response.status !== 200 || !response.data) {
      throw new Error(`Resposta inválida da API: ${response.status}`);
    }
    
    // Converter resposta da API para nosso formato
    return mapRapidAPIResponseToTrends(response.data);
  } catch (error) {
    log(`Erro na requisição à RapidAPI: ${error}`, 'error');
    throw error;
  }
}

/**
 * Converte resposta da RapidAPI para nosso formato padrão
 */
function mapRapidAPIResponseToTrends(apiData: any): TikTokTrend[] {
  // Implementação dependeria da estrutura exata da resposta da API
  if (!Array.isArray(apiData)) {
    throw new Error('Formato de resposta da API inesperado');
  }
  
  return apiData.map(item => {
    return {
      id: uuidv4(),
      name: item.hashtag || item.name,
      description: item.description || `Tendência popular no TikTok`,
      views: parseInt(item.viewCount || item.views || '0'),
      posts: parseInt(item.postCount || item.posts || '0'),
      engagement: parseFloat(item.engagement || '0'),
      rank: item.rank || 0,
      growthRate: parseFloat(item.growthRate || '0'),
      url: `https://www.tiktok.com/tag/${(item.hashtag || item.name).replace('#', '')}`,
      category: item.category || 'geral',
      lastUpdated: new Date()
    };
  });
}

/**
 * Obtém tendências do TikTok através de web scraping
 * Nota: O uso de web scraping deve seguir os termos de serviço do site-alvo
 */
async function getTrendsFromScraping(): Promise<TikTokTrend[]> {
  try {
    // A implementação real usaria um serviço de scraping ou bibliotecas como cheerio
    // Esta é uma implementação simplificada para exemplo
    const response = await axios.get('https://www.tiktok.com/discover');
    
    // Processo de extração de dados da página HTML
    // Essa seria a implementação real com análise do HTML
    
    // Como exemplo, vamos assumir que não foi possível fazer scraping
    // devido a restrições técnicas ou legais
    throw new Error('Web scraping não implementado por questões de TOS');
  } catch (error) {
    log(`Erro no web scraping: ${error}`, 'error');
    throw error;
  }
}

/**
 * Gera tendências baseadas no conhecimento do modelo OpenAI
 */
async function getTrendsFromOpenAI(category?: string): Promise<TikTokTrend[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key não disponível');
  }
  
  try {
    const prompt = category 
      ? `Gere uma lista JSON das 20 hashtags mais populares atualmente no TikTok na categoria "${category}". Inclua: nome da hashtag (com #), descrição curta, número estimado de visualizações, número estimado de posts, categoria e taxa de crescimento (%). Baseie-se apenas em tendências reais e atuais do TikTok, não invente dados.`
      : `Gere uma lista JSON das 20 hashtags mais populares atualmente no TikTok. Inclua: nome da hashtag (com #), descrição curta, número estimado de visualizações, número estimado de posts, categoria e taxa de crescimento (%). Baseie-se apenas em tendências reais e atuais do TikTok, não invente dados.`;
    
    // Fazendo a chamada para o modelo GPT-4o da OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // o modelo mais recente da OpenAI é o "gpt-4o", lançado em 13 de maio de 2024
      messages: [
        {
          role: "system",
          content: "Você é um especialista em tendências do TikTok. Forneça apenas informações precisas e atualizadas sobre tendências reais, baseando-se em seu conhecimento. Responda sempre em formato JSON para facilitar o parsing."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }
    
    const jsonData = JSON.parse(content);
    
    if (!jsonData.hashtags || !Array.isArray(jsonData.hashtags)) {
      throw new Error('Formato de resposta inválido da OpenAI');
    }
    
    // Mapear para nosso formato
    return jsonData.hashtags.map(item => ({
      id: uuidv4(),
      name: item.nome || item.name,
      description: item.descricao || item.description,
      views: parseInt(item.visualizacoes || item.views || '0'),
      posts: parseInt(item.posts || '0'),
      engagement: parseInt(item.visualizacoes || item.views || '0') / parseInt(item.posts || '1'),
      rank: 0, // Será calculado depois
      growthRate: parseFloat(item.taxa_crescimento || item.growth_rate || '0'),
      url: `https://www.tiktok.com/tag/${(item.nome || item.name).replace('#', '')}`,
      category: item.categoria || item.category || category || 'geral',
      lastUpdated: new Date()
    }));
  } catch (error) {
    log(`Erro na chamada do OpenAI: ${error}`, 'error');
    throw error;
  }
}

/**
 * Gera tendências baseadas no conhecimento do modelo Mistral AI
 */
async function getTrendsFromMistral(category?: string): Promise<TikTokTrend[]> {
  if (!mistral) {
    throw new Error('Mistral API client não disponível');
  }
  
  try {
    const prompt = category 
      ? `Gere uma lista JSON das 20 hashtags mais populares atualmente no TikTok na categoria "${category}". Inclua: nome da hashtag (com #), descrição curta, número estimado de visualizações, número estimado de posts, categoria e taxa de crescimento (%). O formato da resposta deve ser um objeto JSON com um array "hashtags". Base seus dados em tendências reais do TikTok.`
      : `Gere uma lista JSON das 20 hashtags mais populares atualmente no TikTok. Inclua: nome da hashtag (com #), descrição curta, número estimado de visualizações, número estimado de posts, categoria e taxa de crescimento (%). O formato da resposta deve ser um objeto JSON com um array "hashtags". Base seus dados em tendências reais do TikTok.`;
    
    const response = await mistral.chat.complete({
      model: "mistral-large-latest", // Usando o modelo mais avançado disponível
      messages: [
        {
          role: "system",
          content: "Você é um especialista em tendências do TikTok. Forneça apenas informações precisas sobre tendências reais. Responda em formato JSON com um array 'hashtags'."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error('Resposta vazia ou inválida do Mistral');
    }
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Resposta vazia do Mistral');
    }
    
    // Tentar extrair o JSON da resposta, que pode estar em vários formatos
    let jsonData = null;
    
    // Primeiro, verificar se a resposta já é um objeto JSON válido
    try {
      if (typeof responseContent === 'string') {
        // Tentativa 1: Diretamente como JSON
        jsonData = JSON.parse(responseContent);
      } else if (typeof responseContent === 'object') {
        // Se já é um objeto, usar diretamente
        jsonData = responseContent;
      }
    } catch (err) {
      // Não é um JSON direto, tentar extrair
      try {
        // Tentativa 2: Extrair de um bloco de código markdown
        if (typeof responseContent === 'string') {
          const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                           responseContent.match(/{[\s\S]*}/);
          
          if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            jsonData = JSON.parse(jsonString);
          }
        }
      } catch (extractErr) {
        // Ambas tentativas falharam
        throw new Error(`Não foi possível extrair JSON da resposta do Mistral: ${extractErr}`);
      }
    }
    
    if (!jsonData) {
      throw new Error('Não foi possível extrair JSON válido da resposta do Mistral');
    }
    
    if (!jsonData.hashtags || !Array.isArray(jsonData.hashtags)) {
      throw new Error('Formato de resposta inválido do Mistral');
    }
    
    // Mapear para nosso formato
    return jsonData.hashtags.map(item => ({
      id: uuidv4(),
      name: item.nome || item.name,
      description: item.descricao || item.description,
      views: parseInt(item.visualizacoes || item.views || '0'),
      posts: parseInt(item.posts || '0'),
      engagement: parseInt(item.visualizacoes || item.views || '0') / parseInt(item.posts || '1'),
      rank: 0,
      growthRate: parseFloat(item.taxa_crescimento || item.growth_rate || '0'),
      url: `https://www.tiktok.com/tag/${(item.nome || item.name).replace('#', '')}`,
      category: item.categoria || item.category || category || 'geral',
      lastUpdated: new Date()
    }));
  } catch (error) {
    log(`Erro na chamada do Mistral: ${error}`, 'error');
    throw error;
  }
}

/**
 * Gera tendências baseadas no conhecimento do modelo Gemini da Google
 */
async function getTrendsFromGemini(category?: string): Promise<TikTokTrend[]> {
  if (!gemini) {
    throw new Error('Gemini API client não disponível');
  }
  
  try {
    const prompt = category 
      ? `Gere uma lista JSON das 20 hashtags mais populares atualmente no TikTok na categoria "${category}". Inclua: nome da hashtag (com #), descrição curta, número estimado de visualizações, número estimado de posts, categoria e taxa de crescimento (%). Formato JSON com array "hashtags".`
      : `Gere uma lista JSON das 20 hashtags mais populares atualmente no TikTok. Inclua: nome da hashtag (com #), descrição curta, número estimado de visualizações, número estimado de posts, categoria e taxa de crescimento (%). Formato JSON com array "hashtags".`;
    
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    const response = result.response;
    if (!response) {
      throw new Error('Resposta vazia ou inválida do Gemini');
    }
    
    const responseContent = response.text();
    if (!responseContent) {
      throw new Error('Resposta vazia do Gemini');
    }
    
    // Tentar extrair o JSON da resposta, que pode estar em vários formatos
    let jsonData = null;
    
    // Primeiro, verificar se a resposta já é um objeto JSON válido
    try {
      if (typeof responseContent === 'string') {
        // Tentativa 1: Diretamente como JSON
        jsonData = JSON.parse(responseContent);
      } else if (typeof responseContent === 'object') {
        // Se já é um objeto, usar diretamente
        jsonData = responseContent;
      }
    } catch (err) {
      // Não é um JSON direto, tentar extrair
      try {
        // Tentativa 2: Extrair de um bloco de código markdown
        if (typeof responseContent === 'string') {
          const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                         responseContent.match(/{[\s\S]*}/);
          
          if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            jsonData = JSON.parse(jsonString);
          }
        }
      } catch (extractErr) {
        // Ambas tentativas falharam
        throw new Error(`Não foi possível extrair JSON da resposta do Gemini: ${extractErr}`);
      }
    }
    
    if (!jsonData) {
      throw new Error('Não foi possível extrair JSON válido da resposta do Gemini');
    }
    
    if (!jsonData.hashtags || !Array.isArray(jsonData.hashtags)) {
      throw new Error('Formato de resposta inválido do Gemini');
    }
    
    // Mapear para nosso formato
    return jsonData.hashtags.map(item => ({
      id: uuidv4(),
      name: item.nome || item.name,
      description: item.descricao || item.description,
      views: parseInt(item.visualizacoes || item.views || '0'),
      posts: parseInt(item.posts || '0'),
      engagement: parseInt(item.visualizacoes || item.views || '0') / parseInt(item.posts || '1'),
      rank: 0,
      growthRate: parseFloat(item.taxa_crescimento || item.growth_rate || '0'),
      url: `https://www.tiktok.com/tag/${(item.nome || item.name).replace('#', '')}`,
      category: item.categoria || item.category || category || 'geral',
      lastUpdated: new Date()
    }));
  } catch (error) {
    log(`Erro na chamada do Gemini: ${error}`, 'error');
    throw error;
  }
}

/**
 * Obtém hashtags de um dataset local como último recurso
 */
function getHashtagsFromLocalDataset(category?: string, limit: number = 20): TikTokTrend[] {
  const now = new Date();
  
  // Lista de categorias e hashtags populares por categoria
  const trendsByCategory: {[key: string]: string[]} = {
    'danca': ['#dance', '#coreografia', '#dancachallenge', '#dancatutorial', '#passinhos', 
              '#dancavideo', '#dancamania', '#dancacomunidade', '#passos', '#dancatiktok'],
    
    'comida': ['#food', '#receita', '#cozinhando', '#foodie', '#comidaboa', '#comidinhas', 
               '#receitafacil', '#cozinhaemcasa', '#dicasculinarias', '#chefsdotiktok'],
    
    'fitness': ['#fitness', '#treino', '#academia', '#dicasdefitness', '#treinoemcasa', '#jornadadefitness', 
                '#fitnesstiktok', '#exercicios', '#emagrecimento', '#desafiofitness'],
    
    'beleza': ['#beleza', '#maquiagem', '#skincare', '#dicasdebeleza', '#rotinadebeleza', '#makebasica', 
               '#skincareroutine', '#tutorialdemaquiagem', '#transformacaocommakeup', '#produtosdebeleza'],
    
    'humor': ['#humor', '#comedia', '#piada', '#pegadinha', '#videoengraçado', '#esquete', '#risadas', 
              '#momentosengraçados', '#comediatiktok', '#pov'],
    
    'desafios': ['#desafio', '#desafiostiktok', '#trend', '#viral', '#dueto', 
                 '#desafiotrending', '#desafiodedanca', '#desafioviral', '#desafiomusical'],
    
    'educacao': ['#aprender', '#educacao', '#fatos', '#tutorial', '#comofazer', '#diy', '#educativo', 
                '#aprendizado', '#tiktokdidatico', '#fatosinteressantes'],
    
    'tecnologia': ['#tech', '#tecnologia', '#gadgets', '#smartphone', '#computador', '#dicastech', 
                  '#programacao', '#coding', '#inteligenciaartificial', '#tutorialtecnologia']
  };
  
  // Se categoria foi especificada e existe, usar hashtags daquela categoria
  // Senão, usar uma seleção de todas as categorias
  let selectedHashtags: string[] = [];
  
  if (category && trendsByCategory[category]) {
    selectedHashtags = trendsByCategory[category];
  } else {
    // Pegar algumas hashtags de cada categoria
    Object.values(trendsByCategory).forEach(categoryHashtags => {
      const randomHashtags = categoryHashtags
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      selectedHashtags = [...selectedHashtags, ...randomHashtags];
    });
  }
  
  // Embaralhar e limitar
  selectedHashtags = selectedHashtags
    .sort(() => 0.5 - Math.random())
    .slice(0, limit);
  
  // Converter hashtags em objetos de tendência
  return selectedHashtags.map((hashtag, index) => {
    const views = Math.floor(Math.random() * 900000000) + 100000000;
    const posts = Math.floor(Math.random() * 1000000) + 10000;
    
    return {
      id: uuidv4(),
      name: hashtag,
      description: `Tendência popular ${hashtag} no TikTok`,
      views: views,
      posts: posts,
      engagement: Math.floor((views / posts) * 100) / 100,
      rank: index + 1,
      growthRate: Math.floor(Math.random() * 500) / 10,
      url: `https://www.tiktok.com/tag/${hashtag.replace('#', '')}`,
      category: category || Object.keys(trendsByCategory).find(cat => 
        trendsByCategory[cat].includes(hashtag)
      ) || 'geral',
      lastUpdated: new Date(now.getTime() - Math.floor(Math.random() * 86400000))
    };
  });
}

/**
 * Busca sons/músicas em alta no TikTok
 */
export async function getTrendingSounds(
  limit: number = 20
): Promise<{
  trends: TikTokTrend[],
  source: string,
  requestId: string
}> {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  try {
    // Verificar cache primeiro
    const cachedData = checkCache<TikTokTrend[]>('sounds');
    
    if (cachedData) {
      const limitedTrends = cachedData.slice(0, limit);
      const endTime = Date.now();
      updateStats(true, true, endTime - startTime);
      
      return {
        trends: limitedTrends,
        source: 'cache',
        requestId
      };
    }
    
    // Cascade de alternativas similar ao método getTrendingHashtags
    // Começar com RapidAPI, depois OpenAI, etc.
    
    // Para exemplo, vamos simplificar e ir direto para OpenAI
    try {
      const trends = await getSoundsFromOpenAI();
      updateCache('sounds', trends);
      
      const limitedTrends = trends.slice(0, limit);
      const endTime = Date.now();
      updateStats(true, false, endTime - startTime, 'openai');
      
      return {
        trends: limitedTrends,
        source: 'openai',
        requestId
      };
    } catch (error) {
      // Fallback para dataset local
      log(`Erro ao obter sons populares: ${error}`, 'error');
      const trends = getSoundsFromLocalDataset(limit);
      
      const endTime = Date.now();
      updateStats(false, false, endTime - startTime);
      
      return {
        trends,
        source: 'local_dataset',
        requestId
      };
    }
  } catch (error) {
    log(`Erro ao buscar sons populares: ${error}`, 'error');
    
    const trends = getSoundsFromLocalDataset(limit);
    const endTime = Date.now();
    updateStats(false, false, endTime - startTime);
    
    return {
      trends,
      source: 'local_dataset',
      requestId
    };
  }
}

/**
 * Gera tendências de sons baseadas no conhecimento do modelo OpenAI
 */
async function getSoundsFromOpenAI(): Promise<TikTokTrend[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key não disponível');
  }
  
  try {
    const prompt = `Gere uma lista JSON das 20 músicas ou sons mais populares atualmente no TikTok. Inclua: nome da música/som, artista (se aplicável), descrição curta, número estimado de vídeos que usam este som e taxa de crescimento (%). O formato da resposta deve ser um objeto JSON com uma chave "sounds" contendo um array de objetos.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // o modelo mais recente da OpenAI é o "gpt-4o", lançado em 13 de maio de 2024
      messages: [
        {
          role: "system",
          content: "Você é um especialista em tendências musicais do TikTok. Forneça apenas informações precisas sobre músicas e sons populares reais. Responda em formato JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error('Resposta vazia ou inválida da OpenAI');
    }
    
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Resposta vazia da OpenAI');
    }
    
    // Tentar extrair o JSON da resposta
    let jsonData = null;
    
    try {
      // OpenAI com response_format: { type: "json_object" } deve retornar JSON válido
      jsonData = JSON.parse(responseContent);
    } catch (err) {
      // Se falhar, tentar extrair de maneira mais robusta
      try {
        // Verificar se há blocos de código markdown
        if (typeof responseContent === 'string') {
          const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                           responseContent.match(/{[\s\S]*}/);
          
          if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            jsonData = JSON.parse(jsonString);
          }
        }
      } catch (extractErr) {
        throw new Error(`Não foi possível extrair JSON válido da resposta da OpenAI: ${extractErr}`);
      }
    }
    
    if (!jsonData) {
      throw new Error('Não foi possível extrair JSON válido da resposta da OpenAI');
    }
    
    if (!jsonData.sounds || !Array.isArray(jsonData.sounds)) {
      throw new Error('Formato de resposta inválido da OpenAI');
    }
    
    // Mapear para nosso formato
    return jsonData.sounds.map((item, index) => ({
      id: uuidv4(),
      name: item.nome || item.name,
      description: `${item.descricao || item.description || ''} ${item.artista || item.artist ? `- por ${item.artista || item.artist}` : ''}`,
      views: parseInt(item.videos || item.views || '0'),
      posts: parseInt(item.videos || item.posts || '0'),
      engagement: 1,
      rank: index + 1,
      growthRate: parseFloat(item.taxa_crescimento || item.growth_rate || '0'),
      url: `https://www.tiktok.com/music/`,
      category: 'som',
      lastUpdated: new Date()
    }));
  } catch (error) {
    log(`Erro na chamada do OpenAI para sons: ${error}`, 'error');
    throw error;
  }
}

/**
 * Gera sons/músicas de fallback quando não é possível obter dados reais
 */
function getSoundsFromLocalDataset(limit: number = 20): TikTokTrend[] {
  const now = new Date();
  
  // Lista de sons populares fictícios
  const popularSounds = [
    'Música pop viral #1',
    'Remix de música clássica',
    'Som de transição popular',
    'Beat para dança viral',
    'Música para challenge #trending',
    'Áudio de comédia #1',
    'Som para tutorial de maquiagem',
    'Música para receitas rápidas',
    'Beat para fitness challenge',
    'Trilha sonora para viagens',
    'Áudio motivacional popular',
    'Música para transformação',
    'Som de trend de moda',
    'Remix de música de filme',
    'Beat para lip sync',
    'Música eletrônica viral',
    'Som para reaction videos',
    'Áudio para storytime',
    'Música para trend educacional',
    'Som ambiente para ASMR'
  ];
  
  // Embaralhar e limitar
  const selectedSounds = popularSounds
    .sort(() => 0.5 - Math.random())
    .slice(0, limit);
  
  // Converter sons em objetos de tendência
  return selectedSounds.map((sound, index) => {
    const views = Math.floor(Math.random() * 500000000) + 50000000;
    const posts = Math.floor(Math.random() * 500000) + 5000;
    
    return {
      id: uuidv4(),
      name: sound,
      description: `Som/música popular no TikTok`,
      views: views,
      posts: posts,
      engagement: Math.floor((views / posts) * 100) / 100,
      rank: index + 1,
      growthRate: Math.floor(Math.random() * 500) / 10,
      url: `https://www.tiktok.com/music/sound-${index}`,
      category: 'som',
      lastUpdated: new Date(now.getTime() - Math.floor(Math.random() * 86400000))
    };
  });
}

/**
 * Busca desafios populares no TikTok
 */
export async function getTrendingChallenges(
  limit: number = 20
): Promise<{
  trends: TikTokTrend[],
  source: string,
  requestId: string
}> {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  try {
    // Implementação similar a getTrendingHashtags e getTrendingSounds
    // Para exemplo, retornamos diretamente tendências de dataset local
    const trends = getChallengesFromLocalDataset(limit);
    
    const endTime = Date.now();
    updateStats(true, false, endTime - startTime);
    
    return {
      trends,
      source: 'local_dataset',
      requestId
    };
  } catch (error) {
    log(`Erro ao buscar desafios populares: ${error}`, 'error');
    
    const trends = getChallengesFromLocalDataset(limit);
    const endTime = Date.now();
    updateStats(false, false, endTime - startTime);
    
    return {
      trends,
      source: 'local_dataset',
      requestId
    };
  }
}

/**
 * Gera desafios de fallback quando não é possível obter dados reais
 */
function getChallengesFromLocalDataset(limit: number = 20): TikTokTrend[] {
  const now = new Date();
  
  // Lista de desafios populares fictícios
  const popularChallenges = [
    '#DançaViral2023',
    '#TransitionChallenge',
    '#MakeupTransformation',
    '#SlowMotionChallenge',
    '#DuetThis',
    '#FitnessPro30dias',
    '#CookingHackChallenge',
    '#LipSyncBattle',
    '#OutfitChange',
    '#BeforeAndAfter',
    '#FamilyChallenge',
    '#PetTricks',
    '#TalentShowcase',
    '#ExpectationVsReality',
    '#DIYHomeDecor',
    '#BookTok',
    '#LifeHackChallenge',
    '#MomentsChallenge',
    '#SingingContest',
    '#DrawingChallenge'
  ];
  
  // Embaralhar e limitar
  const selectedChallenges = popularChallenges
    .sort(() => 0.5 - Math.random())
    .slice(0, limit);
  
  // Converter desafios em objetos de tendência
  return selectedChallenges.map((challenge, index) => {
    const views = Math.floor(Math.random() * 1000000000) + 100000000;
    const posts = Math.floor(Math.random() * 2000000) + 20000;
    
    return {
      id: uuidv4(),
      name: challenge,
      description: `Desafio popular no TikTok`,
      views: views,
      posts: posts,
      engagement: Math.floor((views / posts) * 100) / 100,
      rank: index + 1,
      growthRate: Math.floor(Math.random() * 700) / 10,
      url: `https://www.tiktok.com/tag/${challenge.replace('#', '')}`,
      category: 'desafio',
      lastUpdated: new Date(now.getTime() - Math.floor(Math.random() * 86400000))
    };
  });
}

/**
 * Busca todas as tendências do TikTok (hashtags, sons e desafios)
 */
export async function getAllTrends(
  limit: number = 10
): Promise<{
  hashtags: TikTokTrend[],
  sounds: TikTokTrend[],
  challenges: TikTokTrend[],
  sources: {
    hashtags: string,
    sounds: string,
    challenges: string
  },
  requestId: string
}> {
  const requestId = uuidv4();
  
  // Buscar tendências em paralelo
  const [hashtagsResult, soundsResult, challengesResult] = await Promise.all([
    getTrendingHashtags(undefined, limit),
    getTrendingSounds(limit),
    getTrendingChallenges(limit)
  ]);
  
  return {
    hashtags: hashtagsResult.trends,
    sounds: soundsResult.trends,
    challenges: challengesResult.trends,
    sources: {
      hashtags: hashtagsResult.source,
      sounds: soundsResult.source,
      challenges: challengesResult.source
    },
    requestId
  };
}

/**
 * Obtém estatísticas do módulo
 */
export function getModuleStats(): ModuleStats {
  return { ...moduleStats };
}

/**
 * Reseta as estatísticas do módulo
 */
export function resetStats(): void {
  moduleStats.totalRequests = 0;
  moduleStats.successfulRequests = 0;
  moduleStats.failedRequests = 0;
  moduleStats.cacheHits = 0;
  moduleStats.cacheMisses = 0;
  moduleStats.lastUpdated = new Date();
  moduleStats.averageResponseTime = 0;
  moduleStats.providerUsage = {
    tiktokApi: 0,
    openai: 0,
    mistral: 0,
    gemini: 0,
    huggingface: 0,
    rapidapi: 0,
    scraping: 0
  };
  
  responseTimes.length = 0;
  
  log('Estatísticas do módulo de tendências do TikTok resetadas', 'info');
}