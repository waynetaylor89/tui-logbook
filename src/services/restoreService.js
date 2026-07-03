import { csvRowToMovement, movementDuplicateKey, parseMovementsCsv } from "./csvService.js";
import { validateBackupPayload } from "./jsonBackupService.js";
import { deepMerge } from "./migrationService.js";
import { normalizeMovementEntry } from "../utils/movementTimestamps.js";

const flattenHistory = (history = {}) => Object.values(history || {}).flat();

export const restoreFromJsonBackup = (payload, currentState = {}) => {
  const validation = validateBackupPayload(payload);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const restored = payload.data || {};
  return deepMerge(currentState, restored);
};

export const importMovementsFromCsvText = ({ text, currentHistory = {}, currentUser = "" }) => {
  const rows = parseMovementsCsv(text);
  return importMovementsFromCsvRows({ rows, currentHistory, currentUser });
};

export const importMovementsFromCsvRows = ({ rows, currentHistory = {}, currentUser = "" }) => {
  const existingEntries = flattenHistory(currentHistory);
  const existingKeys = new Set(existingEntries.map((entry) => movementDuplicateKey(entry)));

  const next = { ...currentHistory };
  const imported = [];
  let skippedDuplicates = 0;
  let failed = 0;

  rows.forEach((row) => {
    try {
      const movement = csvRowToMovement(row, currentUser);
      if (!movement.aircraft) {
        failed += 1;
        return;
      }

      const key = movementDuplicateKey(movement);
      if (existingKeys.has(key)) {
        skippedDuplicates += 1;
        return;
      }

      existingKeys.add(key);
      const owner = movement.createdBy || currentUser || "wayne";
      const ownerHistory = next[owner] || [];
      next[owner] = [normalizeMovementEntry(movement), ...ownerHistory];
      imported.push(movement);
    } catch (_error) {
      failed += 1;
    }
  });

  return {
    history: next,
    importedCount: imported.length,
    skippedDuplicates,
    failed,
    imported,
  };
};
