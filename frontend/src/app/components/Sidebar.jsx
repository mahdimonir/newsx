"use client";

import { FileText, Plus, Shield, ShieldUser, UserPen } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white w-full sm:w-50 fixed bottom-0 sm:sticky sm:top-[4rem] h-14 sm:h-dvh border-t sm:border-t-0 sm:border-r border-gray-200 dark:border-gray-700 z-40 transition-transform duration-300">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block p-4 pb-0">
        Dashboard
      </h1>
      <nav className="flex sm:flex-col justify-around sm:justify-start sm:mt-4">
        <Link
          href="/profile"
          className="flex items-center justify-center sm:justify-start p-4 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ShieldUser className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-3" />
          <span className="hidden sm:block">Profile</span>
        </Link>
        <Link
          href="/profile/posts"
          className="flex items-center justify-center sm:justify-start p-4 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FileText className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-3" />
          <span className="hidden sm:block">Posts</span>
        </Link>
        <Link
          href="/profile/create"
          className="flex items-center justify-center sm:justify-start p-4 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Plus className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-3" />
          <span className="hidden sm:block">Create Post</span>
        </Link>
        <Link
          href="/profile/edit"
          className="flex items-center justify-center sm:justify-start p-4 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <UserPen className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-3" />
          <span className="hidden sm:block">Edit Profile</span>
        </Link>
        <Link
          href="/profile/suspended"
          className="flex items-center justify-center sm:justify-start p-4 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Shield className="w-6 h-6 sm:w-5 sm:h-5 sm:mr-3" />
          <span className="hidden sm:block">Suspended</span>
        </Link>
      </nav>
    </div>
  );
}
