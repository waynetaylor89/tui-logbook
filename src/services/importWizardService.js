import { csvRowToMovement, movementDuplicateKey, parseMovementsCsv } from "./csvService.js";
import { validateBackupPayload } from "./jsonBackupService.js";

const flattenHistory = (history = {}) => Object.values(history || {}).flat();

const isJsonLike = (fileName = "", fileType = "", text = "") => {
  const normalizedName = String(fileName).toLowerCase();
  const normalizedType = String(fileType).toLowerCase();
  const trimmed = String(text).trim();

  return (
    normalizedName.endsWith(".json") ||
    normalizedType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  );
};

const isDelimitedTextLike = (fileName = "", fileType = "", text = "") => {
  const normalizedName = String(fileName).toLowerCase();
  const normalizedType = String(fileType).toLowerCase();
  const firstLine = String(text).split(/\r?\n/, 1)[0]?.trim() || "";

  return (
    normalizedName.endsWith(".csv") ||
    normalizedName.endsWith(".txt") ||
    normalizedType.includes("text/csv") ||
    normalizedType.includes("text/plain") ||
    normalizedType.includes("application/vnd.ms-excel") ||
    firstLine.includes(",")
  );
};

export const analyzeImportFile = async ({ file, currentHistory, currentUser }) => {
  const name = String(file?.name || "");
  const type = String(file?.type || "");
  const text = await file.text();

  if (isJsonLike(name, type, text)) {
    const parsed = JSON.parse(text);
    const validation = validateBackupPayload(parsed);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const rows = flattenHistory(parsed.data?.history || {});
    return {
      type: "json",
      rows,
      found: rows.length,
      newCount: rows.length,
      duplicateCount: 0,
      parsed,
    };
  }

  if (isDelimitedTextLike(name, type, text)) {
    const rows = parseMovementsCsv(text);
    const existingKeys = new Set(flattenHistory(currentHistory).map((entry) => movementDuplicateKey(entry)));

    let duplicateCount = 0;
    let newCount = 0;

    rows.forEach((row) => {
      const movement = csvRowToMovement(row, currentUser);
      const key = movementDuplicateKey(movement);
      if (existingKeys.has(key)) {
        duplicateCount += 1;
      } else {
        newCount += 1;
      }
    });

    return {
      type: "csv",
      rows,
      found: rows.length,
      newCount,
      duplicateCount,
      parsed: null,
    };
  }

  throw new Error("Unsupported file type. Please use CSV, TXT, or JSON.");
};
