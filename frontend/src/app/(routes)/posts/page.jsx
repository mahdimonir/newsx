import ClientCreatePostButton from "@/app/components/ClientCreatePostButton";
import PostFeed from "@/app/components/PostFeed";

export const metadata = {
  title: "All Posts - Newsx",
  description: "Browse all blog posts on Newsx",
};

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            All Posts
          </h2>
          <ClientCreatePostButton />
        </div>
        <PostFeed defaultCategory="All" />
      </main>
    </div>
  );
}
