"use client";

import {
  calculateReadTime,
  capitalizeFirstLetter,
  formatDate,
  formatNumber,
} from "@/app/configs/constants";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
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
import { Demo_Image, Demo_Image2 } from "../assets/demo";

export default function PostCard({
  post,
  compact = false,
  onClick,
  onPostDeleted,
  className = "",
}) {
  const {
    title = "Untitled Post",
    content = "",
    image = Demo_Image2,
    author = { userName: "Unknown", avatar: Demo_Image, _id: "" },
    _id,
    catagory = ["General"],
    createdAt,
    likeCount = 0,
    commentCount = 0,
    likes = [],
    isLiked = false,
    comments = [],
    tags = [],
    status = "pending",
    isSuspended = false,
  } = post;

  const { user } = useAuth();
  const router = useRouter();
  const initialIsLiked =
    isLiked || likes.some((like) => like.likedBy._id === user?._id);

  const [likesState, setLikes] = useState(likeCount);
  const [liked, setLiked] = useState(initialIsLiked);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [newReply, setNewReply] = useState({});
  const [localComments, setLocalComments] = useState(comments);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const [commentLikes, setCommentLikes] = useState(
    comments.reduce(
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
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showTags, setShowTags] = useState(false);
  const postDropdownRef = useRef(null);
  const commentDropdownRefs = useRef({});

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
        postId: _id,
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
        postId: _id,
        content: newComment,
      });
      const newCommentData = response.data.data;
      setLocalComments((prev) => [
        {
          ...newCommentData,
          replies: [],
          likeCount: 0,
          likes: [],
          isLiked: false,
          isSuspended: false,
        },
        ...prev,
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
        commentId,
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
      console.log("Deleting comment with ID:", commentId);
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

  const handleDeletePost = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this post?")) return;
    if (!_id) {
      toast.error("Invalid post ID");
      return;
    }
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/posts/${_id}`);
      toast.success("Post deleted successfully");
      if (onPostDeleted) onPostDeleted(_id);
    } catch (error) {
      console.error("Failed to delete post:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (e, newStatus) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await axiosInstance.patch(`/posts/${_id}`, {
        status: newStatus,
      });
      toast.success(`Post status updated to ${newStatus}`);
      if (onPostDeleted) onPostDeleted(_id);
    } catch (error) {
      console.error("Failed to update status:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleSuspendPost = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await axiosInstance.patch(`/admin/suspend/post/${_id}`, {
        isSuspended: !isSuspended,
      });
      toast.success(
        `Post ${
          response.data.data.isSuspended ? "suspended" : "unsuspended"
        } successfully`
      );
      if (onPostDeleted) onPostDeleted(_id);
    } catch (error) {
      console.error("Failed to suspend post:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
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
            ?.isSuspended,
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
      console.error("Failed to suspend comment:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(
        error.response?.data?.message || "Failed to suspend/unsuspend comment"
      );
    }
  };

  const parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;

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

  const secureImageUrl =
    image && typeof image === "string" && image.startsWith("http://")
      ? image.replace("http://", "https://")
      : image || Demo_Image2;

  const filteredCategories = catagory
    .filter((category) => category.toLowerCase() !== "trending")
    .slice(0, 1);

  const displayCategories =
    filteredCategories.length > 0 ? filteredCategories : ["General"];

  const isAuthor = user && user._id === author._id;
  const isAdmin = user && user.role === "admin";

  const stripHtml = (html) => {
    if (typeof window === "undefined") return html;
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const truncatedContent =
    stripHtml(content).slice(0, 100) +
    (stripHtml(content).length > 100 ? "..." : "");

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-shadow hover:shadow-lg flex flex-col border border-gray-200 dark:border-gray-700 ${className} ${
        isSuspended ? "opacity-50" : ""
      }`}
      style={{ minHeight: compact ? "120px" : "400px" }}
    >
      <Link href={`/posts/${_id}`} onClick={onClick}>
        <div className="relative">
          <div
            style={{
              height: compact ? "80px" : "200px",
              overflow: "hidden",
            }}
          >
            <Image
              src={secureImageUrl}
              alt={title}
              width={800}
              height={600}
              style={{ width: "100%", height: "100%" }}
              className="object-cover"
            />
          </div>
          <div className="absolute top-2 left-2">
            {displayCategories.map((category, index) => (
              <span
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-1 px-2 rounded-full text-xs font-medium"
              >
                {capitalizeFirstLetter(category)}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <div className={`p-3 ${compact ? "pb-2" : ""} flex-grow`}>
        <Link href={`/posts/${_id}`} onClick={onClick}>
          <h3
            className={`font-bold ${
              compact ? "text-sm line-clamp-1" : "text-lg"
            } mb-1`}
          >
            {title}
            {isSuspended && (
              <span className="text-red-500 text-xs"> (Suspended)</span>
            )}
            {status === "pending" && (
              <span className="text-yellow-500 text-xs"> (Pending)</span>
            )}
          </h3>
          {compact ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {truncatedContent}
            </p>
          ) : (
            createdAt && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex justify-between">
                <span>{formatDate(createdAt)}</span>
                <span>{calculateReadTime(stripHtml(content))}</span>
              </div>
            )
          )}
          {!compact && content && (
            <div
              className="text-gray-600 dark:text-gray-300 text-sm mb-4 prose dark:prose-invert line-clamp-2"
              dangerouslySetInnerHTML={{ __html: content.slice(0, 200) }}
            />
          )}
        </Link>

        {!compact && parsedTags && parsedTags.length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => setShowTags(!showTags)}
              className="flex items-center text-sm text-gray-700 dark:text-gray-200 hover:text-primary mb-2"
            >
              <Tag size={16} className="mr-1" />
              {showTags ? "Hide Tags" : "Show Tags"}
            </button>
            {showTags && (
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
        )}

        <div className="flex items-center justify-between">
          <Link href={`/users/${author.userName}`}>
            <div className="flex items-center gap-2">
              <Image
                src={author.avatar || Demo_Image}
                alt={author.userName}
                width={24}
                height={24}
                className="rounded-full h-6 w-6 object-cover"
              />
              <span className="text-sm hover:text-primary dark:hover:text-violet-400 transition-colors">
                {capitalizeFirstLetter(author.userName)}
              </span>
            </div>
          </Link>

          {!compact && (
            <div className="flex items-center gap-4">
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
                  fill={showComments ? "violet" : "none"}
                  className={`mr-1 ${
                    showComments
                      ? "text-primary fill-primary"
                      : "text-gray-700 dark:text-gray-200 hover:fill-primary hover:text-primary"
                  }`}
                />
                {formatNumber(localCommentCount)}
              </button>
            </div>
          )}
        </div>
      </div>

      {!compact && showComments && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full max-w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!user || isSuspended}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddComment}
                className="px-4 py-1 text-sm bg-primary text-white rounded-lg hover:bg-violet-600 disabled:opacity-50"
                disabled={!user || !newComment.trim() || isSuspended}
              >
                Post Comment
              </button>
            </div>
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
      {(isAuthor || isAdmin) && !compact && (
        <div className="absolute top-4 right-4" ref={postDropdownRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === "post" ? null : "post");
            }}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Post options"
          >
            <MoreVertical
              size={20}
              className="text-gray-500 dark:text-gray-300"
            />
          </button>
          {dropdownOpen === "post" && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              {isAuthor && (
                <>
                  <Link
                    href={`/profile/edit/${_id}`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Post
                  </Link>
                  <button
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className={`flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left ${
                      isDeleting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Trash2 size={16} className="mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Post"}
                  </button>
                  {status === "pending" ? (
                    <button
                      onClick={(e) => handleUpdateStatus(e, "approved")}
                      className="flex items-center px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Approve Post
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleUpdateStatus(e, "pending")}
                      className="flex items-center px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <Ban size={16} className="mr-2" />
                      Set to Pending
                    </button>
                  )}
                </>
              )}
              {isAdmin && (
                <button
                  onClick={handleSuspendPost}
                  className="flex items-center px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <Ban size={16} className="mr-2" />
                  {isSuspended ? "Unsuspend Post" : "Suspend Post"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
