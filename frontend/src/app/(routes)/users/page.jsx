"use client";

import Loading from "@/app/components/Loading";
import UserCard from "@/app/components/UserCard";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get("/users", {
        params: { page, limit },
      });
      const fetchedUsers = response.data?.data?.users || [];
      // Clean up malformed data
      const cleanedUsers = fetchedUsers.map((user) => ({
        ...user,
        followers: Array.isArray(user.followers)
          ? user.followers
              .filter((f) => f && f.userName)
              .map((f) => ({
                _id: f._id || "",
                userName: f.userName,
              }))
          : [],
        following: Array.isArray(user.following)
          ? user.following
              .filter((f) => f && f.userName)
              .map((f) => ({
                _id: f._id || "",
                userName: f.userName,
              }))
          : [],
        bio: user.bio || "",
        avatar: user.avatar || "",
      }));
      setUsers(cleanedUsers);
      setTotalPages(response.data?.data?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (loading || authLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        {/* Header with Title and Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            All Users
          </h1>
          {currentUser && (
            <Link
              href={
                currentUser.userName
                  ? "/profile/edit"
                  : `/users/${currentUser.userName || ""}`
              }
              className="px-4 py-2 bg-primary text-white rounded-full hover:bg-violet-600 text-sm transition-colors"
              aria-label={
                currentUser.userName
                  ? "Edit your profile"
                  : "Visit your profile"
              }
            >
              {currentUser.userName ? "Edit Profile" : "Visit Profile"}
            </Link>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-3 rounded-md mb-6 text-center">
            {error}
          </p>
        )}

        {/* Users Grid */}
        {users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 text-center">
            No users available.
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-800 dark:text-gray-100">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
