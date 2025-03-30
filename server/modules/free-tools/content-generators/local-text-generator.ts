/**
 * Gerador de texto local que não depende de APIs externas
 * 
 * Este módulo fornece funcionalidade para gerar conteúdo de texto básico
 * sem depender de APIs externas, servindo como fallback quando as conexões falham.
 */

import { log } from '../../../vite';
import { nanoid } from 'nanoid';

interface TextGenerationOptions {
  modelo?: 'informativo' | 'persuasivo' | 'narrativo' | 'técnico';
  idioma?: 'pt-BR' | 'en-US';
  tamanho?: 'pequeno' | 'médio' | 'grande';
  incluirTítulo?: boolean;
  estruturarEmParagrafos?: boolean;
}

interface GenerationResult {
  content: string;
  requestId: string;
  model: string;
  tokensUsed: number;
  estimatedDuration?: number;
}

// Base de conhecimento para geração de conteúdo
const knowledgeBase = {
  'marketing digital': [
    'O marketing digital é essencial para empresas modernas alcançarem seu público-alvo.',
    'Estratégias como SEO, marketing de conteúdo e mídias sociais são pilares do marketing digital.',
    'Análise de dados permite otimizar campanhas de marketing digital em tempo real.',
    'E-mail marketing continua sendo uma das estratégias com melhor ROI no marketing digital.',
    'O marketing de influência tornou-se um componente crucial nas estratégias digitais.',
  ],
  'finanças pessoais': [
    'Controlar gastos é o primeiro passo para uma vida financeira saudável.',
    'Investimentos diversificados ajudam a proteger seu patrimônio contra inflação.',
    'Ter uma reserva de emergência é fundamental antes de iniciar investimentos de risco.',
    'Planejamento financeiro deve incluir objetivos de curto, médio e longo prazo.',
    'Educação financeira é a chave para tomar decisões inteligentes sobre dinheiro.',
  ],
  'desenvolvimento pessoal': [
    'Estabelecer metas claras aumenta suas chances de alcançar objetivos importantes.',
    'Hábitos diários consistentes têm mais impacto que mudanças radicais ocasionais.',
    'Mindfulness e meditação podem reduzir estresse e melhorar foco e produtividade.',
    'Leitura regular expande conhecimentos e desenvolve habilidades cognitivas.',
    'Sair da zona de conforto é necessário para crescimento pessoal significativo.',
  ],
  'tecnologia': [
    'Inteligência Artificial está transformando diversos setores da economia mundial.',
    'Computação em nuvem permite acesso a recursos computacionais sem grandes investimentos iniciais.',
    'Cibersegurança tornou-se uma prioridade absoluta para empresas de todos os portes.',
    'IoT (Internet das Coisas) está conectando bilhões de dispositivos em todo o mundo.',
    'Blockchain oferece soluções de transparência e segurança além das criptomoedas.',
  ],
  'saúde e bem-estar': [
    'Exercícios regulares melhoram não apenas a saúde física, mas também a mental.',
    'Alimentação balanceada é fundamental para prevenção de diversas doenças.',
    'Sono de qualidade impacta diretamente produtividade e saúde geral.',
    'Gerenciamento de estresse é componente essencial para bem-estar completo.',
    'Conexões sociais saudáveis são indicadores importantes de longevidade.',
  ],
  'geral': [
    'A definição de metas claras é o primeiro passo para o sucesso em qualquer área.',
    'Aprendizado contínuo é uma necessidade no mundo moderno em constante mudança.',
    'Equilíbrio entre vida pessoal e profissional contribui para resultados melhores em ambas.',
    'Adaptabilidade é uma das habilidades mais valiosas no século XXI.',
    'Colaboração efetiva multiplica resultados além do trabalho individual.',
  ]
};

// Frases introdutórias para criar fluidez no texto
const introductoryPhrases = [
  'É importante destacar que',
  'Pesquisas recentes indicam que',
  'Especialistas concordam que',
  'Vale a pena considerar que',
  'Um ponto fundamental é que',
  'A experiência mostra que',
  'Não podemos ignorar que',
  'Uma verdade incontestável é que',
  'Estudos comprovam que',
  'É interessante notar que',
];

