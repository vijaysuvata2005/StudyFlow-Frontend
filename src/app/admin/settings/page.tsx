
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

interface AdminProfile {
  id: string;
  username: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function AdminSettingsPage() {
  const [profile, setProfile] =
    useState<AdminProfile | null>(null);

  const [username, setUsername] =
    useState("");

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [changingPassword, setChangingPassword] =
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

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        window.location.href =
          "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load admin profile"
        );
      }

      setProfile(data.admin);

      setUsername(
        data.admin.username || ""
      );

      setPhoneNumber(
        data.admin.phoneNumber || ""
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!username.trim()) {
      setError(
        "Username cannot be empty"
      );
      return;
    }

    if (!phoneNumber.trim()) {
      setError(
        "Phone number cannot be empty"
      );
      return;
    }

    try {
      setSavingProfile(true);

      const token = getToken();

      if (!token) {
        window.location.href =
          "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username:
              username.trim(),
            phoneNumber:
              phoneNumber.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update profile"
        );
      }

      setProfile(data.admin);

      setUsername(
        data.admin.username || ""
      );

      setPhoneNumber(
        data.admin.phoneNumber || ""
      );

      setMessage(
        "Profile updated successfully"
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "Please fill all password fields"
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters"
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "New password and confirm password do not match"
      );
      return;
    }

    if (
      currentPassword === newPassword
    ) {
      setError(
        "New password must be different from current password"
      );
      return;
    }

    try {
      setChangingPassword(true);

      const token = getToken();

      if (!token) {
        window.location.href =
          "/admin/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to change password"
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password changed successfully"
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "studyflow_admin_token"
    );

    localStorage.removeItem(
      "studyflow_admin"
    );

    window.location.href =
      "/admin/login";
  };

  const formatDate = (
    date?: string
  ) => {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Loading settings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950">
              <ShieldCheck
                size={19}
              />
            </div>

            <div>
              <p className="font-semibold">
                StudyFlow
              </p>

              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Admin Settings
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

      {/* CONTENT */}

      <section className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        {/* TITLE */}

        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400">
            <ShieldCheck size={14} />
            Account & Security
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Manage your administrator profile,
            security and account preferences.
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

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* LEFT */}

          <div className="space-y-6">
            {/* PROFILE */}

            <form
              onSubmit={
                handleProfileSubmit
              }
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                  <User size={20} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Admin Profile
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Update your administrator
                    account information.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Username
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    placeholder="admin"
                    className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                    />

                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) =>
                        setPhoneNumber(
                          event.target.value
                        )
                      }
                      placeholder="Phone number"
                      className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-11 pr-4 text-sm outline-none placeholder:text-zinc-600 focus:border-white"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-xs text-zinc-600">
                    Account Role
                  </p>

                  <p className="mt-1 text-sm font-medium capitalize text-zinc-300">
                    {profile?.role ||
                      "Admin"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-xs text-zinc-600">
                    Account Status
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        profile?.isActive
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    />

                    <span className="text-sm font-medium text-zinc-300">
                      {profile?.isActive
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    savingProfile
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* PASSWORD */}

            <form
              onSubmit={
                handlePasswordSubmit
              }
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                  <KeyRound size={20} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Change Password
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Keep your administrator account
                    secure with a strong password.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <PasswordInput
                  label="Current Password"
                  value={
                    currentPassword
                  }
                  onChange={
                    setCurrentPassword
                  }
                  visible={
                    showCurrentPassword
                  }
                  onToggle={() =>
                    setShowCurrentPassword(
                      !showCurrentPassword
                    )
                  }
                />

                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  onChange={
                    setNewPassword
                  }
                  visible={
                    showNewPassword
                  }
                  onToggle={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                />

                <PasswordInput
                  label="Confirm New Password"
                  value={
                    confirmPassword
                  }
                  onChange={
                    setConfirmPassword
                  }
                  visible={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    changingPassword
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {changingPassword ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound
                        size={16}
                      />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT SIDEBAR */}

          <aside className="space-y-6">
            {/* ACCOUNT CARD */}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-zinc-950">
                  {username
                    ? username
                        .charAt(0)
                        .toUpperCase()
                    : "A"}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {username ||
                      "Administrator"}
                  </p>

                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {phoneNumber ||
                      "No phone number"}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-800 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">
                    Member since
                  </span>

                  <span className="text-xs text-zinc-400">
                    {formatDate(
                      profile?.createdAt
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* SECURITY CARD */}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 text-emerald-500"
                />

                <div>
                  <h3 className="text-sm font-semibold">
                    Security
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Your admin login uses password
                    authentication followed by OTP
                    verification.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Two-step verification
                  </span>

                  <span className="rounded-md bg-emerald-950 px-2 py-1 text-[10px] font-medium text-emerald-400">
                    Enabled
                  </span>
                </div>
              </div>
            </div>

            {/* LOGOUT */}

            <div className="rounded-2xl border border-red-950/60 bg-red-950/10 p-5">
              <div className="flex items-start gap-3">
                <LogOut
                  size={19}
                  className="mt-0.5 text-red-400"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-red-300">
                    Sign out
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-red-400/60">
                    Sign out from the StudyFlow
                    admin panel on this device.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="mt-4 w-full rounded-xl border border-red-900/70 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| PASSWORD INPUT
|--------------------------------------------------------------------------
*/

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  visible: boolean;
  onToggle: () => void;
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: PasswordInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-300">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder="••••••••"
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 pr-12 text-sm outline-none placeholder:text-zinc-700 focus:border-white"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          {visible ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </div>
  );
}

