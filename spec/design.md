# Officina production harness

## Purpose

Small, project-independent Codex workspace for heavy artifact production with LLM direction. The repository contains procedures and review contracts, not project assets, credentials, models or caches. The requested new workflow uses Synergos first and Google Drive when Synergos is unavailable. Git versions this harness; it is not the default artifact transport.

## Ownership and boundaries

- Coordinator owns the job brief, revision, approved destination and delivery evidence.
- Producer owns editable source, reproducible generation steps and previews.
- Independent critic owns findings tied to the exact artifact revision. It cannot approve on behalf of the user.
- Synergos / Drive own byte transfer; a local file or accepted upload is not recipient verification.
- Discord forum thread owns the human conversation. A webhook alone can send, but cannot read arbitrary replies.

State: preparing → waiting_reference (if required) → producing → reviewing → revising → ready_for_delivery → delivered. Any external operation can become delivery_unknown; preserve its identity and reconcile before retrying. A new user answer increments the brief revision. Stale approvals never advance a newer artifact.

## Acceptance

1. Codex can discover five skills: production orchestration, model references, adversarial review, artifact exchange and Discord coordination.
2. Modelling requests ask for three-view references and/or concept art before detailed modelling; absent views and inferred geometry remain explicit.
3. An independent critic inspects actual previews and evidence, produces actionable counterexamples, and verifies fixes. No self-review is labelled independent.
4. Synergos preference, explicit Drive fallback, private destinations, input/output integrity and ambiguous-delivery recovery are documented.
5. Each job has one designated forum thread, numbered questions and attributable answers; missing reply access is reported.
6. Dynamic project/source/size/output requirements belong to each brief, not fixed global settings. Repository <=50 MB; heavy runtime data stays outside Git.
7. No endpoint, account, access token, live delivery or human acceptance is fabricated. Operational handoff prerequisites remain visible.

## Reuse evidence (read 2026-10-17)

- AdventureCube `spec/gamedesign/ConceptArt.md`: derive visual rules from supplied art, keep the evidence and later user corrections. Do not copy its game-specific art or visual style.
- Tokyo2070 `spec/tasks/2026-10-14-w1c-walk-view-buildings.md`: actual camera images, not object counts, establish that the asset is visible. Keep technical and visual acceptance separate.
- Tokyo2070 `.agents/skills/discord-publish/SKILL.md`: session-bound webhook, explicit thread ID, disabled mentions, returned message receipt, no blind retries. Generalize destination ownership without copying credentials.
- Synergos `spec/feature/opaque-custody.md`: broker-issued short-lived transfer capabilities, digest verification and receipts. Custody admin credential stays with the broker.
- Synergos `docs/two-node-operations.md`: peer mode needs real network reachability, explicit publish and trusted participants; project ID is not an ACL. Older docs disagree on tunnel support, so runtime capability checks are required.
- Transfer procedures are based on the source specifications above; cloud connectivity remains untested.
- Codex packaging: https://learn.chatgpt.com/docs/build-skills and https://learn.chatgpt.com/docs/agent-configuration/agents-md . Use portable Markdown skills and AGENTS.md; no assumed provider API or private cloud endpoint.

## Implementation choice

The `harness-validation` support boundary owns the portable packaging check and its registered execution. It reads the package without modifying it; it rejects invalid metadata, broken local Markdown links, invalid JSON and oversized packages. It cannot establish production quality or external delivery. Revisor/Augur runs the same `node scripts/check-package.mjs` check registered in `.augur/tests.jsonl`.

This release defines an instruction harness and job templates. It does not deploy a daemon, implement an OAuth client or create a new transfer service. Existing available tools perform I/O. The skill must stop with an explicit missing capability when those tools are absent. A bounded critic loop is part of the workflow; no unbounded autonomous cost or invented background heartbeat.
