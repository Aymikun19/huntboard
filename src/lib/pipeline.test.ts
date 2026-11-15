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
