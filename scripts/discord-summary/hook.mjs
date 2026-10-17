import { fileURLToPath } from 'node:url';
import { deliver } from './delivery.mjs';
import { loadDestination } from './binding.mjs';

try {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > 1024 * 1024) throw new Error('hook_input_too_large');
    chunks.push(chunk);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const directory = fileURLToPath(new URL('../../work/discord-summary/', import.meta.url));
  const needsDestination = input?.hook_event_name === 'Stop' && !input.agent_id
    && typeof input.last_assistant_message === 'string' && input.last_assistant_message.trim();
  const result = await deliver(input, { directory, env: needsDestination ? await loadDestination(directory) : {} });
  process.stderr.write(`Officina Discord: ${result.state}\n`);
  if (['delivery_unknown', 'rejected', 'existing_attempt'].includes(result.state)) process.exitCode = 1;
} catch (error) {
  // Do not print exceptions: HTTP clients may include the secret webhook URL.
  const safe = ['setup_required', 'invalid_destination', 'invalid_session', 'summary_too_large', 'hook_input_too_large', 'journal_unavailable', 'receipt_save_failed_reconcile_discord'].includes(error.message) ? error.message : 'delivery_not_confirmed';
  process.stderr.write(`Officina Discord: ${safe}; check setup and local receipt. No automatic retry.\n`);
  process.exitCode = 1;
}
