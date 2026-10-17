// Keep the original hands-on entry point running the current gesture suites.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
for(const family of ['a','b','c'])execFileSync(process.execPath,[fileURLToPath(new URL(`./night-shift-machinery-${family}-browser.mjs`,import.meta.url))],{stdio:'inherit'});
