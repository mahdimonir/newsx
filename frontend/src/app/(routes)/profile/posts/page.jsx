"use client";

import ClientCreatePostButton from "@/app/components/ClientCreatePostButton";
import Error from "@/app/components/Error";
import Loading from "@/app/components/Loading";
import PostCard from "@/app/components/PostCard";
import Sidebar from "@/app/components/Sidebar";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function Posts() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [allPosts, setAllPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("allposts");
  const [postLoading, setPostLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (user) {
      setActiveTab(user.role === "admin" ? "allposts" : "published");

      const fetchPosts = async () => {
        setPostLoading(true);
        setError(null);
        try {
          let fullAuthors = {};

          if (user.role === "admin") {
            const [allPostsResponse, myPostsResponse] = await Promise.all([
              axiosInstance.get("/posts"),
              axiosInstance.get(`/posts/?author=${user.userName}`),
            ]);
            const allPostsData = allPostsResponse.data?.data?.posts || [];
            const myPostsData = myPostsResponse.data?.data?.posts || [];

            const uniqueAuthors = [
              ...new Set([
                ...allPostsData.map((post) => post.author.userName),
                ...myPostsData.map((post) => post.author.userName),
              ]),
            ];
            if (uniqueAuthors.length > 0) {
              const authorPromises = uniqueAuthors.map((userName) =>
                axiosInstance.get(`/users/${userName}`)
              );
              const authorResponses = await Promise.all(authorPromises);
              fullAuthors = authorResponses.reduce((acc, res) => {
                const author = res.data.data;
                acc[author.userName] = author;
                return acc;
              }, {});
            }

            // Enhance posts with full author data
            setAllPosts(
              allPostsData.map((post) => ({
                ...post,
                author: fullAuthors[post.author.userName] || post.author,
              }))
            );
            setMyPosts(
              myPostsData.map((post) => ({
                ...post,
                author: fullAuthors[post.author.userName] || post.author,
              }))
            );
          } else {
            // Fetch /posts/my and /posts/pending for users
            const [myPostsResponse, pendingPostsResponse] = await Promise.all([
              axiosInstance.get(`/posts/?author=${user.userName}`),
              axiosInstance.get("/posts/pending"),
            ]);
            const myPostsData =
              myPostsResponse.data?.data?.posts.filter(
                (post) => post.status === "approved"
              ) || [];
            const pendingPostsData =
              pendingPostsResponse.data?.data?.posts || [];

            // Fetch full author data for unique authors
            const uniqueAuthors = [
              ...new Set([
                ...myPostsData.map((post) => post.author.userName),
                ...pendingPostsData.map((post) => post.author.userName),
              ]),
            ];
            if (uniqueAuthors.length > 0) {
              const authorPromises = uniqueAuthors.map((userName) =>
                axiosInstance.get(`/users/${userName}`)
              );
              const authorResponses = await Promise.all(authorPromises);
              fullAuthors = authorResponses.reduce((acc, res) => {
                const author = res.data.data;
                acc[author.userName] = author;
                return acc;
              }, {});
            }

            // Enhance posts with full author data
            setMyPosts(
              myPostsData.map((post) => ({
                ...post,
                author: fullAuthors[post.author.userName] || post.author,
              }))
            );
            setPendingPosts(
              pendingPostsData.map((post) => ({
                ...post,
                author: fullAuthors[post.author.userName] || post.author,
              }))
            );
          }
        } catch (err) {
          setError(err.response?.data?.message || "Failed to fetch posts");
          toast.error("Failed to fetch posts");
        } finally {
          setPostLoading(false);
        }
      };
      fetchPosts();
    }
  }, [user, loading, router]);

  const handlePostDeleted = (postId) => {
    setAllPosts((prev) => prev.filter((post) => post._id !== postId));
    setMyPosts((prev) => prev.filter((post) => post._id !== postId));
    setPendingPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  if (loading || postLoading) {
    return <Loading />;
  }
  if (error) {
    return <Error message={error} />;
  }
  if (!user) return null;

  const isAdmin = user.role === "admin";
  const postsToShow =
    isAdmin && activeTab === "allposts"
      ? allPosts
      : isAdmin
      ? myPosts
      : activeTab === "published"
      ? myPosts
      : pendingPosts;

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-4 text-gray-950 dark:text-gray-100">
            {isAdmin && activeTab === "allposts" ? "All Posts" : "My Posts"}
          </h1>
          <div className="hidden sm:block">
            <ClientCreatePostButton />
          </div>
        </div>
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          {isAdmin ? (
            <>
              <button
                className={`pb-2 px-4 ${
                  activeTab === "allposts"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                onClick={() => setActiveTab("allposts")}
                aria-selected={activeTab === "allposts"}
              >
                All Posts
              </button>
              <button
                className={`pb-2 px-4 ${
                  activeTab === "myposts"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                onClick={() => setActiveTab("myposts")}
                aria-selected={activeTab === "myposts"}
              >
                My Posts
              </button>
            </>
          ) : (
            <>
              <button
                className={`pb-2 px-4 ${
                  activeTab === "published"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                onClick={() => setActiveTab("published")}
                aria-selected={activeTab === "published"}
              >
                Published
              </button>
              <button
                className={`pb-2 px-4 ${
                  activeTab === "pending"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                onClick={() => setActiveTab("pending")}
                aria-selected={activeTab === "pending"}
              >
                Pending
              </button>
            </>
          )}
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {postsToShow.length > 0 ? (
              postsToShow.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            ) : (
              <p className="text-gray-500">
                No{" "}
                {isAdmin && activeTab === "allposts"
                  ? "posts"
                  : activeTab === "published"
                  ? "published posts"
                  : activeTab === "pending"
                  ? "pending posts"
                  : "posts"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
