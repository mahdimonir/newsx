"use client";

import axiosInstance from "@/app/utils/axiosConfig";
import { Ban, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { capitalizeFirstLetter, formatDate } from "../configs/constants";
import Error from "./Error";
import Loading from "./Loading";

export default function SuspendedList({ type, isAdmin, userName }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState({});

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItems([]);
        const endpoint = isAdmin
          ? `/admin/suspended/${type}`
          : `/users/suspended/${type}`;
        console.log(`Fetching ${type} from ${endpoint}, isAdmin: ${isAdmin}`);
        const response = await axiosInstance.get(endpoint);
        const fetchedItems = response.data.data[type] || [];
        console.log(`Fetched ${type}:`, fetchedItems);
        setItems(fetchedItems);
      } catch (err) {
        const message =
          err.response?.data?.message || `Failed to fetch suspended ${type}`;
        console.error(`Error fetching ${type}:`, err.response?.status, err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    if (type) {
      fetchItems();
    }
  }, [type, isAdmin, userName]);

  const handleToggleSuspend = async (id, userName) => {
    if (!isAdmin) return;
    const key = `${type}-${id || userName}`;
    setSuspendLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const endpoint =
        type === "users"
          ? `/admin/suspend/user/${userName}`
          : type === "posts"
          ? `/admin/suspend/post/${id}`
          : `/admin/suspend/comment/${id}`;
      const response = await axiosInstance.patch(endpoint);
      setItems((prev) =>
        prev.map((item) => {
          const isMatch =
            (type === "users" && item.userName === userName) ||
            (type !== "users" && item._id === id);
          return isMatch
            ? { ...item, isSuspended: response.data.data.isSuspended }
            : item;
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.message || `Failed to toggle ${type} suspension`
      );
    } finally {
      setSuspendLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  return (
    <div className="grid gap-4">
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item._id || item.userName}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-start border border-gray-200 dark:border-gray-700"
            role="listitem"
          >
            <div className="flex flex-col gap-2">
              {type === "users" && (
                <div className="flex items-center gap-3">
                  {item.avatar ? (
                    <>
                      {(() => {
                        const secureAvatarUrl = item.avatar?.startsWith(
                          "http://"
                        )
                          ? item.avatar.replace("http://", "https://")
                          : item.avatar;
                        return (
                          <Image
                            src={secureAvatarUrl}
                            alt={`${item.name}'s avatar`}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        );
                      })()}
                    </>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.name?.[0] || "@"}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {item.name} <span className="text-gray-400">|</span> (
                      {item.userName})
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.email}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Joined: {formatDate(item.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Posts: {item.postCount || 0} | Role:{" "}
                      {capitalizeFirstLetter(item.role) || "User"}
                    </p>
                    <p className="text-sm italic text-red-500 dark:text-red-400">
                      Reason:{" "}
                      {item.suspensionReason ||
                        "Violated the terms of condition"}
                    </p>
                  </div>
                </div>
              )}
              {type === "posts" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.excerpt || item.content?.substring(0, 100) + "..."}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    By: @{item.author?.userName || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Created: {formatDate(item.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Likes: {item.likeCount || item.likes?.length || 0} |
                    Comments: {item.commentCount || 0}
                  </p>
                  <p className="text-sm italic text-red-500 dark:text-red-400">
                    Reason:{" "}
                    {item.suspensionReason || "Violated the terms of condition"}
                  </p>
                </div>
              )}
              {type === "comments" && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.content}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    On:{" "}
                    <a
                      href={`/posts/${item.post?._id}`}
                      className="text-primary hover:underline"
                    >
                      {item.post?.title || "Visit Post"}
                    </a>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    By: @{item.author?.userName || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Created: {formatDate(item.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Likes: {item.likeCount || 0}
                  </p>
                  {item.parentComment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Replying to:{" "}
                      {item.parentComment.content?.substring(0, 50) + "..."}
                    </p>
                  )}
                  <p className="text-sm italic text-red-500 dark:text-red-400">
                    Reason:{" "}
                    {item.suspensionReason || "Violated the terms of condition"}
                  </p>
                </div>
              )}
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:{" "}
                <span
                  className={
                    item.isSuspended
                      ? "text-yellow-500 font-bold"
                      : "text-green-500 font-bold"
                  }
                >
                  {item.isSuspended ? "Suspended" : "Active"}
                </span>
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleToggleSuspend(item._id, item.userName)}
                disabled={
                  suspendLoading[`${type}-${item._id || item.userName}`]
                }
                className={`flex items-center px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  item.isSuspended
                    ? "bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800"
                    : "bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800"
                } ${
                  suspendLoading[`${type}-${item._id || item.userName}`]
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                title={
                  item.isSuspended ? "Unsuspend this item" : "Suspend this item"
                }
                aria-label={item.isSuspended ? "Unsuspend" : "Suspend"}
              >
                {suspendLoading[`${type}-${item._id || item.userName}`] ? (
                  "Loading..."
                ) : item.isSuspended ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-white" />{" "}
                    Unsuspend
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2 text-white" /> Suspend
                  </>
                )}
              </button>
            )}
          </div>
        ))
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
          No suspended {type}
        </div>
      )}
    </div>
  );
}
