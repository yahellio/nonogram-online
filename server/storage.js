import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(import.meta.dirname, '../data');
const FILE = path.join(DATA_DIR, 'game.json');
const TEMP_FILE = `${FILE}.tmp`;

let queue = Promise.resolve();

export async function loadState() {
  try {
    return JSON.parse(await readFile(FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return undefined;
    throw err;
  }
}

async function write(data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(TEMP_FILE, data);
  await rename(TEMP_FILE, FILE);
}

// Записи выполняются строго по очереди, чтобы не перетирать друг друга
export function saveState(state) {
  const data = JSON.stringify(state);
  queue = queue.then(() => write(data)).catch((err) => console.error('Failed to save state:', err));
  return queue;
}
