import { log } from "../vite";
import fs from "fs";
import path from "path";
import { nanoid } from 'nanoid';

// Diretório para salvar os arquivos de áudio
const OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'audio');

// Garante que o diretório existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TTSOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
  audioEncoding?: string;
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

export class GoogleCloudTTSService {
  private apiKey: string;
  private baseUrl = "https://texttospeech.googleapis.com/v1/text:synthesize";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Gera áudio a partir de texto usando a API Google Cloud Text-to-Speech
   * Usa o método simples de acesso à API REST via HTTP
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

      log(`Sintetizando fala com Google Cloud TTS: "${text.substring(0, 30)}..."`, 'tts');

      // Configuração da requisição
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

      // Chamada para a API do Google Cloud
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

      if (!audioContent) {
        throw new Error('Resposta da API não contém conteúdo de áudio');
      }

      // Gera um nome único para o arquivo
      const timestamp = new Date().getTime();
      const uniqueId = nanoid(8);
      const fileName = `speech_${timestamp}_${uniqueId}.mp3`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      // Salva o arquivo de áudio
      fs.writeFileSync(filePath, Buffer.from(audioContent, 'base64'));

      return {
        audioContent,
        fileName,
        filePath,
      };
    } catch (error) {
      log(`Erro ao sintetizar fala com Google Cloud TTS: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }

  /**
   * Obtém as vozes disponíveis
   */
  async getVoices(languageCode?: string): Promise<{ voices: Voice[] }> {
    try {
      const url = `https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google TTS API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // Filtra por código de idioma se fornecido
      let voices = data.voices || [];
      if (languageCode && voices) {
        voices = voices.filter((voice: any) => 
          voice.languageCodes && voice.languageCodes.includes(languageCode)
        );
      }
      
      // Formata a resposta para o formato esperado
      const formattedVoices: Voice[] = voices.map((voice: any) => ({
        name: voice.name || '',
        gender: String(voice.ssmlGender || ''),
        languageCodes: voice.languageCodes || [],
      }));

      return { voices: formattedVoices };
    } catch (error) {
      log(`Erro ao obter vozes do TTS: ${error instanceof Error ? error.message : String(error)}`, 'tts');
      throw error;
    }
  }
}