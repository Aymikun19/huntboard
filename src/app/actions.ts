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
