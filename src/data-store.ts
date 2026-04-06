import { kanaToHiragana } from './normal-jp.ts';
import type { AccentPattern } from './types.ts';
import pitchAccentDataset from '../data/pitch-accent.json' with { type: 'json' };

interface RawReadingMeta {
  a: number | Array<AccentPattern>;
  app?: number;
}

interface RawPitchAccentEntry {
  k?: Array<string>;
  r: Array<string>;
  rm: Array<RawReadingMeta>;
}

interface GeneratedDataset {
  entries: Array<RawPitchAccentEntry>;
  index: Record<string, Array<number>>;
}

interface Dataset {
  lookupCache: Map<string, Array<RawPitchAccentEntry>>;
  pitchAccentData: GeneratedDataset;
}

let loadedDataset: Dataset | undefined;

function getDataset(): Dataset {
  loadedDataset ??= {
    lookupCache: new Map(),
    pitchAccentData: pitchAccentDataset,
  };

  return loadedDataset;
}

export function lookupEntries(spelling: string): Array<RawPitchAccentEntry> {
  const normalizedSpelling = kanaToHiragana(spelling);
  const { lookupCache, pitchAccentData } = getDataset();
  const cachedEntries = lookupCache.get(normalizedSpelling);

  if (cachedEntries) {
    return cachedEntries;
  }

  const entryIndexes = pitchAccentData.index[normalizedSpelling];
  if (!entryIndexes) {
    lookupCache.set(normalizedSpelling, []);
    return [];
  }

  const entries = entryIndexes.map((index) => pitchAccentData.entries[index]);
  lookupCache.set(normalizedSpelling, entries);

  return entries;
}
