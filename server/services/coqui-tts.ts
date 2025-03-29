import { TTS } from 'tts-js';
import { log } from '../vite';
import path from 'path';
import fs from 'fs';

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
  private tts: TTS;
  private availableVoices: Voice[] = [
    { name: "default", languageCodes: ["pt-BR", "en-US"], gender: "FEMALE" },
    { name: "tts_models/multilingual/multi-dataset/your_tts", languageCodes: ["pt-BR", "en-US"], gender: "MALE" },
    { name: "tts_models/pt/cv/vits", languageCodes: ["pt-BR"], gender: "MALE" },
    { name: "tts_models/en/ljspeech/tacotron2-DDC", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "tts_models/en/ljspeech/glow-tts", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "tts_models/en/ljspeech/speedy-speech", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "tts_models/en/ljspeech/vits", languageCodes: ["en-US"], gender: "FEMALE" },
    { name: "tts_models/es/mai/tacotron2-DDC", languageCodes: ["es-ES"], gender: "FEMALE" },
    { name: "tts_models/fr/mai/tacotron2-DDC", languageCodes: ["fr-FR"], gender: "FEMALE" },
    { name: "tts_models/uk/mai/glow-tts", languageCodes: ["uk-UA"], gender: "FEMALE" },
    { name: "tts_models/zh-CN/baker/tacotron2-DDC-GST", languageCodes: ["zh-CN"], gender: "FEMALE" },
    { name: "tts_models/nl/mai/tacotron2-DDC", languageCodes: ["nl-NL"], gender: "FEMALE" },
    { name: "tts_models/de/thorsten/tacotron2-DCA", languageCodes: ["de-DE"], gender: "MALE" },
    { name: "tts_models/ja/kokoro/tacotron2-DDC", languageCodes: ["ja-JP"], gender: "FEMALE" },
    { name: "tts_models/it/mai_female/glow-tts", languageCodes: ["it-IT"], gender: "FEMALE" },
    { name: "tts_models/ewe/openbible/vits", languageCodes: ["ewe"], gender: "MALE" },
  ];
  
  constructor() {
    this.tts = new TTS();
  }

  /**
   * Generate audio from text using Coqui Text-to-Speech
   */
  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    try {
      const {
        text,
        voice = "default",
        speed = 1.0,
      } = options;

      log(`Synthesizing speech with Coqui TTS: "${text.substring(0, 30)}..."`, 'tts');

      // Para simplicidade, usamos o modelo padrão "tts_models/pt/cv/vits" para português
      // ou adaptamos a escolha do modelo com base na voz selecionada
      const selectedVoice = this.getModelByVoiceName(voice);
      
      // Generates the audio file
      const result = await this.tts.speak({
        text,
        model: selectedVoice,
        speed: speed,
      });

      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileName = `speech_${timestamp}.wav`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      // Save the audio file
      fs.writeFileSync(filePath, result.buffer);

      // Convert buffer to base64
      const audioContent = result.buffer.toString('base64');

      return {
        audioContent,
        fileName,
        filePath,
      };
    } catch (error) {
      log(`Error synthesizing speech with Coqui TTS: ${error instanceof Error ? error.message : String(error)}`, 'tts');
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
   * Helper to get model by voice name
   */
  private getModelByVoiceName(voiceName: string): string {
    // Se for solicitada uma voz específica, tentamos encontrá-la
    const voice = this.availableVoices.find(v => v.name === voiceName);
    
    // Se encontramos a voz, retornamos o nome dela (que é também o modelo)
    if (voice) {
      return voice.name;
    }
    
    // Caso contrário, usamos o modelo padrão para português
    return "tts_models/pt/cv/vits";
  }
}