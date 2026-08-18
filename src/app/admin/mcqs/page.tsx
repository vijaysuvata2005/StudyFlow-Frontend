"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Brain,
  Check,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface Subject {
  _id: string;
  name: string;
}

interface MCQSubject {
  _id: string;
  name: string;
  slug?: string;
}

interface MCQ {
  _id: string;
  subject: string | MCQSubject;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  isActive: boolean;
}

interface MCQForm {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const createEmptyMCQ = (): MCQForm => ({
  id: crypto.randomUUID(),
  subject: "",
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  explanation: "",
});

export default function AdminMCQsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);

  const [forms, setForms] = useState<MCQForm[]>([
    createEmptyMCQ(),
  ]);

  const [showForm, setShowForm] = useState(true);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("studyflow_admin_token");
  };

  /* ============================================================
     LOAD DATA
  ============================================================ */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const [subjectsResponse, mcqsResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/subjects/all`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/api/mcqs/all`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const subjectsData = await subjectsResponse.json();
      const mcqsData = await mcqsResponse.json();

      if (!subjectsResponse.ok) {
        throw new Error(
          subjectsData.message || "Failed to load subjects"
        );
      }

      if (!mcqsResponse.ok) {
        throw new Error(
          mcqsData.message || "Failed to load MCQs"
        );
      }

      setSubjects(subjectsData.subjects || []);
      setMcqs(mcqsData.mcqs || []);
    } catch (err) {
      console.error("Load MCQ data error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ============================================================
     FORM UPDATE
  ============================================================ */

  const updateForm = (
    formId: string,
    field: keyof MCQForm,
    value: string
  ) => {
    setForms((currentForms) =>
      currentForms.map((form) => {
        if (form.id !== formId) {
          return form;
        }

        return {
          ...form,
          [field]: value,
        };
      })
    );
  };

  const updateOption = (
    formId: string,
    optionIndex: number,
    value: string
  ) => {
    setForms((currentForms) =>
      currentForms.map((form) => {
        if (form.id !== formId) {
          return form;
        }

        const updatedOptions = [...form.options];

        updatedOptions[optionIndex] = value;

        return {
          ...form,
          options: updatedOptions,
        };
      })
    );
  };

  const selectCorrectAnswer = (
    formId: string,
    optionIndex: number
  ) => {
    setForms((currentForms) =>
      currentForms.map((form) => {
        if (form.id !== formId) {
          return form;
        }

        return {
          ...form,
          correctAnswer: optionIndex + 1,
        };
      })
    );
  };

  /* ============================================================
     ADD ANOTHER MCQ
  ============================================================ */

  const addAnotherMCQ = () => {
    setError("");
    setMessage("");

    const newMCQ = createEmptyMCQ();

    setForms((currentForms) => [
      ...currentForms,
      newMCQ,
    ]);

    // Form ko visible rakho
    setShowForm(true);

    // Browser ko naye MCQ card ke paas le jao
    setTimeout(() => {
      const element = document.getElementById(
        `mcq-form-${newMCQ.id}`
      );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 50);
  };

  /* ============================================================
     REMOVE FORM
  ============================================================ */

  const removeForm = (formId: string) => {
    setForms((currentForms) => {
      if (currentForms.length === 1) {
        return [createEmptyMCQ()];
      }

      return currentForms.filter(
        (form) => form.id !== formId
      );
    });

    setError("");
    setMessage("");
  };

  /* ============================================================
     VALIDATE
  ============================================================ */

  const validateForms = () => {
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];

      if (!form.subject) {
        return `MCQ ${i + 1}: Please select a subject`;
      }

      if (!form.question.trim()) {
        return `MCQ ${i + 1}: Question is required`;
      }

      if (
        !Array.isArray(form.options) ||
        form.options.length !== 4
      ) {
        return `MCQ ${i + 1}: Exactly 4 options are required`;
      }

      if (
        form.options.some(
          (option) => !option.trim()
        )
      ) {
        return `MCQ ${i + 1}: All 4 options are required`;
      }

      const uniqueOptions = new Set(
        form.options.map((option) =>
          option.trim().toLowerCase()
        )
      );

      if (uniqueOptions.size !== 4) {
        return `MCQ ${i + 1}: Options must be different`;
      }

      if (
        !form.correctAnswer ||
        form.correctAnswer < 1 ||
        form.correctAnswer > 4
      ) {
        return `MCQ ${i + 1}: Please select the correct answer`;
      }
    }

    return null;
  };

  /* ============================================================
     CREATE MCQS
  ============================================================ */

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const validationError = validateForms();

    if (validationError) {
      setError(validationError);

      // Error wale MCQ tak automatically scroll
      const match =
        validationError.match(/MCQ (\d+)/);

      if (match) {
        const index = Number(match[1]) - 1;
        const form = forms[index];

        if (form) {
          setTimeout(() => {
            document
              .getElementById(`mcq-form-${form.id}`)
              ?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
          }, 50);
        }
      }

      return;
    }

    try {
      setCreating(true);

      const token = getToken();

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/mcqs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mcqs: forms.map((form) => ({
              subject: form.subject,

              question: form.question.trim(),

              options: form.options.map((option) =>
                option.trim()
              ),

              correctAnswer: form.correctAnswer,

              explanation: form.explanation.trim(),
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create MCQs"
        );
      }

      setMessage(
        `${data.count || forms.length} MCQ(s) created successfully`
      );

      // Creation ke baad ek fresh empty form
      setForms([createEmptyMCQ()]);

      await loadData();
    } catch (err) {
      console.error("Create MCQs error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create MCQs"
      );
    } finally {
      setCreating(false);
    }
  };

  /* ============================================================
     DELETE MCQ
  ============================================================ */

  const deleteMCQ = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this MCQ?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const token = getToken();

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/mcqs/${id}`,
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
          data.message || "Failed to delete MCQ"
        );
      }

      setMcqs((current) =>
        current.filter((mcq) => mcq._id !== id)
      );

      setMessage("MCQ deleted successfully");
    } catch (err) {
      console.error("Delete MCQ error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete MCQ"
      );
    }
  };

  /* ============================================================
     SUBJECT NAME
  ============================================================ */

  const getSubjectName = (
    subject: string | MCQSubject
  ) => {
    if (typeof subject === "string") {
      const foundSubject = subjects.find(
        (item) => item._id === subject
      );

      return foundSubject?.name || subject;
    }

    return subject?.name || "";
  };

  /* ============================================================
     FILTER
  ============================================================ */

  const filteredMCQs = mcqs.filter((mcq) => {
    const searchText = search.toLowerCase();

    const subjectName = getSubjectName(
      mcq.subject
    );

    return (
      mcq.question
        .toLowerCase()
        .includes(searchText) ||
      subjectName
        .toLowerCase()
        .includes(searchText)
    );
  });

  /* ============================================================
     UI
  ============================================================ */

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
              <Brain size={19} />
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
              <Brain size={14} />
              Content Management
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              MCQ Questions
            </h1>

            <p className="mt-2 text-sm text-zinc-500 sm:text-base">
              Create, edit and manage your practice
              questions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setMessage("");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            <Plus size={17} />

            {showForm ? "Hide Form" : "Add MCQs"}
          </button>
        </div>

        {/* MESSAGES */}

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            <Check size={17} />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            <X size={17} />
            {error}
          </div>
        )}

        {/* CREATE MCQ FORM */}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-10"
          >
            {/* IMPORTANT:
                Every form has a unique ID and key.
                Isse Add Another MCQ properly render hoga.
            */}

            <div className="space-y-6">
              {forms.map((form, index) => (
                <div
                  id={`mcq-form-${form.id}`}
                  key={form.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
                >
                  {/* CARD HEADER */}

                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500">
                        New MCQ
                      </p>

                      <h2 className="mt-1 text-lg font-semibold">
                        Question {index + 1}
                      </h2>
                    </div>

                    {forms.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeForm(form.id)
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-red-900 hover:bg-red-950/30 hover:text-red-400"
                        title="Remove this MCQ"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* SUBJECT */}

                  <div className="mb-5">
                    <label className="mb-2 block text-sm text-zinc-300">
                      Subject
                    </label>

                    <select
                      value={form.subject}
                      onChange={(event) =>
                        updateForm(
                          form.id,
                          "subject",
                          event.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm outline-none focus:border-white"
                    >
                      <option value="">
                        Select Subject
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
                  </div>

                  {/* QUESTION */}

                  <div className="mb-5">
                    <label className="mb-2 block text-sm text-zinc-300">
                      Question
                    </label>

                    <textarea
                      value={form.question}
                      onChange={(event) =>
                        updateForm(
                          form.id,
                          "question",
                          event.target.value
                        )
                      }
                      placeholder="Enter MCQ question..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                    />
                  </div>

                  {/* OPTIONS */}

                  <div className="mb-5">
                    <label className="mb-3 block text-sm text-zinc-300">
                      Options
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {form.options.map(
                        (option, optionIndex) => {
                          const optionNumber =
                            optionIndex + 1;

                          const isCorrect =
                            form.correctAnswer ===
                            optionNumber;

                          return (
                            <div
                              key={`${form.id}-option-${optionIndex}`}
                              className={`rounded-xl border p-3 transition ${
                                isCorrect
                                  ? "border-emerald-700 bg-emerald-950/20"
                                  : "border-zinc-800 bg-zinc-950"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-zinc-400">
                                  {String.fromCharCode(
                                    65 + optionIndex
                                  )}
                                </span>

                                <input
                                  type="text"
                                  value={option}
                                  onChange={(event) =>
                                    updateOption(
                                      form.id,
                                      optionIndex,
                                      event.target.value
                                    )
                                  }
                                  placeholder={`Option ${
                                    optionIndex + 1
                                  }`}
                                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    selectCorrectAnswer(
                                      form.id,
                                      optionIndex
                                    )
                                  }
                                  disabled={!option.trim()}
                                  title="Mark as correct answer"
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                                    isCorrect
                                      ? "border-emerald-700 bg-emerald-600 text-white"
                                      : "border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300"
                                  }`}
                                >
                                  <Check size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <p className="mt-2 text-xs text-zinc-600">
                      Green check = correct answer
                    </p>
                  </div>

                  {/* EXPLANATION */}

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      Explanation{" "}
                      <span className="text-zinc-600">
                        (Optional)
                      </span>
                    </label>

                    <textarea
                      value={form.explanation}
                      onChange={(event) =>
                        updateForm(
                          form.id,
                          "explanation",
                          event.target.value
                        )
                      }
                      placeholder="Explain why this answer is correct..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* FORM ACTIONS */}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={addAnotherMCQ}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
              >
                <Plus size={17} />
                Add Another MCQ
              </button>

              <button
                type="submit"
                disabled={creating}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check size={17} />

                    Create {forms.length} MCQ
                    {forms.length > 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* EXISTING MCQS */}

        <div>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Existing MCQs
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {mcqs.length} total MCQ
                {mcqs.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search MCQs..."
                className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16">
              <Loader2
                size={24}
                className="animate-spin text-zinc-500"
              />
            </div>
          ) : filteredMCQs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
                <Brain
                  size={25}
                  className="text-zinc-500"
                />
              </div>

              <h2 className="text-lg font-semibold">
                No MCQs found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Create your first MCQ using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMCQs.map((mcq, index) => (
                <div
                  key={mcq._id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                          {getSubjectName(
                            mcq.subject
                          )}
                        </span>

                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs ${
                            mcq.isActive
                              ? "bg-emerald-950 text-emerald-400"
                              : "bg-red-950 text-red-400"
                          }`}
                        >
                          {mcq.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <h3 className="font-semibold leading-6">
                        {index + 1}. {mcq.question}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        deleteMCQ(mcq._id)
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-red-900 hover:bg-red-950/30 hover:text-red-400"
                      title="Delete MCQ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {mcq.options.map(
                      (option, optionIndex) => {
                        const optionNumber =
                          optionIndex + 1;

                        const correct =
                          mcq.correctAnswer ===
                          optionNumber;

                        return (
                          <div
                            key={`${mcq._id}-${optionIndex}`}
                            className={`rounded-xl border px-4 py-3 text-sm ${
                              correct
                                ? "border-emerald-800 bg-emerald-950/20 text-emerald-300"
                                : "border-zinc-800 bg-zinc-950 text-zinc-400"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">
                                {String.fromCharCode(
                                  65 + optionIndex
                                )}
                                .
                              </span>

                              <span className="flex-1">
                                {option}
                              </span>

                              {correct && (
                                <Check
                                  size={17}
                                  className="text-emerald-400"
                                />
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {mcq.explanation && (
                    <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <p className="text-xs uppercase tracking-wider text-zinc-600">
                        Explanation
                      </p>

                      <p className="mt-1 text-sm leading-6 text-zinc-400">
                        {mcq.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}