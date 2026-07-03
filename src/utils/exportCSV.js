import { downloadCsv, exportMovementsToCsv, getCsvFilename } from "../services/csvService.js";

export const exportLogbookCSV = (history = []) => {
  const csv = exportMovementsToCsv(history);
  const filename = getCsvFilename(new Date());
  downloadCsv(csv, filename);
};