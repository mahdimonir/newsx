"use client";

import { Demo_Image } from "@/app/assets/demo";
import Image from "next/image";

export default function ProfileDetails({ user }) {
  const secureAvatarUrl = user.avatar?.startsWith("http://")
    ? user.avatar.replace("http://", "https://")
    : user.avatar || Demo_Image;

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
      <div className="flex flex-col items-center mb-6">
        <div className="rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 mb-4">
          <Image
            src={secureAvatarUrl}
            alt={user.userName}
            width={100}
            height={100}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-gray-600 dark:text-gray-400">@{user.userName}</p>
        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        <p className="text-gray-500 dark:text-gray-400 capitalize">
          {user.role}
        </p>
      </div>
    </div>
  );
}
