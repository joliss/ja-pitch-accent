import { lookupEntries } from "./data-store.js";
import { kanaToHiragana } from "./normal-jp.js";
function exactMatchIndexes(values, text) {
    if (!values) {
        return [];
    }
    return values.flatMap((value, index) => kanaToHiragana(value) === text ? [index] : []);
}
function toAccentPatterns(accent) {
    return typeof accent === 'number' ? [{ i: accent }] : accent;
}
function dedupeMatches(matches) {
    const seen = new Set();
    const result = [];
    for (const match of matches) {
        const key = JSON.stringify([
            match.spellings,
            match.reading,
            match.accent,
            match.partOfSpeech,
        ]);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(match);
    }
    return result;
}
export function getJaPitchAccent(spelling, reading) {
    const normalizedSpelling = kanaToHiragana(spelling);
    const normalizedReading = typeof reading === 'string' ? kanaToHiragana(reading) : undefined;
    const results = [];
    for (const entry of lookupEntries(spelling)) {
        const matchingSpellingIndexes = exactMatchIndexes(entry.k, normalizedSpelling);
        const matchedViaReading = matchingSpellingIndexes.length === 0 &&
            exactMatchIndexes(entry.r, normalizedSpelling).length > 0;
        const applicableSpellings = matchingSpellingIndexes.length > 0
            ? matchingSpellingIndexes.map((index) => entry.k[index])
            : entry.k ?? [spelling];
        const matchingSpellingMask = matchingSpellingIndexes.reduce((mask, index) => mask | (1 << index), 0);
        for (const [index, candidateReading] of entry.r.entries()) {
            if (typeof normalizedReading === 'string' &&
                kanaToHiragana(candidateReading) !== normalizedReading) {
                continue;
            }
            const readingMeta = entry.rm[index];
            if (!matchedViaReading &&
                matchingSpellingMask !== 0 &&
                typeof readingMeta.app === 'number' &&
                (readingMeta.app & matchingSpellingMask) === 0) {
                continue;
            }
            for (const accent of toAccentPatterns(readingMeta.a)) {
                results.push({
                    accent: accent.i,
                    partOfSpeech: accent.pos ?? [],
                    reading: candidateReading,
                    spellings: applicableSpellings,
                });
            }
        }
    }
    return dedupeMatches(results);
}
