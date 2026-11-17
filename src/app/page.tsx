import { BellRing, Check, Clock, MessageSquareReply, Send, Trophy, Users } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { dueFollowUps, stats, type App } from "@/lib/pipeline";
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
      <Board apps={apps} today={today} toolbar={<ImportExport />} />
    </div>
  );
}
