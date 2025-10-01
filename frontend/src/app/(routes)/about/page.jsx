"use client";

import Error from "@/app/components/Error";
import Loading from "@/app/components/Loading";
import axiosInstance from "@/app/utils/axiosConfig";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function About() {
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeveloper = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get("/users/mahdi14");
        const developerData = response.data.data;
        setDeveloper(developerData);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load developer information"
        );
        toast.error("Failed to load developer information");
      } finally {
        setLoading(false);
      }
    };

    fetchDeveloper();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <div className="flex pt-5 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-8rem)]">
      <div className="p-4 w-full">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            About Newsx
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
            Welcome to <span className="font-semibold">Newsx</span>, a vibrant
            platform where creativity and community converge. Our mission is to
            empower storytellers, writers, and thinkers to share their ideas
            through a feature-rich blogging experience backed by a robust social
            network.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
            Newsx offers tools for everyone, from novice bloggers to seasoned
            authors. Create engaging posts with our TipTap rich text editor,
            connect with readers through nested comments and likes, and manage
            your content with ease. Admins ensure quality with powerful
            moderation tools, while personalized profiles let you showcase your
            unique voice.
          </p>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Our Features
          </h2>
          <ul className="list-disc list-inside text-base text-gray-700 dark:text-gray-300 mb-4">
            <li>Create and edit blog posts with a TipTap rich text editor.</li>
            <li>
              Engage with nested comments (up to 5 levels) and like/dislike
              functionality.
            </li>
            <li>
              Follow users and build your network with follower/following lists.
            </li>
            <li>Admin dashboard for user, post, and comment moderation.</li>
            <li>Search posts, users, and comments with ease.</li>
            <li>
              Secure authentication with JWT, email verification, and password
              reset.
            </li>
            <li>Responsive design with Tailwind CSS for all devices.</li>
          </ul>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            About the Developer
          </h2>

          <Link href={`/users/${developer.userName}`}>
            {developer ? (
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  {developer.avatar ? (
                    <Image
                      src={developer.avatar}
                      alt={developer.userName}
                      fill
                      className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold">
                      {developer.userName[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {developer.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    @{developer.userName}
                  </p>
                  {developer.bio && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {developer.bio}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              ""
            )}
          </Link>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
            Newsx was crafted by Mahdi Moniruzzaman, a passionate developer
            dedicated to building intuitive and scalable web applications.
            Explore the project on{" "}
            <a
              href="https://github.com/mahdimonir/Newsx"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{" "}
            to contribute or learn more.
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300">
            Have questions or feedback? Reach out at{" "}
            <a
              href="mailto:support@newsx.com"
              className="text-primary hover:underline"
            >
              support@newsx.com
            </a>{" "}
            or join our community of storytellers today!
          </p>
        </div>
      </div>
    </div>
  );
}
