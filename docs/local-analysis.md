# Local audio and motion workflow

The CLI stores evidence and interpretations supplied by the agent. The companion skill owns the method; load its audio and motion references on demand. These steps do not add model calls or installations to the CLI.

1. Run `doctor`, inspect hardware and installed runtimes/model weights. Preserve originals and source timestamps. Decode full-band stereo PCM for acoustic analysis; a mono speech proxy has a separate purpose.
2. Transcribe with an available local model. Preserve raw output and reject repetitive/implausible decoding. An installed MLX runtime is distinct from its model weights. In the local pilot, Small multilingual was a useful bounded escalation after Base failed; benchmark on the target machine rather than assuming the same performance.
3. Measure loudness, envelope and onset candidates. Optionally classify sound locally (for example, native Apple SoundAnalysis). Keep signal measurements, model hypotheses and direct listening distinct. A spectral peak is not proof of a beat or a specific effect.
4. Decode native frame PTS in critical intervals. Track bounded objects/regions and review failure frames. Capture overshoot, settling, translation and scale separately; a difference image is not object tracking or proof of a cut.
5. Relate verified words/effect attacks/beats to visual anchors, with uncertainty and signed offsets. Preserve dependencies when changing content, audio or format. Unknown effect identities and unverified tails remain explicit.
6. Save a new immutable analysis revision with hashed provenance and run `check`. Independently verify auxiliary artifacts: the CLI does not validate arbitrary external provenance files. Processing all samples or frames does not certify semantic/listening coverage.

The pilot's originals, transcripts, measurements and references belong to the private project, not this public repository. Public tests remain synthetic. Sound-effect identity, tails and fine audiovisual synchronization are tracked in [research issue #2](https://github.com/MathBorgess/video-reference/issues/2).

## Share references without committing media

A text-only snapshot can support browsing summaries and analysis JSON. Label it explicitly as a snapshot, list included versus missing artifacts, preserve the source/revision IDs and checksums, and keep availability distinct from observation completeness. It is not a full CLI project: `read`, `handoff` and `check` require the source and referenced evidence. Do not create placeholders or rewrite evidence IDs to make checks pass.

For full CLI use on another machine, transfer the complete project through an authorized private channel, verify its manifest and run `check` at the destination. Never infer permission to upload originals from a request to share descriptions. Until media is available, the agent can propose references from the snapshot but cannot claim a new audiovisual review or a faithful reconstruction.

## Start a new edit

Give the agent the target local video, the reference project or text snapshot, the desired audience/duration and which layers may change. Ask it to propose relevant references with intervals, reusable behavior, dependencies and uncertainties. Or name one exact reference and layer directly. Once the proposal is selected, use `schema adaptation`/`handoff` and present affected relationships for the human's decision. HyperFrames owns the subsequent composition, preview and rendering.
