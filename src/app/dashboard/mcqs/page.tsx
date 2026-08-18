"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  Brain,
  BookOpen,
  ChevronRight,
  Loader2,
  FileQuestion,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Subject {
  _id: string;
  name: string;
  slug?: string;
}

interface MCQ {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  subject?: Subject;
}

interface MCQAttempt {
  id: string;
  questionId: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  subjectId?: string;
  subjectName?: string;
  attemptedAt: string;
}

/* =========================================================
   PAGE WRAPPER
========================================================= */

export default function MCQsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
          <div className="flex items-center gap-3 text-zinc-400">
            <Loader2
              size={21}
              className="animate-spin"
            />
            Loading MCQ Practice...
          </div>
        </main>
      }
    >
      <MCQsContent />
    </Suspense>
  );
}

/* =========================================================
   MAIN MCQ CONTENT
========================================================= */

function MCQsContent() {
  const searchParams = useSearchParams();
  const selectedSubject = searchParams.get("subject");

  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD SUBJECTS + MCQs
  ===================================================== */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * NO SUBJECT SELECTED
         * Load all subjects added by admin.
         */

        if (!selectedSubject) {
          const response = await fetch(
            `${API_URL}/api/subjects`,
            {
              cache: "no-store",
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to load subjects"
            );
          }

          setSubjects(data.subjects || []);
          setMcqs([]);

          return;
        }

        /*
         * SUBJECT SELECTED
         * Load MCQs for that subject.
         */

        const response = await fetch(
          `${API_URL}/api/mcqs?subject=${encodeURIComponent(
            selectedSubject
          )}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load MCQs"
          );
        }

        setMcqs(data.mcqs || []);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSubject]);

  /* =====================================================
     SUBJECT LIST PAGE
  ===================================================== */

  if (!selectedSubject) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        {/* HEADER */}

        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
                <Brain size={19} />
              </div>

              <span className="font-semibold">
                MCQ Practice
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

        {/* CONTENT */}

        <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
                <Brain size={23} />
              </div>

              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                  MCQ Practice
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                  Select a subject to start practicing.
                </p>
              </div>
            </div>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-zinc-400">
                <Loader2
                  size={21}
                  className="animate-spin"
                />
                Loading subjects...
              </div>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="rounded-2xl border border-red-900 bg-red-950/40 p-5 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* NO SUBJECT */}

          {!loading &&
            !error &&
            subjects.length === 0 && (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-14 text-center">
                <BookOpen
                  size={42}
                  className="mx-auto text-zinc-700"
                />

                <h2 className="mt-4 text-lg font-semibold">
                  No subjects available
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Subjects added by admin will appear here.
                </p>
              </div>
            )}

          {/* SUBJECT FOLDERS */}

          {!loading &&
            !error &&
            subjects.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((item) => {
                  const subjectValue =
                    item.slug || item._id;

                  return (
                    <Link
                      key={item._id}
                      href={`/dashboard/mcqs?subject=${encodeURIComponent(
                        subjectValue
                      )}`}
                      className="group"
                    >
                      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 transition duration-300 hover:-translate-y-1 hover:border-zinc-600 hover:bg-zinc-900">
                        {/* ICON */}

                        <div className="flex items-start justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-200 transition group-hover:bg-white group-hover:text-zinc-950">
                            <BookOpen size={25} />
                          </div>

                          <ChevronRight
                            size={20}
                            className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white"
                          />
                        </div>

                        {/* SUBJECT NAME */}

                        <h2 className="mt-6 text-xl font-bold">
                          {item.name}
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                          Practice {item.name} MCQs
                        </p>

                        {/* FOLDER STYLE */}

                        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-zinc-500">
                          <FileQuestion size={15} />
                          Open MCQs
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
        </section>
      </main>
    );
  }

  /* =====================================================
     SUBJECT MCQ PAGE
  ===================================================== */

  return (
    <MCQQuestions
      mcqs={mcqs}
      loading={loading}
      error={error}
      selectedSubject={selectedSubject}
    />
  );
}

/* =========================================================
   MCQ QUESTIONS COMPONENT
========================================================= */

function MCQQuestions({
  mcqs,
  loading,
  error,
  selectedSubject,
}: {
  mcqs: MCQ[];
  loading: boolean;
  error: string;
  selectedSubject: string;
}) {
  const [selected, setSelected] = useState<
    Record<string, number>
  >({});

  const handleAnswer = async (
    mcq: MCQ,
    optionNumber: number
  ) => {
    if (selected[mcq._id]) {
      return;
    }

    // Show result immediately
    setSelected((previous) => ({
      ...previous,
      [mcq._id]: optionNumber,
    }));

    try {
      const token =
        localStorage.getItem(
          "studyflow_token"
        );

      if (!token) {
        console.error(
          "User token not found"
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/attempts/mcqs/${mcq._id}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            selectedAnswer: optionNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "MCQ attempt save failed:",
          data.message
        );

        return;
      }

      console.log(
        "MCQ attempt saved:",
        data.attempt
      );
    } catch (error) {
      console.error(
        "MCQ attempt request failed:",
        error
      );
    }
  };

  const getOptionClass = (
    mcq: MCQ,
    optionNumber: number
  ) => {
    const selectedOption =
      selected[mcq._id];

    if (!selectedOption) {
      return "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900";
    }

    const isCorrect =
      optionNumber === mcq.correctAnswer;

    const isUserSelected =
      optionNumber === selectedOption;

    if (isCorrect) {
      return "border-emerald-700 bg-emerald-950/50 text-emerald-300";
    }

    if (
      isUserSelected &&
      !isCorrect
    ) {
      return "border-red-700 bg-red-950/50 text-red-300";
    }

    return "border-zinc-800 bg-zinc-950 text-zinc-500";
  };

  const getOptionIcon = (
    mcq: MCQ,
    optionNumber: number
  ) => {
    const selectedOption =
      selected[mcq._id];

    if (!selectedOption) {
      return null;
    }

    if (
      optionNumber ===
      mcq.correctAnswer
    ) {
      return (
        <span className="text-emerald-400">
          ✓
        </span>
      );
    }

    if (
      optionNumber === selectedOption &&
      optionNumber !== mcq.correctAnswer
    ) {
      return (
        <span className="text-red-400">
          ✕
        </span>
      );
    }

    return null;
  };

  const correctCount = mcqs.reduce(
    (total, mcq) =>
      total +
      (selected[mcq._id] ===
      mcq.correctAnswer
        ? 1
        : 0),
    0
  );

  const attemptedCount =
    Object.keys(selected).length;

  const subjectName =
    mcqs[0]?.subject?.name ||
    selectedSubject;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link
            href="/dashboard/mcqs"
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
              <Brain size={19} />
            </div>

            <span className="font-semibold">
              MCQ Practice
            </span>
          </Link>

          <Link
            href="/dashboard/mcqs"
            className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          >
            <ArrowLeft size={16} />
            Subjects
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
        {/* TITLE */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
              <BookOpen size={21} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Subject
              </p>

              <h1 className="text-3xl font-bold">
                {subjectName}
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Practice MCQs from this subject.
              </p>
            </div>
          </div>

          {/* STATS */}

          {!loading &&
            !error &&
            mcqs.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs text-zinc-500">
                    Questions
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {mcqs.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs text-zinc-500">
                    Attempted
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {attemptedCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs text-zinc-500">
                    Correct
                  </p>

                  <p className="mt-1 text-2xl font-bold text-emerald-400">
                    {correctCount}
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading MCQs...
            </div>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/40 p-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          mcqs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center">
              <FileQuestion
                size={40}
                className="mx-auto text-zinc-700"
              />

              <h2 className="mt-4 text-lg font-semibold">
                No MCQs available
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Admin has not added MCQs for this subject yet.
              </p>

              <Link
                href="/dashboard/mcqs"
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Back to Subjects
              </Link>
            </div>
          )}

        {/* QUESTIONS */}

        {!loading &&
          !error &&
          mcqs.map((mcq, index) => {
            const selectedOption =
              selected[mcq._id];

            const isAnswered =
              Boolean(selectedOption);

            const isCorrect =
              selectedOption ===
              mcq.correctAnswer;

            return (
              <article
                key={mcq._id}
                className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
              >
                <div className="p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-zinc-500">
                      Question {index + 1}
                    </div>

                    {mcq.subject?.name && (
                      <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500">
                        {mcq.subject.name}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 text-lg font-semibold leading-7">
                    {mcq.question}
                  </h2>

                  <div className="mt-6 space-y-3">
                    {mcq.options.map(
                      (
                        option,
                        optionIndex
                      ) => {
                        const number =
                          optionIndex + 1;

                        return (
                          <button
                            key={optionIndex}
                            type="button"
                            disabled={isAnswered}
                            onClick={() =>
                              handleAnswer(
                                mcq,
                                number
                              )
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition ${getOptionClass(
                              mcq,
                              number
                            )} ${
                              isAnswered
                                ? "cursor-default"
                                : "cursor-pointer"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${
                                selectedOption &&
                                number ===
                                  mcq.correctAnswer
                                  ? "border-emerald-700"
                                  : selectedOption &&
                                    number ===
                                      selectedOption
                                  ? "border-red-700"
                                  : "border-zinc-700"
                              }`}
                            >
                              {String.fromCharCode(
                                64 + number
                              )}
                            </span>

                            <span className="flex-1">
                              {option}
                            </span>

                            {getOptionIcon(
                              mcq,
                              number
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* RESULT */}

                  {isAnswered && (
                    <div
                      className={`mt-5 rounded-xl border p-4 ${
                        isCorrect
                          ? "border-emerald-900 bg-emerald-950/30"
                          : "border-red-900 bg-red-950/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`text-xl ${
                            isCorrect
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {isCorrect
                            ? "✓"
                            : "✕"}
                        </div>

                        <div>
                          <p
                            className={`font-semibold ${
                              isCorrect
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {isCorrect
                              ? "Correct Answer!"
                              : "Wrong Answer"}
                          </p>

                          {!isCorrect && (
                            <p className="mt-1 text-sm text-zinc-400">
                              Correct answer:{" "}
                              <span className="font-semibold text-emerald-400">
                                Option{" "}
                                {String.fromCharCode(
                                  64 +
                                    mcq.correctAnswer
                                )}
                              </span>
                            </p>
                          )}

                          {mcq.explanation && (
                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                              {mcq.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
      </section>
    </main>
  );
}