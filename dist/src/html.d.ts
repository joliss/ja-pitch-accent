import type { CharacterRenderer, PitchAccentMatch } from './types.ts';
export declare function formatPitchAccentHtml(match: Pick<PitchAccentMatch, 'accent' | 'reading'>, renderCharacter?: CharacterRenderer): string;
