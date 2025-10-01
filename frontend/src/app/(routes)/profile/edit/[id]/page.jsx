"use client";

import Error from "@/app/components/Error";
import Loading from "@/app/components/Loading";
import PostForm from "@/app/components/PostForm";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function EditPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      toast.error("Please log in to edit a post");
      router.push("/login");
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await axiosInstance.get(`/posts/${id}`);
        const post = response.data.data;
        if (post.author._id !== user._id) {
          toast.error("You can only edit your own posts");
          router.push("/posts");
          return;
        }
        setPostData(post);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching post:", error);
        setError("Failed to load post. Please try again later.");
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user, authLoading, router]);

  if (authLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return <Error errMessage={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Edit Post
          </h2>
        </div>
        <PostForm postId={id} initialData={postData} />
      </main>
    </div>
  );
}
