const CSV_COLUMNS = [
  "UUID",
  "Flight Number",
  "Registration",
  "Aircraft",
  "Aircraft Type",
  "Airline",
  "Movement Type",
  "From Stand",
  "To Stand",
  "Date",
  "Time",
  "Created Date",
  "Modified Date",
  "Operator",
  "Team Leader",
  "Shift",
  "Notes",
  "Delay Reason",
  "Status",
  "Defect Details",
  "Hold Net Checked",
  "Photos Count",
];

const escapeCsvValue = (value) => {
  const normalized = value === null || value === undefined ? "" : String(value);
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseRegistration = (entry = {}) => {
  if (entry.registration) return String(entry.registration).trim();
  const aircraft = String(entry.aircraft || "");
  if (!aircraft) return "";
  return aircraft.split(" - ")[0]?.trim() || "";
};

const parseAircraftType = (entry = {}) => {
  if (entry.aircraftType) return String(entry.aircraftType).trim();
  const aircraft = String(entry.aircraft || "");
  const parts = aircraft.split(" - ");
  return parts[1]?.trim() || "";
};

export const movementDuplicateKey = (entry = {}) => {
  const registration = parseRegistration(entry).toUpperCase();
  const movementType = String(entry.movementType || "").trim().toUpperCase();
  const date = String(entry.date || "").trim();
  const time = String(entry.time || "").trim();
  const fromStand = String(entry.fromStand || "").trim().toUpperCase();
  const toStand = String(entry.toStand || "").trim().toUpperCase();
  return [registration, movementType, date, time, fromStand, toStand].join("|");
};

export const movementToCsvRecord = (entry = {}) => ({
  "UUID": entry.id || "",
  "Flight Number": entry.flightNumber || "",
  "Registration": parseRegistration(entry),
  "Aircraft": entry.aircraft || "",
  "Aircraft Type": parseAircraftType(entry),
  "Airline": entry.airline || "",
  "Movement Type": entry.movementType || "",
  "From Stand": entry.fromStand || "",
  "To Stand": entry.toStand || "",
  "Date": entry.date || "",
  "Time": entry.time || "",
  "Created Date": entry.createdAt || "",
  "Modified Date": entry.updatedAt || "",
  "Operator": entry.createdBy || "",
  "Team Leader": entry.teamLeader || "",
  "Shift": entry.shift || "",
  "Notes": entry.notes || "",
  "Delay Reason": entry.delayReason || "",
  "Status": entry.status || "",
  "Defect Details": entry.defectDetails || "",
  "Hold Net Checked": String(Boolean(entry.holdNetChecked || false)),
  "Photos Count": String(entry.photosCount || 0),
});

export const exportMovementsToCsv = (movements = []) => {
  const rows = [
    CSV_COLUMNS.join(","),
    ...movements.map((movement) => {
      const record = movementToCsvRecord(movement);
      return CSV_COLUMNS.map((column) => escapeCsvValue(record[column])).join(",");
    }),
  ];

  return rows.join("\n");
};

export const downloadCsv = (csvContent, filename) => {
  const csvWithBom = `\uFEFF${csvContent}`;
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const parseMovementsCsv = (text = "") => {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
};

export const csvRowToMovement = (row = {}, currentUser = "") => {
  const aircraft = String(row["Aircraft"] || row["aircraft"] || "").trim();
  const movementType = String(row["Movement Type"] || row["movementType"] || "Tow").trim();
  const fromStand = String(row["From Stand"] || row["fromStand"] || "").trim().toUpperCase();
  const toStand = String(row["To Stand"] || row["toStand"] || "").trim().toUpperCase();
  const date = String(row["Date"] || row["date"] || "").trim();
  const time = String(row["Time"] || row["time"] || "").trim();

  return {
    id: String(row["UUID"] || row.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    flightNumber: String(row["Flight Number"] || row.flightNumber || "").trim(),
    registration: String(row["Registration"] || row.registration || "").trim(),
    aircraft,
    aircraftType: String(row["Aircraft Type"] || row.aircraftType || "").trim(),
    airline: String(row["Airline"] || row.airline || "").trim(),
    movementType,
    fromStand,
    toStand,
    date,
    time,
    createdAt: String(row["Created Date"] || row.createdAt || "").trim(),
    updatedAt: String(row["Modified Date"] || row.updatedAt || "").trim(),
    createdBy: String(row["Operator"] || row.createdBy || currentUser || "").trim(),
    teamLeader: String(row["Team Leader"] || row.teamLeader || "").trim(),
    shift: String(row["Shift"] || row.shift || "").trim(),
    notes: String(row["Notes"] || row.notes || "").trim(),
    delayReason: String(row["Delay Reason"] || row.delayReason || "").trim(),
    status: String(row["Status"] || row.status || "").trim(),
    defectDetails: String(row["Defect Details"] || row.defectDetails || "").trim(),
    holdNetChecked: String(row["Hold Net Checked"] || row.holdNetChecked || "").toLowerCase() === "true",
    photosCount: Number(row["Photos Count"] || row.photosCount || 0),
  };
};

export const getCsvFilename = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `TUI_Logbook_${y}-${m}-${d}.csv`;
};

export { CSV_COLUMNS };
