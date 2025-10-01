"use client";

import Loading from "@/app/components/Loading";
import Sidebar from "@/app/components/Sidebar";
import SuspendedList from "@/app/components/SuspendedList";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Suspended() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState(user?.role === "admin" ? "users" : "posts");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Reset tab to a valid option based on user role
    if (user?.role !== "admin" && tab === "users") {
      setTab("posts");
    }
  }, [user, tab]);

  if (loading) {
    return <Loading />;
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="p-6 w-full max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Suspended Content
        </h1>
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
          {user.role === "admin" && (
            <button
              className={`pb-3 px-6 font-medium transition-colors ${
                tab === "users"
                  ? "border-b-2 border-primary text-primary dark:text-violet-400 dark:border-violet-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
              onClick={() => setTab("users")}
              aria-selected={tab === "users"}
              aria-label="View suspended users"
            >
              Users
            </button>
          )}
          <button
            className={`pb-3 px-6 font-medium transition-colors ${
              tab === "posts"
                ? "border-b-2 border-primary text-primary dark:text-violet-400 dark:border-violet-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
            onClick={() => setTab("posts")}
            aria-selected={tab === "posts"}
            aria-label="View suspended posts"
          >
            Posts
          </button>
          <button
            className={`pb-3 px-6 font-medium transition-colors ${
              tab === "comments"
                ? "border-b-2 border-primary text-primary dark:text-violet-400 dark:border-violet-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
            onClick={() => setTab("comments")}
            aria-selected={tab === "comments"}
            aria-label="View suspended comments"
          >
            Comments
          </button>
        </div>
        <SuspendedList
          type={tab}
          isAdmin={user.role === "admin"}
          userName={user.userName}
        />
      </div>
    </div>
  );
}
