/**
 * Módulo central para geradores de conteúdo locais
 * 
 * Este arquivo exporta os geradores de conteúdo local que não dependem de APIs externas,
 * servindo como ponto central de acesso.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Gera texto usando um sistema de templates e regras 
 * locais sem depender de APIs externas
 */
export async function generateLocalText(
  theme: string,
  prompt: string,
  options?: any
): Promise<{
  content: string,
  tokensUsed: number,
  estimatedDuration: number,
  requestId: string
}> {
  // Implementação simplificada para geração de texto baseada em templates
  const paragraphs = [];
  
  // Criar introdução
  const introduction = `${prompt} é um tema importante quando falamos de ${theme}.`;
  paragraphs.push(introduction);
  
  // Adicionar alguns pontos relacionados ao tema
  const points = [
    `Ao analisar ${theme}, percebemos vários aspectos relevantes para ${prompt}.`,
    `Estudos recentes sobre ${theme} mostram resultados promissores para aplicações em ${prompt}.`,
    `Especialistas em ${theme} frequentemente destacam a importância de ${prompt} para obter melhores resultados.`
  ];
  
  paragraphs.push(...points);
  
  // Adicionar conclusão
  const conclusion = `Em resumo, ${prompt} representa um elemento chave no contexto de ${theme}, merecendo atenção e estudo aprofundado.`;
  paragraphs.push(conclusion);
  
  // Juntar parágrafos em um texto completo
  const content = paragraphs.join('\n\n');
  
  // Estimar número de tokens (simplificado: aproximadamente 1 token a cada 4 caracteres)
  const tokensUsed = Math.ceil(content.length / 4);
  
  // Estimar tempo de leitura (simplificado: aproximadamente 200 palavras por minuto)
  const wordCount = content.split(/\s+/).length;
  const estimatedDuration = Math.ceil(wordCount / 200);
  
  return {
    content,
    tokensUsed,
    estimatedDuration,
    requestId: uuidv4()
  };
}

/**
 * Gera um script para vídeo sem depender de APIs externas
 */
export async function generateLocalScript(
  theme: string,
  targetAudience: string = 'geral',
  options?: any
): Promise<{
  script: string,
  title: string,
  sections: string[],
  estimatedDuration: number,
  requestId: string
}> {
  // Template para título
  const titleTemplates = [
    `${theme}: O que você precisa saber`,
    `Tudo sobre ${theme} em poucos minutos`,
    `${theme} explicado de forma simples`,
    `Como ${theme} pode transformar seus resultados`,
    `${theme}: Guia completo para ${targetAudience}`
  ];
  
  // Escolher um título aleatoriamente
  const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  
  // Criar introdução
  const intro = `[INTRODUÇÃO]\nOlá! Hoje vamos falar sobre ${theme}, um assunto extremamente importante para ${targetAudience}. Vou mostrar os principais aspectos que você precisa conhecer.`;
  
  // Criar corpo do script
  const body = [
    `[CONTEXTO]\nQuando falamos de ${theme}, precisamos entender que existem vários fatores envolvidos. Primeiro, precisamos considerar o impacto no dia a dia.`,
    
    `[PONTOS PRINCIPAIS]\nExistem 3 aspectos fundamentais sobre ${theme} que vou explicar agora:\n1. A importância para ${targetAudience}\n2. Como implementar na prática\n3. Resultados que podem ser alcançados`,
    
    `[DETALHAMENTO]\nVamos começar pelo primeiro aspecto. ${theme} tem mostrado resultados significativos para ${targetAudience}, com benefícios comprovados em diferentes contextos.`,
    
    `O segundo aspecto é a implementação prática. Para começar a trabalhar com ${theme}, você precisa primeiro entender os fundamentos e depois aplicar metodologias testadas.`,
    
    `Por fim, o terceiro aspecto são os resultados. Diversos estudos mostram que ${targetAudience} que aplicam corretamente os princípios de ${theme} conseguem resultados até 30% melhores.`
  ];
  
  // Criar conclusão
  const conclusion = `[CONCLUSÃO]\nAgora que você já conhece mais sobre ${theme}, espero que possa aplicar esse conhecimento. Se gostou desse conteúdo, não se esqueça de deixar seu like e se inscrever no canal para mais vídeos como este. Muito obrigado e até a próxima!`;
  
  // Juntar todas as partes do script
  const sections = [intro, ...body, conclusion];
  const script = sections.join('\n\n');
  
  // Estimar duração do vídeo (simplificado: aproximadamente 150 palavras por minuto em fala)
  const wordCount = script.split(/\s+/).length;
  const estimatedDuration = Math.ceil(wordCount / 150);
  
  return {
    script,
    title,
    sections,
    estimatedDuration,
    requestId: uuidv4()
  };
}

