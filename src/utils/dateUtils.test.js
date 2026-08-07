import { describe, expect, it } from "vitest";
import { getAircraftTypeCountdowns, getCountdownStatus } from "./dateUtils.js";

describe("getCountdownStatus", () => {
  it("marks entries older than 30 days as expired", () => {
    const now = new Date("2026-07-31T12:00:00Z").getTime();
    const timestamp = new Date("2026-06-30T12:00:00Z").getTime();

    const result = getCountdownStatus(timestamp, now);

    expect(result.days).toBe(31);
    expect(result.isExpired).toBe(true);
  });

  it("keeps recent entries active", () => {
    const now = new Date("2026-07-31T12:00:00Z").getTime();
    const timestamp = new Date("2026-07-20T12:00:00Z").getTime();

    const result = getCountdownStatus(timestamp, now);

    expect(result.days).toBe(11);
    expect(result.isExpired).toBe(false);
  });

  it("derives per-aircraft countdowns from aircraft history", () => {
    const now = new Date("2026-07-31T12:00:00Z").getTime();
    const history = {
      alice: [
        { aircraft: "G-ABC - Boeing 737-800", createdAt: "2026-07-31T12:00:00Z" },
        { aircraft: "G-XYZ - Boeing 787-9 Dreamliner", createdAt: "2026-07-31T12:00:00Z" },
      ],
    };

    const result = getAircraftTypeCountdowns(history, now);
    const section800 = result.find((section) => section.key === "787-800");
    const section900 = result.find((section) => section.key === "787-900");

    expect(section800?.days).toBe(0);
    expect(section900?.days).toBe(0);
  });

  it("parses european movement date and time when createdAt is missing", () => {
    const now = new Date("2026-08-07T12:00:00Z").getTime();
    const history = {
      alice: [
        {
          aircraft: "G-ABC - Boeing 737-800",
          movementDate: "21/06/2026",
          movementTime: "15.19",
        },
      ],
    };

    const result = getAircraftTypeCountdowns(history, now);
    const section737 = result.find((section) => section.key === "737");

    expect(section737?.days).toBeGreaterThan(0);
    expect(section737?.lastEntryLabel?.startsWith("21/06/2026")).toBe(true);
  });
});
