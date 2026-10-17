import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const hash = text => createHash('sha256').update(text).digest('hex');

export function destination(env) {
  if (!env.CC_DISCORD_WEBHOOK_URL || !env.CC_DISCORD_THREAD_ID) throw new Error('setup_required');
  let url;
  try { url = new URL(env.CC_DISCORD_WEBHOOK_URL); } catch { throw new Error('invalid_destination'); }
  if (url.protocol !== 'https:' || url.hostname !== 'discord.com' || url.port || url.username || url.password || url.hash
    || !/^\/api\/(?:v10\/)?webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)
    || !/^\d{15,22}$/.test(env.CC_DISCORD_THREAD_ID)) throw new Error('invalid_destination');
  for (const [key, value] of url.searchParams) {
    if (key !== 'wait' && key !== 'thread_id') throw new Error('invalid_destination');
    if (key === 'thread_id' && value !== env.CC_DISCORD_THREAD_ID) throw new Error('invalid_destination');
  }
  url.searchParams.set('wait', 'true');
  url.searchParams.set('thread_id', env.CC_DISCORD_THREAD_ID);
  return url;
}

export function redact(text, env) {
  if (env.CC_DISCORD_WEBHOOK_URL) {
    // A final response may quote only the credential component, not the full URL.
    const token = new URL(env.CC_DISCORD_WEBHOOK_URL).pathname.split('/').at(-1);
    if (token) text = text.split(token).join('[REDACTED]');
  }
  const secrets = Object.entries(env).filter(([key, value]) => typeof value === 'string' && value.length >= 4
    && /TOKEN|SECRET|PASSWORD|API_KEY|WEBHOOK_URL/i.test(key)).map(([, value]) => value).sort((a, b) => b.length - a.length);
  for (const value of secrets) text = text.split(value).join('[REDACTED]');
  return text.replace(/https:\/\/discord\.com\/api\/(?:v10\/)?webhooks\/[^\s<>]+/g, '[REDACTED WEBHOOK]')
    .replace(/\bsk-(?:ant-)?[A-Za-z0-9_-]{16,}/g, '[REDACTED TOKEN]');
}

export function messageBody(summary) {
  const prefix = 'Claude 作業報告（完了判定は本文を確認）\n';
  const payload = { content: prefix + summary, allowed_mentions: { parse: [] } };
  if (payload.content.length <= 2000) return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
  payload.content = prefix + '最終応答は添付の summary.txt に保存しました。';
  payload.attachments = [{ id: 0, filename: 'summary.txt' }];
  const form = new FormData();
  form.set('payload_json', JSON.stringify(payload));
  form.set('files[0]', new Blob([summary], { type: 'text/plain;charset=utf-8' }), 'summary.txt');
  return { body: form };
}

export async function deliver(input, { env = process.env, directory, fetcher = fetch } = {}) {
  if (input?.hook_event_name !== 'Stop' || input.agent_id) return { state: 'ignored_event' };
  if (typeof input.session_id !== 'string' || !input.session_id || input.session_id.length > 256) throw new Error('invalid_session');
  if (typeof input.last_assistant_message !== 'string' || !input.last_assistant_message.trim()) return { state: 'empty_summary' };
  if (Buffer.byteLength(input.last_assistant_message, 'utf8') > 256 * 1024) throw new Error('summary_too_large');
  const url = destination(env);
  const summary = redact(input.last_assistant_message, env);
  const identity = hash(JSON.stringify([input.session_id, url.pathname.split('/').at(-2), env.CC_DISCORD_THREAD_ID, summary]));
  await mkdir(directory, { recursive: true });
  const path = join(directory, identity + '.json');
  const record = { identity, state: 'delivery_unknown', thread_id: env.CC_DISCORD_THREAD_ID };
  try { await writeFile(path, JSON.stringify(record), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code === 'EEXIST') return { state: 'existing_attempt', identity }; throw new Error('journal_unavailable'); }
  try {
    const response = await fetcher(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), ...messageBody(summary) });
    record.http_status = response.status;
    if (!response.ok) {
      record.state = response.status >= 400 && response.status < 500 ? 'rejected' : 'delivery_unknown';
      await response.body?.cancel();
    } else {
      const reader = response.body?.getReader();
      let text = '', bytes = 0;
      if (!reader) throw new Error('missing_receipt');
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 65536) { await reader.cancel(); throw new Error('receipt_too_large'); }
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
      } finally { reader.releaseLock(); }
      const receipt = JSON.parse(text);
      const needsAttachment = ('Claude 作業報告（完了判定は本文を確認）\n' + summary).length > 2000;
      const attachmentConfirmed = !needsAttachment || receipt.attachments?.some(item => item.filename === 'summary.txt' && item.size === Buffer.byteLength(summary, 'utf8'));
      if (typeof receipt.id === 'string' && /^\d{15,22}$/.test(receipt.id) && receipt.channel_id === env.CC_DISCORD_THREAD_ID && attachmentConfirmed) {
        record.state = 'delivered';
        record.message_id = receipt.id;
      }
    }
  } catch { /* Network failure or invalid receipt is ambiguous; retain journal, never retry. */ }
  try { await writeFile(path, JSON.stringify(record), { mode: 0o600 }); }
  catch { throw new Error('receipt_save_failed_reconcile_discord'); }
  return record;
}
