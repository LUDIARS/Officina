import { mkdir, open, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { destination } from './delivery.mjs';

// One isolated Cloud checkout per run. Never overwrite a previous destination.
export async function bindDestination(input, directory) {
  const env = { CC_DISCORD_WEBHOOK_URL: input?.webhook_url, CC_DISCORD_THREAD_ID: input?.thread_id };
  destination(env);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if ((await lstat(directory)).isSymbolicLink()) throw new Error('unsafe_binding');
  let file;
  try { file = await open(join(directory, 'destination.json'), 'wx', 0o600); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const existing = await loadDestination(directory);
    if (existing.CC_DISCORD_WEBHOOK_URL !== env.CC_DISCORD_WEBHOOK_URL || existing.CC_DISCORD_THREAD_ID !== env.CC_DISCORD_THREAD_ID) throw new Error('destination_already_bound');
    return { state: 'already_bound', thread_id: env.CC_DISCORD_THREAD_ID };
  }
  try { await file.writeFile(JSON.stringify(env), 'utf8'); }
  finally { await file.close(); }
  return { state: 'bound', thread_id: env.CC_DISCORD_THREAD_ID };
}

export async function loadDestination(directory, env = process.env) {
  const path = join(directory, 'destination.json');
  let stat;
  try { stat = await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') { destination(env); return env; } throw error; }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16384
    || (process.platform !== 'win32' && (stat.mode & 0o077))) throw new Error('unsafe_binding');
  const file = await open(path, 'r');
  let saved;
  try { saved = JSON.parse(await file.readFile('utf8')); }
  finally { await file.close(); }
  destination(saved);
  for (const key of ['CC_DISCORD_WEBHOOK_URL', 'CC_DISCORD_THREAD_ID']) {
    if (env[key] && env[key] !== saved[key]) throw new Error('destination_conflict');
  }
  return { ...env, CC_DISCORD_WEBHOOK_URL: saved.CC_DISCORD_WEBHOOK_URL, CC_DISCORD_THREAD_ID: saved.CC_DISCORD_THREAD_ID };
}
