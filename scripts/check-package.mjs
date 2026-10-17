import { readdir, readFile, lstat } from 'node:fs/promises';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Portable packaging check: no cloud credentials, services or network required.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
let total = 0;
let skills = 0;
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'work', 'node_modules'].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) {
      errors.push(`Unexpected symlink: ${relative(root, path)}`);
      continue;
    }
    if (entry.isDirectory()) { await inspect(path); continue; }
    const size = (await lstat(path)).size;
    total += size;
    if (size > 1_000_000) errors.push(`Unexpected large harness file: ${relative(root, path)}`);
    if (entry.name.endsWith('.json')) {
      try { JSON.parse(await readFile(path, 'utf8')); }
      catch { errors.push(`Invalid JSON: ${relative(root, path)}`); }
    }
    if (!entry.name.endsWith('.md')) continue;
    const text = await readFile(path, 'utf8');
    if (entry.name === 'SKILL.md') {
      skills++;
      const header = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
      const name = /^name: ([a-z0-9-]+)$/m.exec(header.replace(/\r/g, ''))?.[1];
      if (!name || name !== directory.split(sep).at(-1) || !/^description: .+/m.test(header)) {
        errors.push(`Invalid skill metadata: ${relative(root, path)}`);
      }
    }
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^(https?:|#)/.test(link)) continue;
      const target = resolve(dirname(path), link.split('#')[0]);
      if (relative(root, target).startsWith('..')) {
        errors.push(`Link escapes package: ${relative(root, path)}`);
        continue;
      }
      try { await lstat(target); }
      catch { errors.push(`Broken link in ${relative(root, path)}: ${link}`); }
    }
  }
}
await inspect(root);
if (skills !== 5) errors.push(`Expected five skills, found ${skills}`);
if (total > 50_000_000) errors.push('Harness exceeds 50 MB');
if (errors.length) {
  process.stderr.write(errors.join('\n') + '\n');
  process.exitCode = 1;
} else {
  process.stdout.write(`Package valid: ${skills} skills, ${total} bytes. Live integrations not tested.\n`);
}
