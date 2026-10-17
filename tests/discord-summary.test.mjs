import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deliver, destination, messageBody, redact } from '../scripts/discord-summary/delivery.mjs';

const thread = '123456789012345678';
// Synthetic fixture only: assemble the endpoint at test time rather than
// publishing a credential-shaped URL. No network client is used by these tests.
const fixtureWebhook = new URL('https://discord.com');
fixtureWebhook.pathname = ['api', 'webhooks', '123456789012345679', 'fake-test-token'].join('/');
const env = { CC_DISCORD_WEBHOOK_URL: fixtureWebhook.href, CC_DISCORD_THREAD_ID: thread };
const event = { hook_event_name: 'Stop', session_id: 'session-test', last_assistant_message: '検証結果: 完了ではなく接続確認のみ。' };
const receipt = () => new Response(JSON.stringify({ id: '123456789012345680', channel_id: thread }), { status: 200 });
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'officina-discord-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('destination is bound to Discord and the explicit existing thread', () => {
  const url = destination(env);
  assert.equal(url.searchParams.get('wait'), 'true');
  assert.equal(url.searchParams.get('thread_id'), thread);
  for (const bad of ['http://discord.com/api/webhooks/1/token', 'https://discord.com.evil.test/api/webhooks/1/token', env.CC_DISCORD_WEBHOOK_URL + '?thread_id=999', env.CC_DISCORD_WEBHOOK_URL + '?thread_name=new', 'https://user@discord.com/api/webhooks/1/token']) {
    assert.throws(() => destination({ ...env, CC_DISCORD_WEBHOOK_URL: bad }), /invalid_destination/);
  }
  assert.throws(() => destination({}), /setup_required/);
});

test('known secrets are removed and both payload types disable mentions', async () => {
  const summary = redact('key=private-value token=fake-test-token ' + env.CC_DISCORD_WEBHOOK_URL, { ...env, SERVICE_SECRET: 'private-value' });
  assert.ok(!summary.includes('private-value'));
  assert.ok(!summary.includes('fake-test-token'));
  const small = JSON.parse(messageBody('@everyone ' + summary).body);
  assert.deepEqual(small.allowed_mentions, { parse: [] });
  const long = messageBody('長'.repeat(3000));
  assert.deepEqual(JSON.parse(long.body.get('payload_json')).allowed_mentions, { parse: [] });
  assert.equal(await long.body.get('files[0]').text(), '長'.repeat(3000));
});

test('only main Stop response is sent; transcript_path is never read', async t => {
  const directory = await fixture(t);
  let calls = 0;
  const options = { env, directory, fetcher: async (url, init) => {
    calls++;
    assert.equal(init.redirect, 'error');
    assert.ok(JSON.parse(init.body).content.includes(event.last_assistant_message));
    return receipt();
  } };
  assert.equal((await deliver({ ...event, hook_event_name: 'SubagentStop' }, options)).state, 'ignored_event');
  assert.equal((await deliver({ ...event, agent_id: 'child' }, options)).state, 'ignored_event');
  assert.equal((await deliver({ ...event, last_assistant_message: '' }, options)).state, 'empty_summary');
  const result = await deliver({ ...event, transcript_path: '/does-not-exist' }, options);
  assert.equal(result.state, 'delivered');
  assert.equal(calls, 1);
  const saved = await readFile(join(directory, result.identity + '.json'), 'utf8');
  assert.ok(!saved.includes('fake-test-token'));
  assert.ok(!saved.includes(event.last_assistant_message));
});

test('concurrent duplicate callbacks send once', async t => {
  const directory = await fixture(t);
  let calls = 0;
  const options = { env, directory, fetcher: async () => { calls++; return receipt(); } };
  const results = await Promise.all([deliver(event, options), deliver(event, options)]);
  assert.equal(calls, 1);
  assert.deepEqual(results.map(x => x.state).sort(), ['delivered', 'existing_attempt']);
});

test('ambiguous or rejected delivery never automatically retries', async t => {
  for (const mode of ['network', '500', '401', 'wrong-thread', 'malformed', 'oversized']) {
    const directory = await fixture(t);
    let calls = 0;
    const options = { env, directory, fetcher: async () => {
      calls++;
      if (mode === 'network') throw new Error('includes-secret-url');
      if (mode === '500' || mode === '401') return new Response('error', { status: Number(mode) });
      if (mode === 'wrong-thread') return new Response(JSON.stringify({ id: '123456789012345680', channel_id: '999999999999999999' }));
      return new Response(mode === 'oversized' ? 'x'.repeat(65537) : 'not JSON');
    } };
    const first = await deliver(event, options);
    assert.equal(first.state, mode === '401' ? 'rejected' : 'delivery_unknown');
    assert.equal((await deliver(event, options)).state, 'existing_attempt');
    assert.equal(calls, 1);
  }
});

test('invalid setup and oversized summary cannot post', async t => {
  const directory = await fixture(t);
  const fetcher = async () => { throw new Error('must not call network'); };
  await assert.rejects(deliver(event, { directory, env: {}, fetcher }), /setup_required/);
  await assert.rejects(deliver({ ...event, last_assistant_message: 'a'.repeat(262145) }, { directory, env, fetcher }), /summary_too_large/);
});

test('long-summary delivery requires an attachment receipt with matching size', async t => {
  const summary = '長'.repeat(3000);
  for (const withAttachment of [false, true]) {
    const directory = await fixture(t);
    const result = await deliver({ ...event, last_assistant_message: summary }, { env, directory,
      fetcher: async () => new Response(JSON.stringify({ id: '123456789012345680', channel_id: thread,
        attachments: withAttachment ? [{ filename: 'summary.txt', size: Buffer.byteLength(summary) }] : [] })) });
    assert.equal(result.state, withAttachment ? 'delivered' : 'delivery_unknown');
  }
});
