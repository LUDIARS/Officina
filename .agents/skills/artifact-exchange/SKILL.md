---
name: artifact-exchange
description: Exchange job inputs and generated artifacts through Synergos first or a designated Google Drive fallback, with integrity checks and delivery receipts. Use for production data transfer, not code publication or arbitrary file synchronization.
---

# Artifact exchange

Resolve the job's recipient, access scope and available transport before transferring. Read [references/transports.md](references/transports.md) for the selected transport. No endpoint or credential is implied by installing this skill.

Prefer Synergos. If its necessary client, broker, authentication or network path is unavailable, record the specific failure and switch to the user-designated Google Drive folder if that integration is available. The user's fallback preference authorizes that route for the requested artifacts, not public sharing or a different account. If the folder/credential is missing, ask for the missing setup; preserve local outputs.

For each input/output record a manifest based on `templates/artifact-manifest.json`: job and revision, relative path, role, byte length and SHA-256. Select actual files explicitly; don't upload a checkout, credentials, cache, private config or unrelated reference collection. Check job capacity limits against real sizes. Use a new revision for changed content, never reuse an operation identity for different bytes.

Download to a staging location, reject paths escaping the job root (including symlinks), check size/hash, then move into inputs without overwriting another revision. Treat archives as untrusted: inspect members and extracted size before extraction. Keep source assets intact.

For output, snapshot finalized files so they do not change during upload. Before sending, persist a nonsecret transfer journal under the job's `receipts/`: operation ID, destination ID, revision, filenames, sizes and hashes. Use the provider's supported correlation identity where available, so a lost response does not erase the only way to locate the operation. If the provider offers no reliable correlation/lookup, record that limitation before sending and retain delivery_unknown after an ambiguous outcome.

Distinguish saved locally, upload accepted, recipient verified and delivery unknown. Verify via recipient-side hash/read-back or a trustworthy receipt tied to the actual hash and size. A Drive file ID, a Synergos publish result or a download link alone is not proof of matching delivered bytes.

Record nonsecret object/file IDs, revision, sizes, hashes and receipt evidence. Never save signed URLs, OAuth tokens or credentials in Git, Discord or review packets. If an upload times out or returns an ambiguous result, reconcile by operation/object identity before resending or switching transports. If reconciliation is unavailable, report delivery unknown and keep the files.

Send ordinary access-controlled file references to the designated forum only after checking the intended recipient can access them. Do not convert a private folder to anyone-with-link. Release temporary credentials through the existing provider lifecycle; do not delete originals or remote objects merely because a job ended.
