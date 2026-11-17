"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { isStage, STAGES } from "@/lib/pipeline";

const schema = z.object({
  company: z.string().trim().min(1),
  role: z.string().trim().min(1),
  url: z.union([z.url(), z.literal("")]).optional(),
  location: z.string().trim().optional(),
  stage: z.enum(STAGES).default("wishlist"),
  follow_up_on: z.string().optional(),
  notes: z.string().optional(),
});

export async function saveApplication(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const row = {
    ...parsed.data,
    url: parsed.data.url || null,
    follow_up_on: parsed.data.follow_up_on || null,
    notes: parsed.data.notes || null,
  };
  const id = String(form.get("id") || "");
  const { error } = id ? await supabase.from("applications").update(row).eq("id", id) : await supabase.from("applications").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/");
  return {};
}

export async function moveApplication(id: string, stage: string) {
  if (!isStage(stage)) return;
  const { supabase } = await requireUser();
  await supabase.from("applications").update({ stage }).eq("id", id);
  revalidatePath("/");
}

export async function deleteApplication(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("applications").delete().eq("id", id);
  revalidatePath("/");
}

/** Mark a follow-up done (clear it) or push it back by `days`. */
export async function snoozeFollowUp(id: string, days: number | null) {
  const { supabase } = await requireUser();
  let next: string | null = null;
  if (days) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + days);
    next = d.toISOString().slice(0, 10);
  }
  await supabase.from("applications").update({ follow_up_on: next }).eq("id", id);
  revalidatePath("/");
}

export async function importCSV(_prev: { error?: string; imported?: number }, form: FormData): Promise<{ error?: string; imported?: number }> {
  const { supabase } = await requireUser();
  const file = form.get("file");
  const text = file instanceof File && file.size ? await file.text() : String(form.get("text") || "");
  if (!text.trim()) return { error: "Choose a CSV file first." };
  if (text.length > 500_000) return { error: "That file is too large (500 KB max)." };
  const { parseCSV, isStage } = await import("@/lib/pipeline");
  const [header, ...rows] = parseCSV(text);
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  const ic = col("company");
  const ir = col("role");
  if (ic < 0 || ir < 0) return { error: "The CSV needs at least Company and Role columns." };
  const get = (r: string[], name: string) => {
    const i = col(name);
    return i >= 0 ? r[i]?.trim() || null : null;
  };
  const date = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const records = rows
    .filter((r) => r[ic]?.trim() && r[ir]?.trim())
    .slice(0, 500)
    .map((r) => {
      const stage = (get(r, "stage") ?? "wishlist").toLowerCase();
      const url = get(r, "link");
      return {
        company: r[ic].trim(),
        role: r[ir].trim(),
        stage: isStage(stage) ? stage : stage.startsWith("interview") ? "interview" : "wishlist",
        location: get(r, "location"),
        url: url && /^https?:\/\//.test(url) ? url : null,
        applied_on: date(get(r, "applied on")),
        follow_up_on: date(get(r, "follow up on")),
        notes: get(r, "notes"),
      };
    });
  if (!records.length) return { error: "No rows with a company and role were found." };
  const { error } = await supabase.from("applications").insert(records);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/insights");
  return { imported: records.length };
}
