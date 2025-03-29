import { log } from "../vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make sure output directory exists
const OUTPUT_DIR = path.join(__dirname, "../../uploads/audio");
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

export class OpenAITTSService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    console.log(`Using OpenAI API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate audio from text using OpenAI Text-to-Speech API
   */
  async synthesizeSpeech(options: TTSOptions): Promise<TTSResponse> {
    try {
      const {
        text,
        voice = "alloy", // Default voice, others: echo, fable, onyx, nova, shimmer
        speed = 1.0,
      } = options;

      // Call the OpenAI API to generate speech
      const response = await this.openai.audio.speech.create({
        model: "tts-1", // or tts-1-hd for higher quality
        voice: voice,
        input: text,
        speed: speed,
      });

      // Convert response to buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileName = `speech_${timestamp}.mp3`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      // Save the audio file
      fs.writeFileSync(filePath, buffer);

      // Convert buffer to base64
      const audioContent = buffer.toString('base64');

      return {
        audioContent,
        fileName,
        filePath,
      };
    } catch (error) {
      log(`Error synthesizing speech with OpenAI: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<any> {
    try {
      // OpenAI TTS currently has a fixed set of voices
      const voices = [
        { name: "alloy", languageCodes: ["en-US", "pt-BR"], gender: "NEUTRAL" },
        { name: "echo", languageCodes: ["en-US", "pt-BR"], gender: "MALE" },
        { name: "fable", languageCodes: ["en-US", "pt-BR"], gender: "FEMALE" },
        { name: "onyx", languageCodes: ["en-US", "pt-BR"], gender: "MALE" },
        { name: "nova", languageCodes: ["en-US", "pt-BR"], gender: "FEMALE" },
        { name: "shimmer", languageCodes: ["en-US", "pt-BR"], gender: "FEMALE" }
      ];

      return { voices };
    } catch (error) {
      log(`Error getting TTS voices: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }
}