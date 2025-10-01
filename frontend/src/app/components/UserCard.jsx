"use client";

import { capitalizeFirstLetter, formatDate } from "@/app/configs/constants";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import {
  Ban,
  CheckCircle,
  Edit,
  Loader2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Demo_Image } from "../assets/demo";

export default function UserCard({ user, onClick, compact = false }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSuspended, setIsSuspended] = useState(user.isSuspended || false);
  const [suspending, setSuspending] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    currentUser &&
      Array.isArray(user.followers) &&
      user.followers.some((f) => f.userName === currentUser.userName)
  );
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    name = "Unknown User",
    userName = "unknown",
    avatar = Demo_Image,
    bio = "",
    followers = [],
    following = [],
    isVerified = false,
    createdAt,
  } = user;

  const secureAvatarUrl =
    avatar && typeof avatar === "string" && avatar.startsWith("http://")
      ? avatar.replace("http://", "https://")
      : avatar || Demo_Image;

  const handleSuspend = async () => {
    if (!currentUser || currentUser.role !== "admin") return;
    setSuspending(true);
    setError(null);
    try {
      const response = await axiosInstance.patch(
        `/admin/suspend/user/${userName}`,
        {},
        { withCredentials: true }
      );
      setIsSuspended(response.data.data.isSuspended);
      toast.success(
        response.data.message ||
          (isSuspended ? "User unsuspended" : "User suspended")
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update suspension status";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSuspending(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (currentUser.userName === userName) return;

    setIsFollowLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(
        "/users/follow",
        { userName },
        { withCredentials: true }
      );
      setIsFollowing(response.data.data.isFollowing);
      toast.success(
        response.data.message ||
          (response.data.data.isFollowing ? "Followed" : "Unfollowed")
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update follow status";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <article
      className={`rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-shadow hover:shadow-md ${
        compact ? "p-2" : "p-4"
      }`}
    >
      <section className="flex items-center gap-3">
        <Link href={`/users/${userName}`} onClick={onClick}>
          {secureAvatarUrl ? (
            <div
              className={`${
                compact ? "w-10 h-10" : "w-16 h-16"
              } rounded-full overflow-hidden border border-gray-200 dark:border-gray-700`}
            >
              <Image
                src={secureAvatarUrl}
                alt={`${userName}'s avatar`}
                width={compact ? 40 : 64}
                height={compact ? 40 : 64}
                className="object-cover w-full h-full"
                unoptimized
                onError={(e) => {
                  e.target.src = Demo_Image;
                }}
              />
            </div>
          ) : (
            <div
              className={`${
                compact ? "w-10 h-10" : "w-16 h-16"
              } rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold`}
            >
              {userName[0]?.toUpperCase() || "?"}
            </div>
          )}
        </Link>
        <div className="flex-1">
          <Link href={`/users/${userName}`} onClick={onClick}>
            <h3 className={`font-bold ${compact ? "text-sm" : "text-lg"}`}>
              {capitalizeFirstLetter(name || userName)}
              {isSuspended && (
                <span className="text-red-500 text-xs"> (Suspended)</span>
              )}
            </h3>
            <p
              className={`text-gray-600 dark:text-gray-400 ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              @{capitalizeFirstLetter(userName)}
            </p>
          </Link>
          {compact && bio && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              {bio}
            </p>
          )}
        </div>
      </section>

      {!compact && (
        <>
          <section className={`text-center ${compact ? "mt-2" : "mt-4"}`}>
            <div className="flex justify-center items-center gap-2 mb-3">
              {isVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Verified
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Not Verified
                </span>
              )}
            </div>

            {bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {bio}
              </p>
            )}

            <div className="flex justify-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <strong>
                  {Array.isArray(followers) ? followers.length : 0}
                </strong>{" "}
                Followers
              </span>
              <span>
                <strong>
                  {Array.isArray(following) ? following.length : 0}
                </strong>{" "}
                Following
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Joined {formatDate(createdAt)}
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={`/users/${userName}`}
                onClick={onClick}
                className="inline-block px-4 py-2 bg-primary text-white rounded-full hover:bg-violet-600 text-sm transition-colors"
                aria-label={`View ${userName}'s profile`}
              >
                View Profile
              </Link>

              {!authLoading &&
                currentUser &&
                currentUser.userName !== userName && (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`px-4 py-2 rounded-full text-sm flex items-center justify-center gap-2 ${
                      isFollowing
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                        : "bg-primary text-white hover:bg-violet-600"
                    } ${
                      isFollowLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    aria-label={
                      isFollowing
                        ? `Unfollow ${userName}`
                        : `Follow ${userName}`
                    }
                  >
                    {isFollowLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4" /> Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" /> Follow
                      </>
                    )}
                  </button>
                )}

              {!authLoading &&
                currentUser &&
                currentUser.userName === userName && (
                  <Link
                    href="/profile/edit"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 text-sm flex items-center justify-center gap-2 transition-colors"
                    aria-label="Edit your profile"
                  >
                    <Edit className="h-4 w-4" /> Edit Profile
                  </Link>
                )}

              {!authLoading &&
                currentUser &&
                currentUser.role === "admin" &&
                currentUser.userName !== userName && (
                  <button
                    onClick={handleSuspend}
                    disabled={suspending}
                    className={`px-4 py-2 rounded-full text-sm flex items-center justify-center gap-2 ${
                      isSuspended
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-red-500 text-white hover:bg-red-600"
                    } ${suspending ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-label={
                      isSuspended
                        ? `Unsuspend ${userName}`
                        : `Suspend ${userName}`
                    }
                  >
                    {suspending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSuspended ? (
                      <>
                        <CheckCircle className="h-4 w-4" /> Unsuspend
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4" /> Suspend
                      </>
                    )}
                  </button>
                )}
            </div>
          </section>
        </>
      )}
    </article>
  );
}
