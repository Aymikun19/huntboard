import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "HuntBoard", description: "A kanban board for your job search." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="font-semibold"><span className="text-accent">▤</span> HuntBoard</Link>
            <form action="/auth/signout" method="post"><button className="text-sm text-stone-500">Sign out</button></form>
          </nav>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
