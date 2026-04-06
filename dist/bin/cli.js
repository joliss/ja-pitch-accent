#!/usr/bin/env tsx
import { formatJaPitchAccentHtml, getJaPitchAccent } from "../src/index.js";
const [, , spelling, reading, ...flags] = process.argv;
if (!spelling) {
    console.error('Usage: ja-pitch-accent <spelling> [reading] [--html]');
    process.exit(1);
}
const matches = getJaPitchAccent(spelling, reading);
if (flags.includes('--html')) {
    console.log(matches.map((match) => formatJaPitchAccentHtml(match)).join('\n'));
}
else {
    console.log(JSON.stringify(matches, null, 2));
}
