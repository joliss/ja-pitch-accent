import { kanaToHiragana } from "./normal-jp.js";
import pitchAccentDataset from '../data/pitch-accent.json' with { type: 'json' };
let loadedDataset;
function getDataset() {
    loadedDataset ??= {
        lookupCache: new Map(),
        pitchAccentData: pitchAccentDataset,
    };
    return loadedDataset;
}
export function lookupEntries(spelling) {
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
