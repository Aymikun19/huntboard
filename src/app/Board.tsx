"use client";

import { CalendarClock, ExternalLink, MapPin, Plus, Search, Video } from "lucide-react";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { DndContext, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { daysBetween, STAGES, STAGE_LABEL, type App, type Stage } from "@/lib/pipeline";
import { deleteApplication, moveApplication } from "./actions";
import { AppForm } from "./AppForm";

const DOT: Record<Stage, string> = {
  wishlist: "bg-stone-400",
  applied: "bg-blue-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-red-400",
};

export function Board({ apps, today, toolbar }: { apps: App[]; today: string; toolbar?: React.ReactNode }) {
  const [optimistic, move] = useOptimistic(apps, (state, { id, stage }: { id: string; stage: Stage }) =>
    state.map((a) => (a.id === id ? { ...a, stage } : a)),
  );
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<App | "new" | null>(null);
  const [q, setQ] = useState("");
  const [hideRejected, setHideRejected] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    return optimistic.filter((a) => !t || `${a.company} ${a.role} ${a.location ?? ""} ${a.notes ?? ""}`.toLowerCase().includes(t));
  }, [optimistic, q]);
  const stages = hideRejected ? STAGES.filter((s) => s !== "rejected") : STAGES;

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const stage = e.over?.id as Stage | undefined;
    if (!stage || optimistic.find((a) => a.id === id)?.stage === stage) return;
    startTransition(async () => {
      move({ id, stage });
      await moveApplication(id, stage);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <span className="sr-only">Search applications</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company, role, notes" className="input !w-64 !py-2 pl-9" />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={hideRejected} onChange={(e) => setHideRejected(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            Hide rejected
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {toolbar}
          <button className="btn" onClick={() => setEditing("new")}><Plus size={16} aria-hidden /> Add application</button>
        </div>
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className={`grid gap-3 overflow-x-auto pb-4 ${hideRejected ? "md:grid-cols-4" : "md:grid-cols-5"}`}>
          {stages.map((stage) => (
            <Column key={stage} stage={stage} apps={visible.filter((a) => a.stage === stage)} onOpen={setEditing} today={today} />
          ))}
        </div>
      </DndContext>
      {editing && (
        <div className="fixed inset-0 z-40 flex justify-end bg-stone-900/30" onClick={() => setEditing(null)}>
          <div role="dialog" aria-modal="true" aria-label="Application details" className="h-full w-full max-w-md bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <AppForm
              key={editing === "new" ? "new" : editing.id}
              app={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
              onDelete={editing !== "new" ? async () => { await deleteApplication(editing.id); setEditing(null); } : undefined}
            />
          </div>
        </div>
      )}
    </>
  );
}

function Column({ stage, apps, onOpen, today }: { stage: Stage; apps: App[]; onOpen: (a: App) => void; today: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section ref={setNodeRef} aria-label={STAGE_LABEL[stage]} className={`min-h-[60vh] min-w-[230px] rounded-2xl border p-2 transition ${isOver ? "border-accent bg-accent/5" : "border-transparent bg-stone-100/80"}`}>
      <h2 className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold">
        <span className="flex items-center gap-2"><span className={`size-2 rounded-full ${DOT[stage]}`} aria-hidden /> {STAGE_LABEL[stage]}</span>
        <span className="badge !bg-white">{apps.length}</span>
      </h2>
      <div className="mt-2 grid gap-2">
        {apps.map((a) => <Card key={a.id} app={a} onOpen={() => onOpen(a)} today={today} />)}
        {apps.length === 0 && <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-xs text-stone-400">Drop cards here</p>}
      </div>
    </section>
  );
}

function Card({ app, onOpen, today }: { app: App; onOpen: () => void; today: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  const overdue = app.follow_up_on && app.follow_up_on <= today;
  const age = app.applied_on ? daysBetween(app.applied_on, today) : null;
  return (
    <article ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onOpen}
      className={`card grid cursor-grab gap-1 p-3 text-sm transition hover:border-stone-300 active:cursor-grabbing ${isDragging ? "z-10 rotate-1 shadow-xl ring-2 ring-accent" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">{app.role}</p>
        {app.url && (
          <a href={app.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 text-stone-400 hover:text-accent" aria-label={`Open the ${app.role} posting`}>
            <ExternalLink size={14} aria-hidden />
          </a>
        )}
      </div>
      <p className="text-stone-600">{app.company}</p>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-400">
        {app.location && <span className="inline-flex items-center gap-1"><MapPin size={11} aria-hidden /> {app.location}</span>}
        {age !== null && app.stage !== "wishlist" && <span>{age === 0 ? "Applied today" : `${age}d ago`}</span>}
      </div>
      {app.interview_at && app.interview_at.slice(0, 10) >= today && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-700" suppressHydrationWarning>
          <Video size={12} aria-hidden /> Interview {new Date(app.interview_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
        </p>
      )}
      {app.follow_up_on && (
        <p className={`mt-1 inline-flex items-center gap-1 text-xs ${overdue ? "font-medium text-amber-700" : "text-stone-500"}`}>
          <CalendarClock size={12} aria-hidden /> Follow up {app.follow_up_on}
        </p>
      )}
    </article>
  );
}
