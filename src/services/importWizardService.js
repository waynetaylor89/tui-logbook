import { csvRowToMovement, movementDuplicateKey, parseMovementsCsv } from "./csvService.js";
import { validateBackupPayload } from "./jsonBackupService.js";

const flattenHistory = (history = {}) => Object.values(history || {}).flat();

export const analyzeImportFile = async ({ file, currentHistory, currentUser }) => {
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".json")) {
    const text = await file.text();
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

  if (name.endsWith(".csv")) {
    const text = await file.text();
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

  throw new Error("Unsupported file type. Please use CSV or JSON.");
};
