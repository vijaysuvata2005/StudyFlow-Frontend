
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";

interface Admin {
  id?: string;
  username?: string;
  role?: string;
}

interface DashboardStats {
  subjects: number;
  notes: number;
  mcqs: number;
  mockTests: number;
  users: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const menuItems = [
  {
    title: "Subjects",
    description: "Create and manage subjects",
    icon: BookOpen,
    href: "/admin/subjects",
  },
  {
    title: "Study Notes",
    description: "Add and manage study notes",
    icon: FileText,
    href: "/admin/notes",
  },
  {
    title: "MCQ Questions",
    description: "Create practice questions",
    icon: Brain,
    href: "/admin/mcqs",
  },
  {
    title: "Mock Tests",
    description: "Create and manage tests",
    icon: Trophy,
    href: "/admin/mock-tests",
  },
  {
    title: "Users",
    description: "View registered users",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Settings",
    description: "Manage admin settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    subjects: 0,
    notes: 0,
    mcqs: 0,
    mockTests: 0,
    users: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | SAFE JSON RESPONSE
  |--------------------------------------------------------------------------
  */

  const fetchJson = async (response: Response, endpoint: string) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();

      console.error(
        `Non-JSON response from ${endpoint}:`,
        text.slice(0, 500)
      );

      throw new Error(
        `Non-JSON response from ${endpoint}`
      );
    }

    return response.json();
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD DASHBOARD STATS
  |--------------------------------------------------------------------------
  */

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);

      const token = localStorage.getItem(
        "studyflow_admin_token"
      );

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        subjectsResponse,
        notesResponse,
        mcqsResponse,
        mockTestsResponse,
        usersResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/api/subjects/all`,
          {
            headers,
            cache: "no-store",
          }
        ),

        fetch(
          `${API_URL}/api/notes/all`,
          {
            headers,
            cache: "no-store",
          }
        ),

        fetch(
          `${API_URL}/api/mcqs/all`,
          {
            headers,
            cache: "no-store",
          }
        ),

        fetch(
          `${API_URL}/api/mock-tests/all`,
          {
            headers,
            cache: "no-store",
          }
        ),

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT:
        | USERS API MUST MATCH ADMIN USERS PAGE
        |--------------------------------------------------------------------------
        */

        fetch(
          `${API_URL}/api/admin/users`,
          {
            headers,
            cache: "no-store",
          }
        ),
      ]);

      const subjectsData = await fetchJson(
        subjectsResponse,
        "/api/subjects/all"
      );

      const notesData = await fetchJson(
        notesResponse,
        "/api/notes/all"
      );

      const mcqsData = await fetchJson(
        mcqsResponse,
        "/api/mcqs/all"
      );

      const mockTestsData = await fetchJson(
        mockTestsResponse,
        "/api/mock-tests/all"
      );

      const usersData = await fetchJson(
        usersResponse,
        "/api/admin/users"
      );

      /*
      |--------------------------------------------------------------------------
      | CHECK RESPONSES
      |--------------------------------------------------------------------------
      */

      if (!subjectsResponse.ok) {
        throw new Error(
          subjectsData.message ||
            "Failed to load subjects"
        );
      }

      if (!notesResponse.ok) {
        throw new Error(
          notesData.message ||
            "Failed to load notes"
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

      if (!usersResponse.ok) {
        throw new Error(
          usersData.message ||
            "Failed to load users"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SET COUNTS
      |--------------------------------------------------------------------------
      */

      setStats({
        subjects:
          subjectsData.subjects?.length || 0,

        notes:
          notesData.notes?.length || 0,

        mcqs:
          mcqsData.mcqs?.length || 0,

        mockTests:
          mockTestsData.mockTests?.length || 0,

        users:
          usersData.users?.length || 0,
      });
    } catch (error) {
      console.error(
        "Dashboard stats error:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | KEEP DASHBOARD WORKING EVEN IF ONE API FAILS
      |--------------------------------------------------------------------------
      */

      setStats((currentStats) => ({
        ...currentStats,
      }));
    } finally {
      setStatsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CHECK ADMIN + LOAD STATS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const savedAdmin =
      localStorage.getItem(
        "studyflow_admin"
      );

    const token =
      localStorage.getItem(
        "studyflow_admin_token"
      );

    if (!token || !savedAdmin) {
      window.location.href =
        "/admin/login";

      return;
    }

    try {
      const parsedAdmin =
        JSON.parse(savedAdmin);

      setAdmin(parsedAdmin);

      loadDashboardStats();
    } catch {
      localStorage.removeItem(
        "studyflow_admin"
      );

      localStorage.removeItem(
        "studyflow_admin_token"
      );

      window.location.href =
        "/admin/login";
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    localStorage.removeItem(
      "studyflow_admin"
    );

    localStorage.removeItem(
      "studyflow_admin_token"
    );

    window.location.href =
      "/admin/login";
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (!admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />

          <p className="text-sm text-zinc-400">
            Loading Admin Dashboard...
          </p>
        </div>
      </main>
    );
  }

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

          {/* LOGO */}

          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
              <LayoutDashboard size={19} />
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

          {/* DESKTOP */}

          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-sm font-medium">
                Admin
              </p>

              <p className="text-xs text-zinc-500">
                @{admin.username || "admin"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* MOBILE */}

          <button
            onClick={() =>
              setMobileMenu(!mobileMenu)
            }
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
            <div className="mb-4">
              <p className="text-sm font-medium">
                Admin
              </p>

              <p className="text-xs text-zinc-500">
                @{admin.username || "admin"}
              </p>
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

      {/* MAIN */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-12">

        {/* HEADING */}

        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400">
            <LayoutDashboard size={14} />
            Administration
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Manage your StudyFlow learning
            platform from one simple dashboard.
          </p>
        </div>

        {/* STATS */}

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {/* SUBJECTS */}

          <Link
            href="/admin/subjects"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">
              Subjects
            </p>

            <p className="mt-2 text-2xl font-bold">
              {statsLoading
                ? "..."
                : stats.subjects}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Total subjects
            </p>
          </Link>

          {/* NOTES */}

          <Link
            href="/admin/notes"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">
              Notes
            </p>

            <p className="mt-2 text-2xl font-bold">
              {statsLoading
                ? "..."
                : stats.notes}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Published notes
            </p>
          </Link>

          {/* MCQS */}

          <Link
            href="/admin/mcqs"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">
              MCQs
            </p>

            <p className="mt-2 text-2xl font-bold">
              {statsLoading
                ? "..."
                : stats.mcqs}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Practice questions
            </p>
          </Link>

          {/* MOCK TESTS */}

          <Link
            href="/admin/mock-tests"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">
              Mock Tests
            </p>

            <p className="mt-2 text-2xl font-bold">
              {statsLoading
                ? "..."
                : stats.mockTests}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Created tests
            </p>
          </Link>

          {/* USERS */}

          <Link
            href="/admin/users"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">
              Users
            </p>

            <p className="mt-2 text-2xl font-bold">
              {statsLoading
                ? "..."
                : stats.users}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Registered users
            </p>
          </Link>
        </div>

        {/* MANAGEMENT */}

        <div>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Manage StudyFlow
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Choose what you want to manage.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950 transition group-hover:scale-105">
                    <Icon size={21} />
                  </div>

                  <h3 className="font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

