"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Dashboard par button nahi dikhana
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="
        fixed
        left-4
        top-4
        z-50
        flex
        h-10
        items-center
        gap-2
        rounded-xl
        border
        border-zinc-800
        bg-zinc-950/90
        px-3
        text-sm
        font-medium
        text-zinc-300
        shadow-lg
        backdrop-blur-md
        transition
        hover:border-zinc-600
        hover:bg-zinc-900
        hover:text-white
        active:scale-95
        sm:left-6
        sm:top-6
      "
      aria-label="Go back"
    >
      <ArrowLeft size={17} />

      <span className="hidden sm:inline">
        Back
      </span>
    </button>
  );
}