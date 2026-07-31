// src/utils/dateUtils.js
export function isExpired(date) {
  return date.toUTCString() < new Date().toUTCString();
}

export function getCountdownStatus(lastEntryTimestamp, now = Date.now()) {
  if (!lastEntryTimestamp) {
    return { days: 0, isExpired: false };
  }

  const totalSeconds = Math.max(0, Math.floor((now - lastEntryTimestamp) / 1000));
  const days = Math.floor(totalSeconds / 86400);

  return {
    days,
    isExpired: days > 30,
  };
}

function getEntryTimestamp(entry = {}) {
  const candidates = [entry.createdAt, entry.updatedAt, entry.timestamp, entry.date];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") continue;

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    const parsed = new Date(candidate).getTime();
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function getAircraftTypeCountdowns(history, now = Date.now()) {
  const entries = Array.isArray(history)
    ? history
    : Object.values(history || {}).flat();

  const categories = [
    {
      key: "737",
      label: "737",
      matcher: (entry = {}) => /737/i.test(`${entry.aircraft || ""} ${entry.aircraftType || ""}`) && !/787/i.test(`${entry.aircraft || ""} ${entry.aircraftType || ""}`),
    },
    {
      key: "787-800",
      label: "787-800",
      matcher: (entry = {}) => /787(?:[-\s]?8|[-\s]?800)|787-8/i.test(`${entry.aircraft || ""} ${entry.aircraftType || ""}`),
    },
    {
      key: "787-900",
      label: "787-900",
      matcher: (entry = {}) => /787(?:[-\s]?9|[-\s]?900)|787-9/i.test(`${entry.aircraft || ""} ${entry.aircraftType || ""}`),
    },
  ];

  return categories.map((category) => {
    const matchingEntries = entries.filter((entry) => category.matcher(entry));
    const latestTimestamp = matchingEntries.reduce((latest, entry) => {
      const timestamp = getEntryTimestamp(entry);
      if (!timestamp) return latest;
      return latest === null || timestamp > latest ? timestamp : latest;
    }, null);

    const countdown = getCountdownStatus(latestTimestamp, now);

    return {
      ...category,
      ...countdown,
      lastEntryLabel: latestTimestamp ? new Date(latestTimestamp).toLocaleString() : null,
    };
  });
}
