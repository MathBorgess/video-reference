# video-reference

Preserve local videos as reusable, layered references for agents directing **Remotion** edits. Each project is an independent folder. Originals are deduplicated inside that folder; analysis revisions and evidence stay traceable.

The CLI prepares and stores evidence. Your current agent interprets the video using the **video-reference skill** in [skills-catalog](https://github.com/MathBorgess/skills-catalog). Remotion builds and renders the result. There are no model API calls, uploads, telemetry, background services or runtime npm dependencies.

## Install

Requires Node.js 22+. Media ingestion and inspection require `ffmpeg` and `ffprobe` on PATH. Install those through your platform's package manager; `doctor` reports availability without installing anything.

Use the published implementation on `main`:

```bash
git clone --branch main https://github.com/MathBorgess/video-reference.git
cd video-reference
npm install --global .
video-reference doctor
```

Without a global install, run `node bin/video-reference.mjs` from this checkout. This package has not been published to npmjs.org; do not assume `npx video-reference` resolves to this project. Install the companion skill using the [catalog's install instructions](https://github.com/MathBorgess/skills-catalog#install).

## First project

```bash
video-reference init ./my-references
video-reference ingest ./clip.mp4 --project ./my-references
video-reference inspect <reference-id> --from 0 --to 2000 --frames 8 --project ./my-references
video-reference schema analysis
video-reference template <reference-id> --project ./my-references
```

All output is a JSON envelope: `{schemaVersion, tool, version, status, data}`. Save **the template's data object**, not the envelope, to an analysis file. The template is intentionally incomplete. Ask the agent to examine the entire video and sound, deepen fast/uncertain intervals, fill the analysis, and preserve unknowns. `inspect` defaults to only the first ten seconds and cannot certify coverage of an entire video.

```bash
video-reference save ./analysis.json --project ./my-references
video-reference search "word reveal" --project ./my-references
video-reference search '*' --project ./my-references
video-reference read <reference-id> --layers audio --project ./my-references
video-reference handoff <reference-id> --target remotion --project ./my-references
video-reference check --project ./my-references
```

`read` includes transitive relation dependencies: an audio request can bring the caption and chart that trigger a sound. `--from` and `--to` select source milliseconds; dependencies may extend beyond that selection. Search is lexical over this project's analyses, not embeddings or a global search. Search another project only by explicitly choosing its path.

## Adapt or mix

Read `schema adaptation` and prepare changes against exact event IDs and revision hashes. Add proposed resolutions using relation keys `referenceId:relationId`. Pass the file with `handoff --adaptation file.json`; use comma-separated reference IDs to combine references.

Changing a connected event or combining references returns `confirmation_required` (exit 4), with affected relations and a decision template. Present the proposal to the human. Only after an actual response, record it with `decide <handoff-id> <approval-file>`. The CLI records an attestation; it cannot authenticate a conversation. It never invents consent or renders. Unresolved dependencies, incomplete analysis, wrong proposal IDs and stale revisions are rejected.

`handoffs/<id>/DIRECTION.md` and `packet.json` carry detailed Remotion direction. They do not create an approved BRIEF or executable composition. Relative media paths resolve from the library root, not the handoff directory. Keep the project folder together when moving it.

For production, `video-reference schema production` exposes the requirements carried by recovery and handoffs: print-and-speech storyboard, stronger relevant milestones/CTA, reversible speech-cleanup review, shared clocks and separate verification states. See [editorial review](docs/editorial-review.md). Concrete effects remain project choices; this CLI does not automatically assess video quality or require a new transcript/cut approval stage.

## Agent interface

- Start with `--help`, `<command> --help` and `schema <command>`. The skill teaches audiovisual judgment, not a second syntax manual.
- stdout contains only JSON; errors also appear on stderr. No TTY prompts.
- Exit codes: `0` success/preview, `1` failure, `2` invalid invocation, `3` incomplete, `4` human decision required. Inspect the payload too. `read` can successfully retrieve an incomplete analysis: inspect `data.coverage`.
- `--dry-run` on supported writes previews without persisting an artifact. Some previews read/hash sources and temporarily acquire the write lock.
- Keep project media, analysis and decisions outside this public source repository.
- After an interrupted write, inspect `.write-lock/owner.json` and ensure the writer is gone before removing a stale lock. A killed process can leave temporary `.ingest-*`, `.evidence-*` or `.handoff-*` directories; review before cleanup. Original copies and revisions are preserved.

See [analysis and evidence](docs/analysis.md), [local audio and motion workflow](docs/local-analysis.md), [Remotion handoff](docs/remotion.md), and [architecture and sources](docs/architecture.md).

## Validation and limits

Run `npm run check` and `npm pack --dry-run`. Tests use synthetic media to verify persistence, relation closure, integrity, decisions and CLI behavior. Coverage is an agent attestation; schemas cannot prove the agent watched or heard a video. No real-video fidelity result is claimed. The pilot must compare a reconstructed critical interval against a user-selected local video, including text, graphics, motion and sound.

This release does not perform ASR, OCR, beat detection, automatic motion reconstruction or remote transcript retrieval. The agent can use available local tools and preserve their evidence/provenance. Do not substitute sampled frames for listening or invent measurements.

A three-video local pilot exercised the workflow with all decoded frames, native sound classification, signal measurements and local MLX transcription. It exposed a repetitive Base ASR failure that Small recovered, and motion overshoot that sparse samples missed. These are observation-method findings, not new built-in CLI features or a completed fidelity test. See the [future acoustic-analysis study](https://github.com/MathBorgess/video-reference/issues/2).

MIT. Interface and reference-workflow research informed this design; no Cloudflare or Hypit code or skill text is bundled.
