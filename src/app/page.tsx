import Link from "next/link";
import {
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  Trophy,
} from "lucide-react";

const features = [
  {
    title: "Study Notes",
    description: "Learn from organized topic-wise notes.",
    icon: FileText,
  },
  {
    title: "MCQ Practice",
    description: "Practice questions and improve your accuracy.",
    icon: Brain,
  },
  {
    title: "Mock Tests",
    description: "Attempt timed tests and check your performance.",
    icon: Trophy,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
              <GraduationCap size={20} />
            </div>

            <span className="font-semibold">StudyFlow</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:pt-28">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400">
            <BookOpen size={14} />
            Learn • Practice • Improve
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Your simple way to
            <span className="block text-zinc-400">
              study smarter.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            StudyFlow brings notes, MCQ practice and mock tests
            together in one clean learning platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:-translate-y-1 hover:border-zinc-700"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
                  <Icon size={21} />
                </div>

                <h2 className="font-semibold">
                  {feature.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-5 py-6 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} StudyFlow. All rights reserved.
      </footer>
    </main>
  );
}