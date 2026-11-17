import { createClient } from "@/lib/supabase/server";
import { csvResponse } from "@/lib/csv";
import { CSV_HEADER, STAGE_LABEL, type App } from "@/lib/pipeline";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });
  const { data } = await supabase.from("applications").select("*").order("created_at");
  const rows = ((data ?? []) as App[]).map((a) => [a.company, a.role, STAGE_LABEL[a.stage], a.location, a.url, a.applied_on, a.follow_up_on, a.notes]);
  return csvResponse("huntboard.csv", [CSV_HEADER, ...rows]);
}
