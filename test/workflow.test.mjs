import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as lib from "../src/library.mjs";
import { digest, json, safe, locked, revision } from "../src/storage.mjs";
import { run } from "../src/media.mjs";
import { LAYERS } from "../src/contracts.mjs";
const cli = fileURLToPath(
  new URL("../bin/video-reference.mjs", import.meta.url),
);
async function fixture(t) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "video-reference-test-"));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const input = path.join(tmp, "synthetic input.mp4");
  run("ffmpeg", [
    "-v",
    "error",
    "-nostdin",
    "-f",
    "lavfi",
    "-i",
    "color=c=blue:s=160x120:r=10:d=2",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=2",
    "-c:v",
    "mpeg4",
    "-c:a",
    "aac",
    "-shortest",
    input,
  ]);
  const { project: root } = await lib.init(
    path.join(tmp, "project with spaces"),
  );
  const { reference: r } = await lib.ingest(root, input);
  return { tmp, input, root, r };
}
function analysis(r) {
  const layers = Object.fromEntries(LAYERS.map((k) => [k, []]));
  const event = (id, description) => ({
    id,
    startMs: 0,
    endMs: r.durationMs,
    description,
    basis: "observed",
    evidenceIds: ["source"],
    details: { state: "Synthetic test; no measured fidelity" },
  });
  layers.text = [event("caption", "Word reveal")];
  layers.graphics = [event("chart", "Bar grows")];
  layers.audio = [event("tone", "Tone accompanies reveal")];
  layers.visual = [event("background", "Blue background")];
  return {
    schemaVersion: 1,
    referenceId: r.id,
    summary: "Synthetic audiovisual relation fixture",
    tags: ["reveal", "chart"],
    coverage: [
      {
        startMs: 0,
        endMs: r.durationMs,
        modalities: ["visual", "audio"],
        evidenceIds: ["source"],
      },
    ],
    layers,
    relations: [
      {
        id: "rel-caption-tone",
        from: "caption",
        to: "tone",
        type: "syncs",
        offsetMs: 0,
        description: "Synthetic relationship",
        evidenceIds: ["source"],
      },
      {
        id: "rel-chart-caption",
        from: "chart",
        to: "caption",
        type: "depends_on",
        offsetMs: 0,
        description: "Synthetic chain",
        evidenceIds: ["source"],
      },
    ],
    unknowns: ["Not a real-video validation"],
  };
}
async function proposal(f) {
  const a = analysis(f.r);
  const s = await lib.save(f.root, a);
  const key = (id) => `${f.r.id}:${id}`;
  const adaptation = {
    schemaVersion: 1,
    intent: "Replace tone while preserving the visual reveal",
    changes: [
      {
        referenceId: f.r.id,
        revision: s.revision,
        eventId: "tone",
        instruction: "Use a bell at the same onset",
      },
    ],
    decisions: [
      {
        relationId: key("rel-caption-tone"),
        resolution: "Keep the caption and new bell aligned",
      },
      {
        relationId: key("rel-chart-caption"),
        resolution: "Preserve chart and caption relationship",
      },
    ],
  };
  const file = path.join(f.tmp, "adaptation.json");
  await fs.writeFile(file, JSON.stringify(adaptation));
  const p = await lib.handoff(f.root, f.r.id, {
    adaptation: file,
    layers: "audio",
  });
  return { a, s, p, file };
}
test("ingest is idempotent, local, preserves input, and project is movable", async (t) => {
  const f = await fixture(t);
  const original = await fs.readFile(f.input);
  const second = await lib.ingest(f.root, f.input);
  assert.equal(second.reused, true);
  assert.equal((await fs.readdir(path.join(f.root, "sources"))).length, 1);
  assert.deepEqual(await fs.readFile(f.input), original);
  const moved = path.join(f.tmp, "moved");
  await fs.rename(f.root, moved);
  assert.equal((await lib.check(moved)).ok, true);
  const other = (await lib.init(path.join(f.tmp, "other"))).project;
  await lib.ingest(other, f.input);
  assert.equal((await fs.readdir(path.join(other, "sources"))).length, 1);
});
test("evidence extraction uses bounded frames/audio and validates hashes", async (t) => {
  const f = await fixture(t);
  const e = await lib.inspect(f.root, f.r.id, {
    frames: 3,
    from: 100,
    to: 1500,
  });
  assert.equal(e.evidence.assets.length, 4);
  assert.equal(
    (await lib.inspect(f.root, f.r.id, { frames: 3, from: 100, to: 1500 }))
      .reused,
    true,
  );
  await fs.appendFile(
    path.join(f.root, e.evidence.assets[0].file),
    "corruption",
  );
  assert.equal((await lib.check(f.root)).ok, false);
});
test("limited-range H264 yields decodable PNG evidence", async (t) => {
  const f = await fixture(t);
  const input = path.join(f.tmp, "limited.mp4");
  run("ffmpeg", [
    "-v",
    "error",
    "-i",
    f.input,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-color_range",
    "tv",
    input,
  ]);
  const { reference: r } = await lib.ingest(f.root, input);
  const { evidence } = await lib.inspect(f.root, r.id, {
    frames: 24,
    to: r.durationMs,
  });
  for (const a of evidence.assets.filter((a) => a.kind === "frame")) {
    assert.equal(path.extname(a.file), ".png");
    run("ffmpeg", [
      "-v",
      "error",
      "-i",
      path.join(f.root, a.file),
      "-f",
      "null",
      "-",
    ]);
  }
});
test("revisions are immutable and reads include transitive dependencies", async (t) => {
  const f = await fixture(t);
  const a = analysis(f.r);
  const first = await lib.save(f.root, a);
  assert.equal(first.status, "complete");
  const selected = await lib.read(f.root, f.r.id, { layers: "audio" });
  assert.equal(selected.mandates.editor, "remotion");
  assert.equal(selected.mandates.preserveSourceColor, true);
  assert.equal(selected.mandates.mandatoryTranscode, false);
  const packet = await lib.handoff(f.root, f.r.id, {target:"remotion", layers:"audio"});
  assert.equal(packet.target,"remotion");
  const savedPacket = await json(path.join(f.root, packet.directory, "packet.json"));
  assert.deepEqual(savedPacket.mandates, packet.mandates);
  assert.deepEqual(packet.mandates, selected.mandates);
  assert.equal(packet.mandates.width,1080);
  assert.equal(packet.mandates.height,1920);
  assert.equal(packet.mandates.version, 2);
  assert.equal(packet.mandates.editorialQuality.storyboard.required, true);
  assert.equal(packet.mandates.editorialQuality.speechCleanup.requiredReview, true);
  const direction = await fs.readFile(path.join(f.root, packet.directory, "DIRECTION.md"), "utf8");
  assert.match(direction, /## Editorial quality/);
  assert.match(direction, /before\/removed\/after speech/);
  assert.match(direction, /intentional repetition/);
  assert.match(direction, /author's CTA/);
  await assert.rejects(lib.handoff(f.root, f.r.id, {target:"hyperframes"}), {code:"invalid_target"});
  assert.deepEqual(selected.events.map((e) => e.id).sort(), [
    "caption",
    "chart",
    "tone",
  ]);
  assert.equal(selected.events.filter((e) => e.dependency).length, 2);
  await assert.rejects(
    lib.read(f.root, f.r.id, { layers: "audio", "max-events": 2 }),
    { code: "context_limit" },
  );
  a.summary = "New interpretation";
  const second = await lib.save(f.root, a);
  assert.notEqual(first.revision, second.revision);
  assert.equal(
    (await revision(f.root, f.r.id, first.revision)).analysis.summary,
    "Synthetic audiovisual relation fixture",
  );
  assert.equal((await lib.check(f.root)).ok, true);
  const matches = await lib.search(f.root, "chart", { limit: 1 });
  assert.equal(matches.total, 1);
  assert.equal(matches.matches[0].revision, second.revision);
});
test("production requirements are discoverable without a project or media operation", () => {
  const p = spawnSync(process.execPath, [cli, "schema", "production"], { encoding: "utf8" });
  assert.equal(p.status, 0, p.stderr);
  const result = JSON.parse(p.stdout);
  assert.equal(result.status, "complete");
  assert.deepEqual(result.data, lib.PRODUCTION_MANDATES);
  assert.equal(result.data.mandatoryTranscriptCutGate, false);
  assert.equal(result.data.mandatoryTranscode, false);
  assert.deepEqual(result.data.editorialQuality.verification.states, ["pass", "fail", "unverified"]);
  assert.match(result.data.editorialQuality.cta.authorship, /absent\/not applicable/);
  assert.match(result.data.editorialQuality.milestones.brand, /not a universal style/);
});
test("coverage gaps, bad times, evidence and relations cannot claim completeness", async (t) => {
  const f = await fixture(t);
  const a = analysis(f.r);
  a.coverage[0].endMs = 100;
  assert.equal((await lib.save(f.root, a)).status, "incomplete");
  assert.equal((await lib.handoff(f.root, f.r.id, {})).status, "incomplete");
  a.layers.audio[0].endMs = f.r.durationMs + 1;
  await assert.rejects(lib.save(f.root, a), { code: "invalid_interval" });
  a.layers.audio[0].endMs = f.r.durationMs;
  a.relations[0].to = "missing";
  await assert.rejects(lib.save(f.root, a), { code: "invalid_relation" });
  a.relations[0].to = "tone";
  a.layers.audio[0].evidenceIds = ["made-up"];
  await assert.rejects(lib.save(f.root, a), { code: "invalid_evidence" });
});
test("dependent changes require exact human decision; changed revisions invalidate it", async (t) => {
  const f = await fixture(t);
  const { a, p, file } = await proposal(f);
  assert.equal(p.status, "confirmation_required");
  assert.equal(p.affectedRelations.length, 2);
  const decision = {
    proposalId: p.proposalId,
    decision: "approve",
    reviewer: "Test reviewer",
    evidence:
      "Synthetic test authorization, not a real human production approval",
    decidedAt: "2026-01-01T00:00:00Z",
  };
  assert.equal(
    (await lib.decide(f.root, p.proposalId, decision)).status,
    "approved",
  );
  assert.equal(
    (await lib.handoff(f.root, f.r.id, { adaptation: file, layers: "audio" }))
      .status,
    "approved",
  );
  assert.equal((await lib.check(f.root)).ok, true);
  a.summary = "Updated analysis";
  await lib.save(f.root, a);
  await assert.rejects(lib.decide(f.root, p.proposalId, decision), {
    code: "stale_proposal",
  });
  assert.equal((await lib.check(f.root)).findings[0].code, "stale_proposal");
});
test("unresolved dependencies cannot be approved and preview writes no packet", async (t) => {
  const f = await fixture(t);
  const { file } = await proposal(f);
  const adaptation = await json(file);
  adaptation.decisions = [];
  await fs.writeFile(file, JSON.stringify(adaptation));
  const preview = await lib.handoff(f.root, f.r.id, {
    adaptation: file,
    "dry-run": true,
  });
  assert.equal(preview.persisted, false);
  const p = await lib.handoff(f.root, f.r.id, { adaptation: file });
  await assert.rejects(
    lib.decide(f.root, p.proposalId, {
      proposalId: p.proposalId,
      decision: "approve",
      reviewer: "Test",
      evidence: "Synthetic authorization",
      decidedAt: "2026-01-01",
    }),
    { code: "unresolved_dependency" },
  );
});
test("preserves existing folders and rejects traversal, symlinks, corruption and concurrent writes", async (t) => {
  const f = await fixture(t);
  await assert.rejects(lib.init(f.tmp), { code: "directory_not_empty" });
  await assert.rejects(safe(f.root, "../outside"), { code: "invalid_path" });
  await fs.symlink(f.tmp, path.join(f.root, "escape"));
  await assert.rejects(safe(f.root, "escape/file"), { code: "unsafe_symlink" });
  await locked(f.root, async () => {
    await assert.rejects(lib.save(f.root, analysis(f.r)), {
      code: "project_busy",
    });
  });
  await fs.appendFile(path.join(f.root, f.r.file), "tamper");
  await assert.rejects(lib.ingest(f.root, f.input), {
    code: "integrity_error",
  });
});
test("CLI is parseable without TTY, strict on options, and exposes actual schemas", () => {
  let r = spawnSync(process.execPath, [cli, "schema", "analysis"], {
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).data.additionalProperties, false);
  r = spawnSync(process.execPath, [cli, "search", "word", "--unknown"], {
    encoding: "utf8",
  });
  assert.equal(r.status, 2);
  assert.equal(JSON.parse(r.stdout).status, "failed");
  assert.match(r.stderr, /usage_error/);
  r = spawnSync(process.execPath, [cli, "search", "word"], {
    encoding: "utf8",
  });
  assert.equal(r.status, 1);
  assert.equal(JSON.parse(r.stdout).data.error.code, "project_required");
});
test("CLI incomplete exit is distinct from success", async (t) => {
  const f = await fixture(t);
  const a = await lib.template(f.root, f.r.id);
  const file = path.join(f.tmp, "analysis.json");
  await fs.writeFile(file, JSON.stringify(a));
  const r = spawnSync(
    process.execPath,
    [cli, "save", file, "--project", f.root],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 3);
  assert.equal(JSON.parse(r.stdout).status, "incomplete");
});

test("decision validation does not inherit the retrieval event budget", async (t) => {
  const f = await fixture(t);
  const a = analysis(f.r);
  a.layers.visual = Array.from({ length: 220 }, (_, i) => ({
    ...a.layers.visual[0],
    id: `background-${i}`,
  }));
  const saved = await lib.save(f.root, a);
  const adaptation = {
    schemaVersion: 1,
    intent: "Replace tone",
    changes: [
      {
        referenceId: f.r.id,
        revision: saved.revision,
        eventId: "tone",
        instruction: "Bell on reveal",
      },
    ],
    decisions: a.relations.map((r) => ({
      relationId: `${f.r.id}:${r.id}`,
      resolution: "Preserve timing",
    })),
  };
  const file = path.join(f.tmp, "large-adaptation.json");
  await fs.writeFile(file, JSON.stringify(adaptation));
  const p = await lib.handoff(f.root, f.r.id, {
    adaptation: file,
    layers: "audio",
  });
  const result = await lib.decide(f.root, p.proposalId, {
    proposalId: p.proposalId,
    decision: "approve",
    reviewer: "Test reviewer",
    evidence: "Synthetic test authorization",
    decidedAt: "2026-01-01T00:00:00Z",
  });
  assert.equal(result.status, "approved");
});
