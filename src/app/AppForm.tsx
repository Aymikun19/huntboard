"use client";

import { Save, Trash2, X } from "lucide-react";
import { useActionState, useEffect } from "react";
import { STAGES, STAGE_LABEL, type App } from "@/lib/pipeline";
import { saveApplication } from "./actions";
import { isoToLagosLocal } from "@/lib/ics";

export function AppForm({ app, onDone, onDelete }: { app?: App; onDone: () => void; onDelete?: () => void }) {
  type S = { error?: string; done?: boolean };
  const [state, action, pending] = useActionState(async (p: S, f: FormData): Promise<S> => {
    const r = await saveApplication(p, f);
    return r.error ? r : { done: true };
  }, {} as S);
  useEffect(() => { if (state.done) onDone(); }, [state, onDone]);

  return (
    <form action={action} className="grid h-full content-start gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{app ? "Application details" : "New application"}</h2>
        <button type="button" className="btn-ghost !p-2" aria-label="Close" onClick={onDone}><X size={16} aria-hidden /></button>
      </div>
      <input type="hidden" name="id" value={app?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Company</span><input name="company" defaultValue={app?.company} required autoFocus /></label>
        <label className="field"><span>Role</span><input name="role" defaultValue={app?.role} required /></label>
        <label className="field"><span>Location</span><input name="location" defaultValue={app?.location ?? ""} placeholder="Lagos / Remote" /></label>
        <label className="field"><span>Stage</span>
          <select name="stage" defaultValue={app?.stage ?? "wishlist"}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>
        </label>
      </div>
      <label className="field"><span>Job link</span><input name="url" type="url" defaultValue={app?.url ?? ""} placeholder="https://" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Follow up on</span><input name="follow_up_on" type="date" defaultValue={app?.follow_up_on ?? ""} /></label>
        <label className="field"><span>Interview <span className="font-normal text-stone-500">(Lagos time)</span></span><input name="interview_at" type="datetime-local" defaultValue={isoToLagosLocal(app?.interview_at ?? null)} /></label>
      </div>
      <label className="field"><span>Interviewer or format</span><input name="interview_with" defaultValue={app?.interview_with ?? ""} placeholder="e.g. Ada (Eng Manager), Google Meet" /></label>
      <label className="field"><span>Notes</span><textarea name="notes" rows={6} defaultValue={app?.notes ?? ""} placeholder="Recruiter name, salary range, interview prep…" /></label>
      {app?.applied_on && <p className="text-xs text-stone-500">Applied on {app.applied_on}</p>}
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <div className="flex items-center justify-between gap-2 border-t border-stone-100 pt-4">
        <button className="btn" disabled={pending}><Save size={15} aria-hidden /> {pending ? "Saving…" : "Save"}</button>
        {onDelete && (
          <button type="button" onClick={() => { if (confirm("Delete this application?")) onDelete(); }} className="btn-ghost text-red-600 hover:!bg-red-50 hover:!text-red-700">
            <Trash2 size={15} aria-hidden /> Delete
          </button>
        )}
      </div>
    </form>
  );
}
