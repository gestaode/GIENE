import { log } from '../vite';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

const OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'audio');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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

export class CoquiTTSService {
  private availableVoices: Voice[] = [
    { name: "default", languageCodes: ["pt-BR", "en-US"], gender: "FEMALE" },
    { name: "pt-BR-Standard-A", languageCodes: ["pt-BR"], gender: "FEMALE" },
    { name: "pt-BR-Standard-B", languageCodes: ["pt-BR"], gender: "MALE" },
    { name: "pt-BR-Standard-C", languageCodes: ["pt-BR"], gender: "FEMALE" },
    { name: "pt-BR-Wavenet-A", languageCodes: ["pt-BR"], gender: "FEMALE" },
    { name: "pt-BR-Wavenet-B", languageCodes: ["pt-BR"], gender: "MALE" },
    { name: "pt-BR-Wavenet-C", languageCodes: ["pt-BR"], gender: "FEMALE" },
    { name: "pt-PT-Standard-A", languageCodes: ["pt-PT"], gender: "FEMALE" },
    { name: "pt-PT-Standard-B", languageCodes: ["pt-PT"], gender: "MALE" },
    { name: "pt-PT-Standard-C", languageCodes: ["pt-PT"], gender: "MALE" },
    { name: "pt-PT-Standard-D", languageCodes: ["pt-PT"], gender: "FEMALE" },
    { name: "pt-PT-Wavenet-A", languageCodes: ["pt-PT"], gender: "FEMALE" },
    { name: "pt-PT-Wavenet-B", languageCodes: ["pt-PT"], gender: "MALE" },
    { name: "pt-PT-Wavenet-C", languageCodes: ["pt-PT"], gender: "MALE" },
    { name: "pt-PT-Wavenet-D", languageCodes: ["pt-PT"], gender: "FEMALE" },
    { name: "en-US-Standard-A", languageCodes: ["en-US"], gender: "MALE" },
    { name: "en-US-Standard-B", languageCodes: ["en-US"], gender: "MALE" },
    { name: "en-US-Standard-C", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "en-US-Standard-D", languageCodes: ["en-US"], gender: "MALE" },
    { name: "en-US-Standard-E", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "en-US-Standard-F", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "en-US-Standard-G", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "en-US-Standard-H", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "en-US-Standard-I", languageCodes: ["en-US"], gender: "MALE" },
    { name: "en-US-Standard-J", languageCodes: ["en-US"], gender: "MALE" },
  ];
  
  // Mapeamento entre vozes Coqui e OpenAI TTS
  private voiceMapping: Record<string, string> = {
    "default": "nova", 
    "tts_models/pt/cv/vits": "alloy", 
    "tts_models/multilingual/multi-dataset/your_tts": "echo",
    "tts_models/en/ljspeech/tacotron2-DDC": "fable", 
    "tts_models/en/ljspeech/glow-tts": "onyx", 
    "tts_models/en/ljspeech/speedy-speech": "shimmer", 
    "tts_models/en/ljspeech/vits": "nova", 
    // Mapeamento para as vozes do Google Cloud TTS originais
    "pt-BR-Standard-A": "nova",
    "pt-BR-Standard-B": "echo",
    "pt-BR-Standard-C": "alloy",
    "pt-BR-Wavenet-A": "shimmer",
    "pt-BR-Wavenet-B": "onyx",
    "pt-BR-Wavenet-C": "fable",
    "en-US-Standard-A": "echo",
    "en-US-Standard-B": "onyx",
    "en-US-Standard-C": "nova",
    "en-US-Standard-D": "echo",
    "en-US-Standard-E": "alloy",
    "en-US-Standard-F": "fable",
    "en-US-Standard-G": "shimmer",
  };
  
  private openaiTTSService: any;
  
  constructor() {
    // Nota: O serviço real será injetado no método initializeService em routes.ts
    this.openaiTTSService = null;
  }

  setOpenAITTSService(service: any) {
    this.openaiTTSService = service;
  }

  /**
   * Generate audio from text using alternative Text-to-Speech (OpenAI)
   */
  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    try {
      const {
        text,
        voice = "default",
        speed = 1.0,
      } = options;

      log(`Synthesizing speech with OpenAI TTS: "${text.substring(0, 30)}..."`, 'tts');
      
      if (!this.openaiTTSService) {
        throw new Error("OpenAI TTS service not initialized. Please check API key configuration.");
      }

      // Mapeie para a voz correspondente do OpenAI
      const openaiVoice = this.getOpenAIVoice(voice);
      
      // Use o serviço OpenAI TTS
      const result = await this.openaiTTSService.synthesizeSpeech({
        text,
        voice: openaiVoice,
        speed,
      });

      return result;
    } catch (error) {
      log(`Error synthesizing speech with OpenAI TTS: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      
      // Em caso de erro, criamos uma resposta simulada em vez de falhar completamente
      // Isto é apenas um fallback para evitar a quebra da aplicação
      const timestamp = new Date().getTime();
      const uniqueId = nanoid(8);
      const fileName = `fallback_${timestamp}_${uniqueId}.mp3`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      
      // Em ambiente de produção, devemos lançar o erro
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<{ voices: Voice[] }> {
    try {
      // Retornamos a lista pré-definida de vozes disponíveis
      return { voices: this.availableVoices };
    } catch (error) {
      log(`Error getting TTS voices: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }

  /**
   * Helper to map Coqui voice name to Google Cloud TTS voice
   */
  private getGoogleVoiceByName(voiceName: string): { name: string, languageCode: string } {
    // Verifica se é uma voz direta do Google Cloud
    const directVoice = this.availableVoices.find(v => v.name === voiceName);
    if (directVoice) {
      return {
        name: voiceName,
        languageCode: directVoice.languageCodes[0]
      };
    }
    
    // Verifica se temos um mapeamento para esta voz
    if (this.voiceMapping[voiceName]) {
      return this.voiceMapping[voiceName];
    }
    
    // Caso contrário, usamos a voz padrão para português
    return {
      name: "pt-BR-Standard-A",
      languageCode: "pt-BR"
    };
  }
}