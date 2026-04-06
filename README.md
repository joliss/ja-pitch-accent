# ja-pitch-accent

Standalone pitch-accent lookup and HTML formatting extracted from [10ten Japanese Reader](https://10ten.life/en/).

The package ships a generated JSON dataset derived from 10ten snapshot data and exposes a lookup API:

```ts
import { formatJaPitchAccentHtml, getJaPitchAccent } from 'ja-pitch-accent';

const matches = getJaPitchAccent('閉める', 'しめる');
const html = formatJaPitchAccentHtml(matches[0]);
```

`getJaPitchAccent(spelling, reading?)` returns an array of matches:

```ts
type JaPitchAccentMatch = {
  accent: number;
  partOfSpeech: string[];
  reading: string;
  spellings: string[];
};
```

The first match is usually the best. `accent` is the pitch-accent downstep position counted in mora:

- `0` means heiban.
- `1` means atamadaka.
- `2` or greater means the pitch drops after that mora.
- If `accent === mora count`, the pattern is odaka.

`formatJaPitchAccentHtml(match, renderCharacter?)` renders the same binary pitch-accent outline style used by 10ten. The optional `renderCharacter(character, index)` callback can return custom HTML for each kana character.

## Data

To rebuild the dataset from 10ten, run:

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
