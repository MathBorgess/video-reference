#!/usr/bin/env node
import {
  commands,
  analysisSchema,
  adaptationSchema,
  approvalSchema,
} from "../src/contracts.mjs";
import { project, json, error } from "../src/storage.mjs";
import * as library from "../src/library.mjs";
import { doctor } from "../src/media.mjs";
import { PRODUCTION_MANDATES } from "../src/production.mjs";
const version = "0.2.0";
function emit(status, data) {
  process.stdout.write(
    JSON.stringify(
      { schemaVersion: 1, tool: "video-reference", version, status, data },
      null,
      2,
    ) + "\n",
  );
}
function help(command) {
  return {
    purpose:
      "Preserve and retrieve local video references for detailed Remotion direction.",
    usage: "video-reference <command> [args] --project <directory>",
    commands: command ? { [command]: commands[command] } : commands,
    next: "doctor → init → ingest → inspect → template → agent analysis → save → search/read → handoff. Use schema analysis for observations and schema production for storyboard, milestone, CTA and speech-cleanup requirements. Load the video-reference skill for interpretation; extraction is not analysis.",
    skill:
      "https://github.com/MathBorgess/skills-catalog/tree/main/skills/creativity/video-reference",
    exitCodes: {
      0: "success/preview",
      1: "failure",
      2: "invalid invocation",
      3: "incomplete",
      4: "human confirmation required",
    },
  };
}
try {
  const argv = process.argv.slice(2);
  if (argv.length === 1 && argv[0] === "--version") {
    emit("complete", { version });
    process.exit(0);
  }
  const command = argv.shift();
  if (!command || command === "--help" || command === "help") {
    emit("complete", help());
    process.exit(0);
  }
  if (!commands[command])
    throw error("usage_error", `Unknown command ${command}. Run --help.`);
  if (argv.includes("--help")) {
    emit("complete", help(command));
    process.exit(0);
  }
  const o = {},
    args = [];
  const booleans = new Set(["dry-run"]);
  const numerics = new Set([
    "from",
    "to",
    "frames",
    "limit",
    "offset",
    "max-events",
  ]);
  let literal = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--" && !literal) {
      literal = true;
      continue;
    }
    if (a.startsWith("--") && !literal) {
      const key = a.slice(2);
      if (!commands[command].flags.includes(key) || Object.hasOwn(o, key))
        throw error("usage_error", `Unknown or repeated flag ${a}`);
      if (booleans.has(key)) o[key] = true;
      else {
        const v = argv[++i];
        if (v === undefined || v.startsWith("--"))
          throw error("usage_error", `Missing value for ${a}`);
        o[key] = numerics.has(key) ? Number(v) : v;
        if (numerics.has(key) && !Number.isFinite(o[key]))
          throw error("usage_error", `Invalid number for ${a}`);
      }
    } else args.push(a);
  }
  if (args.length !== commands[command].args.length)
    throw error(
      "usage_error",
      `Expected: ${command} ${commands[command].args.join(" ")}. Run ${command} --help.`,
    );
  let result;
  if (command === "schema") {
    const name = args[0];
    const schemas = {
      analysis: analysisSchema,
      adaptation: adaptationSchema,
      approval: approvalSchema,
      production: PRODUCTION_MANDATES,
    };
    result = schemas[name] ?? commands[name];
    if (!result) throw error("usage_error", "Unknown schema");
  } else if (command === "doctor") {
    result = doctor();
    result.status = result.ready ? "complete" : "incomplete";
  } else if (command === "init") result = await library.init(args[0], o.name);
  else {
    const root = await project(o.project);
    if (command === "ingest")
      result = await library.ingest(root, args[0], o["dry-run"]);
    if (command === "inspect") result = await library.inspect(root, args[0], o);
    if (command === "template") result = await library.template(root, args[0]);
    if (command === "save")
      result = await library.save(root, await json(args[0]), o["dry-run"]);
    if (command === "search") result = await library.search(root, args[0], o);
    if (command === "read") result = await library.read(root, args[0], o);
    if (command === "handoff") result = await library.handoff(root, args[0], o);
    if (command === "decide")
      result = await library.decide(
        root,
        args[0],
        await json(args[1]),
        o["dry-run"],
      );
    if (command === "check") {
      result = await library.check(root);
      result.status = result.ok ? "complete" : "failed";
    }
  }
  const status = result.status ?? "complete";
  emit(status, result);
  process.exitCode =
    { failed: 1, incomplete: 3, confirmation_required: 4 }[status] ?? 0;
} catch (e) {
  const code = e.code ?? "internal_error";
  emit("failed", { error: { code, message: e.message } });
  process.stderr.write(`${code}: ${e.message}\n`);
  process.exitCode = code === "usage_error" ? 2 : 1;
}
