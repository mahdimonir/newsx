"use client";

import Loading from "@/app/components/Loading";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function UpdateProfile() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    bio: "",
    avatar: "",
    userName: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get("/users/profile");
      const { name, bio, avatar, userName, email } = response.data.data;
      setFormData({ name, bio, avatar, userName, email });
      setPreview(avatar);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Update profile (name, bio, userName)
      const profileResponse = await axiosInstance.patch("/auth/update", {
        name: formData.name,
        bio: formData.bio,
        userName: formData.userName,
        email: formData.email,
      });
      setFormData((prev) => ({
        ...prev,
        ...profileResponse.data.data,
      }));

      // Update avatar if changed
      let avatarResponse;
      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append("avatar", avatarFile);
        avatarResponse = await axiosInstance.patch("/auth/avatar", avatarData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setFormData((prev) => ({
          ...prev,
          avatar: avatarResponse.data.data.avatar,
        }));
        setPreview(avatarResponse.data.data.avatar);
      }

      setAvatarFile(null);

      // Update localStorage user
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("user")),
          name: formData.name,
        })
      );

      if (
        profileResponse.status === 200 ||
        profileResponse.status === 201 ||
        (avatarResponse &&
          (avatarResponse.status === 200 || avatarResponse.status === 201))
      ) {
        toast.success("Profile updated successfully");
        router.push(`/profile`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      {error && (
        <p
          className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg"
          role="alert"
        >
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium mb-2">Avatar</label>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              {preview ? (
                <Image
                  src={preview}
                  alt="Avatar preview"
                  fill
                  className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold">
                  {formData.userName[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <label
              className="cursor-pointer bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-violet-600"
              aria-label="Upload avatar"
            >
              <Upload className="h-5 w-5" />
              Upload
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="text"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed"
            aria-required="true"
            title="Email is not editable"
          />
        </div>

        {/* Username */}
        <div>
          <label htmlFor="userName" className="block text-sm font-medium mb-2">
            Username
          </label>
          <input
            type="text"
            id="userName"
            name="userName"
            value={formData.userName}
            disabled
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed"
            aria-required="true"
            title="Username cannot be changed"
          />
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-full hover:bg-violet-600"
            aria-label="Save profile changes"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full"
            aria-label="Cancel and return to profile"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
