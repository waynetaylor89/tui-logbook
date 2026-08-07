// src/utils/dateUtils.js
import { getEntryCreatedAtTimestamp } from "./movementTimestamps.js";

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
  const normalizedTimestamp = getEntryCreatedAtTimestamp(entry);
  if (Number.isFinite(normalizedTimestamp)) {
    return normalizedTimestamp;
  }

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

function formatLastEntryLabel(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
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
      lastEntryTimestamp: latestTimestamp,
      lastEntryLabel: latestTimestamp ? formatLastEntryLabel(latestTimestamp) : null,
    };
  });
}
