"use client";

import { useActionState, useEffect } from "react";
import { STAGES, STAGE_LABEL, type App } from "@/lib/pipeline";
import { saveApplication } from "./actions";

export function AppForm({ app, onDone, onDelete }: { app?: App; onDone: () => void; onDelete?: () => void }) {
  type S = { error?: string; done?: boolean };
  const [state, action, pending] = useActionState(async (p: S, f: FormData): Promise<S> => {
    const r = await saveApplication(p, f);
    return r.error ? r : { done: true };
  }, {} as S);
  useEffect(() => { if (state.done) onDone(); }, [state, onDone]);

  return (
    <form action={action} className="card grid gap-3 p-6">
      <h2 className="text-lg font-semibold">{app ? "Edit application" : "New application"}</h2>
      <input type="hidden" name="id" value={app?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field"><span>Company</span><input name="company" defaultValue={app?.company} required /></label>
        <label className="field"><span>Role</span><input name="role" defaultValue={app?.role} required /></label>
        <label className="field"><span>Location</span><input name="location" defaultValue={app?.location ?? ""} placeholder="Lagos / Remote" /></label>
        <label className="field"><span>Stage</span>
          <select name="stage" defaultValue={app?.stage ?? "wishlist"}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>
        </label>
      </div>
      <label className="field"><span>Job link</span><input name="url" type="url" defaultValue={app?.url ?? ""} /></label>
      <label className="field"><span>Follow up on</span><input name="follow_up_on" type="date" defaultValue={app?.follow_up_on ?? ""} /></label>
      <label className="field"><span>Notes</span><textarea name="notes" rows={3} defaultValue={app?.notes ?? ""} /></label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-between">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        {onDelete && <button type="button" onClick={onDelete} className="text-sm text-red-600">Delete</button>}
      </div>
    </form>
  );
}
