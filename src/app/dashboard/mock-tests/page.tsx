"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Trophy,
  XCircle,
  RotateCcw,
} from "lucide-react";

import { useSearchParams } from "next/navigation";

interface Subject {
  _id: string;
  name: string;
  slug?: string;
}

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface MockTest {
  _id: string;
  title: string;
  duration: number;
  subject?: Subject;
  questions: Question[];
}

interface AttemptAnswer {
  question: string;
  selectedAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
}

interface Attempt {
  _id: string;
  mockTest:
    | string
    | {
        _id: string;
        title: string;
        duration: number;
        subject?: Subject;
      };
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  score: number;
  percentage: number;
  answers: AttemptAnswer[];
  completedAt: string;
}

interface SubmitResult {
  attemptId: string;
  mockTestId: string;
  title: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  score: number;
  percentage: number;
  answers: AttemptAnswer[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* 
|--------------------------------------------------------------------------
| MAIN CONTENT
|--------------------------------------------------------------------------
| useSearchParams() is inside this component.
| The component itself is wrapped with Suspense at the bottom.
|--------------------------------------------------------------------------
*/

function MockTestsContent() {
  const searchParams = useSearchParams();

  const subjectFilter =
    searchParams.get("subject") || "";

  const [tests, setTests] = useState<MockTest[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>(
    []
  );

  const [selectedTest, setSelectedTest] =
    useState<MockTest | null>(null);

  const [answers, setAnswers] = useState<
    Record<string, number>
  >({});

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  const [submitted, setSubmitted] =
    useState(false);

  const [submitResult, setSubmitResult] =
    useState<SubmitResult | null>(null);

  const [reviewAttempt, setReviewAttempt] =
    useState<Attempt | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [attemptsLoading, setAttemptsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD MOCK TESTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true);
        setError("");

        const url = subjectFilter
          ? `${API_URL}/api/mock-tests?subject=${encodeURIComponent(
              subjectFilter
            )}`
          : `${API_URL}/api/mock-tests`;

        const response = await fetch(url, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load mock tests"
          );
        }

        setTests(data.mockTests || []);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load mock tests"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, [subjectFilter]);

  /*
  |--------------------------------------------------------------------------
  | LOAD USER ATTEMPTS
  |--------------------------------------------------------------------------
  */

  const loadAttempts = async () => {
    try {
      setAttemptsLoading(true);

      const token =
        localStorage.getItem(
          "studyflow_token"
        );

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/attempts/my`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load attempts"
        );
      }

      setAttempts(data.attempts || []);
    } catch (error) {
      console.error(
        "Load attempts error:",
        error
      );
    } finally {
      setAttemptsLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | GET ATTEMPTS FOR TEST
  |--------------------------------------------------------------------------
  */

  const getTestAttempts = (
    testId: string
  ) => {
    return attempts.filter((attempt) => {
      const mockTestId =
        typeof attempt.mockTest === "string"
          ? attempt.mockTest
          : attempt.mockTest?._id;

      return mockTestId === testId;
    });
  };

  const getLatestAttempt = (
    testId: string
  ) => {
    const testAttempts =
      getTestAttempts(testId);

    if (testAttempts.length === 0) {
      return null;
    }

    return [...testAttempts].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() -
        new Date(a.completedAt).getTime()
    )[0];
  };

  /*
  |--------------------------------------------------------------------------
  | TIMER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !selectedTest ||
      submitted ||
      submitting
    ) {
      return;
    }

    if (secondsLeft <= 0) {
      handleSubmitTest(true);
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) =>
        previous - 1
      );
    }, 1000);

    return () =>
      window.clearInterval(timer);
  }, [
    selectedTest,
    submitted,
    submitting,
    secondsLeft,
  ]);

  /*
  |--------------------------------------------------------------------------
  | FORMAT TIMER
  |--------------------------------------------------------------------------
  */

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(
      secondsLeft / 60
    );

    const seconds = secondsLeft % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }, [secondsLeft]);

  /*
  |--------------------------------------------------------------------------
  | START TEST
  |--------------------------------------------------------------------------
  */

  const startTest = (test: MockTest) => {
    setSelectedTest(test);

    setAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setSubmitResult(null);
    setReviewAttempt(null);
    setSubmitting(false);

    setSecondsLeft(
      test.duration * 60
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | REATTEMPT
  |--------------------------------------------------------------------------
  */

  const restartTest = () => {
    if (!selectedTest) {
      return;
    }

    startTest(selectedTest);
  };

  /*
  |--------------------------------------------------------------------------
  | ANSWER QUESTION
  |--------------------------------------------------------------------------
  */

  const handleAnswer = (
    questionId: string,
    optionNumber: number
  ) => {
    if (
      submitted ||
      submitting
    ) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionNumber,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT TEST
  |--------------------------------------------------------------------------
  */

  const handleSubmitTest = async (
    automatic = false
  ) => {
    if (
      !selectedTest ||
      submitting ||
      submitted
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token =
        localStorage.getItem(
          "studyflow_token"
        );

      if (!token) {
        setError(
          "User session expired. Please login again."
        );

        window.location.href = "/login";
        return;
      }

      const formattedAnswers =
        selectedTest.questions.map(
          (question) => ({
            question: question._id,
            selectedAnswer:
              answers[question._id] ??
              null,
          })
        );

      const response = await fetch(
        `${API_URL}/api/attempts/mock-tests/${selectedTest._id}/submit`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            answers: formattedAnswers,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to submit mock test"
        );
      }

      setSubmitResult(
        data.result
      );

      setSubmitted(true);

      await loadAttempts();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Submit test error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit test"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN OLD ATTEMPT
  |--------------------------------------------------------------------------
  */

  const openAttemptReview = (
    attempt: Attempt
  ) => {
    setReviewAttempt(attempt);

    setSelectedTest(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | BACK TO TEST LIST
  |--------------------------------------------------------------------------
  */

  const backToTests = () => {
    setSelectedTest(null);
    setSubmitted(false);
    setSubmitResult(null);
    setReviewAttempt(null);
    setAnswers({});
    setCurrentQuestion(0);
  };

  /*
  |--------------------------------------------------------------------------
  | REVIEW PAGE
  |--------------------------------------------------------------------------
  */

  if (reviewAttempt) {
    const mockTestTitle =
      typeof reviewAttempt.mockTest ===
      "string"
        ? "Mock Test"
        : reviewAttempt.mockTest.title;

    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
            <div>
              <p className="text-sm font-semibold">
                {mockTestTitle}
              </p>

              <p className="text-xs text-zinc-600">
                Attempt Review
              </p>
            </div>

            <button
              onClick={backToTests}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-7 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-zinc-950">
                <Trophy size={28} />
              </div>

              <p className="mt-5 text-sm text-zinc-500">
                Attempt Result
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                {reviewAttempt.score} /{" "}
                {reviewAttempt.totalQuestions}
              </h1>

              <p className="mt-2 text-zinc-500">
                {reviewAttempt.percentage}%
                Score
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 p-4 text-center">
                <p className="text-xs text-zinc-600">
                  Attempted
                </p>

                <p className="mt-1 text-xl font-bold">
                  {reviewAttempt.correctAnswers +
                    reviewAttempt.wrongAnswers}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-4 text-center">
                <p className="text-xs text-zinc-600">
                  Correct
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-400">
                  {reviewAttempt.correctAnswers}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-4 text-center">
                <p className="text-xs text-zinc-600">
                  Wrong
                </p>

                <p className="mt-1 text-xl font-bold text-red-400">
                  {reviewAttempt.wrongAnswers}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-4 text-center">
                <p className="text-xs text-zinc-600">
                  Unattempted
                </p>

                <p className="mt-1 text-xl font-bold">
                  {reviewAttempt.unanswered}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Answer Review
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Check which questions you got
                right and wrong.
              </p>
            </div>

            <div className="space-y-5">
              {reviewAttempt.answers.map(
                (answer, index) => {
                  const question = tests
                    .flatMap(
                      (test) =>
                        test.questions
                    )
                    .find(
                      (item) =>
                        item._id ===
                        answer.question
                    );

                  const selectedText =
                    answer.selectedAnswer
                      ? question?.options[
                          answer.selectedAnswer -
                            1
                        ]
                      : null;

                  const correctText =
                    question?.options[
                      answer.correctAnswer -
                        1
                    ];

                  return (
                    <article
                      key={`${answer.question}-${index}`}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-zinc-500">
                          Question{" "}
                          {index + 1}
                        </span>

                        {answer.isCorrect ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2
                              size={15}
                            />
                            Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                            <XCircle
                              size={15}
                            />
                            Wrong
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-lg font-semibold leading-7">
                        {question?.question ||
                          "Question unavailable"}
                      </h3>

                      <div className="mt-5 space-y-3">
                        <div
                          className={`rounded-xl border p-4 ${
                            answer.isCorrect
                              ? "border-emerald-900 bg-emerald-950/30"
                              : "border-red-900 bg-red-950/30"
                          }`}
                        >
                          <p className="text-xs text-zinc-500">
                            Your Answer
                          </p>

                          <p
                            className={`mt-1 text-sm font-medium ${
                              answer.isCorrect
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {selectedText ||
                              "Not Attempted"}
                          </p>
                        </div>

                        {!answer.isCorrect && (
                          <div className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-4">
                            <p className="text-xs text-zinc-500">
                              Correct Answer
                            </p>

                            <p className="mt-1 text-sm font-medium text-emerald-300">
                              {correctText ||
                                `Option ${String.fromCharCode(
                                  64 +
                                    answer.correctAnswer
                                )}`}
                            </p>
                          </div>
                        )}
                      </div>

                      {question?.explanation && (
                        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                          <p className="text-xs text-zinc-500">
                            Explanation
                          </p>

                          <p className="mt-1 text-sm leading-6 text-zinc-400">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                const mockTestId =
                  typeof reviewAttempt.mockTest ===
                  "string"
                    ? reviewAttempt.mockTest
                    : reviewAttempt.mockTest?._id;

                const test = tests.find(
                  (item) =>
                    item._id === mockTestId
                );

                if (test) {
                  setReviewAttempt(null);
                  startTest(test);
                } else {
                  backToTests();
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              <RotateCcw size={17} />
              Attempt Again
            </button>

            <button
              onClick={backToTests}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800 px-5 py-3 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <ArrowLeft size={17} />
              All Mock Tests
            </button>
          </div>
        </section>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SELECTED TEST PAGE
  |--------------------------------------------------------------------------
  */

  if (selectedTest) {
    const question =
      selectedTest.questions[
        currentQuestion
      ];

    const selected =
      question
        ? answers[question._id]
        : undefined;

    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
            <div>
              <p className="text-sm font-semibold">
                {selectedTest.title}
              </p>

              <p className="text-xs text-zinc-600">
                {answeredCount(
                  answers
                )}{" "}
                /{" "}
                {selectedTest.questions.length}{" "}
                answered
              </p>
            </div>

            {!submitted && (
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                  secondsLeft <= 60
                    ? "border-red-900 bg-red-950/40 text-red-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300"
                }`}
              >
                <Clock3 size={17} />
                {formattedTime}
              </div>
            )}
          </div>
        </header>

        <section className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/40 p-5 text-sm text-red-300">
              {error}
            </div>
          )}

          {submitted &&
          submitResult ? (
            <div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-7 text-center sm:p-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-zinc-950">
                  <Trophy size={28} />
                </div>

                <p className="mt-6 text-sm text-zinc-500">
                  Test Completed
                </p>

                <h1 className="mt-2 text-4xl font-bold">
                  {submitResult.score} /{" "}
                  {submitResult.totalQuestions}
                </h1>

                <p className="mt-2 text-zinc-500">
                  {submitResult.percentage}%
                  Score
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800 p-4">
                    <p className="text-xs text-zinc-600">
                      Attempted
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {submitResult.correctAnswers +
                        submitResult.wrongAnswers}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 p-4">
                    <p className="text-xs text-zinc-600">
                      Correct
                    </p>

                    <p className="mt-1 text-xl font-bold text-emerald-400">
                      {
                        submitResult.correctAnswers
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 p-4">
                    <p className="text-xs text-zinc-600">
                      Wrong
                    </p>

                    <p className="mt-1 text-xl font-bold text-red-400">
                      {
                        submitResult.wrongAnswers
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 p-4">
                    <p className="text-xs text-zinc-600">
                      Unattempted
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {
                        submitResult.unanswered
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() =>
                      setReviewAttempt({
                        _id:
                          submitResult.attemptId,

                        mockTest:
                          selectedTest._id,

                        totalQuestions:
                          submitResult.totalQuestions,

                        correctAnswers:
                          submitResult.correctAnswers,

                        wrongAnswers:
                          submitResult.wrongAnswers,

                        unanswered:
                          submitResult.unanswered,

                        score:
                          submitResult.score,

                        percentage:
                          submitResult.percentage,

                        answers:
                          submitResult.answers,

                        completedAt:
                          new Date().toISOString(),
                      })
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                  >
                    <BookOpen size={17} />
                    Review Answers
                  </button>

                  <button
                    onClick={restartTest}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    <RotateCcw size={17} />
                    Attempt Again
                  </button>

                  <button
                    onClick={backToTests}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 px-5 py-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  >
                    <ArrowLeft size={17} />
                    All Mock Tests
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between text-sm text-zinc-500">
                <span>
                  Question{" "}
                  {currentQuestion + 1}{" "}
                  of{" "}
                  {selectedTest.questions.length}
                </span>

                <span>
                  {Math.round(
                    ((currentQuestion + 1) /
                      selectedTest
                        .questions.length) *
                      100
                  )}
                  %
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-white transition-all"
                  style={{
                    width: `${
                      ((currentQuestion + 1) /
                        selectedTest
                          .questions.length) *
                      100
                    }%`,
                  }}
                />
              </div>

              <article className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
                <h1 className="text-xl font-semibold leading-8">
                  {question.question}
                </h1>

                <div className="mt-7 space-y-3">
                  {question.options.map(
                    (
                      option,
                      index
                    ) => {
                      const number =
                        index + 1;

                      const isSelected =
                        selected ===
                        number;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            handleAnswer(
                              question._id,
                              number
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? "border-white bg-white text-zinc-950"
                              : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${
                              isSelected
                                ? "border-zinc-300"
                                : "border-zinc-700"
                            }`}
                          >
                            {String.fromCharCode(
                              65 + index
                            )}
                          </span>

                          <span className="text-sm">
                            {option}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </article>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  disabled={
                    currentQuestion ===
                    0
                  }
                  onClick={() =>
                    setCurrentQuestion(
                      (previous) =>
                        previous - 1
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 px-5 py-3 text-sm text-zinc-400 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                {currentQuestion <
                selectedTest.questions
                  .length -
                  1 ? (
                  <button
                    onClick={() =>
                      setCurrentQuestion(
                        (previous) =>
                          previous + 1
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                  >
                    Next
                    <ChevronRight
                      size={17}
                    />
                  </button>
                ) : (
                  <button
                    disabled={
                      submitting
                    }
                    onClick={() =>
                      handleSubmitTest(
                        false
                      )
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={17}
                        />
                        Submit Test
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TEST LIST PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
              <BookOpen size={19} />
            </div>

            <span className="font-semibold">
              Mock Tests
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

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <p className="text-sm text-zinc-500">
            Test Center
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Mock Tests
          </h1>

          <p className="mt-2 text-zinc-500">
            Attempt full tests created by
            your admin.
          </p>
        </div>

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading mock tests...
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
          tests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
              No mock tests available.
            </div>
          )}

        {!loading &&
          !error &&
          tests.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => {
                const latestAttempt =
                  getLatestAttempt(
                    test._id
                  );

                const testAttempts =
                  getTestAttempts(
                    test._id
                  );

                return (
                  <article
                    key={test._id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:-translate-y-1 hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-950">
                        <Trophy
                          size={22}
                        />
                      </div>

                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock3
                          size={14}
                        />
                        {test.duration}{" "}
                        min
                      </span>
                    </div>

                    <h2 className="mt-5 text-lg font-semibold">
                      {test.title}
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                      {test.subject?.name ||
                        "General Test"}
                    </p>

                    <p className="mt-4 text-sm text-zinc-600">
                      {test.questions.length}{" "}
                      questions
                    </p>

                    {latestAttempt ? (
                      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-zinc-600">
                              Last Attempt
                            </p>

                            <p className="mt-1 text-lg font-bold">
                              {
                                latestAttempt.percentage
                              }
                              %
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-zinc-600">
                              Score
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {
                                latestAttempt.score
                              }
                              /
                              {
                                latestAttempt.totalQuestions
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
                          <span>
                            Attempts:{" "}
                            {
                              testAttempts.length
                            }
                          </span>

                          <button
                            onClick={() =>
                              openAttemptReview(
                                latestAttempt
                              )
                            }
                            className="text-zinc-300 hover:text-white"
                          >
                            Review →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl border border-dashed border-zinc-800 p-4">
                        <p className="text-xs text-zinc-600">
                          Not attempted yet
                        </p>

                        <p className="mt-1 text-sm text-zinc-400">
                          Start your first
                          attempt.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() =>
                        startTest(test)
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                    >
                      {latestAttempt
                        ? "Attempt Again"
                        : "Start Test"}

                      {latestAttempt ? (
                        <RotateCcw
                          size={17}
                        />
                      ) : (
                        <ChevronRight
                          size={17}
                        />
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
      </section>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/

function answeredCount(
  answers: Record<string, number>
) {
  return Object.keys(answers).length;
}

/*
|--------------------------------------------------------------------------
| SUSPENSE WRAPPER
|--------------------------------------------------------------------------
| This fixes the Next.js 16 production build error:
| "useSearchParams() should be wrapped in a suspense boundary"
|--------------------------------------------------------------------------
*/

export default function MockTestsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 text-white">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-sm text-zinc-400">
              Loading Mock Tests...
            </div>
          </div>
        </main>
      }
    >
      <MockTestsContent />
    </Suspense>
  );
}