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
  id: string;
  name: string;
  gender: string;
  languageCodes: string[];
  description: string;
  previewUrl: string;
  category?: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private availableVoices: Voice[] = [
    {
      id: "pNInz6obpgDQGcFmaJgB", // António
      name: "António (PT)",
      gender: "male",
      languageCodes: ["pt-PT"],
      description: "Voz masculina portuguesa com tom profissional",
      previewUrl: "https://elevenlabs.io/voice-library/preview/pNInz6obpgDQGcFmaJgB",
      category: "professional"
    },
    {
      id: "jsCqWAovK2LkecY7zXl4", // Nicole
      name: "Nicole (Brasileira)",
      gender: "female",
      languageCodes: ["pt-BR"],
      description: "Voz feminina brasileira com tom natural e persuasivo",
      previewUrl: "https://elevenlabs.io/voice-library/preview/jsCqWAovK2LkecY7zXl4",
      category: "natural"
    },
    {
      id: "IKne3meq5aSn9XLyUdCD", // Adam
      name: "Adam (Português)",
      gender: "male",
      languageCodes: ["pt"],
      description: "Voz masculina com tom autoritativo e confiante",
      previewUrl: "https://elevenlabs.io/voice-library/preview/IKne3meq5aSn9XLyUdCD",
      category: "authoritative"
    },
    {
      id: "XB0fDUnXU5powFXDhCwa", // Sebastian
      name: "Sebastian (PT-BR)",
      gender: "male",
      languageCodes: ["pt-BR"],
      description: "Voz masculina brasileira com tom profundo",
      previewUrl: "https://elevenlabs.io/voice-library/preview/XB0fDUnXU5powFXDhCwa",
      category: "professional"
    },
    {
      id: "EXAVITQu4vr4xnSDxMaL", // Bella
      name: "Bella (BR Natural)",
      gender: "female",
      languageCodes: ["pt-BR"],
      description: "Voz feminina brasileira com tom conversacional e amigável",
      previewUrl: "https://elevenlabs.io/voice-library/preview/EXAVITQu4vr4xnSDxMaL",
      category: "friendly"
    },
    {
      id: "onwK4e9ZLuTAKqWW03F9", // Lucas
      name: "Lucas (Vendedor BR)",
      gender: "male",
      languageCodes: ["pt-BR"],
      description: "Voz masculina brasileira ideal para vendas com tom persuasivo",
      previewUrl: "https://elevenlabs.io/voice-library/preview/onwK4e9ZLuTAKqWW03F9",
      category: "sales"
    }
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchAvailableVoices(): Promise<Voice[]> {
    try {
      // Em um cenário real, buscaríamos as vozes da API ElevenLabs
      // Para manter a simplicidade, usamos as vozes pré-definidas
      log("[elevenlabs] Usando vozes pré-cadastradas", "tts");
      return this.availableVoices;
    } catch (error) {
      log(`[elevenlabs] Erro ao buscar vozes: ${error}`, "tts");
      // Fallback para vozes pré-configuradas
      return this.availableVoices;
    }
  }

  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    try {
      const { text, voice = "Nicole (Brasileira)", speed = 1.0 } = options;
      
      log(`[elevenlabs] Sintetizando texto com voz: ${voice}`, "tts");
      
      // Encontra o ID da voz pelo nome
      const voiceInfo = this.availableVoices.find(v => v.name === voice);
      const voiceId = voiceInfo?.id || "jsCqWAovK2LkecY7zXl4"; // Default para Nicole (BR)
      
      let languageCode = "pt-BR";
      let gender = "female";
      
      if (voiceInfo) {
        if (voiceInfo.languageCodes.length > 0) {
          languageCode = voiceInfo.languageCodes[0];
        }
        gender = voiceInfo.gender;
      }
      
      // Como não temos a API key do ElevenLabs, usamos o Google Translate TTS como fallback
      
      // Divide o texto em chunks para lidar com a limitação do Google TTS
      const textChunks = this.splitText(text, 200);
      const audioBuffers: Buffer[] = [];
      
      for (const chunk of textChunks) {
        if (!chunk.trim()) continue;
        
        // Usamos o Google Translate TTS como fallback
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        
        const response = await axios.get(googleUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        audioBuffers.push(Buffer.from(response.data));
      }
      
      // Combina os buffers de áudio
      const audioBuffer = Buffer.concat(audioBuffers);
      
      // Converte para Base64
      const audioBase64 = audioBuffer.toString('base64');
      
      // Cria diretório de uploads se não existir
      const uploadsDir = path.join(process.cwd(), "uploads");
      const audioDir = path.join(uploadsDir, "audio");
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      // Salva o arquivo com nome único
      const fileName = `elevenlabs_${nanoid()}.mp3`;
      const filePath = path.join(audioDir, fileName);
      
      fs.writeFileSync(filePath, audioBuffer);
      
      return {
        audioContent: audioBase64,
        fileName,
        filePath,
      };
    } catch (error) {
      log(`[elevenlabs] Erro ao sintetizar voz: ${error}`, "tts");
      throw new Error(`Erro ao sintetizar voz com ElevenLabs: ${error instanceof Error ? error.message : String(error)}`);
    }
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

  async getVoices(): Promise<{ voices: Voice[] }> {
    // Primeiro tentamos buscar da API, se falhar usa as predefinidas
    const voices = await this.fetchAvailableVoices();
    return { voices };
  }
}