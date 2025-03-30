import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import axios from "axios";
import { log } from "../vite";

interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;
}

interface TTSResponse {
  audioContent: string; // base64 encoded audio
  fileName: string;
  filePath: string;
}

interface Voice {
  name: string;
  gender: string;
  languageCodes: string[];
  description: string; // Descrição do tipo de voz (autoridade, persuasiva, amigável)
  useCase: string; // Caso de uso recomendado
}

/**
 * Serviço de voz premium para português brasileiro
 * Implementa uma estratégia de múltiplas fontes para garantir vozes consistentes
 * e de alta qualidade para o mercado brasileiro.
 */
export class PremiumBrazilianVoiceService {
  private availableVoices: Voice[] = [
    {
      name: "Ricardo Autoritativo",
      gender: "male",
      languageCodes: ["pt-BR"],
      description: "Voz masculina com tom de autoridade e confiança",
      useCase: "Vídeos educativos, explicativos e de autoridade no nicho"
    },
    {
      name: "Amanda Persuasiva",
      gender: "female",
      languageCodes: ["pt-BR"],
      description: "Voz feminina com tom persuasivo e engajante",
      useCase: "Vídeos de vendas e chamadas para ação"
    },
    {
      name: "Carlos Especialista",
      gender: "male",
      languageCodes: ["pt-BR"],
      description: "Voz masculina com tom de especialista técnico",
      useCase: "Tutoriais técnicos e demonstrações de produto"
    },
    {
      name: "Luciana Amigável",
      gender: "female",
      languageCodes: ["pt-BR"],
      description: "Voz feminina com tom amigável e acessível",
      useCase: "Vídeos de relacionamento com cliente e dicas"
    }
  ];

  private ttsProviders: {
    [key: string]: (text: string, options: TTSOptions) => Promise<Buffer>;
  } = {};

  constructor() {
    // Inicializa os provedores de TTS com diferentes tecnologias
    this.initProviders();
  }

  private initProviders() {
    // Provedor 1: Google Translate TTS (maior consistência, menor qualidade)
    this.ttsProviders["google"] = async (text: string, options: TTSOptions) => {
      const voice = options.voice || "Ricardo Autoritativo";
      const languageCode = this.getLanguageCodeForVoice(voice);
      const gender = this.getGenderForVoice(voice);
      
      // Seleciona uma voz específica do Google baseada no gênero
      const googleVoice = gender === "male" ? "pt-BR-Standard-B" : "pt-BR-Standard-A";
      
      // Limitação do Google Translate TTS: 200 caracteres por requisição
      // Dividimos o texto em partes e combinamos o resultado
      const textChunks = this.splitText(text, 200);
      const audioBuffers: Buffer[] = [];
      
      for (const chunk of textChunks) {
        if (!chunk.trim()) continue;
        
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        audioBuffers.push(Buffer.from(response.data));
      }
      
      // Combina os buffers de áudio
      return Buffer.concat(audioBuffers);
    };
    
    // Provedor 2: ResponsiveVoice via API alternativa (voz mais natural)
    this.ttsProviders["responsiveVoice"] = async (text: string, options: TTSOptions) => {
      const voice = options.voice || "Ricardo Autoritativo";
      let rvVoice = "Brazilian Portuguese Male";
      
      // Mapeia vozes personalizadas para as vozes do ResponsiveVoice
      if (voice === "Ricardo Autoritativo" || voice === "Carlos Especialista") {
        rvVoice = "Brazilian Portuguese Male";
      } else if (voice === "Amanda Persuasiva" || voice === "Luciana Amigável") {
        rvVoice = "Brazilian Portuguese Female";
      }
      
      const url = `https://texttospeech.responsivevoice.org/v1/text:synthesize?text=${encodeURIComponent(text)}&lang=pt-BR&engine=g1&name=${encodeURIComponent(rvVoice)}&key=0POmS5Y2&gender=male`;
      
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        return Buffer.from(response.data);
      } catch (error) {
        // Se falhar, tenta com o provedor do Google
        log(`[PremiumBrazilianVoice] Fallback para Google: ${error}`, "tts");
        return this.ttsProviders["google"](text, options);
      }
    };
    
