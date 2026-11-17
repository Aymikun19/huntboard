import { Building2, CalendarRange, Hourglass, MessageSquareReply } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { daysBetween, funnel, STAGE_LABEL, STAGES, stats, weeklyApplied, type App } from "@/lib/pipeline";
import { BarChart } from "@/components/kit/Charts";
import { EmptyState, Stat } from "@/components/kit/Stat";

export const metadata = { title: "Insights" };

const top = (xs: (string | null)[], n = 5) => {
  const m = new Map<string, number>();
  for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
};

export default async function Insights() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("applications").select("*");
  const apps = (data ?? []) as App[];
  const today = new Date().toISOString().slice(0, 10);
  if (!apps.length) return <EmptyState icon={CalendarRange} title="No data yet" text="Add a few applications on the board and your insights appear here." />;

  const s = stats(apps);
  const f = funnel(apps);
  const weekly = weeklyApplied(apps, today);
  const waiting = apps.filter((a) => a.stage === "applied" && a.applied_on).map((a) => daysBetween(a.applied_on!, today));
  const avgWait = waiting.length ? Math.round(waiting.reduce((x, y) => x + y, 0) / waiting.length) : 0;
  const fmt = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="grid gap-8">
      <div>
        <p className="eyebrow">Insights</p>
        <h1 className="page-title mt-1">How your search is going</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={CalendarRange} label="This week" value={String(weekly[weekly.length - 1].count)} hint="Applications sent" />
        <Stat icon={Hourglass} label="Average wait" value={`${avgWait} days`} hint="Applied, no reply yet" />
        <Stat icon={Building2} label="Companies" value={String(new Set(apps.map((a) => a.company.toLowerCase())).size)} />
        <Stat icon={MessageSquareReply} label="Response rate" value={`${s.responseRate}%`} />
      </div>

      <section className="card p-6" aria-labelledby="funnel">
        <h2 id="funnel" className="font-semibold">Funnel</h2>
        <p className="mt-1 text-sm text-stone-500">How many applications reached each stage, and the conversion from the stage before.</p>
        <ol className="mt-6 grid gap-3">
          {f.map((st) => (
            <li key={st.stage} className="grid grid-cols-[110px_1fr_90px] items-center gap-4 text-sm">
              <span className="font-medium">{STAGE_LABEL[st.stage]}</span>
              <span className="h-8 rounded-lg bg-stone-100">
                <span className="flex h-full items-center rounded-lg bg-accent px-3 text-xs font-semibold text-white" style={{ width: `${Math.max(6, (st.count / f[0].count) * 100)}%` }}>{st.count}</span>
              </span>
              <span className="text-right text-stone-500">{st.conversion === null ? "" : `${st.conversion}%`}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="weekly">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 id="weekly" className="font-semibold">Applications per week</h2>
            <span className="text-xs text-stone-500">Last 10 weeks</span>
          </div>
          <BarChart label="Applications per week" height={150} data={weekly.map((w) => ({ label: fmt(w.week), value: w.count, hint: `Week of ${fmt(w.week)}: ${w.count}` }))} />
        </section>
        <section className="card p-6" aria-labelledby="stages">
          <h2 id="stages" className="mb-5 font-semibold">Where everything is now</h2>
          <ul className="grid gap-3">
            {STAGES.map((st) => (
              <li key={st} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-sm">
                <span>{STAGE_LABEL[st]}</span>
                <span className="h-2.5 rounded-full bg-stone-100"><span className="block h-full rounded-full bg-accent/70" style={{ width: `${(s.by[st] / apps.length) * 100}%` }} /></span>
                <span className="text-right tabular-nums text-stone-600">{s.by[st]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[["Top companies", top(apps.map((a) => a.company))], ["Top locations", top(apps.map((a) => a.location))]].map(([title, rows]) => (
          <section key={title as string} className="card p-6">
            <h2 className="mb-4 font-semibold">{title as string}</h2>
            <ul className="grid gap-2 text-sm">
              {(rows as [string, number][]).map(([k, v]) => (
                <li key={k} className="flex justify-between border-b border-stone-100 pb-2 last:border-0"><span>{k}</span><span className="text-stone-500">{v}</span></li>
              ))}
              {(rows as [string, number][]).length === 0 && <li className="text-stone-500">No data yet</li>}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
