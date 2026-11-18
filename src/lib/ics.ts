/** Minimal iCalendar (RFC 5545) builder for interview reminders. */
export type IcsEvent = { uid: string; start: Date; minutes: number; title: string; description?: string; location?: string; url?: string };

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Lines longer than 75 octets are folded with CRLF + space. */
const fold = (line: string) => line.match(/.{1,74}/g)!.join("\r\n ");

export function buildIcs(events: IcsEvent[], now = new Date()): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HuntBoard//Interviews//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of events) {
    const end = new Date(e.start.getTime() + e.minutes * 60_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@huntboard`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(e.start)}`,
      `DTEND:${stamp(end)}`,
      fold(`SUMMARY:${esc(e.title)}`),
      ...(e.description ? [fold(`DESCRIPTION:${esc(e.description)}`)] : []),
      ...(e.location ? [fold(`LOCATION:${esc(e.location)}`)] : []),
      ...(e.url ? [fold(`URL:${e.url}`)] : []),
      "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Interview in one hour", "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** "2026-11-20T10:30" typed in Lagos (UTC+1, no DST) to an ISO instant. */
export function lagosLocalToIso(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+01:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO instant to the value a datetime-local input expects, in Lagos time. */
export function isoToLagosLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 16);
}
