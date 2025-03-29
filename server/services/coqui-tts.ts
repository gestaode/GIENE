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
  private voiceMapping: Record<string, { name: string, languageCode: string }> = {
    "default": { name: "nova", languageCode: "pt-BR" }, 
    "tts_models/pt/cv/vits": { name: "alloy", languageCode: "pt-BR" }, 
    "tts_models/multilingual/multi-dataset/your_tts": { name: "echo", languageCode: "pt-BR" },
    "tts_models/en/ljspeech/tacotron2-DDC": { name: "fable", languageCode: "en-US" }, 
    "tts_models/en/ljspeech/glow-tts": { name: "onyx", languageCode: "en-US" }, 
    "tts_models/en/ljspeech/speedy-speech": { name: "shimmer", languageCode: "en-US" }, 
    "tts_models/en/ljspeech/vits": { name: "nova", languageCode: "en-US" }, 
    // Mapeamento para as vozes do Google Cloud TTS originais
    "pt-BR-Standard-A": { name: "nova", languageCode: "pt-BR" },
    "pt-BR-Standard-B": { name: "echo", languageCode: "pt-BR" },
    "pt-BR-Standard-C": { name: "alloy", languageCode: "pt-BR" },
    "pt-BR-Wavenet-A": { name: "shimmer", languageCode: "pt-BR" },
    "pt-BR-Wavenet-B": { name: "onyx", languageCode: "pt-BR" },
    "pt-BR-Wavenet-C": { name: "fable", languageCode: "pt-BR" },
    "en-US-Standard-A": { name: "echo", languageCode: "en-US" },
    "en-US-Standard-B": { name: "onyx", languageCode: "en-US" },
    "en-US-Standard-C": { name: "nova", languageCode: "en-US" },
    "en-US-Standard-D": { name: "echo", languageCode: "en-US" },
    "en-US-Standard-E": { name: "alloy", languageCode: "en-US" },
    "en-US-Standard-F": { name: "fable", languageCode: "en-US" },
    "en-US-Standard-G": { name: "shimmer", languageCode: "en-US" },
  };
  
  private openaiTTSService: any;
  private googleTTSService: any;
  private responsiveVoiceService: any;
  
  constructor() {
    // Nota: Os serviços reais serão injetados no método initializeService em routes.ts
    this.openaiTTSService = null;
    this.googleTTSService = null;
    this.responsiveVoiceService = null;
  }

  setOpenAITTSService(service: any) {
    this.openaiTTSService = service;
  }
  
  setGoogleTTSService(service: any) {
    this.googleTTSService = service;
  }
  
  setResponsiveVoiceService(service: any) {
    this.responsiveVoiceService = service;
  }
  
  // Método removido

  /**
   * Generate audio from text using multiple Text-to-Speech services with fallback
   */
  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    const {
      text,
      voice = "default",
      speed = 1.0,
    } = options;

    // Lista de erros encontrados para diagnóstico
    const errors: string[] = [];

    // 1. Tenta primeiro com o serviço OpenAI TTS (se disponível)
    if (this.openaiTTSService) {
      try {
        log(`Tentando sintetizar voz com OpenAI TTS: "${text.substring(0, 30)}..."`, 'tts');
        
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao sintetizar voz com OpenAI TTS: ${errorMessage}`, 'tts');
        errors.push(`OpenAI TTS: ${errorMessage}`);
      }
    }

    // 2. Se OpenAI falhar, tenta com o serviço Google TTS (se disponível)
    if (this.googleTTSService) {
      try {
        log(`Tentando sintetizar voz com Google Cloud TTS: "${text.substring(0, 30)}..."`, 'tts');
        
        // Obtenha a voz e código de idioma para o Google TTS
        const { name: voiceName, languageCode } = this.getGoogleVoiceByName(voice);
        
        // Use o serviço Google Cloud TTS
        const result = await this.googleTTSService.synthesizeSpeech({
          text,
          voiceName,
          languageCode,
          speakingRate: speed,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao sintetizar voz com Google Cloud TTS: ${errorMessage}`, 'tts');
        errors.push(`Google Cloud TTS: ${errorMessage}`);
      }
    }

    // Nota: TTS-JS foi removido da cadeia de fallback

    // 4. Se os anteriores falharem, tenta com o ResponsiveVoice (Google Translate)
    if (this.responsiveVoiceService) {
      try {
        log(`Tentando sintetizar voz com ResponsiveVoice: "${text.substring(0, 30)}..."`, 'tts');
        
        // Mapeie a voz para uma compatível com o ResponsiveVoice
        let responsiveVoiceName = "Brazilian Portuguese Female";
        if (voice.includes("Male") || voice.includes("male")) {
          responsiveVoiceName = "Brazilian Portuguese Male";
        }
        
        // Use o serviço ResponsiveVoice
        const result = await this.responsiveVoiceService.synthesizeSpeech({
          text,
          voice: responsiveVoiceName,
          speed,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Erro ao sintetizar voz com ResponsiveVoice: ${errorMessage}`, 'tts');
        errors.push(`ResponsiveVoice: ${errorMessage}`);
      }
    }

    // 5. Se todos os serviços falharem, gera um erro detalhado
    const errorMessage = `Não foi possível sintetizar a voz com nenhum dos serviços disponíveis: ${errors.join("; ")}`;
    log(errorMessage, 'tts');
    throw new Error(errorMessage);
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
   * Helper to map voice name to OpenAI TTS voice
   */
  private getOpenAIVoice(voiceName: string): string {
    // Verifica se temos um mapeamento para esta voz
    if (this.voiceMapping[voiceName]) {
      return this.voiceMapping[voiceName].name;
    }
    
    // Caso contrário, usamos a voz padrão
    return "nova";
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