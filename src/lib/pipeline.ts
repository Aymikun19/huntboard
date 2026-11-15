export const STAGES = ["wishlist", "applied", "interview", "offer", "rejected"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interviewing",
  offer: "Offer 🎉",
  rejected: "Rejected",
};

export type App = {
  id: string; company: string; role: string; url: string | null; location: string | null;
  stage: Stage; applied_on: string | null; follow_up_on: string | null; notes: string | null; updated_at: string;
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
