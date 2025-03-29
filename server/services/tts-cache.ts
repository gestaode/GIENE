
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class TTSCache {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'uploads/audio/cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private generateKey(text: string, voice: string): string {
    return crypto
      .createHash('md5')
      .update(`${text}-${voice}`)
      .digest('hex');
  }

  async get(text: string, voice: string): Promise<string | null> {
    const key = this.generateKey(text, voice);
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }

  async set(text: string, voice: string, audioPath: string): Promise<string> {
    const key = this.generateKey(text, voice);
    const cachePath = path.join(this.cacheDir, `${key}.mp3`);
    
    fs.copyFileSync(audioPath, cachePath);
    return cachePath;
  }
}
