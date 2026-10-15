# video-reference

Local reference preparation and storage belong to the CLI; audiovisual interpretation belongs to the agent skill; composition and rendering belong to Remotion.

- Work on a `codex/` branch and PR. Do not merge without owner authorization.
- Keep runtime Node ESM with standard library only. FFmpeg/FFprobe are explicit optional system dependencies, required for media operations.
- Keep commands and schemas discoverable. stdout is a versioned JSON envelope; diagnostics use stderr. No hidden TTY prompts, network uploads, model calls, telemetry or implicit installations.
- Original copies, evidence and analysis revisions are immutable. Project folders are independent; no shared global media store.
- An adaptation affecting a relation requires a human decision tied to the exact proposal and revisions. A CLI flag is not evidence of human consent.
- Public fixtures must be synthetic. Never commit private video, transcripts, paths, decisions or credentials.
- Run `npm run check` and an installed-package smoke test before delivery. Structural success does not establish audiovisual fidelity.

<!-- mathai-repo-operations:start -->
## Resource cleanup and review

Existing repository-specific retention, immutable-evidence and review/check requirements remain in force. This section does not override longer retention or stricter preservation rules.

Before cleanup, inspect `git status --short`, `git worktree list`, tracked files, ignored/untracked files and active processes. Read this repository's build configuration and `.gitignore` to identify reproducible outputs. Produce a bounded dry-run list with paths, ownership, active-use checks and a recovery plan; remove only confirmed inactive regenerable residue. A directory being ignored does not make it disposable. Never use broad `git clean`, forced worktree removal or recursive deletion across projects.

Stop only temporary processes created by the current task after they are no longer needed. Keep ordinary operational logs for five days, except evidence needed for an open issue. Preserve sources, credentials, local/ignored work and all experiment/evaluation records awaiting human assessment. Age alone does not authorize deletion of projects or conversations. Use the owning application's archive/recovery mechanism for managed worktrees. Report measured cleanup results and unresolved items in short bullets.

### Code Review Rules

Focus on correctness, data loss, security, permission expansion, costs and broken external contracts. State the concrete trigger and consequence of a finding. Put formatting and deterministic checks in CI. Missing required evidence is unverified, not success. Preserve repository-specific human approval and merge rules; this section grants no new merge authority. Report useful architectural decisions separately from blocking risks, in plain language.

<!-- mathai-repo-operations:end -->
