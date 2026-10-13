import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
export const error = (code, message) =>
  Object.assign(new Error(message), { code });
export function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
      .join(",")}}`;
  return JSON.stringify(v);
}
export const digest = (v) =>
  createHash("sha256")
    .update(typeof v === "string" ? v : canonical(v))
    .digest("hex");
export async function hashFile(file) {
  const h = createHash("sha256");
  for await (const b of createReadStream(file)) h.update(b);
  return h.digest("hex");
}
export async function json(file) {
  if ((await fs.stat(file)).size > 16 * 1024 * 1024)
    throw error(
      "input_too_large",
      "JSON input exceeds 16 MiB; split the analysis.",
    );
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (e) {
    throw error("invalid_json", `${path.basename(file)}: ${e.message}`);
  }
}
export async function exists(file) {
  try {
    await fs.lstat(file);
    return true;
  } catch (e) {
    if (e.code === "ENOENT") return false;
    throw e;
  }
}
export function id(value, prefix) {
  if (
    typeof value !== "string" ||
    !new RegExp(`^${prefix}-[a-f0-9]{64}$`).test(value)
  )
    throw error("invalid_id", `Invalid ${prefix} identifier`);
  return value;
}
// Generated project paths must never escape or follow symlinks to another project.
export async function safe(root, relative) {
  if (
    typeof relative !== "string" ||
    path.isAbsolute(relative) ||
    relative.split(/[\\/]/).includes("..")
  )
    throw error("invalid_path", "Expected a project-relative path");
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep))
    throw error("invalid_path", "Path escapes project");
  let cursor = root;
  for (const part of path
    .relative(root, target)
    .split(path.sep)
    .filter(Boolean)) {
    cursor = path.join(cursor, part);
    try {
      if ((await fs.lstat(cursor)).isSymbolicLink())
        throw error("unsafe_symlink", `Project path is a symlink: ${relative}`);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
  return target;
}
export async function writeJSON(
  root,
  relative,
  value,
  { exclusive = false } = {},
) {
  const file = await safe(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (exclusive) {
    await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", {
      flag: "wx",
    });
    return;
  }
  const temp = file + `.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, JSON.stringify(value, null, 2) + "\n", {
      flag: "wx",
    });
    await fs.rename(temp, file);
  } finally {
    await fs.rm(temp, { force: true });
  }
}
export async function project(dir) {
  if (!dir)
    throw error(
      "project_required",
      "Pass --project <directory>; there is no global library.",
    );
  const root = await fs.realpath(path.resolve(dir));
  const meta = await json(await safe(root, "project.json"));
  if (meta.schemaVersion !== 1 || meta.kind !== "video-reference")
    throw error("invalid_project", "Unsupported project manifest");
  return root;
}
export async function locked(root, fn) {
  const lock = await safe(root, ".write-lock");
  try {
    await fs.mkdir(lock);
  } catch (e) {
    if (e.code === "EEXIST")
      throw error(
        "project_busy",
        "Another writer or interrupted run holds .write-lock. Inspect the writer before removing a stale lock.",
      );
    throw e;
  }
  try {
    await fs.writeFile(
      path.join(lock, "owner.json"),
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
    );
    return await fn();
  } finally {
    await fs.rm(lock, { recursive: true, force: true });
  }
}
export async function reference(root, ref) {
  id(ref, "v");
  const r = await json(await safe(root, `references/${ref}/source.json`));
  if (r.id !== ref || r.schemaVersion !== 1 || ref !== `v-${r.sha256}`)
    throw error("integrity_error", "Reference identity mismatch");
  return r;
}
export async function sourcePath(root, r) {
  const file = await safe(root, r.file);
  if ((await hashFile(file)) !== r.sha256)
    throw error("integrity_error", `Original changed: ${r.id}`);
  return file;
}
export async function revision(root, ref, rev) {
  if (!rev)
    rev = (
      await json(await safe(root, `references/${id(ref, "v")}/current.json`))
    ).revision;
  id(rev, "r");
  const a = await json(
    await safe(root, `references/${id(ref, "v")}/revisions/${rev}.json`),
  );
  if (`r-${digest(a)}` !== rev || a.referenceId !== ref)
    throw error("integrity_error", "Analysis revision digest mismatch");
  return { revision: rev, analysis: a };
}
export async function list(root, relative) {
  const dir = await safe(root, relative);
  if (!(await exists(dir))) return [];
  return (await fs.readdir(dir)).sort();
}
