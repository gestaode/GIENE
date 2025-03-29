declare module 'tts-js' {
  export class TTS {
    constructor();

    speak(options: {
      text: string;
      model?: string;
      speed?: number;
    }): Promise<{
      buffer: Buffer;
      audioStream: unknown;
    }>;
  }
}