/**
 * Gerador de hashtags local que não depende de APIs externas
 * 
 * Este módulo fornece funcionalidade para gerar hashtags para redes sociais
 * sem depender de APIs externas, servindo como fallback quando as conexões falham.
 */

import { log } from '../../../vite';
import { nanoid } from 'nanoid';

interface HashtagGenerationOptions {
  plataforma?: 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'linkedin';
  quantidade?: number;
  idioma?: 'pt-BR' | 'en-US';
  incluirEspecíficas?: boolean;
  incluirPopulares?: boolean;
  incluirNicho?: boolean;
}

interface HashtagGenerationResult {
  hashtags: string[];
  categorized: {
    específicas: string[];
    populares: string[];
    nicho: string[];
  };
  model: string;
  requestId: string;
}

// Hashtags populares por plataforma (ordenadas por relevância)
const platformTrendingHashtags = {
  instagram: [
    'instavibes', 'instagood', 'photooftheday', 'instadaily', 'picoftheday',
    'explore', 'viral', 'trending', 'instamood', 'photography', 'love',
    'beautiful', 'happy', 'cute', 'fashion', 'style', 'art', 'followforfollowback',
    'likeforlikes', 'repost', 'instagramers'
  ],
  tiktok: [
    'fyp', 'parati', 'viral', 'foryoupage', 'trending', 'tiktokbrasil',
    'fy', 'foryou', 'trend', 'comedy', 'dance', 'funny', 'humor',
    'viral', 'tiktokviral', 'dueto', 'challenge', 'music', 'tiktokers'
  ],
  twitter: [
    'trending', 'tbt', 'followback', 'follow', 'retweet', 'rt',
    'viral', 'trendingnow', 'thread', 'twitterbrasil', 'opine',
    'fato', 'news', 'hot', 'nowplaying', 'meme', 'factcheck'
  ],
  facebook: [
    'share', 'followme', 'liked', 'viral', 'trending', 'facebooklive',
    'moments', 'friends', 'family', 'love', 'photooftheday', 'motivational',
    'inspiration', 'shareable', 'fbcontent', 'postoftheday'
  ],
  linkedin: [
    'networking', 'jobs', 'career', 'business', 'motivation', 'success',
    'leadership', 'innovation', 'entrepreneur', 'work', 'professional',
    'opportunity', 'jobsearch', 'careeradvice', 'inspiration', 'jobopening'
  ]
};

// Hashtags específicas por tópico
const specificHashtagsByTopic = {
  'marketing digital': [
    'marketingdigital', 'digitalmarketing', 'socialmedia', 'marketing', 'redessociais',
    'marketingstrategy', 'contentmarketing', 'marketingonline', 'digitalstrategy',
    'branding', 'emailmarketing', 'seo', 'searchengineoptimization', 'webmarketing',
    'growthhacking', 'conversionrate', 'leadgeneration', 'digitalmarketingtips'
  ],
  'finanças pessoais': [
    'financaspessoais', 'investimentos', 'dinheiro', 'educacaofinanceira', 'financas',
    'economia', 'independenciafinanceira', 'planejamentofinanceiro', 'investimento',
    'financeiro', 'rendaextra', 'empreendedorismo', 'money', 'finance', 'saving',
    'investment', 'financialfreedom', 'stockmarket', 'bolsadevalores', 'realestate'
  ],
  'desenvolvimento pessoal': [
    'desenvolvimentopessoal', 'autoconhecimento', 'crescimentopessoal', 'mindset',
    'superacao', 'motivacao', 'autodesenvolvimento', 'produtividade', 'habitos',
    'disciplina', 'foco', 'mentalidadedecrescimento', 'crescimento', 'coaching',
    'lideranca', 'sucesso', 'metas', 'objetivos', 'inteligenciaemocional', 'meditacao'
  ],
  'saúde e bem-estar': [
    'saude', 'bemestar', 'saudavel', 'fitness', 'alimentacaosaudavel', 'nutricao',
    'vidasaudavel', 'health', 'wellness', 'healthy', 'workout', 'exercise', 'gym',
    'treino', 'dieta', 'emagrecimento', 'academia', 'yoga', 'meditacao', 'mindfulness',
    'saudemental', 'autocuidado', 'healthylifestyle', 'weightloss', 'nutrition'
  ],
  'tecnologia': [
    'tecnologia', 'tech', 'technology', 'inovacao', 'innovation', 'digital', 'programacao',
    'coding', 'developer', 'programmer', 'software', 'hardware', 'ai', 'artificialintelligence',
    'machinelearning', 'datascience', 'blockchain', 'crypto', 'ciberseguranca', 'iot',
    'internetdascoisas', 'cloud', 'computacaoemnuvem', 'app', 'web3', 'metaverse'
  ],
  'viagem': [
    'viagem', 'viajar', 'travel', 'turismo', 'instatravel', 'travelgram', 'wanderlust',
    'trip', 'travelphotography', 'vacation', 'ferias', 'adventure', 'aventura', 'explore',
    'natureza', 'travelblogger', 'traveltheworld', 'destinos', 'viagemeturismo', 'dicasdeviagem',
    'mochilao', 'roadtrip', 'tourism', 'traveler', 'passaporte', 'viajante'
  ],
  'gastronomia': [
    'gastronomia', 'food', 'comida', 'foodporn', 'foodie', 'instafood', 'culinaria',
    'cozinha', 'receita', 'recipe', 'chef', 'cooking', 'cozinhando', 'gastronomy',
    'gourmet', 'delicious', 'delicia', 'homemade', 'foodphotography', 'tasty',
    'healthyfood', 'foodlover', 'dinner', 'almoço', 'jantar', 'breakfast'
  ],
  'moda': [
    'moda', 'fashion', 'style', 'estilo', 'ootd', 'outfit', 'lookdodia', 'lookoftheday',
    'fashionista', 'instafashion', 'fashionblogger', 'stylish', 'clothes', 'tendencia',
    'trend', 'fashionstyle', 'streetstyle', 'modafeminina', 'modamasculina', 'fashionable',
    'instastyle', 'styling', 'fashionlover', 'modabrasil', 'styleblogger'
  ],
  'geral': [
    'trending', 'viral', 'conteudo', 'content', 'dicas', 'tips', 'aprendizado',
    'learning', 'conhecimento', 'knowledge', 'brasil', 'brazil', 'informacao',
    'information', 'novidades', 'news', 'atualidade', 'tendencias', 'recomendado',
    'recommended', 'destaque', 'featured', 'comunidade', 'community'
  ]
};

