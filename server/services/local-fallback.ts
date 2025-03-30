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
    log("Usando gerador de scripts local de fallback", "local-fallback");
    
    const themes = [
      "Marketing Digital",
      "Vendas Online",
      "Estratégias de Negócios",
      "Empreendedorismo",
      "Transformação Digital"
    ];
    
    // Use o tema fornecido ou escolha um aleatoriamente
    const theme = options.theme || themes[Math.floor(Math.random() * themes.length)];
    
    // Templates de scripts pré-definidos
    const scriptTemplates = [
      {
        title: `5 Estratégias Essenciais para ${theme}`,
        script: `Olá! Hoje vou compartilhar 5 estratégias essenciais para ter sucesso com ${theme}.

Primeiro, é fundamental conhecer seu público-alvo e entender suas necessidades específicas.

Segundo, desenvolva uma presença online consistente e profissional que reflita os valores da sua marca.

Terceiro, crie conteúdo relevante e de valor que resolva problemas reais do seu público.

Quarto, use análise de dados para tomar decisões baseadas em informações concretas, não em suposições.

Por último, esteja sempre atualizado com as tendências do mercado e adapte suas estratégias conforme necessário.

Implemente essas cinco estratégias e você verá resultados significativos em pouco tempo!`,
        keywords: ["estratégias", theme.toLowerCase(), "sucesso", "negócios", "crescimento"],
        length: 45
      },
      {
        title: `Como Revolucionar Seu Negócio com ${theme}`,
        script: `Você quer revolucionar seu negócio usando ${theme}? Neste vídeo, vou mostrar exatamente como fazer isso.

O mercado está mudando rapidamente, e as empresas que não se adaptam ficam para trás. ${theme} é a chave para se manter competitivo.

Muitos empreendedores cometem o erro de ignorar o poder do ${theme} até que seja tarde demais.

Com a metodologia certa, você pode implementar ${theme} em seu negócio de forma eficaz e econômica.

Os resultados falam por si: empresas que investem em ${theme} veem um aumento médio de 30% em seus resultados.

Não perca mais tempo! Comece hoje mesmo a transformar seu negócio com ${theme}.`,
        keywords: [theme.toLowerCase(), "transformação", "resultados", "negócios", "crescimento"],
        length: 40
      },
      {
        title: `O Segredo do ${theme} que Ninguém te Conta`,
        script: `Existe um segredo sobre ${theme} que poucos profissionais conhecem, e hoje vou revelar para você.

A maioria das pessoas aborda ${theme} da maneira errada, focando apenas nos aspectos superficiais.

O verdadeiro poder do ${theme} está na consistência e na estratégia de longo prazo.

Enquanto seus concorrentes estão seguindo tendências passageiras, você pode construir uma base sólida.

Este segredo transformou completamente os resultados dos meus clientes, com aumentos de até 250% em seus retornos.

Se você implementar o que aprenderá hoje, seu negócio nunca mais será o mesmo. Vamos começar!`,
        keywords: ["segredo", theme.toLowerCase(), "estratégia", "resultados", "transformação"],
        length: 35
      }
    ];
    
    // Selecionar um template aleatório
    const selectedTemplate = scriptTemplates[Math.floor(Math.random() * scriptTemplates.length)];
    
    // Adicionar um identificador único de fallback para rastreamento
    const template = {
      title: selectedTemplate.title,
      script: selectedTemplate.script,
      suggestedKeywords: selectedTemplate.keywords,
      videoLengthSeconds: selectedTemplate.length,
      _fallback: true
    };
    
    // Salvar em cache para referência futura
    const cacheFile = path.join("./fallback-cache/scripts", `script_${Date.now()}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(template, null, 2));
    
    log(`Script de fallback gerado e salvo em ${cacheFile}`, "local-fallback");
    
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
    log("Usando gerador de conteúdo social local de fallback", "local-fallback");
    
    // Extrair palavras-chave do texto do script
    const words = scriptText.toLowerCase().split(/\s+/);
    const commonWords = new Set(["a", "o", "e", "de", "da", "do", "para", "com", "em", "um", "uma", "que", "seu", "sua"]);
    const keywords = [...new Set(words.filter(w => w.length > 3 && !commonWords.has(w)))].slice(0, 5);
    
    // Gerar hashtags baseadas nas palavras-chave
    const hashtags = keywords.map(k => `#${k}`);
    
    // Extrair uma frase impactante do script (primeira ou segunda frase)
    const sentences = scriptText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const impactSentence = sentences.length > 1 ? sentences[1].trim() : sentences[0].trim();
    
    // Extrair título (primeira linha do script)
    const firstLine = sentences[0].trim();
    
    // Gerar conteúdos específicos para cada plataforma
    const instagram = `✨ ${firstLine} ✨\n\n${impactSentence}\n\nLeia mais no link da bio!\n\n${hashtags.join(" ")}`;
    
    const facebook = `${firstLine}\n\n${scriptText.substring(0, Math.min(scriptText.length, 200))}...\n\nClique abaixo para assistir o vídeo completo e descobrir mais!\n\n${hashtags.slice(0, 3).join(" ")}`;
    
    const twitter = `${impactSentence.substring(0, Math.min(impactSentence.length, 180))}...\n\n${hashtags.slice(0, 2).join(" ")}`;
    
    const tiktok = `${firstLine} 🔥\n\n${hashtags.join(" ")}`;
    
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
    
    log(`Conteúdo social de fallback gerado e salvo em ${cacheFile}`, "local-fallback");
    
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