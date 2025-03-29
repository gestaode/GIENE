import { log } from '../vite';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import TTS from 'tts-js';

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

export class TTSJSService {
  private tts: TTS;
  private availableVoices: Voice[] = [
    {
      name: "tts_models/pt/cv/vits",
      gender: "female",
      languageCodes: ["pt-BR"],
    },
    {
      name: "tts_models/multilingual/multi-dataset/your_tts",
      gender: "female",
      languageCodes: ["pt-BR", "en-US", "es-ES"],
    },
    {
      name: "tts_models/en/ljspeech/tacotron2-DDC",
      gender: "female",
      languageCodes: ["en-US"],
    },
    {
      name: "tts_models/en/ljspeech/glow-tts",
      gender: "female",
      languageCodes: ["en-US"],
    },
    {
      name: "tts_models/en/ljspeech/speedy-speech",
      gender: "female",
      languageCodes: ["en-US"],
    },
    {
      name: "tts_models/en/ljspeech/vits",
      gender: "female",
      languageCodes: ["en-US"],
    },
  ];

  constructor() {
    this.tts = new TTS();
  }

  /**
   * Gera áudio a partir de texto usando TTS-JS local
   */
  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    try {
      const { 
        text,
        voice = "tts_models/pt/cv/vits",
        speed = 1.0
      } = options;
      
      log(`Sintetizando voz com TTS-JS local: "${text.substring(0, 30)}..."`, 'tts');
      
      // Usar a biblioteca TTS-JS para sintetizar a voz
      const result = await this.tts.speak({
        text,
        model: voice,
        speed
      });
      
      // Converter o buffer para base64
      const audioBase64 = result.buffer.toString('base64');
      
      // Salvar o áudio como arquivo
      const uploadsDir = path.join(process.cwd(), "uploads");
      const audioDir = path.join(uploadsDir, "audio");
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      const fileName = `${nanoid()}.mp3`;
      const filePath = path.join(audioDir, fileName);
      
      fs.writeFileSync(filePath, result.buffer);
      
      return {
        audioContent: audioBase64,
        fileName,
        filePath,
      };
    } catch (error) {
      log(`Erro ao sintetizar voz com TTS-JS: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw new Error(`Erro ao sintetizar voz: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Obter as vozes disponíveis
   */
  async getVoices(): Promise<{ voices: Voice[] }> {
    return { voices: this.availableVoices };
  }
}