import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold">🏆 Hackathon Platform</h1>
      <p className="max-w-md text-neutral-500 dark:text-neutral-400">
        Admin-managed hackathon scoring with live public leaderboards. Open a
        leaderboard via its public link, or sign in to manage hackathons.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Admin
        </Link>
        <ThemeToggle />
      </div>
    </main>
  );
}