// Hashtags de nicho (menos usadas, mais específicas)
const nicheHashtagsByTopic = {
  'marketing digital': [
    'contentcalendar', 'seooptimization', 'businessstrategy', 'digitalanalytics',
    'marketingfunnel', 'contentcreation', 'copyblogger', 'abtest', 'growthhacker',
    'socialmediaschedule', 'digitalpr', 'personalization', 'analyticstools', 'crm'
  ],
  'finanças pessoais': [
    'tesorodireto', 'cdb', 'lci', 'lca', 'financasbehaviorais', 'educacaofinanceira',
    'reservadeemergencia', 'previdenciaprivada', 'rendapassiva', 'fundosimobiliarios',
    'dividendos', 'daytrade', 'frugal', 'budgeting', 'divetuition', 'moneymindset'
  ],
  'desenvolvimento pessoal': [
    'higenedigital', 'minimalismo', 'proposito', 'ikigai', 'gestaodetempo',
    'autodidatismo', 'resiliencia', 'zonadeconforto', 'stoicismo', 'estoicismo',
    'autodisciplina', 'dopamina', 'neuroplasticidade', 'habitos', 'metododeferriss'
  ],
  'saúde e bem-estar': [
    'cronobiologia', 'biohacking', 'periodizacao', 'suplementacao', 'vegetarianismo',
    'paleolitica', 'keto', 'cetogenica', 'jejumintermitente', 'microdosagem',
    'dietaantiinflamatoria', 'gutbrain', 'microbiota', 'imunidade', 'circadiano'
  ],
  'tecnologia': [
    'promptengineering', 'chatgpt', 'llm', 'react', 'flutter', 'rust', 'golang',
    'microservices', 'devops', 'cicd', 'containerization', 'kubernetes', 'terraform',
    'serverless', 'edgecomputing', 'quantumcomputing', 'computacaoquantica', 'web3'
  ],
  'viagem': [
    'slowtravel', 'digitalnomad', 'workation', 'staycation', 'glamping', 'ecoturismo',
    'sustainabletravel', 'darktourism', 'voluntourism', 'housesitting', 'worldschooling',
    'vanlife', 'overlanding', 'vilasturisticas', 'destinosescondidos', 'couchsurfing'
  ],
  'gastronomia': [
    'alimentacaofuncional', 'fermentados', 'agroecologia', 'organicos', 'biodinamica',
    'plantbased', 'foraging', 'slowfood', 'foodtech', 'gastronomiamolecular', 'mixologia',
    'terroir', 'naturalwine', 'foodpairing', 'fooddesign', 'seasonalfood', 'farmtotable'
  ],
  'moda': [
    'slowfashion', 'upcycling', 'modacircular', 'zerowaste', 'minimalwardrobe',
    'capsuledressing', 'secondhandfirst', 'vintagestyle', 'sustentabilidade', 'ethicalfashion',
    'sustainablefashion', 'slowstyling', 'fashionactivism', 'futurism', 'modaautoral'
  ],
  'geral': [
    'aprendizadocontinuo', 'sustentabilidade', 'diversidade', 'inclusao', 'empatia',
    'resiliencia', 'futurismo', 'lifehacks', 'multipassionate', 'multipotential',
    'interdisciplinar', 'holistico', 'design', 'criatividade', 'inovacao', 'culturadigital'
  ]
};

