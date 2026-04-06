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
export declare function lookupEntries(spelling: string): Array<RawPitchAccentEntry>;
export {};
