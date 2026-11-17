"use client";

import { Download, Upload, X } from "lucide-react";
import { useActionState, useRef } from "react";
import { importCSV } from "./actions";

export function ImportExport() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(importCSV, {} as { error?: string; imported?: number });
  return (
    <>
      <a href="/export" className="btn-outline"><Download size={15} aria-hidden /> Export</a>
      <button type="button" className="btn-outline" onClick={() => dialog.current?.showModal()}><Upload size={15} aria-hidden /> Import</button>
      <dialog ref={dialog} className="m-auto w-[min(520px,calc(100vw-2rem))] rounded-2xl p-0 shadow-2xl backdrop:bg-stone-900/40">
        <form action={action} className="grid gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Import applications from CSV</h2>
            <button type="button" className="btn-ghost !p-2" aria-label="Close" onClick={() => dialog.current?.close()}><X size={16} aria-hidden /></button>
          </div>
          <p className="text-sm text-stone-600">
            Columns: <span className="font-mono text-xs">Company, Role</span> (required) and optionally{" "}
            <span className="font-mono text-xs">Stage, Location, Link, Applied on, Follow up on, Notes</span>. Dates as YYYY-MM-DD. A file from Export works as a template.
          </p>
          <input type="file" name="file" accept=".csv,text/csv" className="input" aria-label="CSV file" />
          {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
          {state.imported && <p role="status" className="text-sm text-emerald-700">Imported {state.imported} applications.</p>}
          <button className="btn justify-self-start" disabled={pending}><Upload size={15} aria-hidden /> {pending ? "Importing…" : "Import"}</button>
        </form>
      </dialog>
    </>
  );
}
