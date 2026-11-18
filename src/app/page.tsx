import { BellRing, CalendarPlus, Check, Clock, MessageSquareReply, Send, Trophy, Users, Video } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { dueFollowUps, stats, upcomingInterviews, type App } from "@/lib/pipeline";
import { Landing } from "@/components/kit/Landing";
import { Stat } from "@/components/kit/Stat";
import { snoozeFollowUp } from "./actions";
import { Board } from "./Board";
import { ImportExport } from "./ImportExport";

export default async function Home() {
  const { supabase, user } = await getUser();
  if (!user) return <Landing />;
  const { data } = await supabase.from("applications").select("*").order("updated_at", { ascending: false });
  const apps = (data ?? []) as App[];
  const s = stats(apps);
  const today = new Date().toISOString().slice(0, 10);
  const due = dueFollowUps(apps, today);
  const interviews = upcomingInterviews(apps);
  const when = (iso: string) =>
    new Date(iso).toLocaleString("en-NG", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Pipeline</p>
        <h1 className="page-title mt-1">Your job search</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Send} label="Applications sent" value={String(s.submitted)} hint={`${s.by.wishlist} on the wishlist`} />
        <Stat icon={MessageSquareReply} label="Response rate" value={`${s.responseRate}%`} />
        <Stat icon={Users} label="Interview rate" value={`${s.interviewRate}%`} />
        <Stat icon={Trophy} label="Offers" value={String(s.by.offer)} />
      </div>
      {due.length > 0 && (
        <section className="card border-amber-200 bg-amber-50/70 p-4" aria-labelledby="due">
          <h2 id="due" className="flex items-center gap-2 text-sm font-semibold text-amber-900"><BellRing size={16} aria-hidden /> Follow up today</h2>
          <ul className="mt-3 grid gap-2">
            {due.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                <span><b>{a.role}</b> at {a.company} <span className="text-stone-500">· due {a.follow_up_on}</span></span>
                <span className="flex gap-1">
                  <form action={snoozeFollowUp.bind(null, a.id, null)}><button className="btn-ghost !py-1 text-xs"><Check size={13} aria-hidden /> Done</button></form>
                  <form action={snoozeFollowUp.bind(null, a.id, 3)}><button className="btn-ghost !py-1 text-xs"><Clock size={13} aria-hidden /> In 3 days</button></form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {interviews.length > 0 && (
        <section className="card border-violet-200 bg-violet-50/60 p-4" aria-labelledby="iv">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="iv" className="flex items-center gap-2 text-sm font-semibold text-violet-900"><Video size={16} aria-hidden /> Upcoming interviews</h2>
            <a href="/interviews/ics" className="btn-ghost !py-1 text-xs"><CalendarPlus size={13} aria-hidden /> Add all to calendar</a>
          </div>
          <ul className="mt-3 grid gap-2">
            {interviews.slice(0, 6).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                <span>
                  <b>{a.role}</b> at {a.company}
                  <span className="text-stone-500" suppressHydrationWarning> · {when(a.interview_at!)}{a.interview_with ? ` · ${a.interview_with}` : ""}</span>
                </span>
                <a href={`/interviews/ics?id=${a.id}`} className="btn-ghost !py-1 text-xs"><CalendarPlus size={13} aria-hidden /> .ics</a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Board apps={apps} today={today} toolbar={<ImportExport />} />
    </div>
  );
}