// Frases de transição entre parágrafos
const transitionPhrases = [
  'Além disso,',
  'Por outro lado,',
  'No entanto,',
  'Similarmente,',
  'Consequentemente,',
  'Ademais,',
  'Em contraste,',
  'Nesse contexto,',
  'Paralelamente,',
  'Considerando esse cenário,',
];

// Frases conclusivas
const conclusionPhrases = [
  'Por fim, é essencial reconhecer',
  'Concluindo, podemos afirmar que',
  'Em suma, fica evidente que',
  'Para finalizar, vale ressaltar que',
  'O cenário apresentado nos mostra que',
  'Diante do exposto, conclui-se que',
  'Portanto, torna-se claro que',
  'Em última análise,',
  'Reunindo todos esses pontos,',
  'Como resultado dessas observações,',
];

// Títulos genéricos por tópico
const topicTitles = {
  'marketing digital': [
    'Estratégias Eficazes de Marketing Digital para 2023',
    'Como Transformar Seguidores em Clientes',
    'O Impacto do Marketing de Conteúdo nos Resultados',
    'SEO: A Chave para Visibilidade Online',
    'Marketing Digital para Pequenas Empresas',
  ],
  'finanças pessoais': [
    'Construindo uma Reserva de Emergência Sólida',
    'Investimentos Inteligentes para Iniciantes',
    'Como Eliminar Dívidas Rapidamente',
    'Planejamento Financeiro para Cada Fase da Vida',
    'Independência Financeira: Um Guia Prático',
  ],
  'desenvolvimento pessoal': [
    'Hábitos Diários de Pessoas Altamente Eficazes',
    'Como Superar a Procrastinação Definitivamente',
    'Mindset de Crescimento: Transformando Desafios em Oportunidades',
    'O Poder da Disciplina no Desenvolvimento Pessoal',
    'Autoconhecimento: A Base para o Crescimento',
  ],
  'tecnologia': [
    'Tendências Tecnológicas que Transformarão o Mercado',
    'Inteligência Artificial: Presente e Futuro',
    'Como a Blockchain Está Revolucionando Indústrias',
    'Segurança Digital: Proteção em um Mundo Conectado',
    'O Impacto da Computação em Nuvem nos Negócios',
  ],
  'saúde e bem-estar': [
    'Hábitos Simples para uma Vida Mais Saudável',
    'Equilíbrio Entre Corpo e Mente: O Segredo do Bem-estar',
    'Nutrição Inteligente para o Dia a Dia',
    'Sono de Qualidade: O Pilar Esquecido da Saúde',
    'Gerenciamento de Estresse em Tempos Desafiadores',
  ],
  'geral': [
    'Estratégias Práticas para Alcançar Seus Objetivos',
    'Produtividade: Fazendo Mais com Menos Esforço',
    'Como Desenvolver Resiliência em Tempos de Mudança',
    'O Poder das Conexões Significativas',
    'Princípios Universais de Sucesso e Realização',
  ],
};

/**
 * Seleciona aleatoriamente um elemento de um array
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Capitaliza a primeira letra de uma string
 */
function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Gera um número aleatório dentro de um intervalo
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gera texto localmente com base em um tema e opções
 */
