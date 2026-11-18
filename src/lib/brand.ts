import { BellRing, ChartNoAxesCombined, FileDown, KanbanSquare, Video, Search } from "lucide-react";

export const brand = {
  name: "HuntBoard",
  short: "Job application tracker",
  eyebrow: "For internship and job seekers",
  tagline: "Run your job search like a pipeline.",
  description:
    "Track every application on a drag-and-drop board, get nudged when it is time to follow up and see exactly where your pipeline leaks.",
  cta: { href: "/login?mode=signup", label: "Build your board" },
  proof: ["Drag and drop", "Follow-up reminders", "Funnel analytics"],
  features: [
    { icon: KanbanSquare, title: "Kanban board", text: "Drag applications from Wishlist to Applied, Interview and Offer." },
    { icon: BellRing, title: "Follow-up reminders", text: "Set a follow-up date and the board tells you who to chase today." },
    { icon: ChartNoAxesCombined, title: "Funnel analytics", text: "Response, interview and offer rates, plus applications sent per week." },
    { icon: Search, title: "Search and filter", text: "Find any role or company instantly, or filter the board to one stage." },
    { icon: Video, title: "Interview scheduler", text: "Log interview times and who you are meeting, see what is coming up, and add them to Google or Apple Calendar." },
    { icon: FileDown, title: "Export to CSV", text: "Download your whole pipeline as a spreadsheet." },
  ],
  steps: [
    ["Add applications", "Paste the role, company and link for each job you want."],
    ["Move them along", "Drag cards as you apply, interview and hear back."],
    ["Learn from the funnel", "See your response and interview rates, then adjust."],
  ] as [string, string][],
  closing: "Every offer starts with a well-run pipeline.",
  nav: [
    { href: "/", label: "Board" },
    { href: "/insights", label: "Insights" },
  ] as { href: string; label: string; public?: boolean }[],
  width: "max-w-7xl",
  repo: "https://github.com/Aymikun19/huntboard",
  preview: "/preview.webp" as string | null,
};
