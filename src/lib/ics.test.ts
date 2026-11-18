import { describe, expect, it } from "vitest";
import { buildIcs, isoToLagosLocal, lagosLocalToIso } from "./ics";

describe("ics", () => {
  it("builds a valid event with CRLF and escaping", () => {
    const out = buildIcs([{ uid: "a1", start: new Date("2026-11-20T09:30:00Z"), minutes: 45, title: "Interview: Dev, Acme; Ltd" }], new Date("2026-11-18T00:00:00Z"));
    expect(out).toContain("DTSTART:20261120T093000Z\r\n");
    expect(out).toContain("DTEND:20261120T101500Z\r\n");
    expect(out).toContain("SUMMARY:Interview: Dev\\, Acme\; Ltd");
    expect(out.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  });
  it("folds long lines", () => {
    const out = buildIcs([{ uid: "b", start: new Date(), minutes: 30, title: "x".repeat(200) }]);
    expect(out.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
  it("round-trips Lagos local time", () => {
    expect(lagosLocalToIso("2026-11-20T10:30")).toBe("2026-11-20T09:30:00.000Z");
    expect(isoToLagosLocal("2026-11-20T09:30:00.000Z")).toBe("2026-11-20T10:30");
    expect(lagosLocalToIso("nope")).toBeNull();
  });
});
