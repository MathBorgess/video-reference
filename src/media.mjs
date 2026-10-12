import { spawnSync } from "node:child_process";
import { error } from "./storage.mjs";
export function run(command, args) {
  const r = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  if (r.error?.code === "ENOENT")
    throw error("dependency_missing", `Install ${command}, then rerun doctor.`);
  if (r.error || r.status !== 0)
    throw error(
      "media_failed",
      `${command}: ${r.error?.message || r.stderr?.slice(-1500) || "failed"}`,
    );
  return r.stdout;
}
export function probe(file) {
  const p = JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-protocol_whitelist",
      "file,pipe",
      "-show_format",
      "-show_streams",
      "-of",
      "json",
      file,
    ]),
  );
  const v = p.streams?.find((s) => s.codec_type === "video");
  const durationMs = Math.round(
    Number(p.format?.duration ?? v?.duration) * 1000,
  );
  if (
    !v ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    !v.width ||
    !v.height
  )
    throw error(
      "unsupported_media",
      "Expected a finite local video with readable dimensions and duration.",
    );
  return {
    durationMs,
    width: v.width,
    height: v.height,
    fps: v.avg_frame_rate,
    startTimeMs: Number(p.format?.start_time ?? 0) * 1000,
    hasAudio: p.streams.some((s) => s.codec_type === "audio"),
  };
}
export function sampleTimes(input, startMs, endMs, count, startTimeMs = 0) {
  const data = JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-protocol_whitelist",
      "file,pipe",
      "-select_streams",
      "v:0",
      "-read_intervals",
      `${(startTimeMs + startMs) / 1000}%${(startTimeMs + endMs) / 1000}`,
      "-show_frames",
      "-show_entries",
      "frame=best_effort_timestamp_time",
      "-of",
      "json",
      input,
    ]),
  );
  const times = (data.frames ?? [])
    .map((f) => Number(f.best_effort_timestamp_time) * 1000 - startTimeMs)
    .filter((t) => Number.isFinite(t) && t >= startMs - 0.001 && t < endMs);
  if (!times.length)
    throw error(
      "no_frames",
      "No decodable video frames in this interval; widen the interval.",
    );
  return Array.from({ length: count }, (_, i) => {
    const requestedAtMs = startMs + ((endMs - startMs) * (i + 0.5)) / count;
    const atMs = times.reduce(
      (best, t) =>
        Math.abs(t - requestedAtMs) < Math.abs(best - requestedAtMs) ? t : best,
      times[0],
    );
    return { requestedAtMs, atMs: Math.max(0, atMs) };
  });
}
export function doctor() {
  const tools = Object.fromEntries(
    ["ffmpeg", "ffprobe"].map((name) => {
      try {
        return [
          name,
          { available: true, version: run(name, ["-version"]).split("\n")[0] },
        ];
      } catch (e) {
        return [name, { available: false, error: e.code }];
      }
    }),
  );
  return {
    ready: Object.values(tools).every((t) => t.available),
    tools,
    agentVision: "unverified",
    agentAudio: "unverified",
  };
}
export function frame(input, output, ms) {
  run("ffmpeg", [
    "-v",
    "error",
    "-nostdin",
    "-protocol_whitelist",
    "file,pipe",
    "-ss",
    String(Math.max(0, ms / 1000 - 0.000001)),
    "-i",
    input,
    "-frames:v",
    "1",
    "-vf",
    "scale=640:-2,format=rgb24",
    "-y",
    output,
  ]);
}
export function audio(input, output, start, end) {
  run("ffmpeg", [
    "-v",
    "error",
    "-nostdin",
    "-protocol_whitelist",
    "file,pipe",
    "-ss",
    String(start / 1000),
    "-i",
    input,
    "-t",
    String((end - start) / 1000),
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-y",
    output,
  ]);
}
