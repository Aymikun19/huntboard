import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/ics";

/** All upcoming interviews (or one, with ?id=) as a calendar file. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  let q = supabase.from("applications").select("id, company, role, url, location, interview_at, interview_with").not("interview_at", "is", null);
  q = id ? q.eq("id", id) : q.gte("interview_at", new Date(Date.now() - 86_400_000).toISOString());
  const { data } = await q.order("interview_at");
  const body = buildIcs(
    (data ?? []).map((a) => ({
      uid: a.id,
      start: new Date(a.interview_at!),
      minutes: 60,
      title: `Interview: ${a.role} at ${a.company}`,
      description: [a.interview_with && `With ${a.interview_with}`, a.url].filter(Boolean).join("\n") || undefined,
      location: a.location ?? undefined,
      url: a.url ?? undefined,
    })),
  );
  return new Response(body, {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${id ? "interview" : "interviews"}.ics"` },
  });
}