export async function generateLocalText(
  theme: string,
  prompt: string,
  options: TextGenerationOptions = {}
): Promise<GenerationResult> {
  try {
    // Início do tempo para medir duração
    const startTime = Date.now();
    
    // Definir valores padrão para opções
    const {
      modelo = 'informativo',
      idioma = 'pt-BR',
      tamanho = 'médio',
      incluirTítulo = true,
      estruturarEmParagrafos = true
    } = options;
    
    // Identificar o tópico mais relevante com base no tema e prompt
    let tópico = 'geral';
    const temáticas = Object.keys(knowledgeBase);
    
    for (const t of temáticas) {
      if (theme.toLowerCase().includes(t) || prompt.toLowerCase().includes(t)) {
        tópico = t;
        break;
      }
    }
    
    // Selecionar a base de conhecimento apropriada
    const baseParagraphs = knowledgeBase[tópico as keyof typeof knowledgeBase] || knowledgeBase.geral;
    
    // Determinar a quantidade de parágrafos com base no tamanho desejado
    let numberOfParagraphs: number;
    switch (tamanho) {
      case 'pequeno':
        numberOfParagraphs = randomInRange(2, 3);
        break;
      case 'médio':
        numberOfParagraphs = randomInRange(3, 5);
        break;
      case 'grande':
        numberOfParagraphs = randomInRange(5, 8);
        break;
      default:
        numberOfParagraphs = randomInRange(3, 5);
    }
    
    // Gerar o título se solicitado
    let title = '';
    if (incluirTítulo) {
      const possibleTitles = topicTitles[tópico as keyof typeof topicTitles] || topicTitles.geral;
      title = randomChoice(possibleTitles);
    }
    
    // Construir o conteúdo
    let content = incluirTítulo ? `# ${title}\n\n` : '';
    
    // Introdução
    let introPhrase = randomChoice(introductoryPhrases);
    let introParagraph = introPhrase + ' ' + randomChoice(baseParagraphs).toLowerCase();
    content += capitalizeFirstLetter(introParagraph) + ' ';
    
    // Adicionar uma frase adicional à introdução
    content += randomChoice(baseParagraphs) + '\n\n';
    
    // Corpo do texto
    for (let i = 0; i < numberOfParagraphs - 2; i++) {
      let transition = randomChoice(transitionPhrases);
      let paragraph = transition + ' ' + randomChoice(baseParagraphs).toLowerCase() + ' ';
      
      // Adicionar 1-2 frases adicionais por parágrafo
      const additionalSentences = randomInRange(1, 2);
      for (let j = 0; j < additionalSentences; j++) {
        paragraph += randomChoice(baseParagraphs) + ' ';
      }
      
      content += capitalizeFirstLetter(paragraph) + '\n\n';
    }
    
    // Conclusão
    let conclusionPhrase = randomChoice(conclusionPhrases);
    let conclusionParagraph = conclusionPhrase + ' ' + randomChoice(baseParagraphs).toLowerCase();
    content += capitalizeFirstLetter(conclusionParagraph) + '\n';
    
    // Formatar conteúdo conforme o modelo escolhido
    if (modelo === 'persuasivo') {
      content = content
        .replace(/pode/g, 'deve')
        .replace(/talvez/g, 'certamente')
        .replace(/alguns/g, 'muitos')
        .replace(/algumas/g, 'muitas');
    } else if (modelo === 'técnico') {
      content = content
        .replace(/simples/g, 'específico')
        .replace(/fácil/g, 'eficiente')
        .replace(/ótimo/g, 'eficaz')
        .replace(/bom/g, 'adequado');
    }
    
    // Se não quiser estruturar em parágrafos, substituir quebras de linha
    if (!estruturarEmParagrafos) {
      content = content.replace(/\n\n/g, ' ');
    }
    
    // Calcular tokens aproximados (considerando que 1 token ≈ 4 caracteres no padrão GPT)
    const tokensUsed = Math.ceil(content.length / 4);
    
    // Calcular duração estimada para leitura (250 palavras por minuto é a média)
    const words = content.split(' ').length;
    const estimatedDuration = Math.ceil(words / 250);
    
    // Fim do tempo para medição
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    log(`Texto local gerado em ${processingTime}ms, aproximadamente ${tokensUsed} tokens`, 'info');
    
    return {
      content,
      requestId: nanoid(),
      model: 'local-text-generator',
      tokensUsed,
      estimatedDuration
    };
  } catch (error) {
    log('Erro ao gerar texto localmente:', 'error');
    log(error, 'error');
    
    // Resposta em caso de erro
    return {
      content: 'Não foi possível gerar texto. Por favor, tente novamente mais tarde.',
      requestId: nanoid(),
      model: 'local-text-generator',
      tokensUsed: 0
    };
  }
}