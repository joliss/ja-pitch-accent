#!/usr/bin/env tsx

import { formatPitchAccentHtml, getPitchAccent } from '../src/index.ts';

const [, , spelling, reading, ...flags] = process.argv;

if (!spelling) {
  console.error('Usage: get-pitch-accent <spelling> [reading] [--html]');
  process.exit(1);
}

const matches = getPitchAccent(spelling, reading);

if (flags.includes('--html')) {
  console.log(matches.map((match) => formatPitchAccentHtml(match)).join('\n'));
} else {
  console.log(JSON.stringify(matches, null, 2));
}
