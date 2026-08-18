"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

interface Subject {
  _id: string;
  name: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  subject: Subject;
  isActive: boolean;
  createdAt?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(
    []
  );

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD SUBJECTS
  // ==========================================

  const loadSubjects = async () => {
    try {
      const token = localStorage.getItem(
        "studyflow_admin_token"
      );

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/subjects/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      console.error("Load subjects error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load subjects"
      );
    }
  };

  // ==========================================
  // LOAD NOTES
  // ==========================================

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem(
        "studyflow_admin_token"
      );

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/notes/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(
            "studyflow_admin"
          );

          localStorage.removeItem(
            "studyflow_admin_token"
          );

          window.location.href = "/admin/login";

          return;
        }

        throw new Error(
          data.message || "Failed to load notes"
        );
      }

      setNotes(data.notes || []);
    } catch (error) {
      console.error("Load notes error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load notes"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadSubjects();
    loadNotes();
  }, []);

  // ==========================================
  // CREATE NOTE
  // ==========================================

  const handleCreateNote = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Note title is required");
      return;
    }

    if (!content.trim()) {
      setError("Note content is required");
      return;
    }

    if (!selectedSubject) {
      setError("Please select a subject");
      return;
    }

    try {
      setCreating(true);

      const token = localStorage.getItem(
        "studyflow_admin_token"
      );

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/notes`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            subject: selectedSubject,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create note"
        );
      }

      setSuccess("Note created successfully");

      setTitle("");
      setContent("");
      setSelectedSubject("");

      setShowForm(false);

      await loadNotes();
    } catch (error) {
      console.error("Create note error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create note"
      );
    } finally {
      setCreating(false);
    }
  };

  // ==========================================
  // DELETE NOTE
  // ==========================================

  const handleDeleteNote = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(id);
      setError("");
      setSuccess("");

      const token = localStorage.getItem(
        "studyflow_admin_token"
      );

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/notes/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete note"
        );
      }

      setSuccess("Note deleted successfully");

      await loadNotes();
    } catch (error) {
      console.error("Delete note error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete note"
      );
    } finally {
      setDeleting(null);
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredNotes = notes.filter((note) => {
    const searchText = search
      .toLowerCase()
      .trim();

    return (
      note.title
        .toLowerCase()
        .includes(searchText) ||
      note.content
        .toLowerCase()
        .includes(searchText) ||
      note.subject?.name
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
              <FileText size={19} />
            </div>

            <div>
              <p className="font-semibold">
                StudyFlow
              </p>

              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Admin Panel
              </p>
            </div>
          </Link>

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </header>

      {/* MAIN */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
        {/* HEADING */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400">
              <FileText size={14} />
              Content Management
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Study Notes
            </h1>

            <p className="mt-2 text-sm text-zinc-500 sm:text-base">
              Create and manage study notes for students.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setSuccess("");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            {showForm ? (
              <X size={17} />
            ) : (
              <Plus size={17} />
            )}

            {showForm ? "Close" : "Add Note"}
          </button>
        </div>

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* FORM */}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold">
              Add New Note
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Add a study note and assign it to a subject.
            </p>

            <form
              onSubmit={handleCreateNote}
              className="mt-6 space-y-5"
            >
              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Note Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Introduction to Computer Networks"
                  className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                  required
                />
              </div>

              {/* SUBJECT */}

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Subject
                </label>

                <select
                  value={selectedSubject}
                  onChange={(event) =>
                    setSelectedSubject(
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-white"
                  required
                >
                  <option value="">
                    Select a subject
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject._id}
                      value={subject._id}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>

                {subjects.length === 0 && (
                  <p className="mt-2 text-xs text-amber-500">
                    Create a subject first before adding notes.
                  </p>
                )}
              </div>

              {/* CONTENT */}

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Note Content
                </label>

                <textarea
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  placeholder="Write your study notes here..."
                  rows={10}
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 outline-none placeholder:text-zinc-600 focus:border-white"
                  required
                />
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={
                    creating ||
                    subjects.length === 0
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {creating
                    ? "Creating..."
                    : "Create Note"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setTitle("");
                    setContent("");
                    setSelectedSubject("");
                  }}
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SEARCH */}

        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search notes..."
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <Loader2
                size={20}
                className="animate-spin"
              />

              Loading notes...
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* EMPTY */

          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
              <FileText
                size={25}
                className="text-zinc-500"
              />
            </div>

            <h2 className="text-lg font-semibold">
              {search
                ? "No notes found"
                : "No notes yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              {search
                ? "Try searching with a different keyword."
                : 'You haven\'t created any notes yet. Click "Add Note" to create your first study note.'}
            </p>

            {!search && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                <Plus size={17} />
                Add First Note
              </button>
            )}
          </div>
        ) : (
          /* NOTES */

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
                    <FileText size={21} />
                  </div>

                  <button
                    onClick={() =>
                      handleDeleteNote(note._id)
                    }
                    disabled={
                      deleting === note._id
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-red-900 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
                    title="Delete note"
                  >
                    {deleting === note._id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <BookOpen
                    size={14}
                    className="text-zinc-500"
                  />

                  <span className="text-xs text-zinc-500">
                    {note.subject?.name ||
                      "Unknown Subject"}
                  </span>
                </div>

                <h3 className="font-semibold">
                  {note.title}
                </h3>

                <p className="mt-2 line-clamp-4 text-sm leading-6 text-zinc-500">
                  {note.content}
                </p>

                <div className="mt-4">
                  <span className="rounded-full border border-emerald-900 bg-emerald-950/40 px-2.5 py-1 text-[11px] text-emerald-400">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}