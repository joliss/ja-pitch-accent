import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

function kanaToHiragana(input: string): string {
  let result = '';

  for (const character of input) {
    let codePoint = character.codePointAt(0)!;

    if (
      (codePoint >= 12449 && codePoint <= 12534) ||
      codePoint === 12541 ||
      codePoint === 12542
    ) {
      codePoint -= 96;
    }

    result += String.fromCodePoint(codePoint);
  }

  return result;
}

async function main() {
  const sourcePath =
    process.argv[2] ??
    path.resolve(process.cwd(), '../10ten-ja-reader/data/words.ljson');
  const outputDir = process.argv[3] ?? path.resolve(process.cwd(), 'data');
  const outputDataPath = path.join(outputDir, 'pitch-accent.ljson');
  const outputIndexPath = path.join(outputDir, 'pitch-accent.idx');

  await fs.promises.mkdir(outputDir, { recursive: true });

  const lineReader = readline.createInterface({
    input: fs.createReadStream(sourcePath),
    crlfDelay: Infinity,
  });

  const dataStream = fs.createWriteStream(outputDataPath);
  const index = new Map<string, Array<number>>();
  let offset = 0;

  for await (const line of lineReader) {
    const entry = JSON.parse(line) as {
      k?: Array<string>;
      r: Array<string>;
      rm?: Array<
        | 0
        | {
            a?: number | Array<{ i: number; pos?: Array<string> }>;
            app?: number;
          }
      >;
    };

    if (!Array.isArray(entry.rm)) {
      continue;
    }

    const readings: Array<string> = [];
    const readingMeta: Array<{
      a: number | Array<{ i: number; pos?: Array<string> }>;
      app?: number;
    }> = [];

    for (const [indexInEntry, reading] of entry.r.entries()) {
      const meta = entry.rm[indexInEntry];

      if (!meta || typeof meta !== 'object' || typeof meta.a === 'undefined') {
        continue;
      }

      readings.push(reading);
      readingMeta.push(
        typeof meta.app === 'number' ? { a: meta.a, app: meta.app } : { a: meta.a }
      );
    }

    if (!readings.length) {
      continue;
    }

    const reducedEntry = JSON.stringify({
      ...(entry.k ? { k: entry.k } : {}),
      r: readings,
      rm: readingMeta,
    });

    dataStream.write(`${reducedEntry}\n`);

    const keys = new Set([...(entry.k ?? []), ...readings].map(kanaToHiragana));
    for (const key of keys) {
      index.set(key, [...(index.get(key) ?? []), offset]);
    }

    offset += reducedEntry.length + 1;
  }

  await new Promise<void>((resolve, reject) => {
    dataStream.on('error', reject);
    dataStream.end(() => resolve());
  });

  const sortedKeys = [...index.keys()].sort();
  const indexContents = sortedKeys
    .map((key) => `${key},${index.get(key)!.join(',')}`)
    .join('\n');

  await fs.promises.writeFile(outputIndexPath, `${indexContents}\n`, 'utf8');
}

await main();
