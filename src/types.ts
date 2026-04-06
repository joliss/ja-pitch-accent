export interface AccentPattern {
  i: number;
  pos?: Array<string>;
}

export interface PitchAccentMatch {
  accent: number;
  partOfSpeech: Array<string>;
  reading: string;
  spellings: Array<string>;
}

export interface CharacterRenderer {
  (character: string, index: number): string;
}
