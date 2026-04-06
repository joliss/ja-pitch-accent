import fs from 'node:fs';

import { kanaToHiragana } from './normal-jp.ts';
import type { AccentPattern } from './types.ts';

interface RawReadingMeta {
  a: number | Array<AccentPattern>;
  app?: number;
}

interface RawPitchAccentEntry {
  k?: Array<string>;
  r: Array<string>;
  rm: Array<RawReadingMeta>;
}

interface Dataset {
  entryCache: Map<number, RawPitchAccentEntry>;
  lookupCache: Map<string, Array<RawPitchAccentEntry>>;
  pitchAccentData: string;
  pitchAccentIndex: string;
}

let dataset: Dataset | undefined;

function loadTextFile(path: string): string {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8');
}

function getDataset(): Dataset {
  dataset ??= {
    entryCache: new Map(),
    lookupCache: new Map(),
    pitchAccentData: loadTextFile('../data/pitch-accent.ljson'),
    pitchAccentIndex: loadTextFile('../data/pitch-accent.idx'),
  };

  return dataset;
}

function findLineStartingWith({
  source,
  text,
}: {
  source: string;
  text: string;
}): string | null {
  const textLength = text.length;
  let start = 0;
  let end = source.length - 1;

  while (start < end) {
    const midpoint = (start + end) >> 1;
    const lineStart = source.lastIndexOf('\n', midpoint) + 1;
    const candidate = source.substring(lineStart, lineStart + textLength);

    if (text < candidate) {
      end = lineStart - 1;
    } else if (text > candidate) {
      start = source.indexOf('\n', midpoint + 1) + 1;
    } else {
      return source.substring(lineStart, source.indexOf('\n', midpoint + 1));
    }
  }

  return null;
}

function getEntryAtOffset(offset: number): RawPitchAccentEntry {
  const { entryCache, pitchAccentData } = getDataset();
  const cachedEntry = entryCache.get(offset);

  if (cachedEntry) {
    return cachedEntry;
  }

  const lineEnd = pitchAccentData.indexOf('\n', offset);
  const line = pitchAccentData.substring(
    offset,
    lineEnd === -1 ? pitchAccentData.length : lineEnd
  );
  const entry = JSON.parse(line) as RawPitchAccentEntry;
  entryCache.set(offset, entry);

  return entry;
}

export function lookupEntries(spelling: string): Array<RawPitchAccentEntry> {
  const normalizedSpelling = kanaToHiragana(spelling);
  const { lookupCache, pitchAccentIndex } = getDataset();
  const cachedEntries = lookupCache.get(normalizedSpelling);

  if (cachedEntries) {
    return cachedEntries;
  }

  const lookupResult = findLineStartingWith({
    source: pitchAccentIndex,
    text: `${normalizedSpelling},`,
  });

  if (!lookupResult) {
    lookupCache.set(normalizedSpelling, []);
    return [];
  }

  const offsets = lookupResult.split(',').slice(1).map(Number);
  const entries = offsets.map(getEntryAtOffset);
  lookupCache.set(normalizedSpelling, entries);

  return entries;
}
