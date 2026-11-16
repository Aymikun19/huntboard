import { BellRing } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { dueFollowUps, stats, type App } from "@/lib/pipeline";
import { Board } from "./Board";

export default async function Home() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("applications").select("*").order("updated_at", { ascending: false });
  const apps = (data ?? []) as App[];
  const s = stats(apps);
  const today = new Date().toISOString().slice(0, 10);
  const due = dueFollowUps(apps, today);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Applications sent" value={String(s.submitted)} />
        <Stat label="Response rate" value={`${s.responseRate}%`} />
        <Stat label="Interview rate" value={`${s.interviewRate}%`} />
        <Stat label="Offers" value={String(s.by.offer)} />
      </div>
      {due.length > 0 && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm">
          <BellRing size={16} className="mr-1.5 inline align-text-bottom" aria-hidden /><b>Follow up today:</b> {due.map((a) => `${a.role} @ ${a.company}`).join(" · ")}
        </div>
      )}
      <Board apps={apps} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
