export const DEFAULT_MISSING_MOVEMENT_DATE = "01.01.2026";

const padDatePart = (value) => String(value).padStart(2, "0");

const normalizeTimeValue = (timeValue = "") => {
  const rawTime = String(timeValue || "").trim();
  const dottedTime = rawTime.replace(/\./g, ":");
  const match = dottedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return rawTime;
  return `${padDatePart(match[1])}:${match[2]}:${match[3] || "00"}`;
};

const parseDateParts = (dateValue, fallbackYear = new Date().getFullYear()) => {
  const rawDate = String(dateValue || "").trim();
  if (!rawDate) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [year, month, day] = rawDate.split("-").map(Number);
    return { year, month, day };
  }

  const separatedMatch = rawDate.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2}|\d{4}))?$/);
  if (!separatedMatch) return null;

  const day = Number(separatedMatch[1]);
  const month = Number(separatedMatch[2]);
  let year = fallbackYear;

  if (separatedMatch[3]) {
    year = separatedMatch[3].length === 2 ? 2000 + Number(separatedMatch[3]) : Number(separatedMatch[3]);
  }

  return { year, month, day };
};

const buildDateFromParts = (parts, timeValue = "") => {
  if (!parts) return null;

  const normalizedTime = normalizeTimeValue(timeValue);
  const timeMatch = normalizedTime.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;
  const seconds = timeMatch ? Number(timeMatch[3]) : 0;

  const parsed = new Date(parts.year, parts.month - 1, parts.day, hours, minutes, seconds);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const parseMovementDateTime = (dateValue, timeValue = "", fallbackYear) => {
  const parts = parseDateParts(dateValue, fallbackYear);
  const parsed = buildDateFromParts(parts, timeValue);
  if (!parsed || !parts) return null;

  return {
    timestamp: parsed.getTime(),
    isoDate: `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`,
    isoDateTime: parsed.toISOString(),
    displayDate: `${padDatePart(parts.day)}.${padDatePart(parts.month)}.${parts.year}`,
    normalizedTime: normalizeTimeValue(timeValue),
  };
};

export const getEntryMovementDate = (entry = {}) => String(entry.movementDate || entry.date || "").trim();

export const getEntryMovementTime = (entry = {}) => String(entry.movementTime || entry.time || "").trim();

export const getEntryCreatedAtTimestamp = (entry = {}) => {
  const createdAt = String(entry.createdAt || "").trim();
  if (createdAt) {
    const timestamp = new Date(createdAt).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }

  const parsed = parseMovementDateTime(getEntryMovementDate(entry), getEntryMovementTime(entry));
  return parsed?.timestamp ?? null;
};

export const getEntryCreatedAtDateKey = (entry = {}) => {
  const createdAt = String(entry.createdAt || "").trim();
  if (createdAt) {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${padDatePart(parsed.getMonth() + 1)}-${padDatePart(parsed.getDate())}`;
    }
  }

  const movementParsed = parseMovementDateTime(getEntryMovementDate(entry), getEntryMovementTime(entry));
  return movementParsed?.isoDate ?? "";
};

export const normalizeMovementEntry = (entry = {}, options = {}) => {
  const normalizedMovementDate = getEntryMovementDate(entry);
  const normalizedMovementTime = getEntryMovementTime(entry);

  let createdAt = String(entry.createdAt || "").trim();
  let updatedAt = String(entry.updatedAt || "").trim();
  let missingTimestamp = Boolean(entry.missingTimestamp);

  if (!createdAt) {
    const fromMovement = parseMovementDateTime(normalizedMovementDate, normalizedMovementTime, options.fallbackYear);
    if (fromMovement) {
      createdAt = fromMovement.isoDateTime;
    } else if (options.defaultCreatedAt) {
      createdAt = options.defaultCreatedAt;
    } else {
      missingTimestamp = true;
    }
  }

  if (!updatedAt && createdAt) {
    updatedAt = createdAt;
  }

  return {
    ...entry,
    movementDate: normalizedMovementDate,
    movementTime: normalizedMovementTime,
    date: normalizedMovementDate,
    time: normalizedMovementTime,
    createdAt,
    updatedAt,
    missingTimestamp,
  };
};

export const normalizeMovementHistory = (history = {}, options = {}) => {
  if (!history || typeof history !== "object") return {};

  return Object.fromEntries(
    Object.entries(history).map(([owner, entries]) => [
      owner,
      Array.isArray(entries)
        ? entries.map((entry) => normalizeMovementEntry(entry, options))
        : [],
    ])
  );
};