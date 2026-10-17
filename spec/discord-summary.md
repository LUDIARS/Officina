# Claude final-response delivery

Support boundary `discord-summary` owns Stop-event validation, Discord destination validation, and delivery receipts. It does not own production acceptance or Discord replies. User request: forward the final summary using a supplied webhook.

The checked-in command hook reads only `last_assistant_message` from a main-agent `Stop` input. It does not scrape transcripts or invoke another LLM. Cloud hooks are documented at https://code.claude.com/docs/en/hooks . Each Stop is a turn boundary, not proof of job completion.

Runtime inputs are `CC_DISCORD_WEBHOOK_URL` (secret) and `CC_DISCORD_THREAD_ID` (designated existing forum thread). No credentials are committed. The destination is HTTPS discord.com with a webhook path and no redirect. Posting uses `wait=true`, a fixed thread, and disabled mentions. No channel or thread is created implicitly. The owner provisions the forum/thread and grants access separately.

Node 20+ is required. Summary input is limited to 256 KiB, total hook input to 1 MiB. A long response is attached as UTF-8 summary.txt in the same POST; short responses fit in content. Redaction covers the webhook and configured environment values with secret-like names, plus common credential patterns. This is defense in depth, not a guarantee for arbitrary secrets: the agent must produce a shareable final response.

Before HTTP I/O, create an exclusive delivery journal under ignored work/discord-summary/. Identity hashes session ID, thread, webhook ID (not token), and redacted summary. Identical final responses in the same session/destination are intentionally sent once. Journal existence suppresses retries for every state, including unknown. Concurrent invocations cannot both send. No raw summary, credentials, or response body goes into the journal. A receipt is delivered only when Discord returns message ID and matching channel ID. Timeouts, 5xx, malformed responses, process death and receipt-write failure remain unknown; 4xx is rejected. The operator reconciles Discord before any deliberate retry; this hook never automatically retries.

The hook never emits a blocking decision or exit code 2. Errors are generic and nonblocking. Missing credentials are reported as setup_required; they do not silently indicate delivery. No final summary is posted from SubagentStop or failure events.

Acceptance: isolated injected-client tests cover strict destinations, missing setup, main Stop selection, redaction, long-message attachment, concurrent duplicate calls, HTTP rejection, unknown delivery, and receipt identity. Real Claude-cloud hook execution and Discord delivery require a separately supplied webhook/thread and are not inferred from unit tests.

Rollback: revert the hook registration and modules; retain ignored receipt files for reconciliation.
