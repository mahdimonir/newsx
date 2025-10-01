"use client";

import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import {
  Ban,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { formatDate } from "../configs/constants";
import Loading from "./Loading";
import PostCard from "./PostCard";
import UserCard from "./UserCard";

const ProfileActions = ({
  user,
  profile,
  isFollowing,
  handleFollow,
  handleSuspend,
  isFollowLoading,
  isSuspendLoading,
  handleDeleteAccount,
  isDeleteLoading,
  showForgotPassword,
  setShowForgotPassword,
  showOtpForm,
  setShowOtpForm,
  handleRequestOtp,
  handleResetPassword,
  otp,
  setOtp,
  userEmail,
  setUserEmail,
  canResend,
  setCanResend,
  timer,
  setTimer,
  otpLoading,
  setOtpLoading,
  inputRefs,
  passwordVisible,
  setPasswordVisible,
  serverError,
  setServerError,
  errors,
  register,
  getValues,
  handleSubmit,
}) => {
  if (!user) return null;
  const isOwnProfile = user.userName === profile.userName;
  const isAdmin = user.role === "admin";

  return (
    <div className="mt-4 flex flex-col sm:flex-row gap-4">
      {isOwnProfile ? (
        <>
          <Link
            href="/profile/edit"
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-full hover:bg-violet-600 text-center"
            aria-label="Edit Profile"
          >
            Edit Profile
          </Link>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleteLoading}
            className={`w-full sm:w-auto px-4 py-2 rounded-full flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 ${
              isDeleteLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Delete Account"
          >
            {isDeleteLoading ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="h-5 w-5" /> Delete Account
              </>
            )}
          </button>
          <button
            onClick={() => {
              setShowForgotPassword(true);
              setServerError("");
            }}
            className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 text-center"
            aria-label="Forgot Password"
          >
            Forgot Password
          </button>
        </>
      ) : (
        <button
          onClick={handleFollow}
          disabled={isFollowLoading}
          className={`w-full sm:w-auto px-4 py-2 rounded-full flex items-center justify-center gap-2 ${
            isFollowing
              ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              : "bg-primary text-white hover:bg-violet-600"
          } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={isFollowing ? "Unfollow" : "Follow"}
        >
          {isFollowLoading ? (
            "Loading..."
          ) : isFollowing ? (
            <>
              <UserMinus className="h-5 w-5" /> Unfollow
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" /> Follow
            </>
          )}
        </button>
      )}
      {isAdmin && !isOwnProfile && (
        <button
          onClick={handleSuspend}
          disabled={isSuspendLoading}
          className={`w-full sm:w-auto px-4 py-2 rounded-full flex items-center justify-center gap-2 ${
            profile.isSuspended
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-red-500 text-white hover:bg-red-600"
          } ${isSuspendLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={profile.isSuspended ? "Unsuspend User" : "Suspend User"}
        >
          {isSuspendLoading ? (
            "Loading..."
          ) : (
            <>
              <Ban className="h-5 w-5" />
              {profile.isSuspended ? "Unsuspend" : "Suspend"}
            </>
          )}
        </button>
      )}

      {isOwnProfile && showForgotPassword && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 flex items-center justify-center z-50 w-full max-w-md mx-auto p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-4">
              {showOtpForm
                ? "Enter OTP and New Password"
                : "Reset Your Password"}
            </h3>
            {!showOtpForm ? (
              <form onSubmit={handleSubmit(handleRequestOtp)}>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="support@newsx.com"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                  disabled={otpLoading}
                  aria-label="Email address"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address",
                    },
                  })}
                  defaultValue={profile.email}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setServerError("");
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="px-4 py-2 bg-primary text-white rounded-full hover:bg-violet-600 disabled:opacity-50"
                  >
                    {otpLoading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
                {serverError && (
                  <p className="text-red-500 text-sm mt-2">{serverError}</p>
                )}
              </form>
            ) : (
              <form onSubmit={handleSubmit(handleResetPassword)}>
                <div className="flex justify-center gap-4 mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        if (/^[0-9]?$/.test(e.target.value)) {
                          const newOtp = [...otp];
                          newOtp[index] = e.target.value;
                          setOtp(newOtp);
                          if (
                            e.target.value &&
                            index < inputRefs.current.length - 1
                          ) {
                            inputRefs.current[index + 1]?.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[index] && index > 0) {
                          inputRefs.current[index - 1]?.focus();
                        }
                      }}
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="w-14 h-14 text-center border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none rounded text-xl"
                      disabled={otpLoading}
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                    disabled={otpLoading}
                    aria-label="New password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                  >
                    {passwordVisible ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
                <label className="block text-gray-700 dark:text-gray-300 mb-1 mt-4">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-0 mb-1"
                    disabled={otpLoading}
                    aria-label="Confirm new password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === getValues("password") ||
                        "Passwords do not match",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                  >
                    {passwordVisible ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setShowOtpForm(false);
                      setServerError("");
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otp.some((d) => d === "") || otpLoading}
                    className="px-4 py-2 bg-primary text-white rounded-full hover:bg-violet-600 disabled:opacity-50"
                  >
                    {otpLoading ? "Resetting Password..." : "Reset Password"}
                  </button>
                </div>
                <div className="text-center text-sm mt-4">
                  <button
                    className="text-violet-600 cursor-pointer disabled:opacity-50"
                    disabled={!canResend || otpLoading}
                    onClick={async () => {
                      try {
                        setServerError("");
                        setOtpLoading(true);
                        setCanResend(false);
                        setTimer(60);
                        const res = await axiosInstance.post(
                          "/auth/forget-password",
                          { email: userEmail },
                          { withCredentials: true }
                        );
                        if (res.status === 200 && res.data.success) {
                          toast.success(
                            res.data.message || "New OTP sent successfully!"
                          );
                        }
                      } catch (err) {
                        const errorMessage =
                          err.response?.data?.message ||
                          err.message ||
                          "Failed to resend OTP";
                        setServerError(errorMessage);
                        toast.error(errorMessage);
                      } finally {
                        setOtpLoading(false);
                      }
                    }}
                  >
                    {canResend
                      ? otpLoading
                        ? "Resending..."
                        : "Resend OTP"
                      : `Resend in ${timer}s`}
                  </button>
                </div>
                {serverError && (
                  <p className="text-red-500 text-sm mt-2">{serverError}</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const UserDetails = ({ profile }) => {
  return (
    <div className="mt-4 text-gray-600 dark:text-gray-400 flex">
      <div className="flex flex-col items-start">
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Role:</strong> {profile.role}
        </p>
        <p className="flex gap-2">
          <strong>Verified:</strong>
          {profile.isVerified ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <span>Not Verified</span>
          )}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          {profile.isSuspended ? "Suspended" : "Active"}
        </p>
        <p>
          <strong>Joined:</strong> {formatDate(profile.createdAt)}
        </p>
        <p>
          <strong>Last Updated:</strong> {formatDate(profile.updatedAt)}
        </p>
      </div>
    </div>
  );
};

export default function UserProfile({ userName }) {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [approvedPosts, setApprovedPosts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [suspendedPosts, setSuspendedPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socialError, setSocialError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isSuspendLoading, setIsSuspendLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otpLoading, setOtpLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sortBy, setSortBy] = useState("approved");
  const inputRefs = useRef([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const targetUserName = userName || user?.userName;
        if (!targetUserName) {
          throw new Error("User not logged in");
        }
        // Fetch profile
        const profileResponse = await axiosInstance.get(
          `/users/${targetUserName}`
        );
        const profileData = profileResponse.data.data;
        setProfile(profileData);
        setFollowers(profileData.followers || []);
        setFollowing(profileData.following || []);
        setIsFollowing(
          user &&
            profileData.followers?.some((f) => f.userName === user.userName)
        );

        // Fetch posts based on role and profile ownership
        const isOwnProfile = user && user.userName === targetUserName;
        const isAdmin = user && user.role === "admin";
        const isAuthor = isOwnProfile && user.role !== "admin";

        let approved = [];
        let pending = [];
        let suspended = [];

        if (isAuthor || (isAdmin && isOwnProfile)) {
          // Authors or admins viewing own profile: fetch /posts/my and /posts/pending
          const [approvedResponse, pendingResponse] = await Promise.all([
            axiosInstance.get(`/posts/?author=${targetUserName}`),
            axiosInstance.get("/posts/pending"),
          ]);
          approved =
            approvedResponse.data?.data?.posts.filter(
              (post) => post.status === "approved"
            ) || [];
          pending = pendingResponse.data?.data?.posts || [];
        } else if (isAdmin && !isOwnProfile) {
          // Admins viewing another user's profile: fetch /posts, /posts/pending, /admin/suspended/post
          const [approvedResponse, pendingResponse, suspendedResponse] =
            await Promise.all([
              axiosInstance.get(`/posts/?author=${targetUserName}`),
              axiosInstance.get(`/posts/pending?author=${targetUserName}`),
              axiosInstance.get(
                `/admin/suspended/posts?author=${targetUserName}`
              ),
            ]);
          approved = approvedResponse.data?.data?.posts || [];
          pending = pendingResponse.data?.data?.posts || [];
          suspended = suspendedResponse.data?.data?.posts || [];
        } else {
          // Other users: fetch approved posts from /posts
          const approvedResponse = await axiosInstance.get(
            `/posts?author=${targetUserName}`
          );
          approved = approvedResponse.data?.data?.posts || [];
        }

        // Fetch full author data for unique authors
        const allPosts = [...approved, ...pending, ...suspended];
        const uniqueAuthors = [
          ...new Set(allPosts.map((post) => post.author.userName)),
        ];
        let fullAuthors = {};
        if (uniqueAuthors.length > 0) {
          const authorPromises = uniqueAuthors.map((userName) =>
            axiosInstance.get(`/users/${userName}`)
          );
          const authorResponses = await Promise.all(authorPromises);
          fullAuthors = authorResponses.reduce((acc, res) => {
            const author = res.data.data;
            acc[author.userName] = author;
            return acc;
          }, {});
        }

        // Enhance posts with full author data
        setApprovedPosts(
          approved.map((post) => ({
            ...post,
            author: fullAuthors[post.author.userName] || post.author,
          }))
        );
        setPendingPosts(
          pending.map((post) => ({
            ...post,
            author: fullAuthors[post.author.userName] || post.author,
          }))
        );
        setSuspendedPosts(
          suspended.map((post) => ({
            ...post,
            author: fullAuthors[post.author.userName] || post.author,
          }))
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load profile or posts"
        );
        toast.error("Failed to load profile or posts");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfileAndPosts();
    }
  }, [userName, user, authLoading]);

  useEffect(() => {
    const fetchSocialData = async () => {
      if (followers.length === 0 && following.length === 0) return;

      setSocialLoading(true);
      setSocialError(null);

      try {
        const followerPromises = followers.map((follower) =>
          axiosInstance.get(`/users/${follower.userName}`)
        );
        const followerResponses = await Promise.all(followerPromises);
        const fullFollowers = followerResponses.map((res) => res.data.data);
        setFollowers(fullFollowers);

        const followingPromises = following.map((followed) =>
          axiosInstance.get(`/users/${followed.userName}`)
        );
        const followingResponses = await Promise.all(followingPromises);
        const fullFollowing = followingResponses.map((res) => res.data.data);
        setFollowing(fullFollowing);
      } catch (err) {
        setSocialError(
          err.response?.data?.message || "Failed to load social data"
        );
        toast.error("Failed to load follower/following details");
      } finally {
        setSocialLoading(false);
      }
    };

    fetchSocialData();
  }, [followers.length, following.length]);

  const handleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsFollowLoading(true);
    try {
      const targetUserName = userName || user.userName;
      const response = await axiosInstance.post(
        "/users/follow",
        { userName: targetUserName },
        { withCredentials: true }
      );
      setIsFollowing(response.data.data.isFollowing);
      setProfile((prev) => ({
        ...prev,
        followers: response.data.data.isFollowing
          ? [...prev.followers, { _id: user._id, userName: user.userName }]
          : prev.followers.filter((f) => f.userName !== user.userName),
      }));
      if (response.data.data.isFollowing) {
        try {
          const userResponse = await axiosInstance.get(
            `/users/${user.userName}`
          );
          const fullUserData = userResponse.data.data;
          setFollowers((prev) => [
            ...prev.filter((f) => f.userName !== user.userName),
            fullUserData,
          ]);
        } catch (err) {
          console.error("Failed to fetch full user data:", err);
        }
      } else {
        setFollowers((prev) =>
          prev.filter((f) => f.userName !== user.userName)
        );
      }
      toast.success(
        response.data.message ||
          (response.data.data.isFollowing ? "Followed" : "Unfollowed")
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update follow status";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleSuspend = async () => {
    setIsSuspendLoading(true);
    try {
      const targetUserName = userName || user.userName;
      const response = await axiosInstance.patch(
        `/admin/suspend/user/${targetUserName}`
      );
      setProfile((prev) => ({
        ...prev,
        isSuspended: response.data.data.isSuspended,
      }));
      toast.success(
        response.data.data.isSuspended
          ? "User suspended successfully"
          : "User unsuspended successfully"
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update suspend status";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSuspendLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleteLoading(true);
    try {
      const response = await axiosInstance.delete("/auth/delete", {
        withCredentials: true,
      });
      if (response.status === 200 && response.data.success) {
        toast.success(response.data.message || "Account deleted successfully!");
        setUser(null);
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("rememberMe");
        }
        router.push("/login");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete account";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleRequestOtp = async ({ email }) => {
    try {
      setServerError("");
      setOtpLoading(true);

      const res = await axiosInstance.post(
        "/auth/forget-password",
        { email },
        { withCredentials: true }
      );

      if (res.status === 200 && res.data.success) {
        setUserEmail(email);
        setShowOtpForm(true);
        setCanResend(false);
        setTimer(60);
        toast.success(res.data.message || "OTP sent to your email!");
      } else {
        throw new Error(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to send OTP";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async ({ password, confirmPassword }) => {
    try {
      setServerError("");
      setOtpLoading(true);

      const enteredOtp = otp.join("").trim().toString();
      if (!enteredOtp || enteredOtp.length !== 4) {
        throw new Error("Please enter a complete 4-digit OTP");
      }
      if (!userEmail) {
        throw new Error("Email not found. Please start over.");
      }

      const res = await axiosInstance.post(
        "/auth/reset-password",
        { email: userEmail, otp: enteredOtp, password },
        { withCredentials: true }
      );

      if (res.status === 200 && res.data.success) {
        setOtp(Array(4).fill(""));
        toast.success(res.data.message || "Password reset successfully!");
        setTimeout(() => {
          setShowForgotPassword(false);
          setShowOtpForm(false);
        }, 2000);
      } else {
        throw new Error(res.data.message || "Failed to reset password");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Password reset failed";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setApprovedPosts((prev) => prev.filter((post) => post._id !== postId));
    setPendingPosts((prev) => prev.filter((post) => post._id !== postId));
    setSuspendedPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  useEffect(() => {
    let timeout;
    if (showOtpForm && timer > 0 && !canResend) {
      timeout = setTimeout(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timeout);
  }, [timer, showOtpForm, canResend]);

  if (loading || authLoading) {
    return <Loading />;
  }

  if (error || !profile) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-red-500">{error || "User not found"}</p>
        <Link
          href="/users"
          className="mt-4 inline-block text-primary hover:text-violet-600"
        >
          Back to Users
        </Link>
      </div>
    );
  }

  const isOwnProfile = user && user.userName === profile.userName;
  const isAdmin = user && user.role === "admin";
  const showSortBy = isOwnProfile || isAdmin;
  const sortOptions =
    isAdmin && !isOwnProfile
      ? ["approved", "suspended"]
      : ["approved", "pending"];
  const postsToShow =
    sortBy === "approved"
      ? approvedPosts
      : sortBy === "pending"
      ? pendingPosts
      : suspendedPosts;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          {profile.avatar ? (
            <Image
              src={profile.avatar}
              alt={profile.userName}
              fill
              className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold">
              {profile.userName[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold">
            {profile.name || profile.userName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            @{profile.userName}
          </p>
          {profile.bio && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {profile.bio}
            </p>
          )}
          <div className="mt-4 flex gap-4 justify-center md:justify-start">
            <button
              onClick={() => setActiveTab("posts")}
              className="hover:text-primary"
              aria-label="View Posts"
            >
              {approvedPosts.length +
                pendingPosts.length +
                suspendedPosts.length}{" "}
              Posts
            </button>
            <button
              onClick={() => setActiveTab("followers")}
              className="hover:text-primary"
              aria-label="View Followers"
            >
              {followers.length} Followers
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className="hover:text-primary"
              aria-label="View Following"
            >
              {following.length} Following
            </button>
          </div>
          <ProfileActions
            user={user}
            profile={profile}
            isFollowing={isFollowing}
            handleFollow={handleFollow}
            handleSuspend={handleSuspend}
            isFollowLoading={isFollowLoading}
            isSuspendLoading={isSuspendLoading}
            handleDeleteAccount={handleDeleteAccount}
            isDeleteLoading={isDeleteLoading}
            showForgotPassword={showForgotPassword}
            setShowForgotPassword={setShowForgotPassword}
            showOtpForm={showOtpForm}
            setShowOtpForm={setShowOtpForm}
            handleRequestOtp={handleRequestOtp}
            handleResetPassword={handleResetPassword}
            otp={otp}
            setOtp={setOtp}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            canResend={canResend}
            setCanResend={setCanResend}
            timer={timer}
            setTimer={setTimer}
            otpLoading={otpLoading}
            setOtpLoading={setOtpLoading}
            inputRefs={inputRefs}
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            serverError={serverError}
            setServerError={setServerError}
            errors={errors}
            register={register}
            getValues={getValues}
            handleSubmit={handleSubmit}
          />
          <UserDetails profile={profile} />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            className={`pb-2 px-4 ${
              activeTab === "posts"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-600 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab("posts")}
            aria-selected={activeTab === "posts"}
          >
            Posts
          </button>
          <button
            className={`pb-2 px-4 ${
              activeTab === "followers"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-600 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab("followers")}
            aria-selected={activeTab === "followers"}
          >
            Followers
          </button>
          <button
            className={`pb-2 px-4 ${
              activeTab === "following"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-600 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab("following")}
            aria-selected={activeTab === "following"}
          >
            Following
          </button>
        </div>

        {activeTab === "posts" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Posts</h2>
              {showSortBy && (
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Sort posts by status"
                  >
                    {sortOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            {postsToShow.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No {sortBy} posts yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {postsToShow.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onPostDeleted={handlePostDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "followers" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Followers</h2>
            {socialLoading ? (
              <Loading />
            ) : socialError ? (
              <p className="text-red-500">{socialError}</p>
            ) : followers.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No followers yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {followers.map((follower) => (
                  <UserCard key={follower._id} user={follower} />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "following" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Following</h2>
            {socialLoading ? (
              <Loading />
            ) : socialError ? (
              <p className="text-red-500">{socialError}</p>
            ) : following.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                Not following anyone yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {following.map((followed) => (
                  <UserCard key={followed._id} user={followed} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
