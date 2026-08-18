"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

interface Subject {
  _id: string;
  name: string;
  slug?: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  subject?: Subject;
  createdAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function NotesContent() {
  const searchParams = useSearchParams();

  const subjectFilter =
    searchParams.get("subject") || "";

  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [openNote, setOpenNote] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        setError("");

        if (!API_URL) {
          throw new Error(
            "NEXT_PUBLIC_API_URL is not configured."
          );
        }

        const response = await fetch(
          `${API_URL}/api/notes`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load notes"
          );
        }

        setNotes(
          Array.isArray(data.notes)
            ? data.notes
            : []
        );
      } catch (error) {
        console.error(
          "Notes loading error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load notes"
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    const text = search
      .toLowerCase()
      .trim();

    return notes.filter((note) => {
      const title =
        note.title?.toLowerCase() || "";

      const content =
        note.content?.toLowerCase() || "";

      const matchesSearch =
        !text ||
        title.includes(text) ||
        content.includes(text);

      if (!subjectFilter) {
        return matchesSearch;
      }

      const matchesSubject =
        note.subject?.slug === subjectFilter ||
        note.subject?._id === subjectFilter;

      return (
        matchesSearch &&
        matchesSubject
      );
    });
  }, [
    notes,
    search,
    subjectFilter,
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* HEADER */}

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
            className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </header>

      {/* MAIN */}

      <section className="mx-auto max-w-5xl px-5 py-10">
        {/* TITLE */}

        <div className="mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-950">
            <FileText size={22} />
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            Study Notes
          </h1>

          <p className="mt-2 text-zinc-500">
            Read notes added by your admin.
          </p>
        </div>

        {/* SEARCH */}

        <div className="relative mb-7">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search notes..."
            className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </div>

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2
                size={20}
                className="animate-spin"
              />

              Loading notes...
            </div>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300">
            <p className="font-medium">
              Unable to load notes
            </p>

            <p className="mt-2 text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredNotes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
              No notes found.
            </div>
          )}

        {/* NOTES */}

        {!loading &&
          !error &&
          filteredNotes.length > 0 && (
            <div className="space-y-4">
              {filteredNotes.map((note) => {
                const isOpen =
                  openNote === note._id;

                return (
                  <article
                    key={note._id}
                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenNote(
                          isOpen
                            ? null
                            : note._id
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-zinc-900"
                    >
                      <div className="min-w-0">
                        <h2 className="font-semibold">
                          {note.title}
                        </h2>

                        {note.subject?.name && (
                          <p className="mt-1 text-xs text-zinc-600">
                            {note.subject.name}
                          </p>
                        )}
                      </div>

                      <ChevronDown
                        size={19}
                        className={`shrink-0 text-zinc-500 transition-transform ${
                          isOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-zinc-800 px-5 py-6">
                        <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                          {note.content}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
      </section>
    </main>
  );
}

function NotesLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="flex items-center gap-3 text-zinc-400">
        <Loader2
          size={20}
          className="animate-spin"
        />

        Loading notes...
      </div>
    </main>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<NotesLoading />}>
      <NotesContent />
    </Suspense>
  );
}