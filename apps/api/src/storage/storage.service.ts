import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads', 'results');
  }

  async ensureDir(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  filePath(code: string): string {
    return path.join(this.baseDir, `${code}.png`);
  }

  async save(code: string, buffer: Buffer): Promise<string> {
    await this.ensureDir();
    const fp = this.filePath(code);
    await fs.writeFile(fp, buffer);
    return fp;
  }

  async read(code: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.filePath(code));
    } catch {
      return null;
    }
  }

  async exists(code: string): Promise<boolean> {
    try {
      await fs.access(this.filePath(code));
      return true;
    } catch {
      return false;
    }
  }

  async delete(code: string): Promise<void> {
    try {
      await fs.unlink(this.filePath(code));
    } catch {
      this.logger.warn(`Could not delete file for code ${code}`);
    }
  }
}
