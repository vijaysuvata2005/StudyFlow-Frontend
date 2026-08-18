"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  FileText,
  LogOut,
  Menu,
  Trophy,
  UserRound,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
}

interface DashboardStats {
  subjects: number;
  testsAttempted: number;
  averageScore: number;
}

const menuItems = [
  {
    title: "Subjects",
    description: "Explore your study subjects",
    icon: BookOpen,
    href: "/dashboard/subjects",
  },
  {
    title: "Notes",
    description: "Read topic-wise study notes",
    icon: FileText,
    href: "/dashboard/notes",
  },
  {
    title: "MCQ Practice",
    description: "Practice questions subject-wise",
    icon: Brain,
    href: "/dashboard/mcqs",
  },
  {
    title: "Mock Tests",
    description: "Test your preparation",
    icon: Trophy,
    href: "/dashboard/mock-tests",
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    subjects: 0,
    testsAttempted: 0,
    averageScore: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    const savedUser = localStorage.getItem("studyflow_user");
    const token = localStorage.getItem("studyflow_token");

    if (!token || !savedUser) {
      window.location.href = "/login";
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      setUser(parsedUser);
    } catch {
      localStorage.removeItem("studyflow_user");
      localStorage.removeItem("studyflow_token");

      window.location.href = "/login";
    }
  }, []);

  // =====================================================
  // LOAD DASHBOARD STATS
  // =====================================================

  useEffect(() => {
    const loadDashboardStats = async () => {
      const token = localStorage.getItem("studyflow_token");

      if (!token) {
        return;
      }

      try {
        setStatsLoading(true);
        setStatsError("");

        const response = await fetch(
          `${API_URL}/api/attempts/dashboard-stats`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load dashboard stats"
          );
        }

        if (data.success && data.stats) {
          setStats({
            subjects: Number(data.stats.subjects || 0),
            testsAttempted: Number(
              data.stats.testsAttempted || 0
            ),
            averageScore: Number(
              data.stats.averageScore || 0
            ),
          });
        }
      } catch (error) {
        console.error(
          "Dashboard stats error:",
          error
        );

        setStatsError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard stats"
        );
      } finally {
        setStatsLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("studyflow_token");
    localStorage.removeItem("studyflow_user");

    window.location.href = "/";
  };

  // =====================================================
  // LOADING USER
  // =====================================================

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

          <div className="text-sm text-zinc-400">
            Loading StudyFlow...
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      {/* =================================================
          HEADER
      ================================================= */}

<header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">

    {/* LOGO */}
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

    {/* DESKTOP USER */}
    <div className="hidden items-center gap-4 sm:flex">

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800">
          <UserRound size={17} />
        </div>

        <div>
          <p className="text-sm font-medium">
            {user.name}
          </p>

          <p className="text-xs text-zinc-500">
            @{user.username}
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
      >
        <LogOut size={16} />
        Logout
      </button>

    </div>

    {/* MOBILE MENU BUTTON */}
    <button
      onClick={() => setMobileMenu(!mobileMenu)}
      aria-label="Toggle menu"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 sm:hidden"
    >
      {mobileMenu ? (
        <X size={19} />
      ) : (
        <Menu size={19} />
      )}
    </button>

  </div>

  {/* MOBILE MENU */}
  {mobileMenu && (
    <div className="border-t border-zinc-800 px-5 py-4 sm:hidden">

      <div className="mb-4 flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800">
          <UserRound size={17} />
        </div>

        <div>
          <p className="text-sm font-medium">
            {user.name}
          </p>

          <p className="text-xs text-zinc-500">
            @{user.username}
          </p>
        </div>

      </div>

      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
      >
        <LogOut size={16} />
        Logout
      </button>

    </div>
  )}
</header>

      {/* =================================================
          MAIN
      ================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-12">

        {/* WELCOME */}

        <div className="mb-10">

          <p className="text-sm text-zinc-500">
            Welcome back 👋
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Hello, {user.name}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Continue your preparation and improve your
            performance with StudyFlow.
          </p>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          {/* SUBJECTS */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-zinc-500">
                Subjects
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                <BookOpen size={17} />
              </div>

            </div>

            {statsLoading ? (
              <div className="mt-3 flex items-center gap-2">
                <Loader2
                  size={18}
                  className="animate-spin text-zinc-500"
                />

                <span className="text-sm text-zinc-500">
                  Loading...
                </span>
              </div>
            ) : (
              <p className="mt-3 text-3xl font-bold">
                {stats.subjects}
              </p>
            )}

            <p className="mt-1 text-xs text-zinc-600">
              Available subjects
            </p>

          </div>

          {/* TESTS ATTEMPTED */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-zinc-500">
                Tests Attempted
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                <Trophy size={17} />
              </div>

            </div>

            {statsLoading ? (
              <div className="mt-3 flex items-center gap-2">
                <Loader2
                  size={18}
                  className="animate-spin text-zinc-500"
                />

                <span className="text-sm text-zinc-500">
                  Loading...
                </span>
              </div>
            ) : (
              <p className="mt-3 text-3xl font-bold">
                {stats.testsAttempted}
              </p>
            )}

            <p className="mt-1 text-xs text-zinc-600">
              Completed mock tests
            </p>

          </div>

          {/* AVERAGE SCORE */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-zinc-500">
                Average Score
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                <Brain size={17} />
              </div>

            </div>

            {statsLoading ? (
              <div className="mt-3 flex items-center gap-2">
                <Loader2
                  size={18}
                  className="animate-spin text-zinc-500"
                />

                <span className="text-sm text-zinc-500">
                  Loading...
                </span>
              </div>
            ) : (
              <p className="mt-3 text-3xl font-bold">
                {stats.averageScore}%
              </p>
            )}

            <p className="mt-1 text-xs text-zinc-600">
              Your overall performance
            </p>

          </div>

        </div>

        {/* STATS ERROR */}

        {statsError && (
          <div className="mb-8 rounded-2xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
            Unable to load dashboard statistics:{" "}
            {statsError}
          </div>
        )}

        {/* =================================================
            LEARNING OPTIONS
        ================================================= */}

        <div>

          <div className="mb-5">

            <h2 className="text-xl font-semibold">
              Start Learning
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Choose what you want to study today.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900"
                >

                  <div className="mb-5 flex items-center justify-between">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950 transition group-hover:scale-105">
                      <Icon size={21} />
                    </div>

                    <ArrowRight
                      size={18}
                      className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white"
                    />

                  </div>

                  <h3 className="font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {item.description}
                  </p>

                  <div className="mt-5 text-xs font-medium text-zinc-400 group-hover:text-white">
                    Open →
                  </div>

                </Link>
              );
            })}

          </div>

        </div>

        {/* =================================================
            QUICK MCQ ACCESS
        ================================================= */}

        <div className="mt-10">

          <Link
            href="/dashboard/mcqs"
            className="group flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-700 hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
          >

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-950">
                <Brain size={22} />
              </div>

              <div>

                <h3 className="font-semibold">
                  MCQ Practice
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Open MCQs and choose a subject to start practicing.
                </p>

              </div>

            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition group-hover:text-white">

              Start Practice

              <ArrowRight
                size={17}
                className="transition group-hover:translate-x-1"
              />

            </div>

          </Link>

        </div>

      </section>

    </main>
  );
}