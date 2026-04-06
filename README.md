# get-pitch-accent

Standalone pitch-accent lookup and HTML formatting extracted from 10ten Japanese Reader.

The package ships a generated JSON dataset derived from 10ten's GPL-licensed word data and exposes a synchronous lookup API:

```ts
import { formatPitchAccentHtml, getPitchAccent } from 'get-pitch-accent';

const matches = getPitchAccent('閉める', 'しめる');
const html = formatPitchAccentHtml(matches[0]);
```

`getPitchAccent(spelling, reading?)` returns an array of matches:

```ts
type PitchAccentMatch = {
  accent: number;
  partOfSpeech: string[];
  reading: string;
  spellings: string[];
};
```

`formatPitchAccentHtml(match, renderCharacter?)` renders the same binary pitch-accent outline style used by 10ten. The optional `renderCharacter(character, index)` callback can return custom HTML for each kana character.

`spelling` is used instead of `kanjiSpelling` because kana-only words are valid lookups too.

## Data

The dataset is generated, not manually copied. Rebuild it with:

```sh
pnpm run build-data
```

By default that reads from `../10ten-ja-reader/data/words.ljson`, but you can also pass an explicit source path and output directory to `scripts/build-dataset.ts`.

## Browser use

The runtime imports the full generated JSON dataset directly, so it can be bundled for browser use.

That also means bundle size will be large. The generated JSON is intentionally included whole rather than fetched lazily, so expect several megabytes of extra bundle weight and parse cost at startup.
