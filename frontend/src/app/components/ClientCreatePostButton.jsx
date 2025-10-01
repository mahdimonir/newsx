"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ClientCreatePostButton() {
  const { user } = useAuth();
  return (
    user && (
      <Link
        href="/profile/create"
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-violet-600"
        aria-label="Create a new post"
      >
        Create Post
      </Link>
    )
  );
}
