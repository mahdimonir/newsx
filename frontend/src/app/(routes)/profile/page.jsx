"use client";

import Loading from "@/app/components/Loading";
import Sidebar from "@/app/components/Sidebar";
import UserProfile from "@/app/components/UserProfile";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading />;
  }

  if (!user) return null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-4 w-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-950 dark:text-gray-100">
          Profile
        </h1>
        <UserProfile userName={user.userName} />
      </div>
    </div>
  );
}
