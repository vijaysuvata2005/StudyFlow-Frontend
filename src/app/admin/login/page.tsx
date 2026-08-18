"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

interface AdminData {
  id: string;
  username: string;
  phoneNumber: string;
  role: string;
}

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * If admin is already logged in,
   * directly open dashboard.
   */
  useEffect(() => {
    const token = localStorage.getItem(
      "studyflow_admin_token"
    );

    const savedAdmin = localStorage.getItem(
      "studyflow_admin"
    );

    if (token && savedAdmin) {
      window.location.href = "/admin/dashboard";
    }
  }, []);

  /*
   * Admin username + password login
   */
const handleLogin = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  setLoading(true);
  setError("");

  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Admin login failed"
      );
    }

    if (!data.token || !data.admin) {
      throw new Error(
        "Admin authentication data was not received."
      );
    }

    localStorage.setItem(
      "studyflow_admin_token",
      data.token
    );

    localStorage.setItem(
      "studyflow_admin",
      JSON.stringify(data.admin)
    );

    window.location.href = "/admin/dashboard";
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Something went wrong"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">

          {/* Header */}

          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-xl">
              <ShieldCheck
                size={28}
                strokeWidth={2.2}
              />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              StudyFlow
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Admin Portal
            </p>
          </div>

          {/* Login Card */}

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl sm:p-8">

            <div className="mb-7">
              <h2 className="text-xl font-semibold">
                Admin Sign In
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Sign in using your admin credentials.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* Username */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Username
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    placeholder="Enter admin username"
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter admin password"
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {/* Error */}

              {error && (
                <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Login Button */}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}

                {!loading && (
                  <ArrowRight size={17} />
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            StudyFlow Admin • Secure Access
          </p>
        </div>
      </div>
    </main>
  );
}