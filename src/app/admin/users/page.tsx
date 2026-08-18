
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getToken = () => {
    return localStorage.getItem(
      "studyflow_admin_token"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SAFE JSON RESPONSE
  |--------------------------------------------------------------------------
  */

  const parseResponse = async (
    response: Response
  ) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();

      throw new Error(
        response.ok
          ? "Server returned an invalid response"
          : `Server error (${response.status})`
      );
    }

    return response.json();
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD USERS
  |--------------------------------------------------------------------------
  */

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const [usersResponse, statsResponse] =
        await Promise.all([
          fetch(
            `${API_URL}/api/admin/users`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          ),

          fetch(
            `${API_URL}/api/admin/users/stats`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          ),
        ]);

      const usersData =
        await parseResponse(usersResponse);

      const statsData =
        await parseResponse(statsResponse);

      if (!usersResponse.ok) {
        throw new Error(
          usersData.message ||
            "Failed to load users"
        );
      }

      if (!statsResponse.ok) {
        throw new Error(
          statsData.message ||
            "Failed to load user statistics"
        );
      }

      setUsers(usersData.users || []);

      setStats(
        statsData.stats || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
        }
      );
    } catch (err) {
      console.error("Load users error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | UPDATE USER STATUS
  |--------------------------------------------------------------------------
  */

  const toggleUserStatus = async (
    user: User
  ) => {
    try {
      setActionLoading(user._id);
      setError("");
      setMessage("");

      const token = getToken();

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/users/${user._id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: !user.isActive,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update user status"
        );
      }

      setMessage(
        user.isActive
          ? `${user.username} has been deactivated`
          : `${user.username} has been activated`
      );

      await loadUsers();
    } catch (err) {
      console.error(
        "Update user status error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update user status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE USER
  |--------------------------------------------------------------------------
  */

  const deleteUser = async (user: User) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${user.username}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(user._id);
      setError("");
      setMessage("");

      const token = getToken();

      if (!token) {
        window.location.href = "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/users/${user._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete user"
        );
      }

      setMessage(
        "User deleted successfully"
      );

      await loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete user"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER USERS
  |--------------------------------------------------------------------------
  */

  const filteredUsers = useMemo(() => {
    const text = search
      .trim()
      .toLowerCase();

    if (!text) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name
          .toLowerCase()
          .includes(text) ||
        user.username
          .toLowerCase()
          .includes(text) ||
        user.email
          .toLowerCase()
          .includes(text)
      );
    });
  }, [users, search]);

  /*
  |--------------------------------------------------------------------------
  | DATE FORMAT
  |--------------------------------------------------------------------------
  */

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

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
              <Users size={19} />
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

        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400">
            <ShieldCheck size={14} />
            User Management
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Users
          </h1>

          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            View and manage registered StudyFlow users.
          </p>
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

        {/* STATS */}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
              <Users
                size={19}
                className="text-zinc-300"
              />
            </div>

            <p className="text-sm text-zinc-500">
              Total Users
            </p>

            <p className="mt-1 text-3xl font-bold">
              {stats.totalUsers}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950">
              <UserCheck
                size={19}
                className="text-emerald-400"
              />
            </div>

            <p className="text-sm text-zinc-500">
              Active Users
            </p>

            <p className="mt-1 text-3xl font-bold">
              {stats.activeUsers}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-950">
              <UserX
                size={19}
                className="text-red-400"
              />
            </div>

            <p className="text-sm text-zinc-500">
              Inactive Users
            </p>

            <p className="mt-1 text-3xl font-bold">
              {stats.inactiveUsers}
            </p>
          </div>
        </div>

        {/* USER LIST */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
          {/* LIST HEADER */}

          <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-semibold">
                Registered Users
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {filteredUsers.length} of{" "}
                {users.length} users shown
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
                placeholder="Search users..."
                className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-11 pr-4 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>
          </div>

          {/* CONTENT */}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={25}
                className="animate-spin text-zinc-500"
              />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-5 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
                <Users
                  size={25}
                  className="text-zinc-600"
                />
              </div>

              <h3 className="text-lg font-semibold">
                No users found
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                {search
                  ? "Try a different search."
                  : "No registered users yet."}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-600">
                      <th className="px-6 py-4 font-medium">
                        User
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Email
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Joined
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map(
                      (user) => {
                        const busy =
                          actionLoading ===
                          user._id;

                        return (
                          <tr
                            key={user._id}
                            className="border-b border-zinc-800/70 transition hover:bg-zinc-900"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300">
                                  {user.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-medium text-zinc-200">
                                    {user.name}
                                  </p>

                                  <p className="truncate text-xs text-zinc-600">
                                    @{user.username}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-xs truncate px-6 py-5 text-sm text-zinc-400">
                              {user.email}
                            </td>

                            <td className="px-6 py-5 text-sm text-zinc-500">
                              {formatDate(
                                user.createdAt
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
                                  user.isActive
                                    ? "bg-emerald-950 text-emerald-400"
                                    : "bg-red-950 text-red-400"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    user.isActive
                                      ? "bg-emerald-400"
                                      : "bg-red-400"
                                  }`}
                                />

                                {user.isActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    toggleUserStatus(
                                      user
                                    )
                                  }
                                  className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {busy ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : user.isActive ? (
                                    "Deactivate"
                                  ) : (
                                    "Activate"
                                  )}
                                </button>

                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    deleteUser(
                                      user
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-red-900 hover:bg-red-950/30 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="Delete User"
                                >
                                  <Trash2
                                    size={15}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="space-y-3 p-4 md:hidden">
                {filteredUsers.map(
                  (user) => {
                    const busy =
                      actionLoading ===
                      user._id;

                    return (
                      <div
                        key={user._id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 font-semibold text-zinc-300">
                              {user.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {user.name}
                              </p>

                              <p className="truncate text-xs text-zinc-600">
                                @{user.username}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-lg px-2 py-1 text-[10px] ${
                              user.isActive
                                ? "bg-emerald-950 text-emerald-400"
                                : "bg-red-950 text-red-400"
                            }`}
                          >
                            {user.isActive
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
                          <p className="break-all text-sm text-zinc-400">
                            {user.email}
                          </p>

                          <p className="text-xs text-zinc-600">
                            Joined{" "}
                            {formatDate(
                              user.createdAt
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              toggleUserStatus(
                                user
                              )
                            }
                            className="flex-1 rounded-lg border border-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-40"
                          >
                            {busy ? (
                              <Loader2
                                size={14}
                                className="mx-auto animate-spin"
                              />
                            ) : user.isActive ? (
                              "Deactivate"
                            ) : (
                              "Activate"
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              deleteUser(
                                user
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-red-900 hover:bg-red-950/30 hover:text-red-400 disabled:opacity-40"
                            title="Delete User"
                          >
                            <Trash2
                              size={15}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

