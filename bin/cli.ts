#!/usr/bin/env node

import { formatJaPitchAccentHtml, getJaPitchAccent } from '../src/index.ts';

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith('--')));
const positionals = args.filter((arg) => !arg.startsWith('--'));
const [spelling, reading] = positionals;

if (!spelling) {
  console.error('Usage: ja-pitch-accent <spelling> [reading] [--html]');
  process.exit(1);
}

const matches = getJaPitchAccent(spelling, reading);

if (flags.has('--html')) {
  console.log(matches.map((match) => formatJaPitchAccentHtml(match)).join('\n'));
} else {
  console.log(JSON.stringify(matches, null, 2));
}
