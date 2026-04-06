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
  const defaultSourcePath = path.resolve(
    process.cwd(),
    'vendor/10ten-ja-reader/data/words.ljson'
  );
  const sourcePath =
    process.argv[2] ?? defaultSourcePath;
  const outputDir = process.argv[3] ?? path.resolve(process.cwd(), 'data');
  const outputDataPath = path.join(outputDir, 'pitch-accent.json');
  const legacyPaths = [
    path.join(outputDir, 'pitch-accent.idx'),
    path.join(outputDir, 'pitch-accent.ljson'),
  ];

  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      sourcePath === defaultSourcePath
        ? 'Expected 10ten data at vendor/10ten-ja-reader/data/words.ljson. Run `git submodule update --init --recursive` first, or pass an explicit source path.'
        : `Pitch accent source file not found: ${sourcePath}`
    );
  }

  await fs.promises.mkdir(outputDir, { recursive: true });
  await Promise.all(
    legacyPaths.map((legacyPath) =>
      fs.promises.rm(legacyPath, { force: true })
    )
  );

  const lineReader = readline.createInterface({
    input: fs.createReadStream(sourcePath),
    crlfDelay: Infinity,
  });

  const index = new Map<string, Array<number>>();
  const entries: Array<{
    k?: Array<string>;
    r: Array<string>;
    rm: Array<{
      a: number | Array<{ i: number; pos?: Array<string> }>;
      app?: number;
    }>;
  }> = [];

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

    const reducedEntry = {
      ...(entry.k ? { k: entry.k } : {}),
      r: readings,
      rm: readingMeta,
    };
    entries.push(reducedEntry);
    const entryIndex = entries.length - 1;

    const keys = new Set([...(entry.k ?? []), ...readings].map(kanaToHiragana));
    for (const key of keys) {
      index.set(key, [...(index.get(key) ?? []), entryIndex]);
    }
  }

  const sortedIndex = Object.fromEntries(
    [...index.keys()]
      .sort()
      .map((key) => [key, index.get(key)!])
  );

  await fs.promises.writeFile(
    outputDataPath,
    `${JSON.stringify({ entries, index: sortedIndex })}\n`,
    'utf8'
  );
}

await main();
