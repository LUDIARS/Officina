# Available transfer routes

These are consumer procedures, not a promise that any integration is configured. Resolve hosts/ports from the job's provisioned configuration. Preserve the runtime's network proxy and CA trust.

## Synergos custody over HTTP

Preferred where the existing management broker can issue object-scoped capabilities. The cloud worker must not receive the custody administrator credential or receipt-signing key.

1. Supply the broker with the intended artifact hash, byte length, content type and operation identity through the authorized tool. It obtains an admission and passes the resulting upload capability and required headers through secret runtime configuration.
2. Use the supplied HTTP method, URL and exact required headers. The current custody contract requires `If-None-Match: *` and the declared SHA-256. Do not construct or guess signature parameters; do not print the URL or follow redirects to a different destination.
3. Ask the broker to verify the object and retain the nonsecret verified receipt. A 412 can mean an existing object; reconcile its identity and digest instead of treating it as either unconditional success or permission to overwrite. A 409 is a conflict to resolve, not retry with different bytes.
4. For inputs, use the broker-issued short-lived GET capability, then verify size/hash locally. Expiry requires a fresh authorized capability for the same object, not a permanent public URL.

Basis: Synergos `spec/feature/opaque-custody.md`, read 2026-10-17. Its admin API belongs to the existing broker (Cu in that specification); Officina does not claim Cc already implements this broker. If no suitable broker is provisioned, try the existing peer route or the approved Drive fallback.

## Synergos peer sharing

Use an already provisioned, trusted job-only shared directory and an installed compatible CLI. Confirm supported options using its help. Do not install a large source checkout just to build the client unless the job explicitly allows it.

Documented inspection commands: `synergos-core project list`, `project get <project-id>`, `peer list <project-id>`, `transfer list -p <project-id>`. Publish only explicit files using `project publish <project-id> <files...>`; never `--all` on a workspace containing secrets or unrelated jobs. Confirm that the files arrived at the recipient and their hashes match.

Join/setup belongs to the provisioned connection procedure. Do not put invite tokens in diagnostic logs or an echoed command line. A project ID is not access control. Use this route only on the approved trusted network with the intended peers; the documented implementation lacks per-project peer ACLs. TCP reachability does not prove QUIC/UDP reachability. Do not assume a Tailscale proxy or Cloudflare HTTP Tunnel carries UDP; require a real two-peer transfer check. If the environment cannot support it, report that reason and use Drive.

## Google Drive fallback

Use an authenticated Drive connector, supported upload tool or browser session exposed in the environment. Inspect that tool's schema before use; this harness does not assume a particular CLI or invent an upload endpoint.

Require the designated folder ID, authorized account, intended recipients and available capacity. Keep existing private sharing. Put each job/revision under a distinct name, recording returned file IDs. For large files prefer the tool's supported resumable upload; keep upload-session secrets out of logs. Do not create duplicate files after an unknown outcome: look up the exact recorded identity, then reconcile size/hash or read back the bytes.

If recipient verification is not available, record `upload_accepted` and ask the recipient to confirm hashes from the manifest. Missing credentials/folder is a setup failure, not a successful fallback. Do not post capability-bearing download URLs to Discord.
