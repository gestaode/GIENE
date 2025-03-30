import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import axios from "axios";

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
}

export class ResponsiveVoiceService {
  private availableVoices: Voice[] = [
    {
      name: "Brazilian Portuguese Female",
      gender: "female",
      languageCodes: ["pt-BR"],
    },
    {
      name: "Brazilian Portuguese Male",
      gender: "male",
      languageCodes: ["pt-BR"],
    },
    {
      name: "Portuguese Female",
      gender: "female",
      languageCodes: ["pt-PT"],
    },
    {
      name: "Portuguese Male",
      gender: "male",
      languageCodes: ["pt-PT"],
    },
    {
      name: "US English Female",
      gender: "female",
      languageCodes: ["en-US"],
    },
    {
      name: "US English Male",
      gender: "male",
      languageCodes: ["en-US"],
    }
  ];

  /**
   * Gera áudio a partir de texto usando Google Translate TTS API (alternativa gratuita)
   */
  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    try {
      const voiceName = options.voice || "Brazilian Portuguese Female";
      
      // Mapeamento de nomes de vozes para códigos de idioma do Google Translate
      const languageCode = this.getLanguageCodeForVoice(voiceName);
      
      // Google Translate TTS API URL (não requer API key)
      // Esta é uma solução alternativa, pois a ResponsiveVoice estava retornando 403
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=tw-ob&q=${encodeURIComponent(options.text)}`;
      
      // Adicionar User-Agent para simular um navegador
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const audioBuffer = Buffer.from(response.data);
      const audioBase64 = audioBuffer.toString('base64');
      
      // Cria diretório de uploads se não existir
      const uploadsDir = path.join(process.cwd(), "uploads");
      const audioDir = path.join(uploadsDir, "audio");
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      const fileName = `${nanoid()}.mp3`;
      const filePath = path.join(audioDir, fileName);
      
      fs.writeFileSync(filePath, audioBuffer);
      
      return {
        audioContent: audioBase64,
        fileName,
        filePath,
      };
    } catch (error) {
      console.error("[responsive-voice] Error synthesizing speech:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Erro ao sintetizar voz: ${errorMessage}`);
    }
  }
  
  /**
   * Retorna o código do idioma com base no nome da voz
   */
  private getLanguageCodeForVoice(voiceName: string): string {
    // Encontra a voz nos disponíveis e retorna o primeiro código de idioma
    const voice = this.availableVoices.find(v => v.name === voiceName);
    if (voice && voice.languageCodes.length > 0) {
      return voice.languageCodes[0];
    }
    
    // Fallback para português brasileiro se a voz não for encontrada
    return "pt-BR";
  }

  /**
   * Obter as vozes disponíveis
   */
  async getVoices(): Promise<{ voices: Voice[] }> {
    return { voices: this.availableVoices };
  }
}