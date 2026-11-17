import { describe, expect, it } from "vitest";
import { dueFollowUps, isStage, stats, type App } from "./pipeline";

const mk = (stage: App["stage"], follow_up_on: string | null = null): App => ({
  id: Math.random().toString(), company: "Co", role: "Dev", url: null, location: null,
  stage, applied_on: null, follow_up_on, notes: null, updated_at: "",
});

describe("stats", () => {
  it("computes response and interview rates over submitted applications", () => {
    const s = stats([mk("wishlist"), mk("applied"), mk("applied"), mk("interview"), mk("rejected")]);
    expect(s.submitted).toBe(4);
    expect(s.responseRate).toBe(50);
    expect(s.interviewRate).toBe(25);
  });
  it("handles an empty board", () => expect(stats([]).responseRate).toBe(0));
});

describe("dueFollowUps", () => {
  it("returns overdue active applications, oldest first", () => {
    const due = dueFollowUps([mk("applied", "2026-11-20"), mk("interview", "2026-11-10"), mk("offer", "2026-11-01"), mk("applied", "2026-11-14")], "2026-11-15");
    expect(due.map((a) => a.follow_up_on)).toEqual(["2026-11-10", "2026-11-14"]);
  });
});

it("validates stages", () => {
  expect(isStage("offer")).toBe(true);
  expect(isStage("hacked")).toBe(false);
});

describe("analytics helpers", () => {
  const base = { url: null, location: null, applied_on: null, follow_up_on: null, notes: null, updated_at: "" };
  const mk = (id: string, stage: App["stage"], applied_on: string | null = null): App => ({ ...base, id, company: "C", role: "R", stage, applied_on });

  it("builds a cumulative funnel with conversions", async () => {
    const { funnel } = await import("./pipeline");
    const f = funnel([mk("1", "wishlist"), mk("2", "applied"), mk("3", "rejected"), mk("4", "interview"), mk("5", "offer")]);
    expect(f.map((s) => s.count)).toEqual([5, 4, 2, 1]);
    expect(f[2].conversion).toBe(50);
  });

  it("counts applications per week", async () => {
    const { weeklyApplied } = await import("./pipeline");
    const w = weeklyApplied([mk("1", "applied", "2026-11-16"), mk("2", "applied", "2026-11-12")], "2026-11-17", 2);
    expect(w).toEqual([{ week: "2026-11-09", count: 1 }, { week: "2026-11-16", count: 1 }]);
  });

  it("parses quoted CSV", async () => {
    const { parseCSV } = await import("./pipeline");
    expect(parseCSV('a,"b, c","say ""hi"""\r\n1,2,3\n')).toEqual([["a", "b, c", 'say "hi"'], ["1", "2", "3"]]);
  });
});
