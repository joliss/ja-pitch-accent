# ja-pitch-accent

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/example-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/example-light.png">
  <img src="docs/example-light.png" alt="HTML rendering example" width="200">
</picture>

Standalone pitch-accent lookup and HTML formatting extracted from [10ten Japanese Reader](https://10ten.life/en/).

Completely vibe-coded. Use at your own discretion!

## CLI

```sh
npx ja-pitch-accent <spelling> [reading] [--html]
```

For example, to get a JSON array (see below), run:

```sh
npx ja-pitch-accent 閉める
```

To print HTML instead:

```sh
npx ja-pitch-accent 閉める --html | head -n 1
```

When there are multiple dictionary entries, we print one per line. We use `head -n 1` in this example to only print the first.

## JavaScript API

### Installation

```sh
npm install ja-pitch-accent
```

### Usage

```ts
import { formatJaPitchAccentHtml, getJaPitchAccent } from 'ja-pitch-accent';

const matches = getJaPitchAccent('閉める', 'しめる');
const html = formatJaPitchAccentHtml(matches[0]);
```

`getJaPitchAccent(spelling, reading?)` takes a Japanese word, and optionally a `reading` to narrow the results to a specific reading. It returns an array of matches. The first match is usually the best.

```ts
type JaPitchAccentMatch = {
  accent: number;
  partOfSpeech: string[];
  reading: string;
  spellings: string[];
};
```

`accent` is the pitch-accent downstep position counted in mora:

- `0` means heiban.
- `1` means atamadaka.
- `2` or greater means the pitch drops after that mora.
- If `accent === mora count`, the pattern is odaka.

`formatJaPitchAccentHtml(match, renderCharacter?)` renders the same binary pitch-accent outline style used by 10ten. The optional `renderCharacter(character, index)` callback can return custom HTML for each kana character.

### Browser use

This package can be used in the browser as-is. However, your bundle size will be several megabytes, as the entire dataset JSON is included.

## Contributing

### Data

To rebuild the dataset from 10ten, run:

```sh
git submodule update --init --recursive
pnpm run build-data
```

By default that reads from the vendored 10ten submodule at `vendor/10ten-ja-reader/data/words.ljson`, but you can also pass an explicit source path and output directory to `scripts/build-dataset.ts`.

## Licensing

The package code is GPL-3.0-only.

The bundled generated dataset also carries upstream attribution/licence notices from the data sources used by 10ten, including JMdict/EDICT and pitch-accent data attributed by 10ten to Uros Ozvatic/Kanjium. See [NOTICE](/Users/primary/src/get-pitch-accent/NOTICE).
