export type JsonDiffType = "added" | "removed" | "modified";

export type JsonDiffEntry = {
  path: string;
  type: JsonDiffType;
  before: unknown;
  after: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pathFor(parent: string, key: string): string {
  return parent ? `${parent}.${key}` : key;
}

function arrayPathFor(parent: string, index: number): string {
  return `${parent}[${index}]`;
}

function pushDiff(diffs: JsonDiffEntry[], path: string, type: JsonDiffType, before: unknown, after: unknown) {
  diffs.push({ path: path || "root", type, before, after });
}

function walkDiff(diffs: JsonDiffEntry[], beforeValue: unknown, afterValue: unknown, currentPath: string) {
  if (beforeValue === afterValue) {
    return;
  }

  const beforeIsArray = Array.isArray(beforeValue);
  const afterIsArray = Array.isArray(afterValue);
  if (beforeIsArray && afterIsArray) {
    const beforeArray = beforeValue as unknown[];
    const afterArray = afterValue as unknown[];
    const maxLength = Math.max(beforeArray.length, afterArray.length);

    for (let index = 0; index < maxLength; index += 1) {
      const hasBefore = index < beforeArray.length;
      const hasAfter = index < afterArray.length;
      const nextPath = arrayPathFor(currentPath || "root", index);

      if (hasBefore && !hasAfter) {
        pushDiff(diffs, nextPath, "removed", beforeArray[index], undefined);
        continue;
      }

      if (!hasBefore && hasAfter) {
        pushDiff(diffs, nextPath, "added", undefined, afterArray[index]);
        continue;
      }

      walkDiff(diffs, beforeArray[index], afterArray[index], nextPath);
    }

    return;
  }

  if (isPlainObject(beforeValue) && isPlainObject(afterValue)) {
    const keys = new Set<string>([
      ...Object.keys(beforeValue),
      ...Object.keys(afterValue),
    ]);

    for (const key of keys) {
      const hasBefore = Object.prototype.hasOwnProperty.call(beforeValue, key);
      const hasAfter = Object.prototype.hasOwnProperty.call(afterValue, key);
      const nextPath = pathFor(currentPath, key);

      if (hasBefore && !hasAfter) {
        pushDiff(diffs, nextPath, "removed", beforeValue[key], undefined);
        continue;
      }

      if (!hasBefore && hasAfter) {
        pushDiff(diffs, nextPath, "added", undefined, afterValue[key]);
        continue;
      }

      walkDiff(diffs, beforeValue[key], afterValue[key], nextPath);
    }

    return;
  }

  if (beforeValue === undefined && afterValue !== undefined) {
    pushDiff(diffs, currentPath || "root", "added", beforeValue, afterValue);
    return;
  }

  if (beforeValue !== undefined && afterValue === undefined) {
    pushDiff(diffs, currentPath || "root", "removed", beforeValue, afterValue);
    return;
  }

  pushDiff(diffs, currentPath || "root", "modified", beforeValue, afterValue);
}

export function diffJson(beforeValue: unknown, afterValue: unknown): JsonDiffEntry[] {
  const diffs: JsonDiffEntry[] = [];
  walkDiff(diffs, beforeValue, afterValue, "");
  return diffs;
}

export function formatDiffValue(value: unknown): string {
  if (value === undefined) {
    return "(empty)";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
