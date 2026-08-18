"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  GraduationCap,
  LockKeyhole,
  UserRound,
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const response = await fetch(
        `${API_URL}/api/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      // Save JWT token
      localStorage.setItem(
        "studyflow_token",
        data.token
      );

      // Save logged-in user
      localStorage.setItem(
        "studyflow_user",
        JSON.stringify(data.user)
      );

      // Go to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);

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
    <main className="min-h-screen bg-zinc-950 px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full">

          {/* Logo + Heading */}

          <div className="mb-8 text-center">
            <Link
              href="/"
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-950"
            >
              <GraduationCap size={28} />
            </Link>

            <h1 className="text-3xl font-bold">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Sign in to continue learning.
            </p>
          </div>

          {/* Login Card */}

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8">
            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* Username */}

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
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
                    placeholder="Enter your username"
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-4 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
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
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-4 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
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
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}

                {!loading && (
                  <ArrowRight size={17} />
                )}
              </button>
            </form>

            {/* Register */}

            <div className="mt-6 border-t border-zinc-800 pt-6 text-center">
              <p className="text-sm text-zinc-400">
                Don't have an account?{" "}

                <Link
                  href="/register"
                  className="font-medium text-white hover:underline"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Back */}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              ← Back to StudyFlow
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}