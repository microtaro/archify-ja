#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copySiteAssets } from './copy-site-assets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const templatePath = path.join(here, 'index-template.html');
const outputPath = path.resolve(process.argv[2] || path.join(repoRoot, 'docs/index.html'));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
copySiteAssets(outputPath);
fs.copyFileSync(templatePath, outputPath);
console.log(`Built ${outputPath}.`);
