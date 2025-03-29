
import { log } from '../vite';
import { Voice } from '@elevenlabs/types';
import axios from 'axios';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'audio');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TTSOptions {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: { 'xi-api-key': this.apiKey }
      });
      
      // Salvar vozes no banco
      for (const voice of response.data.voices) {
        await storage.createOrUpdateVoice({
          voiceId: voice.voice_id,
          name: voice.name,
          provider: 'elevenlabs',
          samples: voice.preview_url ? [voice.preview_url] : [],
          settings: voice.settings
        });
      }

      return response.data.voices;
    } catch (error) {
      log.error('Error fetching ElevenLabs voices:', error);
      throw error;
    }
  }

  async synthesizeSpeech(options: TTSOptions) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${options.voiceId}`,
        {
          text: options.text,
          model_id: options.modelId,
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer'
        }
      );

      const fileName = `elevenlabs_${Date.now()}.mp3`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      
      fs.writeFileSync(filePath, Buffer.from(response.data));

      return {
        fileName,
        filePath,
        audioContent: response.data.toString('base64')
      };
    } catch (error) {
      log.error('Error synthesizing speech with ElevenLabs:', error);
      throw error;
    }
  }
}
