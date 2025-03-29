
import fs from 'fs';
import path from 'path';

export class CleanupService {
  private tempDir: string;
  private maxAge: number; // em horas

  constructor(maxAge = 24) {
    this.tempDir = path.join(process.cwd(), 'uploads/temp');
    this.maxAge = maxAge;
    this.setupAutoCleanup();
  }

  private setupAutoCleanup() {
    // Limpa arquivos a cada 6 horas
    setInterval(() => this.cleanup(), 6 * 60 * 60 * 1000);
  }

  async cleanup() {
    const files = fs.readdirSync(this.tempDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(this.tempDir, file);
      const stats = fs.statSync(filePath);
      const age = (now - stats.mtimeMs) / (1000 * 60 * 60);

      if (age > this.maxAge) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
