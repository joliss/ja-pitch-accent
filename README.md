# get-pitch-accent

Standalone pitch-accent lookup and HTML formatting extracted from 10ten Japanese Reader.

The package ships a generated JSON dataset derived from 10ten snapshot data and exposes a synchronous lookup API:

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
git submodule update --init --recursive
pnpm run build-data
```

By default that reads from the vendored 10ten submodule at `vendor/10ten-ja-reader/data/words.ljson`, but you can also pass an explicit source path and output directory to `scripts/build-dataset.ts`.

## Licensing

The package code is GPL-3.0-only.

The bundled generated dataset also carries upstream attribution/licence notices from the data sources used by 10ten, including JMdict/EDICT and pitch-accent data attributed by 10ten to Uros Ozvatic/Kanjium. See [NOTICE](/Users/primary/src/get-pitch-accent/NOTICE).

## Browser use

The runtime imports the full generated JSON dataset directly, so it can be bundled for browser use.

That also means bundle size will be large. The generated JSON is intentionally included whole rather than fetched lazily, so expect several megabytes of extra bundle weight and parse cost at startup.
