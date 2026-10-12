# video-reference

Local reference preparation and storage belong to the CLI; audiovisual interpretation belongs to the agent skill; composition and rendering belong to HyperFrames.

- Work on a `codex/` branch and PR. Do not merge without owner authorization.
- Keep runtime Node ESM with standard library only. FFmpeg/FFprobe are explicit optional system dependencies, required for media operations.
- Keep commands and schemas discoverable. stdout is a versioned JSON envelope; diagnostics use stderr. No hidden TTY prompts, network uploads, model calls, telemetry or implicit installations.
- Original copies, evidence and analysis revisions are immutable. Project folders are independent; no shared global media store.
- An adaptation affecting a relation requires a human decision tied to the exact proposal and revisions. A CLI flag is not evidence of human consent.
- Public fixtures must be synthetic. Never commit private video, transcripts, paths, decisions or credentials.
- Run `npm run check` and an installed-package smoke test before delivery. Structural success does not establish audiovisual fidelity.
