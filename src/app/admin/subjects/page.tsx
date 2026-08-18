"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

interface Subject {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD SUBJECTS
  // ==========================================

  const loadSubjects = async () => {
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
        `${API_URL}/api/subjects/all`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("studyflow_admin");
          localStorage.removeItem("studyflow_admin_token");

          window.location.href = "/admin/login";
          return;
        }

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
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadSubjects();
  }, []);

  // ==========================================
  // CREATE SUBJECT
  // ==========================================

  const handleCreateSubject = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Subject name is required");
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
        `${API_URL}/api/subjects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("studyflow_admin");
          localStorage.removeItem("studyflow_admin_token");

          window.location.href = "/admin/login";
          return;
        }

        throw new Error(
          data.message || "Failed to create subject"
        );
      }

      setSuccess("Subject created successfully");

      setName("");
      setDescription("");

      setShowForm(false);

      await loadSubjects();
    } catch (error) {
      console.error("Create subject error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create subject"
      );
    } finally {
      setCreating(false);
    }
  };

  // ==========================================
  // DELETE SUBJECT
  // ==========================================

  const handleDeleteSubject = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
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
        `${API_URL}/api/subjects/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("studyflow_admin");
          localStorage.removeItem("studyflow_admin_token");

          window.location.href = "/admin/login";
          return;
        }

        throw new Error(
          data.message || "Failed to delete subject"
        );
      }

      setSuccess("Subject deleted successfully");

      await loadSubjects();
    } catch (error) {
      console.error("Delete subject error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete subject"
      );
    } finally {
      setDeleting(null);
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredSubjects = subjects.filter((subject) => {
    const searchText = search.toLowerCase().trim();

    return (
      subject.name.toLowerCase().includes(searchText) ||
      subject.description
        .toLowerCase()
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
              <BookOpen size={19} />
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
              <BookOpen size={14} />
              Content Management
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Subjects
            </h1>

            <p className="mt-2 text-sm text-zinc-500 sm:text-base">
              Create and manage subjects for your students.
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

            {showForm ? "Close" : "Add Subject"}
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

        {/* ADD FORM */}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold">
              Add New Subject
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Enter the subject details below.
            </p>

            <form
              onSubmit={handleCreateSubject}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Subject Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Computer Science"
                  className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Enter subject description"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={creating}
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
                    : "Create Subject"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setName("");
                    setDescription("");
                  }}
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 hover:bg-zinc-800"
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
              placeholder="Search subjects..."
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

              Loading subjects...
            </div>
          </div>
        ) : filteredSubjects.length === 0 ? (
          /* EMPTY */

          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
              <BookOpen
                size={25}
                className="text-zinc-500"
              />
            </div>

            <h2 className="text-lg font-semibold">
              {search
                ? "No subjects found"
                : "No subjects yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              {search
                ? "Try searching with a different subject name."
                : 'You haven\'t created any subjects yet. Click "Add Subject" to create your first subject.'}
            </p>

            {!search && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                <Plus size={17} />
                Add First Subject
              </button>
            )}
          </div>
        ) : (
          /* SUBJECT LIST */

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <div
                key={subject._id}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
                    <BookOpen size={21} />
                  </div>

                  <button
                    onClick={() =>
                      handleDeleteSubject(subject._id)
                    }
                    disabled={
                      deleting === subject._id
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-red-900 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
                    title="Delete subject"
                  >
                    {deleting === subject._id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>

                <h3 className="font-semibold">
                  {subject.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {subject.description ||
                    "No description available."}
                </p>

                <div className="mt-4 flex items-center gap-2">
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