# Architecture and research basis

The CLI handles deterministic local procedures, the companion skill guides interpretation by the current agent, and Remotion owns production. No command silently invokes a model or equates extraction with understanding.

Each project owns its originals, evidence, immutable analyses and handoffs. Deduplication by bytes is within the project. Independent folders were chosen over a global store for simple copying and recovery; two projects may keep copies of the same video.

Remotion is the initial destination, enabling detailed typography, graphical construction and motion direction. This creates a contract to maintain, not a fidelity guarantee.

## Research references

- Cloudflare [agent docs](https://developers.cloudflare.com/cf/agents/) and cf source at [22b0ccb6bc979deba3ce76b8a61621ee389af63e](https://github.com/cloudflare/cf/tree/22b0ccb6bc979deba3ce76b8a61621ee389af63e) informed help/schema discovery and structured output. This small CLI does not need a search engine over its own few commands; library search is separate.
- Hypit's [reference analysis](https://github.com/hypit-ai/hypit/blob/85e01c76716498e6ec5b8bdfb6b374ca67f0195a/skills/hypit/references/creation/reference-video.md) and [timing](https://github.com/hypit-ai/hypit/blob/85e01c76716498e6ec5b8bdfb6b374ca67f0195a/skills/hypit/references/production/timing.md) informed the distinction between source observation and adaptation anchors. No Hypit runtime or skill text is incorporated.
- [PySceneDetect](https://www.scenedetect.com/docs/latest/), [WhisperX](https://github.com/m-bain/whisperX) and [librosa](https://librosa.org/doc/main/index.html) are possible local tools, not implemented capabilities or dependencies in this release.
- [Remotion](https://github.com/remotion-dev/remotion) owns the target composition workflow. Use its pinned React/Sequence APIs and current official documentation.

External research was static inspection. Software tests use synthetic fixtures. The real-video pilot remains necessary to evaluate direction quality.
