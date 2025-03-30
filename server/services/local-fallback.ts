import { log } from "../vite";
import { OpenAIService } from "./openai";
import { MistralAIService } from "./mistral";
import { HuggingFaceService } from "./huggingface";
import { GoogleCloudTTSService } from "./google-cloud-tts";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { FFmpegService } from "./ffmpeg";

/**
 * Serviço de fallback local que não depende de APIs externas
 * Usado como último recurso quando todas as outras opções falham
 */
export class LocalFallbackService {
  constructor() {
    log("Inicializando serviço de fallback local", "local-fallback");
    // Verificar e criar diretórios necessários
    this.ensureDirectoriesExist();
  }

  /**
   * Garante que os diretórios necessários existam
   */
  private ensureDirectoriesExist() {
    const dirs = [
      "./fallback-cache",
      "./fallback-cache/scripts",
      "./fallback-cache/audio",
      "./fallback-cache/images"
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Método de fallback para geração de scripts de vídeo
   * Retorna um script pré-definido ou gera um baseado em templates quando todas as APIs falham
   */
  async generateVideoScript(options: any): Promise<{
    title: string;
    script: string;
    suggestedKeywords: string[];
    videoLengthSeconds: number;
  }> {
    log("Usando gerador de scripts local de fallback aprimorado", "local-fallback");
    
    const themes = [
      "Marketing Digital",
      "Vendas Online",
      "Estratégias de Negócios",
      "Empreendedorismo",
      "Transformação Digital",
      "Finanças Pessoais",
      "Investimentos",
      "Desenvolvimento Pessoal",
      "Produtividade",
      "Tecnologia"
    ];
    
    // Use o tema fornecido ou escolha um aleatoriamente
    const theme = options.theme || themes[Math.floor(Math.random() * themes.length)];
    
    // Modelos de estrutura de script mais elaborados
    type ScriptTemplate = {
      title: string;
      structure: string[];
      keywords: string[];
      length: number;
    };
    
    // Templates de scripts avançados com estruturas específicas
    const scriptTemplates: ScriptTemplate[] = [
      // Modelo 1: Lista de dicas/estratégias
      {
        title: `${Math.floor(Math.random() * 3) + 5} Estratégias Avançadas para ${theme}`,
        structure: [
          `Olá! Hoje vou compartilhar estratégias avançadas para destacar seu negócio com ${theme}.`,
          `Antes de começarmos, é importante entender que ${theme} está revolucionando o mercado atual.`,
          `A primeira estratégia é focar em personalização. Conheça seu público e adapte sua abordagem.`,
          `A segunda estratégia é a análise contínua de dados. Use métricas para tomar decisões mais inteligentes.`,
          `A terceira estratégia envolve automação de processos. Isso economiza tempo e recursos valiosos.`,
          `Quarta estratégia: integração de plataformas. Sistemas conectados geram melhores resultados.`,
          `A quinta e mais poderosa: construa relacionamentos autênticos com seu público-alvo.`,
          `Combine todas estas estratégias para criar um sistema de ${theme} verdadeiramente eficaz.`,
          `Empresas que implementam estas estratégias veem um aumento médio de 70% em seus resultados!`,
          `Comece a implementar hoje mesmo e colha os benefícios do ${theme} em seu negócio.`
        ],
        keywords: ["estratégias", theme.toLowerCase(), "personalização", "automação", "resultados"],
        length: 45
      },
      
      // Modelo 2: Problema e solução
      {
        title: `Como Solucionar os Principais Desafios de ${theme}`,
        structure: [
          `Você está enfrentando desafios com ${theme}? Neste vídeo, vou mostrar soluções práticas.`,
          `O maior problema que vejo constantemente é a falta de estratégia clara em ${theme}.`,
          `A maioria das pessoas tenta implementar ${theme} sem entender completamente seu funcionamento.`,
          `Isso leva a desperdício de recursos e resultados decepcionantes.`,
          `A solução começa com um diagnóstico preciso do seu cenário atual.`,
          `Em seguida, desenvolva um plano estruturado com metas claras e mensuráveis.`,
          `Implemente ferramentas e processos adequados para otimizar seus esforços.`,
          `Monitore constantemente os resultados e faça ajustes quando necessário.`,
          `Esta abordagem sistemática para ${theme} transforma desafios em oportunidades.`,
          `Meus clientes que seguem este método conseguem resultados até 3x melhores. Começe agora!`
        ],
        keywords: [theme.toLowerCase(), "desafios", "soluções", "estratégia", "resultados"],
        length: 50
      },
      
      // Modelo 3: Case de sucesso
      {
        title: `Case de Sucesso: Transformando Resultados com ${theme}`,
        structure: [
          `Hoje vou compartilhar um case real de como ${theme} pode transformar completamente um negócio.`,
          `Este case envolve uma empresa que estava lutando para se destacar em um mercado competitivo.`,
          `Antes de implementar ${theme}, eles enfrentavam problemas sérios de crescimento e retenção.`,
          `O primeiro passo foi realizar uma análise completa do cenário atual e definir objetivos claros.`,
          `Em seguida, desenvolvemos uma estratégia personalizada de ${theme} adaptada às necessidades específicas.`,
          `A implementação foi gradual, com foco inicial nos pontos de maior impacto.`,
          `Os primeiros resultados começaram a aparecer em apenas 30 dias, com aumento de engajamento.`,
          `Em três meses, a empresa registrou crescimento de 150% em seus principais indicadores.`,
          `O segredo foi a consistência e a abordagem científica para testar e otimizar cada etapa.`,
          `Você pode obter resultados semelhantes aplicando estes mesmos princípios em seu negócio.`
        ],
        keywords: ["case", "sucesso", theme.toLowerCase(), "resultados", "estratégia"],
        length: 55
      },
      
      // Modelo 4: Tendências e futuro
      {
        title: `O Futuro do ${theme}: Tendências que Vão Dominar o Mercado`,
        structure: [
          `O cenário de ${theme} está mudando rapidamente. Vamos analisar as principais tendências futuras.`,
          `A primeira tendência é a hiperpersonalização através de inteligência artificial.`,
          `Em segundo lugar, vemos a integração completa entre canais online e offline.`,
          `A terceira tendência é a priorização da experiência do usuário em todas as interações.`,
          `A quarta tendência envolve sustentabilidade e responsabilidade social integradas à estratégia.`,
          `Os dados em tempo real e análise preditiva representam a quinta maior tendência.`,
          `Empresas que antecipam estas mudanças conseguem vantagem competitiva significativa.`,
          `Para se preparar, comece investindo em capacitação e tecnologias adequadas.`,
          `Desenvolva uma mentalidade de experimentação contínua e adaptação rápida.`,
          `O futuro pertence às organizações ágeis que abraçam a evolução constante do ${theme}.`
        ],
        keywords: ["tendências", "futuro", theme.toLowerCase(), "inovação", "tecnologia"],
        length: 48
      },
      
      // Modelo 5: Tutorial passo a passo
      {
        title: `${theme} na Prática: Tutorial Completo Passo a Passo`,
        structure: [
          `Neste tutorial prático, vou mostrar exatamente como implementar ${theme} do zero.`,
          `Antes de começarmos, vamos entender os fundamentos essenciais de ${theme}.`,
          `Passo 1: Defina seus objetivos específicos e mensuráveis com ${theme}.`,
          `Passo 2: Identifique seu público-alvo e suas necessidades específicas.`,
          `Passo 3: Desenvolva sua estratégia personalizada de ${theme}.`,
          `Passo 4: Escolha as ferramentas e plataformas mais adequadas para sua realidade.`,
          `Passo 5: Implemente um sistema de métricas para acompanhar resultados.`,
          `Passo 6: Faça testes, analise os dados e otimize continuamente.`,
          `Passo 7: Escale as estratégias que funcionam e abandone as que não trazem resultados.`,
          `Seguindo este processo, você terá uma implementação de ${theme} realmente eficaz e lucrativa.`
        ],
        keywords: ["tutorial", "passo a passo", theme.toLowerCase(), "implementação", "estratégia"],
        length: 52
      }
    ];
    
    // Selecionar um template aleatório
    const selectedTemplate = scriptTemplates[Math.floor(Math.random() * scriptTemplates.length)];
    
    // Montar o script completo a partir da estrutura
    let fullScript = "";
    for (const paragraph of selectedTemplate.structure) {
      fullScript += paragraph + "\n\n";
    }
    
    // Adicionar um identificador único de fallback para rastreamento
    const template = {
      title: selectedTemplate.title,
      script: fullScript.trim(),
      suggestedKeywords: selectedTemplate.keywords,
      videoLengthSeconds: selectedTemplate.length,
      _fallback: true
    };
    
    // Salvar em cache para referência futura
    const cacheFile = path.join("./fallback-cache/scripts", `script_${Date.now()}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(template, null, 2));
    
    log(`Script avançado de fallback gerado e salvo em ${cacheFile}`, "local-fallback");
    
    return template;
  }
  
  /**
   * Método de fallback para geração de conteúdo para redes sociais
   */
  async generateSocialMediaContent(scriptText: string, options: any): Promise<{
    instagram: string;
    facebook: string;
    twitter: string;
    tiktok: string;
    hashtags: string[];
  }> {
    log("Usando gerador de conteúdo social local de fallback aprimorado", "local-fallback");
    
    // Extrair palavras-chave do texto do script para hashtags mais relevantes
    const words = scriptText.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      "a", "o", "e", "de", "da", "do", "para", "com", "em", "um", "uma", 
      "que", "seu", "sua", "como", "por", "mais", "dos", "das", "nos", "nas",
      "este", "esta", "isso", "aqui", "você", "seu", "sua", "seus", "suas",
      "nós", "eles", "elas", "este", "esta", "estes", "estas", "esse", "essa"
    ]);
    
    // Extrair palavras-chave mais relevantes (não comuns e compridas)
    const keywords = [...new Set(
      words.filter(w => w.length > 3 && !commonWords.has(w))
    )].slice(0, 6);
    
    // Adicionar palavras-chave populares relacionadas ao tema
    const themeKeywords = {
      "marketing": ["estratégia", "digital", "conteúdo", "resultado", "vendas"],
      "negócio": ["empreendedor", "sucesso", "estratégia", "resultado", "crescimento"],
      "vendas": ["conversão", "cliente", "resultado", "estratégia", "negócio"],
      "tecnologia": ["inovação", "digital", "transformação", "futuro", "solução"],
      "finanças": ["investimento", "resultado", "economia", "crescimento", "dinheiro"]
    };
    
    // Tentar encontrar palavras-chave temáticas com base no texto
    let themeMatched = "";
    for (const theme in themeKeywords) {
      if (scriptText.toLowerCase().includes(theme)) {
        themeMatched = theme;
        break;
      }
    }
    
    // Adicionar hashtags temáticas
    const themeHashtags = themeMatched 
      ? themeKeywords[themeMatched].map(k => `#${k}`) 
      : ["#estratégia", "#sucesso", "#crescimento", "#resultado", "#negócios"];
    
    // Gerar hashtags baseadas nas palavras-chave do texto
    const contentHashtags = keywords.map(k => `#${k}`);
    
    // Combinar e remover duplicatas
    const allHashtags = [...new Set([...contentHashtags, ...themeHashtags])];
    
    // Cortar para um número razoável
    const hashtags = allHashtags.slice(0, 8);
    
    // Extrair frases impactantes do script (até três)
    const sentences = scriptText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const impactSentences = sentences.slice(0, 3).map(s => s.trim());
    
    // Extrair título (primeira linha do script)
    const firstLine = sentences[0].trim();
    
    // Encontrar uma frase com apelo à ação
    const callToAction = [
      "Não perca tempo e comece a implementar hoje mesmo!",
      "Clique e descubra como transformar seu negócio!",
      "Assista o vídeo completo e revolucione seus resultados!",
      "Compartilhe com quem precisa dessas informações!",
      "Salve este post para consultar mais tarde!"
    ][Math.floor(Math.random() * 5)];
    
    // Gerar conteúdo específico para Instagram - mais visual e engajador
    const instagram = `✨ ${firstLine} ✨\n\n${impactSentences[0]}\n\n${
      impactSentences.length > 1 ? `💡 ${impactSentences[1]}\n\n` : ""
    }👉 ${callToAction}\n\nDeixe seu comentário se isso te ajudou!\n\n${hashtags.join(" ")}`;
    
    // Conteúdo para Facebook - mais informativo e detalhado
    const facebook = `📊 ${firstLine}\n\n${
      scriptText.substring(0, Math.min(scriptText.length, 250))
    }...\n\n${callToAction}\n\nClique abaixo para assistir o vídeo completo e descobrir como aplicar estas estratégias no seu negócio!\n\n${
      hashtags.slice(0, 5).join(" ")
    }`;
    
    // Twitter - conciso e direto
    const twitter = `${
      impactSentences[0].substring(0, Math.min(impactSentences[0].length, 200))
    }\n\n${callToAction.substring(0, 50)}...\n\n${hashtags.slice(0, 3).join(" ")}`;
    
    // TikTok - muito breve, com emojis e alta energia
    const tiktok = `${firstLine} 🔥\n\n${
      impactSentences.length > 1 ? impactSentences[1].split(" ").slice(0, 7).join(" ") + "..." : ""
    }\n\n✅ ${callToAction}\n\n${hashtags.slice(0, 4).join(" ")}`;
    
    const result = {
      instagram,
      facebook,
      twitter,
      tiktok,
      hashtags,
      _fallback: true
    };
    
    // Salvar em cache para referência futura
    const cacheFile = path.join("./fallback-cache/scripts", `social_${Date.now()}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    
    log(`Conteúdo social avançado de fallback gerado e salvo em ${cacheFile}`, "local-fallback");
    
    return result;
  }
  
  /**
   * Método de fallback para sugestão de tópicos em tendência
   */
  async suggestTrendingTopics(theme: string, count: number = 5): Promise<string[]> {
    log("Usando gerador de tópicos em tendência local de fallback", "local-fallback");
    
    const trendingTopicsMap: Record<string, string[]> = {
      "marketing digital": [
        "Marketing de Conteúdo para Pequenas Empresas",
        "Estratégias de SEO para 2025",
        "Como Usar o TikTok para Negócios",
        "Automação de Marketing para Iniciantes",
        "Email Marketing que Converte",
        "Inteligência Artificial no Marketing",
        "Estratégias de Marketing para E-commerce",
        "Psicologia do Consumidor Online",
        "Como Criar uma Comunidade Engajada",
        "Análise de Dados para Decisões de Marketing"
      ],
      "vendas": [
        "Técnicas de Vendas Consultivas",
        "Como Construir um Funil de Vendas Eficiente",
        "Objeções de Vendas: Como Superar",
        "Vendas por WhatsApp: Estratégias que Funcionam",
        "Psicologia da Persuasão em Vendas",
        "Vendas B2B no Ambiente Digital",
        "Como Aumentar o Ticket Médio",
        "Scripts de Vendas que Convertem",
        "Negociação Avançada para Vendedores",
        "Como Qualificar Leads Efetivamente"
      ],
      "negócios": [
        "Modelos de Negócios Escaláveis",
        "Como Criar um Plano de Negócios Efetivo",
        "Gestão Financeira para Empreendedores",
        "Estratégias de Precificação",
        "Como Validar uma Ideia de Negócio",
        "Captação de Investimentos para Startups",
        "Modelos de Receita Recorrente",
        "Gestão de Equipes Remotas",
        "Parcerias Estratégicas para Crescimento",
        "Internacionalização de Pequenos Negócios"
      ],
      "empreendedorismo": [
        "Como Empreender com Pouco Capital",
        "Mentalidade do Empreendedor de Sucesso",
        "Da Ideia ao Negócio em 60 Dias",
        "Erros Fatais que Empreendedores Cometem",
        "Como Equilibrar Vida Pessoal e Empreendedorismo",
        "Bootstrapping: Crescendo sem Investimento Externo",
        "Storytelling para Empreendedores",
        "Produtividade para Fundadores",
        "Como Encontrar um Co-fundador Ideal",
        "Desenvolvendo Resiliência Empreendedora"
      ],
      "tecnologia": [
        "Inteligência Artificial para Pequenas Empresas",
        "Blockchain Além das Criptomoedas",
        "Automação de Processos com Low Code",
        "Cibersegurança para Negócios Digitais",
        "Realidade Aumentada no Comércio Eletrônico",
        "Edge Computing: O Futuro da Computação",
        "Tecnologias Verdes para Empresas",
        "Transformação Digital Passo a Passo",
        "Internet das Coisas em Aplicações Comerciais",
        "5G e o Impacto nos Negócios"
      ]
    };
    
    // Normalizar tema para busca no mapa
    const normalizedTheme = theme.toLowerCase();
    
    // Encontrar a categoria mais próxima se não houver correspondência exata
    let topics: string[] = [];
    let bestCategory = "";
    let bestScore = 0;
    
    for (const category in trendingTopicsMap) {
      if (category === normalizedTheme) {
        // Correspondência exata
        topics = [...trendingTopicsMap[category]];
        break;
      }
      
      // Verificar se o tema contém ou está contido na categoria
      if (category.includes(normalizedTheme) || normalizedTheme.includes(category)) {
        const score = Math.min(category.length, normalizedTheme.length) / 
                      Math.max(category.length, normalizedTheme.length);
        
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }
    }
    
    // Usar a melhor categoria encontrada se não houver correspondência exata
    if (topics.length === 0 && bestCategory) {
      topics = [...trendingTopicsMap[bestCategory]];
    }
    
    // Fallback genérico se nenhuma categoria for encontrada
    if (topics.length === 0) {
      topics = [
        `5 Estratégias de ${theme} para 2025`,
        `Como Usar ${theme} para Aumentar Vendas`,
        `${theme} para Iniciantes: Guia Completo`,
        `Tendências de ${theme} que Você Precisa Conhecer`,
        `O Futuro do ${theme} nos Próximos Anos`,
        `${theme} Avançado: Técnicas Profissionais`,
        `Case de Sucesso: ${theme} na Prática`,
        `Ferramentas Essenciais para ${theme}`,
        `Erros Comuns em ${theme} e Como Evitar`,
        `${theme} vs Métodos Tradicionais: O Que Funciona Melhor?`
      ];
    }
    
    // Embaralhar e limitar ao número solicitado
    const shuffled = topics.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    // Salvar em cache para referência futura
    const result = {
      theme,
      topics: selected,
      _fallback: true
    };
    
    const cacheFile = path.join("./fallback-cache/scripts", `topics_${Date.now()}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    
    log(`Tópicos em tendência de fallback gerados e salvos em ${cacheFile}`, "local-fallback");
    
    return selected;
  }
  
  /**
   * Sintetiza texto em fala usando um processo local se possível,
   * ou gera um arquivo de áudio simples como fallback
   */
  async synthesizeSpeech(text: string, language: string = "pt-BR"): Promise<Buffer> {
    log("Usando sintetizador de fala local de fallback", "local-fallback");
    
    // Nome de arquivo único baseado no hash do texto
    const textHash = Buffer.from(text).toString('base64').replace(/[/+=]/g, '').substring(0, 10);
    const outputPath = path.join("./fallback-cache/audio", `speech_${textHash}.mp3`);
    
    // Verificar se já temos este texto em cache
    if (fs.existsSync(outputPath)) {
      log(`Usando arquivo de áudio em cache: ${outputPath}`, "local-fallback");
      return fs.readFileSync(outputPath);
    }
    
    // Tentar usar espeak se disponível no sistema
    try {
      await this.generateAudioWithEspeak(text, outputPath, language);
      return fs.readFileSync(outputPath);
    } catch (error) {
      log(`Espeak falhou, usando arquivo de áudio de fallback genérico`, "local-fallback");
      
      // Se espeak falhar, copiar um arquivo de áudio genérico pré-gravado
      const genericAudioPath = path.join("./fallback-cache/audio", "generic_speech.mp3");
      
      // Se não tivermos nem mesmo o arquivo genérico, criar um vazio
      if (!fs.existsSync(genericAudioPath)) {
        this.createEmptyAudioFile(genericAudioPath);
      }
      
      // Copiar o arquivo genérico para o caminho esperado
      fs.copyFileSync(genericAudioPath, outputPath);
      return fs.readFileSync(outputPath);
    }
  }
  
  /**
   * Tenta gerar áudio usando espeak (se disponível no sistema)
   */
  private async generateAudioWithEspeak(text: string, outputPath: string, language: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar lingua para espeak
      const langMap: Record<string, string> = {
        "pt-BR": "pt-br",
        "en-US": "en-us",
        "es-ES": "es",
        "fr-FR": "fr",
        "de-DE": "de",
        "it-IT": "it"
      };
      
      const espeakLang = langMap[language] || "pt-br";
      
      // Arquivo WAV temporário (espeak gera WAV)
      const tempWavPath = outputPath.replace(".mp3", ".wav");
      
      // Executar espeak para gerar o arquivo WAV
      const espeakProcess = spawn("espeak", [
        "-v", espeakLang,
        "-f", "-", // ler do stdin
        "-w", tempWavPath
      ]);
      
      espeakProcess.stdin.write(text);
      espeakProcess.stdin.end();
      
      espeakProcess.on("error", (error) => {
        log(`Erro ao executar espeak: ${error.message}`, "local-fallback");
        reject(error);
      });
      
      espeakProcess.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(`espeak saiu com código ${code}`));
        }
        
        // Converter WAV para MP3 usando FFmpeg
        const ffmpegService = new FFmpegService();
        
        ffmpegService.convertAudioFormat(tempWavPath, outputPath, "mp3")
          .then(() => {
            // Remover arquivo WAV temporário
            if (fs.existsSync(tempWavPath)) {
              fs.unlinkSync(tempWavPath);
            }
            resolve();
          })
          .catch(reject);
      });
    });
  }
  
  /**
   * Cria um arquivo de áudio vazio/genérico como último recurso
   */
  private createEmptyAudioFile(filePath: string): void {
    // Criar um diretório pai se não existir
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Preencher com um arquivo de áudio mínimo (1 segundo de silêncio)
    const ffmpegService = new FFmpegService();
    
    try {
      ffmpegService.createSilentAudio(filePath, 1)
        .catch(error => {
          log(`Erro ao criar áudio silencioso: ${error.message}`, "local-fallback");
          // Como último recurso, criar um arquivo vazio
          fs.writeFileSync(filePath, Buffer.alloc(0));
        });
    } catch (error) {
      log(`Erro ao inicializar FFmpeg: ${error instanceof Error ? error.message : String(error)}`, "local-fallback");
      // Como último recurso, criar um arquivo vazio
      fs.writeFileSync(filePath, Buffer.alloc(0));
    }
  }
}

// Instância singleton
export const localFallbackService = new LocalFallbackService();