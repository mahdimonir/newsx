"use client";

import PostForm from "@/app/components/PostForm";

export default function CreatePostPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Create New Post
          </h2>
        </div>
        <PostForm />
      </main>
    </div>
  );
}
