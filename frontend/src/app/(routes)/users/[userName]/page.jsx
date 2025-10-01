"use client";

import Loading from "@/app/components/Loading";
import UserProfile from "@/app/components/UserProfile";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserProfilePage() {
  const { userName } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userName) {
      setError("Invalid username");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userName]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-red-500">{error}</p>
        <a
          href="/users"
          className="mt-4 inline-block text-primary hover:text-violet-600"
        >
          Back to Users
        </a>
      </div>
    );
  }

  return <UserProfile userName={userName} />;
}
