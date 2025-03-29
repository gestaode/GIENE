declare module 'tts-js' {
  class TTS {
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
  
  // Exportação padrão
  export default TTS;
}