/**
 * Gera hashtags para redes sociais sem depender de APIs externas
 */
export async function generateLocalHashtags(
  theme: string,
  content: string,
  options?: any
): Promise<{
  hashtags: string[],
  categorized: {[key: string]: string[]},
  requestId: string
}> {
  // Listas de hashtags populares por categoria
  const hashtagsByCategory: {[key: string]: string[]} = {
    marketing: ['#marketing', '#digitalmarketing', '#socialmedia', '#branding', '#marketingtips', '#marketingstrategy', '#marketingdigital', '#business', '#socialmediamarketing', '#contentmarketing'],
    
    tecnologia: ['#technology', '#tech', '#innovation', '#coding', '#programming', '#developer', '#software', '#ai', '#artificialintelligence', '#machinelearning', '#datascience', '#cybersecurity'],
    
    empreendedorismo: ['#empreendedorismo', '#business', '#entrepreneur', '#entrepreneurship', '#success', '#motivation', '#startup', '#innovation', '#mindset', '#goals', '#smallbusiness'],
    
    saude: ['#health', '#wellness', '#healthy', '#fitness', '#nutrition', '#mentalhealth', '#healthylifestyle', '#healthcare', '#wellbeing', '#selfcare', '#medicine'],
    
    educacao: ['#education', '#learning', '#teaching', '#school', '#student', '#teacher', '#knowledge', '#study', '#college', '#university', '#elearning', '#onlinelearning'],
    
    financas: ['#finance', '#money', '#investing', '#investment', '#financial', '#wealth', '#stocks', '#trading', '#cryptocurrency', '#bitcoin', '#economy', '#realestate'],
    
    gerais: ['#trend', '#trending', '#viral', '#instagood', '#instadaily', '#followme', '#photooftheday', '#picoftheday', '#follow', '#explore', '#content', '#creator']
  };
  
  // Determinar categorias relevantes para o tema
  const relevantCategories = [];
  
  if (theme.match(/market|brand|promoc|vend|cliente|consum/i)) {
    relevantCategories.push('marketing');
  }
  
  if (theme.match(/tech|tecno|softw|program|cod|desenvolv|app|aplic|web|site|comput/i)) {
    relevantCategories.push('tecnologia');
  }
  
  if (theme.match(/empreend|negoc|empresa|startup|inovac|empres/i)) {
    relevantCategories.push('empreendedorismo');
  }
  
  if (theme.match(/saud|fit|bem|nutri|aliment|exerc|med|corpo|ment/i)) {
    relevantCategories.push('saude');
  }
  
  if (theme.match(/educ|aprend|ensino|escola|faculdade|universidade|conhec|estud/i)) {
    relevantCategories.push('educacao');
  }
  
  if (theme.match(/finan|dinheiro|invest|econom|bolsa|acoes|criptomoeda|renda/i)) {
    relevantCategories.push('financas');
  }
  
  // Se nenhuma categoria específica foi identificada, usar gerais
  if (relevantCategories.length === 0) {
    relevantCategories.push('gerais');
  }
  
  // Criar hashtags específicas relacionadas ao tema
  const specificHashtags = [
    `#${theme.replace(/\s+/g, '')}`,
    `#${theme.replace(/\s+/g, '_')}`,
    `#${theme.replace(/\s+/g, '')}Tips`,
    `#${theme.replace(/\s+/g, '')}Brasil`,
    `#${theme.replace(/\s+/g, '')}Expert`
  ];
  
  // Filtrar hashtags por relevância
  const result: {[key: string]: string[]} = {
    especificas: specificHashtags
  };
  
  // Adicionar hashtags de categorias relevantes
  relevantCategories.forEach(category => {
    result[category] = hashtagsByCategory[category];
  });
  
  // Adicionar algumas hashtags gerais sempre
  if (!relevantCategories.includes('gerais')) {
    result['gerais'] = hashtagsByCategory['gerais'].slice(0, 5);
  }
  
  // Criar lista completa de hashtags
  let allHashtags: string[] = [];
  Object.values(result).forEach(hashtags => {
    allHashtags = [...allHashtags, ...hashtags];
  });
  
  // Remover duplicatas e limitar número de hashtags
  const uniqueHashtags = [...new Set(allHashtags)];
  const limitedHashtags = uniqueHashtags.slice(0, 20);
  
  return {
    hashtags: limitedHashtags,
    categorized: result,
    requestId: uuidv4()
  };
}