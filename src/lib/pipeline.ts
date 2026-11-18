export const STAGES = ["wishlist", "applied", "interview", "offer", "rejected"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export type App = {
  id: string; company: string; role: string; url: string | null; location: string | null;
  stage: Stage; applied_on: string | null; follow_up_on: string | null; notes: string | null; updated_at: string;
  interview_at?: string | null; interview_with?: string | null;
};

/** Pipeline metrics. Response rate = applications that got any reply (interview, offer or rejection). */
export function stats(apps: App[]) {
  const by = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const a of apps) by[a.stage]++;
  const submitted = apps.length - by.wishlist;
  const responded = by.interview + by.offer + by.rejected;
  return {
    by,
    submitted,
    responseRate: submitted ? Math.round((responded / submitted) * 100) : 0,
    interviewRate: submitted ? Math.round(((by.interview + by.offer) / submitted) * 100) : 0,
  };
}

/** Follow-ups due today or overdue, for active applications only. */
export function dueFollowUps(apps: App[], today: string) {
  return apps
    .filter((a) => a.follow_up_on && a.follow_up_on <= today && (a.stage === "applied" || a.stage === "interview"))
    .sort((a, b) => a.follow_up_on!.localeCompare(b.follow_up_on!));
}

export const isStage = (s: unknown): s is Stage => STAGES.includes(s as Stage);

/** Cumulative funnel: everyone who reached a stage or a later one. Rejections count as applied. */
export function funnel(apps: App[]) {
  const reached = (s: Stage) =>
    apps.filter((a) => {
      if (s === "wishlist") return true;
      if (s === "applied") return a.stage !== "wishlist";
      if (s === "interview") return a.stage === "interview" || a.stage === "offer";
      return a.stage === "offer";
    }).length;
  const steps = (["wishlist", "applied", "interview", "offer"] as Stage[]).map((s) => ({ stage: s, count: reached(s) }));
  return steps.map((st, i) => ({ ...st, conversion: i === 0 || !steps[i - 1].count ? null : Math.round((st.count / steps[i - 1].count) * 100) }));
}

const mondayOf = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
};

/** Applications sent per week for the last `n` weeks (oldest first). */
export function weeklyApplied(apps: App[], today: string, n = 10) {
  const end = mondayOf(today);
  const weeks = Array.from({ length: n }, (_, i) => {
    const d = new Date(end + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 7 * (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const counts = new Map(weeks.map((w) => [w, 0]));
  for (const a of apps) {
    if (!a.applied_on) continue;
    const w = mondayOf(a.applied_on);
    if (counts.has(w)) counts.set(w, counts.get(w)! + 1);
  }
  return weeks.map((w) => ({ week: w, count: counts.get(w)! }));
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86_400_000);
}

/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

export const CSV_HEADER = ["Company", "Role", "Stage", "Location", "Link", "Applied on", "Follow up on", "Notes"];

/** Interviews from now on (and any in the last 2 hours), soonest first. */
export function upcomingInterviews(apps: App[], now = new Date()): App[] {
  const from = now.getTime() - 2 * 3_600_000;
  return apps
    .filter((a) => a.interview_at && new Date(a.interview_at).getTime() >= from)
    .sort((a, b) => a.interview_at!.localeCompare(b.interview_at!));
}
