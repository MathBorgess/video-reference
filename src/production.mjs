// Direction requirements, not automated audiovisual judgments. Project intent wins.
export const EDITORIAL_QUALITY = Object.freeze({
  version: 1,
  scope: "Apply to requested production, using current project mandates, author intent, brand and destination. Reference recovery alone does not authorize editing.",
  storyboard: {
    required: true,
    coverage: "Every intended chapter, relevant milestone, CTA and cut candidate",
    fields: ["id", "source interval", "destination interval", "timestamped screenshot and provenance", "speech excerpt or explicit absence/uncertainty", "editorial purpose", "action: keep/cut/shorten/emphasize", "reason", "text/graphics/motion/audio anchors", "verification scope and editable file/prop"],
    timing: "Build before assembly and update after edits; storyboard supports the complete composition without a separate mandatory approval round.",
    evidence: "Use real available prints, label source/reference/previous draft/current draft distinctly; missing prints remain missing. Public repositories use synthetic fixtures only.",
  },
  milestones: {
    selection: "Identify the actual hook, discoveries, setbacks, attempts, contrasts, results and closing invitation in the author's content; explain relevance rather than impose a fixed count.",
    hierarchy: "Give relevant milestones visibly greater weight than ordinary speech through readable type, contrast, motion and hold; suppress competing elements and anchor to the real words.",
    brand: "Choose font, size, palette, glow and layout from the current brand/reference. Glow is an option, not a universal style or a source-video filter.",
  },
  cta: {
    emphasis: "Make the author's intended action and keyword unmistakable, with dominant hierarchy, readable hold and speech-linked reveal where speech exists.",
    authorship: "Use an existing or explicitly authorized invitation. Record CTA absent/not applicable when appropriate; propose missing copy without inventing a promise or changing author intent.",
  },
  speechCleanup: {
    requiredReview: true,
    candidates: "Inspect the whole source for mistakes, duplicate takes, false starts, redundant repetition and idle pauses. List candidates with before/removed/after excerpts and source/destination times.",
    decision: "Apply reversible cuts when they improve pace while preserving meaning, qualifiers, intentional repetition, useful pauses and authentic admissions of failure. Every inspected candidate has an action and reason; no quota or indiscriminate shortening.",
    verification: "Check joins and remap footage, audio, captions, graphics, B-roll, motion and matte together. ASR is supporting evidence, not proof of wording or audible continuity; uncertain meaning remains for review.",
  },
  compositing: "Keep information clear of faces and destination overlays. For foreground occlusion, align native framing and clocks; inspect hair, glasses, jaw, shoulders and hands in motion and around cuts, including enlarged views. Rectangular face patches are not a substitute for a good contour.",
  verification: {
    dimensions: ["structure", "visual", "audio", "color", "human acceptance"],
    states: ["pass", "fail", "unverified"],
    scope: "Record inspected intervals/frames and findings separately. Extraction, checksums, schemas, file counts and server startup cannot certify creative quality, listening, HDR or human acceptance.",
  },
});

export const PRODUCTION_MANDATES = Object.freeze({
  version: 2,
  editor: "remotion",
  firstPass: ["Show the 0–3s hook, captions and screen elements second by second, plus a screenshot-and-speech storyboard", "Assemble the complete editable video with reference and author content", "Open actual Remotion Studio for human review"],
  width: 1080,
  height: 1920,
  safeAreas: "Keep important content clear of faces and Instagram top, bottom and right overlays; verify in preview",
  preserveSourceColor: true,
  mandatoryTranscode: false,
  mandatoryTranscriptCutGate: false,
  subsequentEditing: "human with AI assistance",
  exportRequiresRequest: true,
  editorialQuality: EDITORIAL_QUALITY,
});

export function editorialDirection() {
  return `## Editorial quality\n\nBuild a storyboard before assembly and update it after cuts: every chapter, milestone, CTA and cut candidate needs a timestamped screenshot with provenance, source/destination interval, speech excerpt (or explicit absence/uncertainty), purpose, action/reason, shared motion/audio anchors and editable file/prop. Actual prints and full production remain required; label unavailable or historical evidence honestly.\n\nGive relevant milestones greater visual weight than ordinary speech, with readable holds and fewer competing elements. Make the author's CTA/action/keyword dominant. Derive type, palette, scale and optional glow from the current brand; do not impose a reference's identity or invent CTA promises.\n\nReview the whole source for mistakes, duplicate takes, false starts, redundant repetition and idle pauses. Keep a cut ledger with before/removed/after speech and exact clocks. Tighten reversibly when meaning and acoustic continuity survive; preserve intentional repetition, qualifiers and authentic failure admissions. Inspect joins and remap all dependent layers together. No mandatory transcript/cut approval gate.\n\nInspect safe areas, face collisions and any matte at enlarged critical poses and consecutive frames. Track structure, visual, audio, color and human acceptance independently as pass/fail/unverified with actual observation scope. Structural checks cannot certify audiovisual quality. The current project MANDATES and explicit author decisions prevail.\n`;
}
