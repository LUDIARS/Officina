# Artifact manifest v1

Copy `templates/artifact-manifest.json` into the ignored job directory. Fill `job_id` and immutable `revision` before transfer. Add each selected file to `artifacts`:

```json
{
  "path": "outputs/building.blend",
  "role": "editable_source",
  "byte_length": 1234,
  "sha256": "64 lowercase hexadecimal characters computed from actual bytes"
}
```

Paths are relative to the job root, unique, and cannot traverse outside it; resolve symlinks before access. Roles can distinguish input, editable_source, export, preview and review_evidence. Sizes/hashes above are illustrative, not real evidence. Hash the stable final file, not a file still being written.

`delivery.transport` is `synergos` or `google_drive`; `status` is `saved_locally`, `upload_accepted`, `recipient_verified`, `delivery_unknown` or `failed`. A receipt ID identifies external evidence, not an invented local success marker. `recipient_verified` can be true only after recipient-side size/hash confirmation or a verified receipt tied to those bytes. Keep object/file IDs and the operation ID, never signed URLs or credentials.

For multi-file transfers, preserve per-file receipts in `receipts/`; promote the manifest to recipient_verified only when every selected artifact is verified. Interrupted jobs retain their last evidence. Changed files require a new revision and new operation identity. This format is an instruction contract, not a machine-enforced schema or transport implementation.
