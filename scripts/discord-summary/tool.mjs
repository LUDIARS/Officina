import { fileURLToPath } from 'node:url';
import { bindDestination, loadDestination } from './binding.mjs';
import { deliver } from './delivery.mjs';

// Read credentials from stdin, never arguments. stdout contains safe receipts only.
try {
  const command = process.argv[2];
  if (!['bind', 'publish'].includes(command) || process.argv.length !== 3) throw new Error('invalid_command');
  let bytes = 0;
  const chunks = [];
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > 1024 * 1024) throw new Error('input_too_large');
    chunks.push(chunk);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const directory = fileURLToPath(new URL('../../work/discord-summary/', import.meta.url));
  const result = command === 'bind' ? await bindDestination(input, directory)
    : await deliver({ hook_event_name: 'Stop', session_id: input?.session_id, last_assistant_message: input?.summary },
      { directory, env: await loadDestination(directory) });
  process.stdout.write(JSON.stringify(result) + '\n');
  if (!['bound', 'already_bound', 'delivered'].includes(result.state)) process.exitCode = 1;
} catch (error) {
  const allowed = ['setup_required', 'invalid_destination', 'destination_already_bound', 'destination_conflict', 'unsafe_binding', 'invalid_command', 'input_too_large', 'invalid_session', 'summary_too_large'];
  process.stdout.write(JSON.stringify({ state: 'not_confirmed', error: allowed.includes(error.message) ? error.message : 'operation_not_confirmed' }) + '\n');
  process.exitCode = 1;
}
