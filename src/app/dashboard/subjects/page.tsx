"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  Loader2,
  Trophy,
} from "lucide-react";

interface Subject {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/subjects`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load subjects"
          );
        }

        setSubjects(data.subjects || []);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load subjects"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
              <BookOpen size={19} />
            </div>

            <span className="font-semibold">
              StudyFlow
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8">
          <p className="text-sm text-zinc-500">
            StudyFlow Learning
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Subjects
          </h1>

          <p className="mt-2 text-zinc-500">
            Choose a subject and start your preparation.
          </p>
        </div>

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading subjects...
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          subjects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
              <BookOpen
                size={32}
                className="mx-auto text-zinc-600"
              />

              <h2 className="mt-4 text-lg font-semibold">
                No subjects available
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Admin has not added any active subjects yet.
              </p>
            </div>
          )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const subjectKey =
              subject.slug || subject._id;

            return (
              <div
                key={subject._id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:-translate-y-1 hover:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-950">
                    <BookOpen size={22} />
                  </div>

                  <ArrowRight
                    size={19}
                    className="text-zinc-600"
                  />
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  {subject.name}
                </h2>

                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">
                  {subject.description ||
                    "Start learning this subject."}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <Link
                    href={`/dashboard/notes?subject=${encodeURIComponent(
                      subjectKey
                    )}`}
                    className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800 p-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <FileText size={17} />
                    Notes
                  </Link>

                  <Link
                    href={`/dashboard/mcqs?subject=${encodeURIComponent(
                      subjectKey
                    )}`}
                    className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800 p-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Brain size={17} />
                    MCQs
                  </Link>

                  <Link
                    href={`/dashboard/mock-tests?subject=${encodeURIComponent(
                      subjectKey
                    )}`}
                    className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800 p-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <Trophy size={17} />
                    Tests
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}