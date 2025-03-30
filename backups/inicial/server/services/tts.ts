import { log } from "../vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make sure output directory exists
const OUTPUT_DIR = path.join(__dirname, "../../uploads/audio");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TTSOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
}

interface TTSResponse {
  audioContent: string; // base64 encoded audio
  fileName: string;
  filePath: string;
}

export class GoogleTTSService {
  private apiKey: string;
  private baseUrl = "https://texttospeech.googleapis.com/v1/text:synthesize";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate audio from text using Google Text-to-Speech API
   */
  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    try {
      const {
        text,
        languageCode = "pt-BR",
        voiceName = "pt-BR-Standard-A",
        speakingRate = 1.0,
        pitch = 0,
      } = options;

      // Create the request body
      const requestBody = {
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate,
          pitch,
        },
      };

      // Make the API request
      const url = `${this.baseUrl}?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google TTS API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileName = `speech_${timestamp}.mp3`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      // Save the audio file
      fs.writeFileSync(filePath, Buffer.from(audioContent, 'base64'));

      return {
        audioContent,
        fileName,
        filePath,
      };
    } catch (error) {
      log(`Error synthesizing speech: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getVoices(languageCode?: string): Promise<any> {
    try {
      const url = `https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google TTS API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // Filter by language code if provided
      if (languageCode) {
        data.voices = data.voices.filter((voice: any) => 
          voice.languageCodes.includes(languageCode)
        );
      }

      return data;
    } catch (error) {
      log(`Error getting TTS voices: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }
}
