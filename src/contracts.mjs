export const LAYERS = [
  "content",
  "structure",
  "visual",
  "text",
  "graphics",
  "motion",
  "audio",
];
const string = { type: "string", minLength: 1 };
const number = { type: "number", minimum: 0 };
const array = (items) => ({ type: "array", items });
const object = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const interval = { startMs: number, endMs: number };
const evidenceIds = array(string);
const event = object({
  id: string,
  ...interval,
  description: string,
  basis: { enum: ["observed", "inferred"] },
  evidenceIds,
  details: {
    type: "object",
    description:
      "Domain-specific observations: layout, text runs, graphical construction, trajectories, timing, sound roles. Hypotheses must be labeled.",
  },
});
export const analysisSchema = object({
  schemaVersion: { const: 1 },
  referenceId: string,
  summary: string,
  tags: array(string),
  coverage: array(
    object({
      ...interval,
      modalities: {
        type: "array",
        items: { enum: ["visual", "audio"] },
        minItems: 1,
      },
      evidenceIds,
    }),
  ),
  layers: object(Object.fromEntries(LAYERS.map((k) => [k, array(event)]))),
  relations: array(
    object({
      id: string,
      from: string,
      to: string,
      type: {
        enum: [
          "syncs",
          "anticipates",
          "emphasizes",
          "displays",
          "illustrates",
          "depends_on",
        ],
      },
      offsetMs: { type: "number" },
      description: string,
      evidenceIds,
    }),
  ),
  unknowns: array(string),
});
analysisSchema.properties.provenance = array(
  object({
    provider: string,
    assetId: string,
    contentRevision: string,
    checksum: string,
    artifactRevision: string,
    notes: string,
  }),
);
export const adaptationSchema = object({
  schemaVersion: { const: 1 },
  intent: string,
  changes: array(
    object({
      referenceId: string,
      revision: string,
      eventId: string,
      instruction: string,
    }),
  ),
  decisions: array(
    object({
      relationId: {
        ...string,
        description:
          "Affected relation key from handoff: <referenceId>:<relationId>, not the local relation ID alone.",
      },
      resolution: string,
    }),
  ),
});
export const approvalSchema = object({
  proposalId: string,
  decision: { enum: ["approve", "reject"] },
  reviewer: string,
  evidence: string,
  decidedAt: string,
});
const p = ["project"];
export const commands = {
  doctor: {
    args: [],
    flags: [],
    effect: "Read local executable availability; no installation.",
  },
  init: {
    args: ["directory"],
    flags: ["name"],
    effect: "Create an independent project. Repeatable.",
  },
  ingest: {
    args: ["local-video"],
    flags: [...p, "dry-run"],
    effect:
      "Copy and hash a video, probe media, create a reference; no interpretation.",
  },
  inspect: {
    args: ["reference-id"],
    flags: [...p, "from", "to", "frames", "dry-run"],
    effect:
      "Extract bounded evidence frames and an audio excerpt; defaults to first 10 seconds, not full analysis.",
  },
  template: {
    args: ["reference-id"],
    flags: p,
    effect: "Return an incomplete analysis template for the current source.",
  },
  save: {
    args: ["analysis-json-file"],
    flags: [...p, "dry-run"],
    effect:
      "Validate and persist an immutable analysis revision; select it as current.",
  },
  search: {
    args: ["query"],
    flags: [...p, "limit", "offset"],
    effect:
      "Local lexical search in this project only. Use * to list. No embeddings.",
  },
  read: {
    args: ["reference-id"],
    flags: [...p, "revision", "layers", "from", "to", "max-events"],
    effect: "Read selected layers/time and transitive relation dependencies.",
  },
  handoff: {
    args: ["reference-ids-comma-separated"],
    flags: [
      ...p,
      "layers",
      "from",
      "to",
      "max-events",
      "adaptation",
      "target",
      "dry-run",
    ],
    effect:
      "Write a pinned Remotion direction packet. Changed dependencies require a decision.",
  },
  decide: {
    args: ["handoff-id", "approval-json-file"],
    flags: [...p, "dry-run"],
    effect:
      "Record a human decision for the exact proposal. Does not apply changes or render.",
  },
  check: {
    args: [],
    flags: p,
    effect:
      "Verify source, evidence, revision and handoff integrity. No visual-quality claim.",
  },
  schema: {
    args: ["command-or-analysis-or-adaptation-or-approval-or-production"],
    flags: [],
    effect: "Read a contract.",
  },
};
export function validate(value, schema, path = "$") {
  const fail = (reason) => {
    throw Object.assign(new Error(`${path}: ${reason}`), {
      code: "invalid_input",
    });
  };
  if ("const" in schema && value !== schema.const)
    fail(`expected ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value))
    fail(`expected one of ${schema.enum.join(", ")}`);
  if (schema.type) {
    const kind = Array.isArray(value)
      ? "array"
      : value === null
        ? "null"
        : typeof value;
    if (kind !== schema.type) fail(`expected ${schema.type}`);
  }
  if (
    typeof value === "number" &&
    (!Number.isFinite(value) ||
      (schema.minimum !== undefined && value < schema.minimum))
  )
    fail("invalid number");
  if (typeof value === "string" && schema.minLength && !value.trim())
    fail("must not be blank");
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems)
      fail("too few items");
    if (schema.items)
      value.forEach((v, i) => validate(v, schema.items, `${path}[${i}]`));
  }
  if (schema.properties) {
    for (const k of schema.required ?? [])
      if (!Object.hasOwn(value, k)) fail(`missing ${k}`);
    for (const [k, v] of Object.entries(value)) {
      if (!Object.hasOwn(schema.properties, k)) {
        if (schema.additionalProperties === false) fail(`unknown field ${k}`);
      } else validate(v, schema.properties[k], `${path}.${k}`);
    }
  }
}
