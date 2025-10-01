import HeroSection from "@/app/components/HeroSection";
import PostFeed from "@/app/components/PostFeed";

export const metadata = {
  title: "Newsx - Your Personal Blog Space",
  description: "Discover interesting blog posts from various categories",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <HeroSection />
        <main className="mt-8 md:mt-0">
          <PostFeed defaultCategory="All" />
        </main>
      </div>
    </div>
  );
}
