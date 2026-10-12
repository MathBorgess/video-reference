# Analysis and evidence contract

`schema analysis` is the authoritative machine-readable shape. Times are milliseconds on the original source clock, never the future render clock. `schemaVersion` is 1. Required fields: `referenceId`, `summary`, `tags`, `coverage`, `layers`, `relations`, `unknowns`.

All seven layer arrays exist, even if empty: content, structure, visual, text, graphics, motion, audio. Each event has a globally unique simple `id`, `startMs`, `endMs`, `description`, `basis` (observed or inferred), `evidenceIds` and `details` object. Use `source` as evidence when inspecting the original directly, or IDs returned by inspect. Records without evidence are rejected.

| Layer | Useful details |
|---|---|
| content | Exact words, entities, claims, meaning and narrative role; uncertain transcription |
| structure | Hook, development, reveal, payoff, pauses and their relationships |
| visual | Framing, normalized bounds, stacking/occlusion, cuts, objects and continuity |
| text | Copy, word groups, line breaks, hierarchy, position, emphasis, entry/hold/exit |
| graphics | Visible values, component order, accumulation, transformations and reveals |
| motion | Start/end states, trajectory, timing, acceleration, overlap, holds; inferred implementation separately |
| audio | Voice, music, effects, attacks, silence, mix role, tails and semantic correspondence |

“Dynamic text” is insufficient. Describe what appears, which part moves, in what order and how it relates to sound/content. Exact fonts or easing inferred from pixels remain reconstruction hypotheses. A word's importance is not proof of the original editor's intention.

Relations connect event IDs, using syncs, anticipates, emphasizes, displays, illustrates or depends_on. `offsetMs` means the start of `to` relative to the start of `from` when timing is intended; the description states semantic role and whether timing was measured. Relation IDs differ from event IDs. Cycles are allowed; retrieval computes finite transitive closure.

Coverage records declare inspected source intervals and modalities (visual, audio), with evidence IDs. Full coverage requires no gaps in each present modality. This checks the declaration, not observation truth. Empty layers do not prove absence: describe absence or uncertainty in summary/unknowns. Incomplete analysis can be saved for resumption, but its handoff remains incomplete.

Optional provenance records preserve upstream provider, assetId, contentRevision, checksum, artifactRevision and notes. An agent using a transcript connector must use accepted pinned references and verify their correspondence to this original. The CLI stores pointers without verifying the remote service. Transcript corrections can invalidate word alignment: preserve unknown timing or realign instead of copying stale timestamps.

Saving writes a content-addressed immutable revision and changes only the current pointer. Hashes use canonical JSON. `check` verifies assets and revisions; the human pilot verifies audiovisual usefulness.
