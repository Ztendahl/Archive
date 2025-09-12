/* eslint-env node */
import fs from 'fs';
import path from 'path';
import process from 'process';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
const locked = JSON.parse(fs.readFileSync(path.resolve('versions.lock.json'), 'utf8'));

function parse(v) {
  return v.replace(/^[^0-9]*/, '').split('.').map(Number);
}

function isDowngrade(current, locked) {
  const c = parse(current);
  const l = parse(locked);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const diff = (c[i] || 0) - (l[i] || 0);
    if (diff < 0) return true;
    if (diff > 0) return false;
  }
  return false;
}

const downgrades = [];
for (const [name, version] of Object.entries(locked.dependencies || {})) {
  const current = pkg.dependencies?.[name];
  if (current && isDowngrade(current, version)) {
    downgrades.push(`${name}: ${current} < ${version}`);
  }
}
for (const [name, version] of Object.entries(locked.devDependencies || {})) {
  const current = pkg.devDependencies?.[name];
  if (current && isDowngrade(current, version)) {
    downgrades.push(`${name}: ${current} < ${version}`);
  }
}

if (downgrades.length) {
  console.error('Dependency downgrades detected:\n' + downgrades.join('\n'));
  process.exit(1);
}
