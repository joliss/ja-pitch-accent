import type { CharacterRenderer, JaPitchAccentMatch } from './types.ts';
export declare function formatJaPitchAccentHtml(match: Pick<JaPitchAccentMatch, 'accent' | 'reading'>, renderCharacter?: CharacterRenderer): string;
