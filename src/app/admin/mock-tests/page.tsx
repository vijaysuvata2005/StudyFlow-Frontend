
"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface Subject {
  _id: string;
  name: string;
  slug?: string;
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

interface MockTest {
  _id: string;
  title: string;
  subject: string | MCQSubject;
  duration: number;
  questions: MCQ[];
  isActive: boolean;
  createdAt?: string;
}

interface MockTestForm {
  title: string;
  subject: string;
  duration: string;
  questions: string[];
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const emptyForm = (): MockTestForm => ({
  title: "",
  subject: "",
  duration: "30",
  questions: [],
});

export default function AdminMockTestsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);

  const [form, setForm] =
    useState<MockTestForm>(emptyForm());

  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [mcqSearch, setMcqSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const getToken = () => {
    return localStorage.getItem(
      "studyflow_admin_token"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href =
          "/admin/login";
        return;
      }

      const [
        subjectsResponse,
        mcqsResponse,
        mockTestsResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/api/subjects/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${API_URL}/api/mcqs/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${API_URL}/api/mock-tests/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      const subjectsData =
        await subjectsResponse.json();

      const mcqsData =
        await mcqsResponse.json();

      const mockTestsData =
        await mockTestsResponse.json();

      if (!subjectsResponse.ok) {
        throw new Error(
          subjectsData.message ||
            "Failed to load subjects"
        );
      }

      if (!mcqsResponse.ok) {
        throw new Error(
          mcqsData.message ||
            "Failed to load MCQs"
        );
      }

      if (!mockTestsResponse.ok) {
        throw new Error(
          mockTestsData.message ||
            "Failed to load mock tests"
        );
      }

      setSubjects(
        subjectsData.subjects || []
      );

      setMcqs(
        mcqsData.mcqs || []
      );

      setMockTests(
        mockTestsData.mockTests || []
      );
    } catch (err) {
      console.error(err);

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

  /*
  |--------------------------------------------------------------------------
  | FORM HELPERS
  |--------------------------------------------------------------------------
  */

  const updateForm = (
    field: keyof MockTestForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const getSubjectName = (
    subject: string | MCQSubject
  ) => {
    if (
      typeof subject === "string"
    ) {
      const found = subjects.find(
        (item) =>
          item._id === subject
      );

      return found?.name || subject;
    }

    return subject?.name || "";
  };

  /*
  |--------------------------------------------------------------------------
  | SELECTED QUESTIONS
  |--------------------------------------------------------------------------
  */

  const toggleQuestion = (
    mcqId: string
  ) => {
    setForm((current) => {
      const exists =
        current.questions.includes(
          mcqId
        );

      return {
        ...current,
        questions: exists
          ? current.questions.filter(
              (id) => id !== mcqId
            )
          : [
              ...current.questions,
              mcqId,
            ],
      };
    });
  };

  const selectAllVisible = () => {
    const visibleIds =
      filteredMCQs.map(
        (mcq) => mcq._id
      );

    setForm((current) => {
      const merged = new Set(
        current.questions
      );

      visibleIds.forEach((id) =>
        merged.add(id)
      );

      return {
        ...current,
        questions: Array.from(
          merged
        ),
      };
    });
  };

  const clearSelected = () => {
    setForm((current) => ({
      ...current,
      questions: [],
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER MCQs
  |--------------------------------------------------------------------------
  */

  const filteredMCQs = useMemo(() => {
    const text =
      mcqSearch
        .trim()
        .toLowerCase();

    return mcqs.filter((mcq) => {
      const subjectName =
        getSubjectName(
          mcq.subject
        ).toLowerCase();

      const matchesSearch =
        !text ||
        mcq.question
          .toLowerCase()
          .includes(text) ||
        subjectName.includes(text);

      const matchesSubject =
        !form.subject ||
        (typeof mcq.subject ===
          "string"
          ? mcq.subject ===
            form.subject
          : mcq.subject?._id ===
            form.subject);

      return (
        matchesSearch &&
        matchesSubject &&
        mcq.isActive
      );
    });
  }, [
    mcqs,
    mcqSearch,
    form.subject,
    subjects,
  ]);

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Mock test title is required";
    }

    if (!form.subject) {
      return "Please select a subject";
    }

    const duration =
      Number(form.duration);

    if (
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      return "Duration must be a positive number";
    }

    if (
      form.questions.length === 0
    ) {
      return "Please select at least one MCQ";
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE / UPDATE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        window.location.href =
          "/admin/login";
        return;
      }

      const isEditing =
        Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/api/mock-tests/${editingId}`
        : `${API_URL}/api/mock-tests`;

      const response =
        await fetch(url, {
          method: isEditing
            ? "PUT"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.title.trim(),
            subject: form.subject,
            duration:
              Number(form.duration),
            questions:
              form.questions,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save mock test"
        );
      }

      setMessage(
        isEditing
          ? "Mock test updated successfully"
          : "Mock test created successfully"
      );

      setForm(emptyForm());
      setEditingId(null);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save mock test"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const startEdit = (
    mockTest: MockTest
  ) => {
    setError("");
    setMessage("");

    setEditingId(
      mockTest._id
    );

    setForm({
      title: mockTest.title,
      subject:
        typeof mockTest.subject ===
        "string"
          ? mockTest.subject
          : mockTest.subject._id,
      duration:
        String(mockTest.duration),
      questions:
        mockTest.questions.map(
          (question) =>
            question._id
        ),
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const deleteMockTest = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this mock test?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const token = getToken();

      if (!token) {
        window.location.href =
          "/admin/login";
        return;
      }

      const response =
        await fetch(
          `${API_URL}/api/mock-tests/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete mock test"
        );
      }

      setMessage(
        "Mock test deleted successfully"
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete mock test"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVE / INACTIVE
  |--------------------------------------------------------------------------
  */

  const toggleActive = async (
    mockTest: MockTest
  ) => {
    try {
      setError("");
      setMessage("");

      const token = getToken();

      if (!token) {
        window.location.href =
          "/admin/login";
        return;
      }

      const response =
        await fetch(
          `${API_URL}/api/mock-tests/${mockTest._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              isActive:
                !mockTest.isActive,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update status"
        );
      }

      setMessage(
        mockTest.isActive
          ? "Mock test deactivated"
          : "Mock test activated"
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update status"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER MOCK TESTS
  |--------------------------------------------------------------------------
  */

  const filteredMockTests =
    mockTests.filter(
      (mockTest) => {
        const text =
          search
            .trim()
            .toLowerCase();

        if (!text) {
          return true;
        }

        const subjectName =
          getSubjectName(
            mockTest.subject
          ).toLowerCase();

        return (
          mockTest.title
            .toLowerCase()
            .includes(text) ||
          subjectName.includes(text)
        );
      }
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

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
        {/* TITLE */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400">
              <Brain size={14} />
              Test Management
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Mock Tests
            </h1>

            <p className="mt-2 text-sm text-zinc-500 sm:text-base">
              Create tests using your existing MCQs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setMessage("");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            <Plus size={17} />

            {showForm
              ? "Hide Form"
              : "Create Mock Test"}
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

        {/* CREATE / EDIT FORM */}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  {editingId
                    ? "Edit Mock Test"
                    : "New Mock Test"}
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {editingId
                    ? "Update Mock Test"
                    : "Create Mock Test"}
                </h2>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X size={15} />
                  Cancel Edit
                </button>
              )}
            </div>

            {/* BASIC DETAILS */}

            <div className="grid gap-5 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="mb-2 block text-sm text-zinc-300">
                  Test Title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="Computer Basic Test 1"
                  className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Subject
                </label>

                <select
                  value={form.subject}
                  onChange={(event) =>
                    updateForm(
                      "subject",
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm outline-none focus:border-white"
                >
                  <option value="">
                    Select Subject
                  </option>

                  {subjects.map(
                    (subject) => (
                      <option
                        key={
                          subject._id
                        }
                        value={
                          subject._id
                        }
                      >
                        {subject.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Duration
                </label>

                <div className="relative">
                  <Clock3
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    type="number"
                    min="1"
                    value={
                      form.duration
                    }
                    onChange={(event) =>
                      updateForm(
                        "duration",
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-20 text-sm outline-none focus:border-white"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600">
                    minutes
                  </span>
                </div>
              </div>
            </div>

            {/* QUESTION SELECTOR */}

            <div className="mt-8 border-t border-zinc-800 pt-7">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-semibold">
                    Select Questions
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {form.questions.length}{" "}
                    question
                    {form.questions.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    selected
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      selectAllVisible
                    }
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    Select Visible
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearSelected
                    }
                    className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-800 hover:text-white"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* SEARCH */}

              <div className="relative mb-4">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type="text"
                  value={mcqSearch}
                  onChange={(event) =>
                    setMcqSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search questions..."
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-11 pr-4 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                />
              </div>

              {/* MCQ LIST */}

              <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2">
                {filteredMCQs.length ===
                0 ? (
                  <div className="px-5 py-12 text-center text-sm text-zinc-600">
                    No active MCQs found.
                  </div>
                ) : (
                  filteredMCQs.map(
                    (mcq, index) => {
                      const selected =
                        form.questions.includes(
                          mcq._id
                        );

                      return (
                        <button
                          key={
                            mcq._id
                          }
                          type="button"
                          onClick={() =>
                            toggleQuestion(
                              mcq._id
                            )
                          }
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-emerald-800 bg-emerald-950/20"
                              : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                                selected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-zinc-700 text-zinc-600"
                              }`}
                            >
                              {selected ? (
                                <Check
                                  size={
                                    15
                                  }
                                />
                              ) : (
                                <span className="text-xs">
                                  {index +
                                    1}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">
                                  {getSubjectName(
                                    mcq.subject
                                  )}
                                </span>
                              </div>

                              <p className="text-sm font-medium leading-6 text-zinc-200">
                                {mcq.question}
                              </p>

                              <div className="mt-2 grid gap-1 text-xs text-zinc-600 sm:grid-cols-2">
                                {mcq.options.map(
                                  (
                                    option,
                                    optionIndex
                                  ) => (
                                    <span
                                      key={
                                        optionIndex
                                      }
                                      className="truncate"
                                    >
                                      {String.fromCharCode(
                                        65 +
                                          optionIndex
                                      )}
                                      .{" "}
                                      {
                                        option
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )
                )}
              </div>
            </div>

            {/* FORM ACTIONS */}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    {editingId
                      ? "Update Mock Test"
                      : "Create Mock Test"}
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={
                    cancelEdit
                  }
                  className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* EXISTING TESTS */}

        <div>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Existing Mock Tests
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {mockTests.length} total test
                {mockTests.length !==
                1
                  ? "s"
                  : ""}
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
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search mock tests..."
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
          ) : filteredMockTests.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
                <Brain
                  size={25}
                  className="text-zinc-500"
                />
              </div>

              <h2 className="text-lg font-semibold">
                No mock tests found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Create your first mock
                test using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMockTests.map(
                (mockTest) => (
                  <MockTestCard
                    key={
                      mockTest._id
                    }
                    mockTest={
                      mockTest
                    }
                    subjectName={getSubjectName(
                      mockTest.subject
                    )}
                    onEdit={
                      startEdit
                    }
                    onDelete={
                      deleteMockTest
                    }
                    onToggleActive={
                      toggleActive
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| MOCK TEST CARD
|--------------------------------------------------------------------------
*/

interface MockTestCardProps {
  mockTest: MockTest;
  subjectName: string;
  onEdit: (
    mockTest: MockTest
  ) => void;
  onDelete: (
    id: string
  ) => void;
  onToggleActive: (
    mockTest: MockTest
  ) => void;
}

function MockTestCard({
  mockTest,
  subjectName,
  onEdit,
  onDelete,
  onToggleActive,
}: MockTestCardProps) {
  const [expanded, setExpanded] =
    useState(false);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
              {subjectName}
            </span>

            <span className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
              <Clock3 size={12} />
              {mockTest.duration} min
            </span>

            <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
              {mockTest.questions.length}{" "}
              Questions
            </span>

            <span
              className={`rounded-lg px-2.5 py-1 text-xs ${
                mockTest.isActive
                  ? "bg-emerald-950 text-emerald-400"
                  : "bg-red-950 text-red-400"
              }`}
            >
              {mockTest.isActive
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <h3 className="text-lg font-semibold">
            {mockTest.title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onToggleActive(
                mockTest
              )
            }
            className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            {mockTest.isActive
              ? "Deactivate"
              : "Activate"}
          </button>

          <button
            type="button"
            onClick={() =>
              onEdit(mockTest)
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            title="Edit Mock Test"
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(
                mockTest._id
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:border-red-900 hover:bg-red-950/30 hover:text-red-400"
            title="Delete Mock Test"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* QUESTIONS */}

      <div className="mt-5 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={() =>
            setExpanded(!expanded)
          }
          className="flex w-full items-center justify-between text-left text-sm text-zinc-400 hover:text-white"
        >
          <span>
            View selected questions
          </span>

          {expanded ? (
            <ChevronUp size={17} />
          ) : (
            <ChevronDown size={17} />
          )}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {mockTest.questions.map(
              (question, index) => (
                <div
                  key={
                    question._id
                  }
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex gap-3">
                    <span className="text-xs font-semibold text-zinc-600">
                      {index + 1}.
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm leading-6 text-zinc-300">
                        {
                          question.question
                        }
                      </p>

                      <div className="mt-2 grid gap-1 text-xs text-zinc-600 sm:grid-cols-2">
                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => (
                            <span
                              key={
                                optionIndex
                              }
                              className={
                                question.correctAnswer ===
                                optionIndex +
                                  1
                                  ? "text-emerald-500"
                                  : ""
                              }
                            >
                              {String.fromCharCode(
                                65 +
                                  optionIndex
                              )}
                              .{" "}
                              {
                                option
                              }
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