    // Provedor 3: Voice RSS (alta qualidade, requer API key em produção)
    // Deixamos comentado pois precisaria de uma API key
    /*
    this.ttsProviders["voiceRSS"] = async (text: string, options: TTSOptions) => {
      const voice = options.voice || "Ricardo Autoritativo";
      const gender = this.getGenderForVoice(voice);
      
      // Precisaria de API key em produção
      // const apiKey = process.env.VOICE_RSS_API_KEY;
      const apiKey = "DEMO_KEY"; 
      
      const url = `https://api.voicerss.org/?key=${apiKey}&hl=pt-br&v=${gender === "male" ? "Paulo" : "Marcia"}&src=${encodeURIComponent(text)}`;
      
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer'
        });
        
        return Buffer.from(response.data);
      } catch (error) {
        // Se falhar, tenta com o provedor do ResponsiveVoice
        return this.ttsProviders["responsiveVoice"](text, options);
      }
    };
    */
  }

  /**
   * Sintetiza fala a partir de texto usando a voz brasileira escolhida
   */
  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    try {
      const voice = options.voice || "Ricardo Autoritativo";
      log(`[PremiumBrazilianVoice] Sintetizando voz: ${voice}`, "tts");
      
      // Algoritmo para escolher o melhor provedor baseado na voz
      const provider = this.selectBestProvider(voice);
      
      // Obtém áudio do provedor selecionado
      const audioBuffer = await this.ttsProviders[provider](options.text, options);
      const audioBase64 = audioBuffer.toString('base64');
      
      // Cria diretório de uploads se não existir
      const uploadsDir = path.join(process.cwd(), "uploads");
      const audioDir = path.join(uploadsDir, "audio");
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      // Salva arquivo com nome único
      const fileName = `${nanoid()}-${voice.replace(/\s+/g, '-').toLowerCase()}.mp3`;
      const filePath = path.join(audioDir, fileName);
      
      fs.writeFileSync(filePath, audioBuffer);
      
      return {
        audioContent: audioBase64,
        fileName,
        filePath,
      };
    } catch (error) {
      log(`[PremiumBrazilianVoice] Error: ${error}`, "tts");
      throw new Error(`Erro ao sintetizar voz brasileira premium: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Seleciona o melhor provedor de voz baseado na voz solicitada
   */
  private selectBestProvider(voice: string): string {
    // Algoritmo simples de seleção baseado na voz solicitada
    if (voice === "Ricardo Autoritativo" || voice === "Carlos Especialista") {
      return "responsiveVoice"; // Voz masculina funciona bem com ResponsiveVoice
    }
    
    // Por padrão, usa o Google que tem maior consistência
    return "google";
  }

  /**
   * Retorna o código do idioma com base no nome da voz
   */
  private getLanguageCodeForVoice(voiceName: string): string {
    const voice = this.availableVoices.find(v => v.name === voiceName);
    if (voice && voice.languageCodes.length > 0) {
      return voice.languageCodes[0];
    }
    
    // Fallback para português brasileiro
    return "pt-BR";
  }

  /**
   * Retorna o gênero com base no nome da voz
   */
  private getGenderForVoice(voiceName: string): string {
    const voice = this.availableVoices.find(v => v.name === voiceName);
    if (voice) {
      return voice.gender;
    }
    
    // Fallback para masculino
    return "male";
  }

  /**
   * Divide o texto em partes menores para APIs com limitação de tamanho
   */
  private splitText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }
    
    const chunks: string[] = [];
    let currentPosition = 0;
    
    while (currentPosition < text.length) {
      let endPosition = Math.min(currentPosition + maxLength, text.length);
      
      // Tenta encontrar um ponto ou vírgula para fazer um corte limpo
      const lastPunctuationMark = Math.max(
        text.lastIndexOf('.', endPosition),
        text.lastIndexOf('!', endPosition),
        text.lastIndexOf('?', endPosition),
        text.lastIndexOf(',', endPosition),
        text.lastIndexOf(';', endPosition)
      );
      
      if (lastPunctuationMark > currentPosition) {
        endPosition = lastPunctuationMark + 1;
      }
      
      chunks.push(text.substring(currentPosition, endPosition).trim());
      currentPosition = endPosition;
    }
    
    return chunks;
  }

  /**
   * Obtém todas as vozes brasileiras disponíveis
   */
  async getVoices(): Promise<{ voices: Voice[] }> {
    return { voices: this.availableVoices };
  }
}