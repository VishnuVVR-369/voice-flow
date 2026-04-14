import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { DictionaryWord } from '../shared/types';

export class DictionaryService {
  private dir: string;

  constructor() {
    this.dir = path.join(app.getPath('userData'), 'dictionary');
    this.ensureDir();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  list(): DictionaryWord[] {
    this.ensureDir();
    const files = fs.readdirSync(this.dir).filter(f => f.endsWith('.json'));
    const words: DictionaryWord[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.dir, file), 'utf-8');
        const parsed = JSON.parse(content) as Partial<DictionaryWord>;
        const normalizedWord = this.normalizeWord(parsed.word);
        if (!normalizedWord || typeof parsed.id !== 'string' || typeof parsed.created_at !== 'string') {
          continue;
        }
        words.push({
          id: parsed.id,
          word: normalizedWord,
          created_at: parsed.created_at,
        });
      } catch {
        // skip corrupt files
      }
    }
    words.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return words;
  }

  add(word: string): { entry: DictionaryWord; duplicate: boolean } {
    this.ensureDir();
    const normalizedWord = this.normalizeWord(word);
    if (!normalizedWord) {
      throw new Error('Dictionary terms cannot be empty.');
    }

    const existing = this.findExistingWord(normalizedWord);
    if (existing) {
      return { entry: existing, duplicate: true };
    }

    const entry: DictionaryWord = {
      id: randomUUID(),
      word: normalizedWord,
      created_at: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(this.dir, `${entry.id}.json`), JSON.stringify(entry, null, 2), 'utf-8');
    return { entry, duplicate: false };
  }

  delete(id: string): boolean {
    const filePath = path.join(this.dir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  getAllWords(): string[] {
    const seen = new Set<string>();
    const uniqueWords: string[] = [];

    for (const entry of this.list()) {
      const normalizedWord = this.normalizeWord(entry.word);
      if (!normalizedWord) {
        continue;
      }

      const key = normalizedWord.toLocaleLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      uniqueWords.push(normalizedWord);
    }

    return uniqueWords;
  }

  private normalizeWord(word: unknown): string {
    return typeof word === 'string' ? word.trim() : '';
  }

  private findExistingWord(word: string): DictionaryWord | null {
    const normalized = word.toLocaleLowerCase();
    return this.list().find((entry) => entry.word.toLocaleLowerCase() === normalized) ?? null;
  }
}
