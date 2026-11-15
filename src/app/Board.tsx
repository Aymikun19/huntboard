"use client";

import { useOptimistic, useState, useTransition } from "react";
import { DndContext, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { STAGES, STAGE_LABEL, type App, type Stage } from "@/lib/pipeline";
import { deleteApplication, moveApplication } from "./actions";
import { AppForm } from "./AppForm";

export function Board({ apps }: { apps: App[] }) {
  const [optimistic, move] = useOptimistic(apps, (state, { id, stage }: { id: string; stage: Stage }) =>
    state.map((a) => (a.id === id ? { ...a, stage } : a)),
  );
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<App | "new" | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }));

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
      <div className="flex justify-end">
        <button className="btn" onClick={() => setEditing("new")}>+ Add application</button>
      </div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-3 overflow-x-auto pb-4 md:grid-cols-5">
          {STAGES.map((stage) => (
            <Column key={stage} stage={stage} apps={optimistic.filter((a) => a.stage === stage)} onOpen={setEditing} />
          ))}
        </div>
      </DndContext>
      {editing && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/30 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <AppForm app={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} onDelete={editing !== "new" ? async () => { await deleteApplication(editing.id); setEditing(null); } : undefined} />
          </div>
        </div>
      )}
    </>
  );
}

function Column({ stage, apps, onOpen }: { stage: Stage; apps: App[]; onOpen: (a: App) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section ref={setNodeRef} className={`min-h-[60vh] min-w-[220px] rounded-2xl p-2 transition ${isOver ? "bg-accent/10" : "bg-stone-100"}`}>
      <h2 className="flex items-center justify-between px-2 py-1 text-sm font-semibold">
        {STAGE_LABEL[stage]} <span className="badge">{apps.length}</span>
      </h2>
      <div className="mt-2 grid gap-2">
        {apps.map((a) => <Card key={a.id} app={a} onOpen={() => onOpen(a)} />)}
      </div>
    </section>
  );
}

function Card({ app, onOpen }: { app: App; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  const overdue = app.follow_up_on && app.follow_up_on <= new Date().toISOString().slice(0, 10);
  return (
    <article ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onOpen}
      className={`card cursor-grab p-3 text-sm active:cursor-grabbing ${isDragging ? "z-10 shadow-lg ring-2 ring-accent" : ""}`}>
      <p className="font-semibold">{app.role}</p>
      <p className="text-stone-600">{app.company}</p>
      {app.location && <p className="text-xs text-stone-400">{app.location}</p>}
      {app.follow_up_on && <p className={`mt-1 text-xs ${overdue ? "font-medium text-amber-600" : "text-stone-400"}`}>Follow up {app.follow_up_on}</p>}
    </article>
  );
}
