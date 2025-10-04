"use client";

import { Demo_Image, Demo_Image2 } from "@/app/assets/demo";
import Loading from "@/app/components/Loading";
import {
  capitalizeFirstLetter,
  formatDate,
  formatNumber,
} from "@/app/configs/constants";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Ban,
  CheckCircle,
  Edit,
  HeartIcon,
  MessageCircle,
  MoreVertical,
  Tag,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

export default function PostClient({ id }) {
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likesState, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [newReply, setNewReply] = useState({});
  const [localComments, setLocalComments] = useState([]);
  const [localCommentCount, setLocalCommentCount] = useState(0);
  const [commentLikes, setCommentLikes] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showTags, setShowTags] = useState(false);
  const postDropdownRef = useRef(null);
  const commentDropdownRefs = useRef({});

  // Validate id and handle invalid cases
  useEffect(() => {
    if (!id || typeof id !== "string") {
      console.error("Invalid post ID:", id);
      toast.error("Invalid post ID");
      router.push("/posts");
    }
  }, [id, router]);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const response = await axiosInstance.get(`/posts/${id}`);
        const postData = response.data.data;
        setPost(postData);
        setLikes(postData.likeCount || 0);
        setLiked(
          postData.isLiked ||
            postData.likes.some((like) => like.likedBy._id === user?._id)
        );
        setLocalComments(postData.comments || []);
        setLocalCommentCount(postData.commentCount || 0);
        setCommentLikes(
          postData.comments.reduce(
            (acc, comment) => ({
              ...acc,
              [comment._id]: {
                liked:
                  comment.isLiked ||
                  comment.likes.some((like) => like.likedBy._id === user?._id),
                likeCount: comment.likeCount || 0,
              },
            }),
            {}
          )
        );
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load post");
        router.push("/posts");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, user, router]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        postDropdownRef.current &&
        !postDropdownRef.current.contains(event.target)
      ) {
        if (dropdownOpen === "post") setDropdownOpen(null);
      }
      Object.entries(commentDropdownRefs.current).forEach(
        ([commentId, ref]) => {
          if (ref.current && !ref.current.contains(event.target)) {
            if (dropdownOpen === commentId) setDropdownOpen(null);
          }
        }
      );
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }
    const optimisticLiked = !liked;
    const optimisticLikes = optimisticLiked ? likesState + 1 : likesState - 1;
    setLiked(optimisticLiked);
    setLikes(optimisticLikes);
    try {
      const response = await axiosInstance.patch(`/likes/toggle`, {
        postId: id,
      });
      setLiked(response.data.data.isLiked);
      setLikes(response.data.data.likeCount);
    } catch (error) {
      setLiked(!optimisticLiked);
      setLikes(likesState);
      toast.error(error.response?.data?.message || "Failed to toggle like");
    }
  };

  const handleCommentLikeToggle = async (commentId) => {
    if (!user) {
      toast.error("Please log in to like comments");
      return;
    }
    const currentState = commentLikes[commentId] || {
      liked: false,
      likeCount: 0,
    };
    const optimisticLiked = !currentState.liked;
    const optimisticLikeCount = optimisticLiked
      ? currentState.likeCount + 1
      : currentState.likeCount - 1;
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: { liked: optimisticLiked, likeCount: optimisticLikeCount },
    }));
    try {
      const response = await axiosInstance.patch(`/likes/toggle`, {
        commentId,
      });
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: {
          liked: response.data.data.isLiked,
          likeCount: response.data.data.likeCount,
        },
      }));
    } catch (error) {
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: currentState,
      }));
      toast.error(
        error.response?.data?.message || "Failed to toggle comment like"
      );
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    try {
      const response = await axiosInstance.post(`/comments`, {
        postId: id,
        content: newComment,
      });
      const newCommentData = response.data.data;
      setLocalComments((prev) => [
        ...prev,
        {
          ...newCommentData,
          replies: [],
          likeCount: 0,
          likes: [],
          isLiked: false,
          isSuspended: false,
        },
      ]);
      setLocalCommentCount((prev) => prev + 1);
      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!user) {
      toast.error("Please log in to reply");
      return;
    }
    if (!newReply[parentCommentId]?.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    try {
      const response = await axiosInstance.post(`/comments/replies`, {
        parentCommentId,
        content: newReply[parentCommentId],
      });
      const newReplyData = response.data.data;
      setLocalComments((prev) =>
        prev.map((comment) =>
          comment._id === parentCommentId
            ? {
                ...comment,
                replies: [
                  ...(comment.replies || []),
                  {
                    ...newReplyData,
                    replies: [],
                    likeCount: 0,
                    likes: [],
                    isLiked: false,
                    isSuspended: false,
                  },
                ],
              }
            : comment.replies
            ? {
                ...comment,
                replies: updateNestedReplies(
                  comment.replies,
                  parentCommentId,
                  newReplyData
                ),
              }
            : comment
        )
      );
      setLocalCommentCount((prev) => prev + 1);
      setNewReply((prev) => ({ ...prev, [parentCommentId]: "" }));
      setReplyTo(null);
      toast.success("Reply added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reply");
    }
  };

  const updateNestedReplies = (replies, parentCommentId, newReplyData) => {
    return replies.map((reply) =>
      reply._id === parentCommentId
        ? {
            ...reply,
            replies: [
              ...(reply.replies || []),
              {
                ...newReplyData,
                replies: [],
                likeCount: 0,
                likes: [],
                isLiked: false,
                isSuspended: false,
              },
            ],
          }
        : reply.replies
        ? {
            ...reply,
            replies: updateNestedReplies(
              reply.replies,
              parentCommentId,
              newReplyData
            ),
          }
        : reply
    );
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    try {
      const response = await axiosInstance.patch(`/comments/${commentId}`, {
        content: editCommentContent,
        commentId, // Include commentId in the body if required by backend
      });
      const updatedComment = response.data.data;
      setLocalComments((prev) =>
        updateCommentInTree(prev, commentId, {
          ...updatedComment,
          replies:
            prev.find((c) => c._id === commentId)?.replies ||
            updatedComment.replies ||
            [],
        })
      );
      setEditingComment(null);
      setEditCommentContent("");
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error("Edit comment error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await axiosInstance.delete(`/comments/${commentId}`);
      setLocalComments((prev) => removeCommentFromTree(prev, commentId));
      setLocalCommentCount((prev) => prev - 1);
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Delete comment error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to delete comment");
    }
  };

  const updateCommentInTree = (comments, commentId, updatedComment) => {
    return comments.map((comment) =>
      comment._id === commentId
        ? { ...comment, ...updatedComment }
        : comment.replies
        ? {
            ...comment,
            replies: updateCommentInTree(
              comment.replies,
              commentId,
              updatedComment
            ),
          }
        : comment
    );
  };

  const removeCommentFromTree = (comments, commentId) => {
    return comments
      .filter((comment) => comment._id !== commentId)
      .map((comment) =>
        comment.replies
          ? {
              ...comment,
              replies: removeCommentFromTree(comment.replies, commentId),
            }
          : comment
      );
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await axiosInstance.delete(`/posts/${id}`);
      toast.success("Post deleted successfully");
      router.push("/posts");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const response = await axiosInstance.patch(`/posts/${id}`, { status });
      setPost((prev) => ({ ...prev, status: response.data.data.status }));
      toast.success(`Post status updated to ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleSuspendPost = async () => {
    try {
      const response = await axiosInstance.patch(`/admin/suspend/post/${id}`, {
        isSuspended: !post.isSuspended,
      });
      setPost((prev) => ({
        ...prev,
        isSuspended: response.data.data.isSuspended,
      }));
      toast.success(
        `Post ${post.isSuspended ? "unsuspended" : "suspended"} successfully`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to suspend/unsuspend post"
      );
    }
  };

  const handleSuspendComment = async (commentId) => {
    try {
      const response = await axiosInstance.patch(
        `/admin/suspend/comment/${commentId}`,
        {
          isSuspended: !localComments.find((c) => c._id === commentId)
            .isSuspended,
        }
      );
      setLocalComments((prev) =>
        updateCommentInTree(prev, commentId, {
          isSuspended: response.data.data.isSuspended,
        })
      );
      toast.success(
        `Comment ${
          response.data.data.isSuspended ? "suspended" : "unsuspended"
        } successfully`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to suspend/unsuspend comment"
      );
    }
  };

  const renderComments = (comments, depth = 0) => {
    return comments.map((comment) => {
      const isCommentAuthor = user && user._id === comment.author._id;
      const isAdmin = user && user.role === "admin";
      const isDeepComment = depth >= 2;
      if (!commentDropdownRefs.current[comment._id]) {
        commentDropdownRefs.current[comment._id] = { current: null };
      }
      return (
        <div
          key={comment._id}
          className={`mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 ${
            isDeepComment
              ? "ml-0 border-l-4 border-violet-300 dark:border-violet-600"
              : `ml-${depth * 4}`
          } ${comment.isSuspended ? "opacity-50" : ""}`}
        >
          <div className="flex items-start gap-3">
            <Image
              src={comment.author.avatar || Demo_Image}
              alt={comment.author.userName}
              width={32}
              height={32}
              className="rounded-full h-8 w-8 object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Link href={`/profile/${comment.author.userName}`}>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-violet-400">
                    {capitalizeFirstLetter(comment.author.userName)}
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                  {(isCommentAuthor || isAdmin) && (
                    <div
                      ref={(el) =>
                        (commentDropdownRefs.current[comment._id].current = el)
                      }
                      className="relative"
                    >
                      <button
                        onClick={() =>
                          setDropdownOpen(
                            dropdownOpen === comment._id ? null : comment._id
                          )
                        }
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label="Comment options"
                      >
                        <MoreVertical
                          size={16}
                          className="text-gray-500 dark:text-gray-300"
                        />
                      </button>
                      {dropdownOpen === comment._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 transition-all duration-200">
                          {isCommentAuthor && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingComment(comment._id);
                                  setEditCommentContent(comment.content);
                                  setDropdownOpen(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                              >
                                <Edit size={16} className="mr-2" />
                                Edit Comment
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteComment(comment._id);
                                  setDropdownOpen(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Delete Comment
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                handleSuspendComment(comment._id);
                                setDropdownOpen(null);
                              }}
                              className="flex items-center px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                            >
                              <Ban size={16} className="mr-2" />
                              {comment.isSuspended
                                ? "Unsuspend Comment"
                                : "Suspend Comment"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {editingComment === comment._id ? (
                <div className="mt-2 flex items-center gap-2">
                  <textarea
                    value={editCommentContent}
                    onChange={(e) => setEditCommentContent(e.target.value)}
                    className="flex-1 p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => handleEditComment(comment._id)}
                    className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-violet-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingComment(null)}
                    className="px-3 py-1 text-sm text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {comment.isSuspended
                    ? "This comment is suspended."
                    : comment.content}
                </p>
              )}
              {!comment.isSuspended && (
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleCommentLikeToggle(comment._id)}
                    className="flex items-center text-sm text-gray-500 dark:text-gray-300"
                    aria-label={
                      commentLikes[comment._id]?.liked
                        ? "Unlike comment"
                        : "Like comment"
                    }
                  >
                    <HeartIcon
                      size={16}
                      fill={commentLikes[comment._id]?.liked ? "red" : "none"}
                      className={`mr-1 ${
                        commentLikes[comment._id]?.liked
                          ? "text-red-500 fill-red-500"
                          : "text-gray-500 dark:text-gray-300 hover:fill-red-500 hover:text-red-500"
                      }`}
                    />
                    {formatNumber(commentLikes[comment._id]?.likeCount || 0)}
                  </button>
                  <button
                    onClick={() =>
                      setReplyTo(replyTo === comment._id ? null : comment._id)
                    }
                    className="text-sm text-gray-500 dark:text-gray-300 hover:text-primary"
                  >
                    Reply
                  </button>
                </div>
              )}
              {replyTo === comment._id && !comment.isSuspended && (
                <div className="mt-3 flex items-center gap-2">
                  <textarea
                    value={newReply[comment._id] || ""}
                    onChange={(e) =>
                      setNewReply((prev) => ({
                        ...prev,
                        [comment._id]: e.target.value,
                      }))
                    }
                    placeholder="Write a reply..."
                    className="flex-1 p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => handleAddReply(comment._id)}
                    className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-violet-600"
                  >
                    Post
                  </button>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="px-3 py-1 text-sm text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          {comment.replies?.length > 0 &&
            renderComments(comment.replies, depth + 1)}
        </div>
      );
    });
  };

  if (loading) {
    return <Loading />;
  }

  if (!post) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300 py-10">
        Post not found.
      </div>
    );
  }

  const isAuthor = user && user._id === post.author._id;
  const isAdmin = user && user.role === "admin";
  const parsedTags =
    typeof post.tags === "string" ? JSON.parse(post.tags) : post.tags || [];
  const parsedContentTable =
    typeof post.contentTable === "string"
      ? JSON.parse(post.contentTable)
      : post.contentTable || [];
  const secureImageUrl =
    post.image &&
    typeof post.image === "string" &&
    post.image.startsWith("http://")
      ? post.image.replace("http://", "https://")
      : post.image || Demo_Image2;
  const filteredCategories =
    post.catagory
      ?.filter((category) => category.toLowerCase() !== "trending")
      ?.slice(0, 1) || [];
  const displayCategories =
    filteredCategories.length > 0 ? filteredCategories : ["General"];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-lg">
      {/* 1st: Author, CreatedAt, Status */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Image
              src={post.author.avatar || Demo_Image}
              alt={post.author.userName}
              width={32}
              height={32}
              className="rounded-full h-8 w-8 object-cover"
            />
            <Link href={`/profile/${post.author.userName}`}>
              <span className="text-base font-medium text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-violet-400">
                {capitalizeFirstLetter(post.author.userName)}
              </span>
            </Link>
          </div>
        </div>

        {(isAuthor || isAdmin) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Status:{" "}
              <span
                className={
                  post.status === "approved"
                    ? "text-green-500"
                    : post.status === "pending"
                    ? "text-yellow-500"
                    : "text-red-500"
                }
              >
                {capitalizeFirstLetter(post.status)}
              </span>
              {post.isSuspended && <span>(Suspended)</span>}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center ml-9 mt-[-28px] mb-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="">{formatDate(post.createdAt)}</span>
      </div>
      {/* 2nd: Image with Category Chip */}
      {post.image && (
        <div className="mb-6 relative">
          <Image
            src={secureImageUrl}
            alt={post.title}
            width={800}
            height={400}
            className="object-cover w-full"
          />
          <div className="absolute top-4 left-4">
            {displayCategories.map((category, index) => (
              <span
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-1 px-3 rounded-full text-xs font-medium"
              >
                {capitalizeFirstLetter(category)}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* 3rd: Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {post.title}
      </h1>
      {/* 4th: Content */}
      <div className="prose dark:prose-invert text-gray-700 dark:text-gray-300 mb-6 max-w-none blog-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>
      
      <style jsx global>{`
        .blog-content {
          font-family: 'Georgia', serif;
          line-height: 1.8;
          font-size: 1.1rem;
        }
        
        .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #333;
        }
        
        .blog-content h1 {
          font-size: 2rem;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 0.5rem;
        }
        
        .blog-content h2 {
          font-size: 1.75rem;
        }
        
        .blog-content h3 {
          font-size: 1.5rem;
        }
        
        .blog-content p {
          margin-bottom: 1.5rem;
        }
        
        .blog-content a {
          color: #6d28d9;
          text-decoration: none;
          border-bottom: 1px solid #e5e7eb;
          transition: border-color 0.2s;
        }
        
        .blog-content a:hover {
          border-color: #6d28d9;
        }
        
        .blog-content blockquote {
          border-left: 4px solid #6d28d9;
          padding-left: 1rem;
          font-style: italic;
          margin: 1.5rem 0;
          color: #4b5563;
        }
        
        .blog-content ul, .blog-content ol {
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .blog-content li {
          margin-bottom: 0.5rem;
        }
        
        .blog-content img {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          max-width: 100%;
          height: auto;
          margin: 1.5rem 0;
        }
        
        .blog-content pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .blog-content code {
          background-color: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        
        /* Dark mode styles */
        .dark .blog-content h1, .dark .blog-content h2, .dark .blog-content h3, .dark .blog-content h4 {
          color: #e5e7eb;
        }
        
        .dark .blog-content h1 {
          border-bottom: 2px solid #374151;
        }
        
        .dark .blog-content a {
          color: #a78bfa;
          border-bottom: 1px solid #4b5563;
        }
        
        .dark .blog-content a:hover {
          border-color: #a78bfa;
        }
        
        .dark .blog-content blockquote {
          border-left: 4px solid #a78bfa;
          color: #9ca3af;
        }
        
        .dark .blog-content pre {
          background-color: #1f2937;
        }
        
        .dark .blog-content code {
          background-color: #1f2937;
        }
      `}</style>
      {/* 5th: Tags (Toggleable) */}
      <div className="mb-6">
        <button
          onClick={() => setShowTags(!showTags)}
          className="flex items-center text-sm text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-violet-400 mb-2"
        >
          <Tag size={16} className="mr-1" />
          {showTags ? "Hide Tags" : "Show Tags"}
        </button>
        {showTags && parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {parsedTags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-1 px-3 rounded-full text-xs font-medium"
              >
                {capitalizeFirstLetter(tag)}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Table of Contents (Optional) */}
      {/* {parsedContentTable.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Table of Contents
          </h2>
          <pre className="bg-gray-50 dark:bg-gray-900 flex flex-wrap gap-2 p-4 rounded-lg overflow-auto">
            {parsedContentTable.map((item, index) => (
              <span
                key={index}
                className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white py-1 px-3 rounded-lg text-xs font-medium"
              >
                {capitalizeFirstLetter(item)}
              </span>
            ))}
          </pre>
        </div>
      )} */}
      {/* 6th: Likes, Comments, Action (Dropdown) */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={handleLikeToggle}
          className="flex items-center text-sm text-gray-700 dark:text-gray-200"
          aria-label={liked ? "Unlike post" : "Like post"}
        >
          <HeartIcon
            size={20}
            fill={liked ? "red" : "none"}
            className={`mr-1 ${
              liked
                ? "text-red-500 fill-red-500"
                : "text-gray-700 dark:text-gray-200 hover:fill-red-500 hover:text-red-500"
            }`}
          />
          {formatNumber(likesState)}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center text-sm text-gray-700 dark:text-gray-200"
          aria-label={showComments ? "Hide comments" : "Show comments"}
        >
          <MessageCircle
            size={20}
            className={`mr-1 ${
              showComments
                ? "text-primary fill-primary"
                : "text-gray-700 dark:text-gray-200 hover:fill-primary hover:text-primary"
            }`}
          />
          {formatNumber(localCommentCount)}
        </button>
        {(isAuthor || isAdmin) && (
          <div className="relative z-50" ref={postDropdownRef}>
            <button
              onClick={() =>
                setDropdownOpen(dropdownOpen === "post" ? null : "post")
              }
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Post options"
            >
              <MoreVertical
                size={20}
                className="text-gray-500 dark:text-gray-300"
              />
            </button>
            {dropdownOpen === "post" && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 transition-all duration-200">
                {isAuthor && (
                  <>
                    <Link
                      href={`/profile/edit/${id}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left transition-colors"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Post
                    </Link>
                    <button
                      onClick={handleDeletePost}
                      className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left transition-colors"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Post
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          post.status === "approved" ? "pending" : "approved"
                        )
                      }
                      className={`flex items-center px-4 py-2 text-sm ${
                        post.status === "approved"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                      } hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left transition-colors`}
                    >
                      {post.status === "approved" ? (
                        <>
                          <Ban size={16} className="mr-2" />
                          Set to Pending
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Approve
                        </>
                      )}
                    </button>
                  </>
                )}
                {isAdmin && (
                  <button
                    onClick={handleSuspendPost}
                    className="flex items-center px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left transition-colors"
                  >
                    <Ban size={16} className="mr-2" />
                    {post.isSuspended ? "Unsuspend Post" : "Suspend Post"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Comments Section (Hidden by Default) */}
      {showComments && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleAddComment}
              className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-violet-600"
            >
              Post
            </button>
          </div>
          {localComments.length > 0 ? (
            renderComments(localComments)
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No comments yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
