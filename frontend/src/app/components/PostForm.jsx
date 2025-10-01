"use client";

import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { TagsInput } from "react-tag-input-component";

const EditorToolbar = ({ onFormat }) => {
  return (
    <div className="flex gap-2 mb-2">
      <button
        type="button"
        onClick={() => onFormat("bold")}
        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
        aria-label="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => onFormat("italic")}
        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
        aria-label="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => onFormat("bullet")}
        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
        aria-label="Bullet List"
      >
        •
      </button>
    </div>
  );
};

export default function PostForm({ postId = null, initialData = null }) {
  const { user } = useAuth();
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState(initialData?.image || null);
  const [existingImage, setExistingImage] = useState(
    initialData?.image || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseTags = (tags) => {
    try {
      if (!tags) return [];
      if (Array.isArray(tags)) {
        return tags
          .map((tag) => {
            if (typeof tag === "string") {
              return tag
                .replace(/^"|"$/g, "")
                .replace(/^\[|\]$/g, "")
                .replace(/\\"/g, "");
            }
            return String(tag);
          })
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      }
      if (typeof tags === "string") {
        const cleaned = tags.replace(/^"|"$/g, "").replace(/\\"/g, "");
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed)
          ? parsed.map((tag) => String(tag).trim()).filter((tag) => tag)
          : [];
      }
      return [];
    } catch (error) {
      console.warn("Failed to parse tags:", error, tags);
      return [];
    }
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      catagory: initialData?.catagory || [],
      tags: parseTags(initialData?.tags),
      image: null,
    },
  });

  const categories = [
    "General",
    "Adventure",
    "Food",
    "Technology",
    "Travel",
    "Lifestyle",
    "Art",
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("image", file);
      setImagePreview(URL.createObjectURL(file));
      setExistingImage(null);
    }
  };

  const handleFormat = (type) => {
    const textarea = document.getElementById("content");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let newText = "";

    if (type === "bold") {
      newText = `**${selectedText}**`;
    } else if (type === "italic") {
      newText = `*${selectedText}*`;
    } else if (type === "bullet") {
      newText = selectedText
        .split("\n")
        .map((line) => (line ? `- ${line}` : line))
        .join("\n");
    }

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newValue = before + newText + after;
    setValue("content", newValue, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    if (!user) {
      toast.error("Please log in to save the post");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = new FormData();
      postData.append("title", data.title);
      postData.append("content", data.content);
      data.catagory.forEach((cat) => postData.append("catagory", cat));
      const cleanTags = data.tags
        .map((tag) => String(tag).trim())
        .filter((tag) => tag);
      postData.append("tags", JSON.stringify(cleanTags));
      if (data.image) {
        postData.append("image", data.image);
      }

      const isEditMode = !!postId;
      const url = isEditMode ? `/posts/${postId}` : "/posts";
      const method = isEditMode ? "patch" : "post";

      const response = await axiosInstance[method](url, postData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === (isEditMode ? 200 : 201)) {
        toast.success(
          `Post ${isEditMode ? "updated" : "created"} successfully`
        );
        const newPostId = isEditMode ? postId : response.data.data._id;
        if (!newPostId) {
          throw new Error("Post ID not found in response");
        }
        router.push(`/posts/${newPostId}`);
      }
    } catch (error) {
      console.error(`Error ${postId ? "updating" : "creating"} post:`, error);
      toast.error(
        error.response?.data?.message ||
          `Failed to ${postId ? "update" : "create"} post`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        <p>
          Please{" "}
          <a href="/login" className="text-primary hover:underline">
            log in
          </a>{" "}
          to {postId ? "edit" : "create"} a post.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pb-20">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
      >
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Title
          </label>
          <input
            id="title"
            {...register("title", { required: "Title is required" })}
            className={`mt-1 block w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.title ? "border-red-500" : ""
            }`}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Content
          </label>
          <EditorToolbar onFormat={handleFormat} />
          <textarea
            id="content"
            {...register("content", { required: "Content is required" })}
            className={`mt-1 block w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition h-64 ${
              errors.content ? "border-red-500" : ""
            }`}
            placeholder="Write your post in Markdown (e.g., **bold**, *italic*, - bullet)"
          />
          {errors.content && (
            <p className="text-red-500 text-xs mt-1">
              {errors.content.message}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="catagory"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Categories
          </label>
          <Controller
            name="catagory"
            control={control}
            rules={{ required: "Select at least one category" }}
            render={({ field }) => (
              <select
                id="catagory"
                multiple
                value={field.value}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  field.onChange(selected);
                }}
                className={`mt-1 block w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition ${
                  errors.catagory ? "border-red-500" : ""
                }`}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple categories.
          </p>
          {errors.catagory && (
            <p className="text-red-500 text-xs mt-1">
              {errors.catagory.message}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Tags
          </label>
          <Controller
            name="tags"
            control={control}
            rules={{
              validate: (value) =>
                value.length > 0 || "At least one tag is required",
            }}
            render={({ field }) => (
              <TagsInput
                value={field.value}
                onChange={(tags) =>
                  field.onChange(tags.map((tag) => String(tag).trim()))
                }
                placeHolder="Enter tags (e.g., javascript, coding)"
                classNames={{
                  tag: "bg-violet-600 text-white px-2 py-1 rounded-full text-sm mr-1 border border-violet-700",
                  input:
                    "p-3 w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg",
                }}
              />
            )}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Press Enter to add a tag.
          </p>
          {errors.tags && (
            <p className="text-red-500 text-xs mt-1">{errors.tags.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Image
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 transition"
          />
          {imagePreview && (
            <div className="mt-2 relative group">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-xs rounded-lg object-cover transition transform group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => {
                  setValue("image", null);
                  setImagePreview(existingImage);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>
          )}
          {existingImage && !imagePreview && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current image will be kept unless a new one is uploaded.
            </p>
          )}
        </div>

        <div className="fixed bottom-4 left-0 right-0 max-w-3xl mx-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex justify-end gap-4 z-50 md:p-6 pointer-events-auto">
          <a
            href="/posts"
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition pointer-events-auto"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 text-sm bg-primary text-white rounded-lg hover:bg-violet-600 transition pointer-events-auto ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting
              ? "Saving..."
              : postId
              ? "Update Post"
              : "Create Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
