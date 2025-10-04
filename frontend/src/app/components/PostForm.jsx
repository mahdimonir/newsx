"use client";

import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { TagsInput } from "react-tag-input-component";
import RichTextEditor from "./RichTextEditor";

export default function PostForm({ postId = null, initialData = null }) {
  const { user } = useAuth();
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState(initialData?.image || null);
  const [imageUrl, setImageUrl] = useState(initialData?.image || null);
  const [contentUploadedUrls, setContentUploadedUrls] = useState(
    Array.isArray(initialData?.images)
      ? initialData.images.map((img) => img.url).filter(Boolean)
      : []
  );
  const [contentImagePreviews, setContentImagePreviews] = useState(
    Array.isArray(initialData?.images)
      ? initialData.images.map((img) => img.url).filter(Boolean)
      : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug initialData to verify images
  useEffect(() => {
    console.log("initialData:", initialData);
    console.log("contentUploadedUrls:", contentUploadedUrls);
    console.log("contentImagePreviews:", contentImagePreviews);
  }, [initialData, contentUploadedUrls, contentImagePreviews]);

  const parseTags = (tags) => {
    try {
      if (!tags) return [];
      if (Array.isArray(tags)) {
        return tags
          .map(String)
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
      if (typeof tags === "string") {
        const cleaned = tags.replace(/^"|"$/g, "").replace(/\\"/g, "");
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed)
          ? parsed.map((tag) => String(tag).trim()).filter(Boolean)
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
      catagory: initialData?.catagory || "General",
      tags: parseTags(initialData?.tags),
    },
  });

  const categories = [
    "General",
    ".NET",
    "Adventure",
    "Art",
    "Blockchain",
    "Blog",
    "Businesses",
    "Data Engineering",
    "Food",
    "Git",
    "Golang",
    "Java",
    "JavaScript",
    "Mobile App Development",
    "MVP",
    "Personal",
    "Programming & Development",
    "Python",
    "React",
    "Software Development",
    "SQL Server",
    "Staff-Augmentation",
    "Technologies",
    "Technology",
    "Travel",
    "Web",
  ];

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axiosInstance.post("/posts/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data.url;
    } catch (error) {
      throw new Error("Image upload failed");
    }
  };

  const deleteImage = async (url) => {
    try {
      console.log("Deleting image with URL:", url);
      await axiosInstance.delete("/posts/image", { data: { url } });
    } catch (error) {
      console.error(
        "Image deletion error:",
        error.response?.data || error.message
      );
      throw new Error("Image deletion failed");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // If there's an existing image, delete it
        if (imageUrl) {
          await deleteImage(imageUrl);
        }
        const url = await uploadImage(file);
        setImageUrl(url);
        setImagePreview(URL.createObjectURL(file) || url);
        toast.success("Image uploaded");
      } catch (error) {
        toast.error("Image upload failed");
      }
    }
  };

  const handleDeleteImage = async () => {
    if (imageUrl) {
      try {
        await deleteImage(imageUrl);
        setImageUrl(null);
        setImagePreview(null);
        toast.success("Image deleted");
      } catch (error) {
        toast.error("Failed to delete image");
      }
    }
  };

  const handleContentImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const url = await uploadImage(file);
        setContentUploadedUrls((prev) => [...prev, url]);
        setContentImagePreviews((prev) => [
          ...prev,
          URL.createObjectURL(file) || url,
        ]);
        navigator.clipboard.writeText(url);
        toast.success(`Image uploaded, URL copied: ${url}`);
      } catch (error) {
        toast.error(`Upload failed for ${file.name}`);
      }
    }
    // Reset the file input
    e.target.value = null;
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleDeleteContentImage = async (url, index) => {
    try {
      await deleteImage(url);
      setContentUploadedUrls((prev) => prev.filter((_, i) => i !== index));
      setContentImagePreviews((prev) => prev.filter((_, i) => i !== index));
      toast.success("Image deleted");
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  const insertContentImagePlaceholder = () => {
    toast.info(
      "Upload an image using the uploader below, copy the URL, and insert it into the editor using the image tool."
    );
  };

  const onSubmit = async (data) => {
    if (!user) {
      toast.error("Please log in to save the post");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        title: data.title,
        content: data.content,
        catagory: data.catagory,
        tags: data.tags
          .map(String)
          .map((tag) => tag.trim())
          .filter(Boolean),
        imageUrl: imageUrl,
        contentImageUrls: contentUploadedUrls,
      };

      const isEditMode = !!postId;
      const url = isEditMode ? `/posts/${postId}` : "/posts";
      const method = isEditMode ? "patch" : "post";

      const response = await axiosInstance[method](url, postData);

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
        className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4">
          {postId ? "Edit Post" : "Create New Post"}
        </h1>

        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Title
          </label>
          <input
            id="title"
            {...register("title", { required: "Title is required" })}
            className={`mt-1 block w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.title ? "border-red-500" : ""
            }`}
            placeholder="Enter a compelling title for your post"
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="mb-8">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Content
          </label>
          <div
            className={`${
              errors.content ? "border border-red-500 rounded-lg" : ""
            }`}
          >
            <Controller
              name="content"
              control={control}
              rules={{ required: "Content is required" }}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write your post content here..."
                  onInsertContentImage={insertContentImagePlaceholder}
                />
              )}
            />
          </div>
          {errors.content && (
            <p className="text-red-500 text-xs mt-1">
              {errors.content.message}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Upload images below, copy the URL, and insert into the editor using
            the image tool.
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Images
            </label>
            <input
              id="contentImages"
              type="file"
              accept="image/*"
              multiple
              onChange={handleContentImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
          </div>

          {contentImagePreviews.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Uploaded Content Images:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {contentImagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative group w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                  >
                    <img
                      src={preview}
                      alt={`Content Image ${index + 1}`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.error(`Failed to load image: ${preview}`);
                        e.target.src = "/placeholder-image.jpg"; // Optional: fallback image
                      }}
                    />
                    <div className="absolute inset-0 backdrop-blur-sm bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={() => handleCopy(contentUploadedUrls[index])}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Copy URL
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteContentImage(
                            contentUploadedUrls[index],
                            index
                          )
                        }
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label
              htmlFor="catagory"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Category
            </label>
            <Controller
              name="catagory"
              control={control}
              rules={{ required: "Select a category" }}
              render={({ field }) => (
                <select
                  id="catagory"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
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
            {errors.catagory && (
              <p className="text-red-500 text-xs mt-1">
                {errors.catagory.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tags
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagsInput
                  value={field.value}
                  onChange={field.onChange}
                  name="tags"
                  placeHolder="Enter tags and press Enter"
                />
              )}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Image
          </label>
          {imagePreview && (
            <div className="mb-4 relative group w-full h-64 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt="Image Preview"
                className="object-cover w-full h-full"
                onError={(e) => {
                  console.error(`Failed to load image: ${imagePreview}`);
                  e.target.src = "/placeholder-image.jpg"; // Optional: fallback image
                }}
              />
              <div className="absolute inset-0 backdrop-blur-sm bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-2 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={() => handleCopy(imageUrl)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
            isSubmitting
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          {isSubmitting
            ? postId
              ? "Updating..."
              : "Publishing..."
            : postId
            ? "Update Post"
            : "Publish Post"}
        </button>
      </form>
    </div>
  );
}