/**
 * Seleciona aleatoriamente um número específico de elementos de um array
 */
function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Normaliza uma string para ser usada como hashtag (remove espaços, acentos, etc.)
 */
function normalizeForHashtag(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/\s+/g, '')              // remove espaços
    .replace(/[^\w]/g, '')            // remove caracteres especiais
    .toLowerCase();
}

/**
 * Capitaliza cada palavra em camelCase para melhorar legibilidade de hashtags longas
 */
function camelCaseHashtag(input: string): string {
  // Se a string já está em camelCase ou PascalCase, retorna como está
  if (/^[a-z]+([A-Z][a-z]+)*$/.test(input) || /^([A-Z][a-z]+)+$/.test(input)) {
    return input;
  }
  
  // Divide a string em palavras
  const words = input.split(/\s+|[-_]/);
  
  // Capitaliza a primeira letra de cada palavra, exceto a primeira
  return words
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Gera hashtags localmente com base em um tema e opções
 */
export async function generateLocalHashtags(
  theme: string,
  content: string,
  options: HashtagGenerationOptions = {}
): Promise<HashtagGenerationResult> {
  try {
    // Início do tempo para medir duração
    const startTime = Date.now();
    
    // Definir valores padrão para opções
    const {
      plataforma = 'instagram',
      quantidade = 15,
      idioma = 'pt-BR',
      incluirEspecíficas = true,
      incluirPopulares = true,
      incluirNicho = true
    } = options;
    
    // Normalizar tema e conteúdo para busca
    const normalizedTheme = theme.toLowerCase();
    const normalizedContent = content.toLowerCase();
    
    // Identificar o tópico mais relevante
    let tópico = 'geral';
    const temáticas = Object.keys(specificHashtagsByTopic);
    
    for (const t of temáticas) {
      if (normalizedTheme.includes(t) || normalizedContent.includes(t)) {
        tópico = t;
        break;
      }
    }
    
    // Extrair palavras-chave do tema e conteúdo
    const keywords = [...new Set([
      ...normalizedTheme.split(/\s+/),
      ...normalizedContent.split(/\s+/).filter(word => word.length > 3).slice(0, 10)
    ])];
    
    // Gerar hashtags específicas a partir das palavras-chave
    const customHashtags = keywords.map(keyword => normalizeForHashtag(keyword))
      .filter(keyword => keyword.length > 3)
      .map(keyword => camelCaseHashtag(keyword));
    
    // Preparar hashtags específicas para o tópico
    const specificHashtags = incluirEspecíficas 
      ? getRandomElements(specificHashtagsByTopic[tópico as keyof typeof specificHashtagsByTopic], Math.floor(quantidade * 0.4))
      : [];
    
    // Preparar hashtags populares da plataforma
    const popularHashtags = incluirPopulares
      ? getRandomElements(platformTrendingHashtags[plataforma as keyof typeof platformTrendingHashtags], Math.floor(quantidade * 0.3))
      : [];
    
    // Preparar hashtags de nicho
    const nicheHashtags = incluirNicho
      ? getRandomElements(nicheHashtagsByTopic[tópico as keyof typeof nicheHashtagsByTopic], Math.floor(quantidade * 0.3))
      : [];
    
    // Adicionar hashtags customizadas
    let specificCount = Math.max(0, Math.floor(quantidade * 0.4) - specificHashtags.length);
    const filteredCustomHashtags = customHashtags.slice(0, specificCount);
    
    // Combinar todas as hashtags e adicionar o prefixo '#'
    const allHashtags = [
      ...specificHashtags,
      ...filteredCustomHashtags,
      ...popularHashtags,
      ...nicheHashtags
    ];
    
    // Eliminar duplicatas e limitar ao número solicitado
    const uniqueHashtags = [...new Set(allHashtags)].slice(0, quantidade);
    
    // Adicionar o prefixo '#' a cada hashtag
    const finalHashtags = uniqueHashtags.map(tag => `#${tag}`);
    
    // Categorizar as hashtags
    const categorizedHashtags = {
      específicas: [...specificHashtags, ...filteredCustomHashtags].map(tag => `#${tag}`),
      populares: popularHashtags.map(tag => `#${tag}`),
      nicho: nicheHashtags.map(tag => `#${tag}`)
    };
    
    // Fim do tempo para medição
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    log(`Hashtags locais geradas em ${processingTime}ms, quantidade: ${finalHashtags.length}`, 'info');
    
    return {
      hashtags: finalHashtags,
      categorized: categorizedHashtags,
      model: 'local-hashtag-generator',
      requestId: nanoid()
    };
  } catch (error) {
    log('Erro ao gerar hashtags localmente:', 'error');
    log(error, 'error');
    
    // Resposta em caso de erro
    return {
      hashtags: ['#erro', '#tente_novamente'],
      categorized: {
        específicas: [],
        populares: [],
        nicho: []
      },
      model: 'local-hashtag-generator',
      requestId: nanoid()
    };
  }
}