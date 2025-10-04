"use client";

import ProfileIcon from "@/app/assets/svgs/profile-icon";
import Loading from "@/app/components/Loading";
import PostCard from "@/app/components/PostCard";
import UserCard from "@/app/components/UserCard";
import axiosInstance from "@/app/utils/axiosConfig";
import { useAuth } from "@/context/AuthContext";
import {
  AlignJustify,
  Bell,
  ChevronDown,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const useClickOutside = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    let called = false;
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        if (!called) {
          called = true;
          setTimeout(() => {
            callback();
            called = false;
          }, 100);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [callback]);

  return ref;
};

const SearchInput = ({
  value,
  onChange,
  onClear,
  className,
  autoFocus,
  onKeyDown,
}) => (
  <div className={`relative ${className}`}>
    <input
      type="text"
      placeholder="Search posts and users"
      className="w-full rounded-full py-2 pl-4 pr-12 bg-gray-100 text-sm text-gray-950 dark:text-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      aria-label="Search posts and users"
    />
    <Search className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300" />
    {value && (
      <X
        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300 cursor-pointer hover:text-gray-700 dark:hover:text-gray-100"
        onClick={onClear}
        aria-label="Clear search"
      />
    )}
  </div>
);

const NavLinks = ({ onClick, user, isMobile }) => {
  const links = [
    { href: "/", label: "Home" },
    { href: "/posts", label: "Posts" },
    ...(user
      ? [
          { href: "/profile/create", label: "Create Post" },
          { href: "/profile", label: "Profile" },
        ]
      : []),
    { href: "/users", label: "Users" },
    { href: "/about", label: "About" },
  ];

  return (
    <div
      className={`${
        isMobile
          ? "bg-white dark:bg-gray-900 shadow-lg rounded-lg p-4"
          : "flex flex-col"
      }`}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md ${
            isMobile ? "mb-2" : ""
          }`}
          onClick={onClick}
        >
          {link.label}
        </Link>
      ))}
      {isMobile && (
        <div className="mt-2">
          <UserActions user={user} onClick={onClick} />
        </div>
      )}
    </div>
  );
};

const UserActions = ({ user, logout, authLoading, model, onClick }) => {
  if (authLoading || model) return null;
  return user ? (
    <button
      onClick={() => {
        logout();
        if (onClick) onClick();
      }}
      className="text-sm text-white bg-red-400 hover:bg-red-500 hover:shadow text-center px-3 py-1 rounded-sm w-full cursor-pointer"
      aria-label="Logout"
    >
      Logout
    </button>
  ) : (
    <Link
      href="/login"
      className="text-sm bg-primary text-white text-center px-3 py-1 rounded-sm hover:bg-violet-600 block w-full cursor-pointer"
      onClick={onClick}
      aria-label="Sign In"
    >
      Sign In
    </Link>
  );
};

const UserSection = ({
  user,
  authLoading,
  notifications,
  toggleNotificationDropdown,
  notificationOpen,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  notificationRef,
  model,
  isMobile,
  setError,
  loadingMore,
  hasNextPage,
  loadMoreNotifications,
  totalDocs,
}) => {
  if (authLoading || (model && isMobile)) return null;
  if (!user) return null;

  return (
    <>
      <div className="relative" ref={notificationRef}>
        <button
          onClick={toggleNotificationDropdown}
          aria-label="Notifications"
          aria-expanded={notificationOpen}
        >
          <Bell
            className={`h-5 w-5 ${
              notificationOpen
                ? "text-primary"
                : "text-gray-900 dark:text-gray-100"
            }`}
          />
          {totalDocs > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {totalDocs > 99 ? "99+" : totalDocs}
            </span>
          )}
        </button>
        {notificationOpen && (
          <div className="absolute top-full right-0 md:left-1/2 md:-translate-x-1/2 mt-3 w-64 bg-white dark:bg-gray-900 shadow-lg rounded-lg z-50 max-h-[300px] overflow-y-auto">
            {notifications.length === 0 && !loadingMore ? (
              <div className="p-4 text-center text-gray-600 dark:text-gray-300">
                No notifications
              </div>
            ) : (
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {notifications.length} of {totalDocs} notifications
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-primary hover:text-violet-600"
                      aria-label="Mark all notifications as read"
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={deleteAllNotifications}
                      className="text-xs text-red-500 hover:text-red-600"
                      aria-label="Delete all notifications"
                    >
                      Delete all
                    </button>
                  </div>
                </div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="mb-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2"
                  >
                    <p>{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-xs text-primary hover:text-violet-600"
                          onClick={toggleNotificationDropdown}
                        >
                          View
                        </Link>
                      )}
                      {!notification.isRead && (
                        <button
                          onClick={() =>
                            markNotificationAsRead(notification._id)
                          }
                          className="text-xs text-primary hover:text-violet-600"
                          aria-label="Mark notification as read"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="text-xs text-red-500 hover:text-red-600"
                        aria-label="Delete notification"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {loadingMore && (
                  <div className="p-2 text-center text-gray-600 dark:text-gray-300">
                    <Loading />
                  </div>
                )}
                {!loadingMore && hasNextPage && (
                  <div className="p-2 text-center">
                    <button
                      onClick={loadMoreNotifications}
                      className="text-xs text-primary hover:text-violet-600"
                      aria-label="Load more notifications"
                    >
                      Load More
                    </button>
                  </div>
                )}
                {!loadingMore && !hasNextPage && notifications.length > 0 && (
                  <div className="p-4 text-center text-gray-600 dark:text-gray-300">
                    No more notifications
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Link
        href="/profile"
        className="border-2 w-7 h-7 flex items-center justify-center rounded-full border-gray-900 dark:border-gray-100"
        aria-label="Profile"
      >
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt="User avatar"
            width={28}
            height={28}
            className="rounded-full object-cover"
          />
        ) : (
          <ProfileIcon className="h-6 w-6 p-0.5 text-gray-900 dark:text-gray-100" />
        )}
      </Link>
    </>
  );
};

export default function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dark, setDark] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user, logout, loading: authLoading } = useAuth();
  const [model, setModel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [focusedResult, setFocusedResult] = useState(null);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalDocs, setTotalDocs] = useState(0);
  const searchCache = useRef(new Map());
  const abortControllerRef = useRef(null);

  const searchRef = useClickOutside(() => {
    setSearchOpen(false);
    setSearchTerm("");
    setPosts([]);
    setUsers([]);
    setError(null);
    setFocusedResult(null);
  });
  const navRef = useClickOutside(() => setNavOpen(false));
  const mobileMenuRef = useClickOutside(() => setModel(false));
  const notificationRef = useClickOutside(() => setNotificationOpen(false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && searchOpen) {
        setSearchOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [searchOpen]);

  useEffect(() => {
    setIsHydrated(true);
    const isDarkMode = localStorage.getItem("Dark") === "true";
    setDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounceQuery(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      if (!debounceQuery) {
        setPosts([]);
        setUsers([]);
        setError(null);
        setLoading(false);
        return;
      }

      if (searchCache.current.has(debounceQuery)) {
        const { posts, users } = searchCache.current.get(debounceQuery);
        setPosts(posts);
        setUsers(users);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const [postsResult, usersResult] = await Promise.allSettled([
          axiosInstance.get("/search/posts", {
            params: { query: debounceQuery, limit: 5 },
            signal: abortControllerRef.current.signal,
          }),
          axiosInstance.get("/search/users", {
            params: { query: debounceQuery, limit: 5 },
            signal: abortControllerRef.current.signal,
          }),
        ]);

        const postsData =
          postsResult.status === "fulfilled"
            ? postsResult.value.data.data || []
            : [];
        const usersData =
          usersResult.status === "fulfilled"
            ? usersResult.value.data.data || []
            : [];

        setPosts(postsData);
        setUsers(usersData);
        searchCache.current.set(debounceQuery, {
          posts: postsData,
          users: usersData,
        });

        if (postsData.length === 0 && usersData.length === 0) {
          setError("No results found for this query.");
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        setError("Failed to load search results.");
        setPosts([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debounceQuery]);

  const fetchNotifications = useCallback(
    async (page = 1, append = false) => {
      if (!user || (!hasNextPage && append) || loadingMore) {
        return;
      }

      setLoadingMore(append);
      try {
        const response = await axiosInstance.get("/notifications", {
          params: { page, limit: 10 },
        });
        const {
          notifications: newNotifications,
          hasNextPage: apiHasNextPage,
          totalDocs,
        } = response.data.data;
        console.log("Notifications API response:", {
          page,
          notifications: newNotifications.length,
          hasNextPage: apiHasNextPage,
          totalDocs,
        });
        setNotifications((prev) => {
          const updated = append
            ? [...prev, ...newNotifications]
            : newNotifications;
          console.log("Updated notifications:", updated);
          return updated;
        });
        setHasNextPage(apiHasNextPage);
        setTotalDocs(totalDocs);
        setNotificationPage(page);
        console.log("State updated:", {
          notificationsLength: append
            ? prev.length + newNotifications.length
            : newNotifications.length,
          hasNextPage: apiHasNextPage,
          totalDocs,
          page,
        });
      } catch (error) {
        console.error("Fetch notifications error:", error);
        setError("Failed to load notifications.");
        if (!append) {
          setNotifications([]);
          setTotalDocs(0);
        }
      } finally {
        setLoadingMore(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      fetchNotifications(1);
    } else {
      setNotifications([]);
      setNotificationPage(1);
      setHasNextPage(true);
      setTotalDocs(0);
    }
  }, [user, fetchNotifications]);

  const loadMoreNotifications = useCallback(() => {
    if (hasNextPage && !loadingMore) {
      console.log("Load More clicked, fetching page:", notificationPage + 1);
      fetchNotifications(notificationPage + 1, true);
    }
  }, [hasNextPage, loadingMore, notificationPage, fetchNotifications]);

  const markNotificationAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      setError("Failed to mark notification as read.");
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axiosInstance.patch("/notifications", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setNotificationOpen(false);
    } catch (error) {
      setError("Failed to mark all notifications as read.");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotalDocs((prev) => prev - 1);
    } catch (error) {
      setError("Failed to delete notification.");
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await axiosInstance.delete("/notifications");
      setNotifications([]);
      setTotalDocs(0);
      setNotificationOpen(false);
    } catch (error) {
      setError("Failed to delete all notifications.");
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !dark;
    setDark(newDarkMode);
    localStorage.setItem("Dark", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  const toggleNotificationDropdown = () => setNotificationOpen((prev) => !prev);

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
    if (!searchOpen) {
      setTimeout(() => {
        searchRef.current?.querySelector("input")?.focus();
      }, 100);
    }
  };

  const toggleNav = () => setNavOpen((prev) => !prev);
  const modelHandler = () => setModel(true);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchTerm("");
      setSearchOpen(false);
      setFocusedResult(null);
      return;
    }

    const results = [...users, ...posts];
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedResult((prev) => {
        if (prev === null || prev === results.length - 1) return 0;
        return prev + 1;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedResult((prev) => {
        if (prev === null || prev === 0) return results.length - 1;
        return prev - 1;
      });
    } else if (e.key === "Enter" && focusedResult !== null) {
      e.preventDefault();
      const item = results[focusedResult];
      const href = item.userName
        ? `/users/${item.userName}`
        : `/posts/${item._id}`;
      window.location.href = href;
      setSearchTerm("");
      setSearchOpen(false);
      setFocusedResult(null);
    }
  };

  const handleResultClick = useCallback(() => {
    setSearchTerm("");
    setSearchOpen(false);
    setPosts([]);
    setUsers([]);
    setError(null);
    setFocusedResult(null);
  }, []);

  if (!isHydrated) {
    return <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700"></div>;
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-900 shadow-xl">
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Newsx Home">
          <img src="/logo.svg" alt="Newsx Logo" className="h-8 w-auto" />
        </Link>

        <div className="flex-1 mx-4 hidden md:block relative" ref={searchRef}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => {
              setSearchTerm("");
              setPosts([]);
              setUsers([]);
              setError(null);
            }}
            className="max-w-[28rem] mx-auto"
            onKeyDown={handleSearchKeyDown}
          />
          {debounceQuery && (
            <div
              className="absolute left-0 right-0 mx-auto w-full max-w-[28rem] bg-white dark:bg-gray-900 shadow-lg rounded-lg max-h-[70vh] overflow-y-auto z-50 top-[60px]"
              role="listbox"
              aria-label="Search results"
            >
              {loading ? (
                <div className="p-4 flex justify-center items-center">
                  <Loading />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-300">
                  {error}
                </div>
              ) : users.length === 0 && posts.length === 0 ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-300">
                  No results found for "{debounceQuery}".
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Found {users.length + posts.length} result
                    {users.length + posts.length !== 1 ? "s" : ""}
                  </div>
                  {users.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Users
                      </h3>
                      {users.map((user, index) => (
                        <div
                          key={user._id}
                          className={`mb-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            focusedResult === index
                              ? "bg-gray-100 dark:bg-gray-800"
                              : ""
                          }`}
                          role="option"
                          aria-selected={focusedResult === index}
                        >
                          <UserCard
                            user={user}
                            compact
                            onClick={handleResultClick}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {posts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Posts
                      </h3>
                      {posts.map((post, index) => (
                        <div
                          key={post._id}
                          className={`mb-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            focusedResult === users.length + index
                              ? "bg-gray-100 dark:bg-gray-800"
                              : ""
                          }`}
                          role="option"
                          aria-selected={focusedResult === users.length + index}
                        >
                          <PostCard
                            post={post}
                            compact
                            onClick={handleResultClick}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {searchOpen && (
          <div
            className="fixed top-0 left-0 w-full h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:hidden z-50 transition-opacity duration-200"
            ref={searchRef}
          >
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => {
                  setSearchTerm("");
                  setSearchOpen(false);
                  setPosts([]);
                  setUsers([]);
                  setError(null);
                }}
                className="flex-1"
                autoFocus
                onKeyDown={handleSearchKeyDown}
              />
              <button
                className="ml-2 text-gray-900 dark:text-gray-100"
                onClick={() => {
                  setSearchTerm("");
                  setSearchOpen(false);
                  setPosts([]);
                  setUsers([]);
                  setError(null);
                }}
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {debounceQuery && (
              <div
                className="p-4 w-full max-w-[28rem] mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg max-h-[70vh] overflow-y-auto"
                role="listbox"
                aria-label="Search results"
              >
                {loading ? (
                  <div className="p-4 flex justify-center items-center">
                    <Loading />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-gray-600 dark:text-gray-300">
                    {error}
                  </div>
                ) : users.length === 0 && posts.length === 0 ? (
                  <div className="p-4 text-center text-gray-600 dark:text-gray-300">
                    No results found for "{debounceQuery}".
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Found {users.length + posts.length} result
                      {users.length + posts.length !== 1 ? "s" : ""}
                    </div>
                    {users.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Users
                        </h3>
                        {users.map((user, index) => (
                          <div
                            key={user._id}
                            className={`mb-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                              focusedResult === index
                                ? "bg-gray-100 dark:bg-gray-800"
                                : ""
                            }`}
                            role="option"
                            aria-selected={focusedResult === index}
                          >
                            <UserCard
                              user={user}
                              compact
                              onClick={handleResultClick}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {posts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Posts
                        </h3>
                        {posts.map((post, index) => (
                          <div
                            key={post._id}
                            className={`mb-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                              focusedResult === users.length + index
                                ? "bg-gray-100 dark:bg-gray-800"
                                : ""
                            }`}
                            role="option"
                            aria-selected={
                              focusedResult === users.length + index
                            }
                          >
                            <PostCard
                              post={post}
                              compact
                              onClick={handleResultClick}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className="w-[50px] h-[23px] overflow-hidden rounded-full shadow-inner bg-gray-300 dark:bg-white relative flex justify-center items-center cursor-pointer"
            onClick={toggleTheme}
            role="button"
            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
          >
            <div
              className={`absolute flex items-center w-full h-full transition-transform duration-300 ${
                dark ? "translate-x-[20px]" : "translate-x-0"
              }`}
            >
              <Moon
                className="absolute left-1 top-[2.5px] h-5 w-5 dark:hidden"
                color="white"
              />
              <Sun
                className="absolute left-0 top-[2px] h-5 w-5 hidden dark:block"
                color="gray"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserSection
              user={user}
              authLoading={authLoading}
              notifications={notifications}
              toggleNotificationDropdown={toggleNotificationDropdown}
              notificationOpen={notificationOpen}
              markNotificationAsRead={markNotificationAsRead}
              markAllNotificationsAsRead={markAllNotificationsAsRead}
              deleteNotification={deleteNotification}
              deleteAllNotifications={deleteAllNotifications}
              notificationRef={notificationRef}
              model={model}
              isMobile={isMobile}
              setError={setError}
              loadingMore={loadingMore}
              hasNextPage={hasNextPage}
              loadMoreNotifications={loadMoreNotifications}
              totalDocs={totalDocs}
            />
          </div>

          <div
            className={model ? "hidden" : "relative hidden md:block"}
            ref={navRef}
          >
            <button
              className="flex items-center text-sm text-gray-900 dark:text-gray-100 hover:text-primary"
              onClick={toggleNav}
              aria-label="Navigation menu"
              aria-expanded={navOpen}
            >
              Menu
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            {navOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-900 shadow-lg rounded-lg z-50">
                <NavLinks
                  user={user}
                  onClick={() => setNavOpen(false)}
                  isMobile={false}
                />
              </div>
            )}
          </div>

          <div className={model ? "hidden" : "hidden md:block"}>
            <UserActions
              user={user}
              logout={logout}
              authLoading={authLoading}
              model={model}
            />
          </div>

          <button
            className="md:hidden border rounded-sm text-gray-950 dark:text-gray-100"
            onClick={modelHandler}
            aria-label="Toggle mobile menu"
          >
            <AlignJustify className="h-5 w-5" />
          </button>

          {model && (
            <div
              className="fixed top-0 right-0 h-screen md:hidden bg-white dark:bg-gray-900 w-[12rem] p-4 transition-all duration-300 ease-in-out z-50"
              ref={mobileMenuRef}
            >
              <button
                className="text-red-500 self-end mb-4"
                onClick={() => setModel(false)}
                aria-label="Close mobile menu"
              >
                <X className="h-5 w-5" />
              </button>
              {user && (
                <Link
                  href="/profile"
                  className="flex justify-center mb-6"
                  onClick={() => setModel(false)}
                >
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt="User avatar"
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-gray-900 dark:border-gray-100 object-cover"
                    />
                  ) : (
                    <div className="border-2 w-16 h-16 flex items-center justify-center rounded-full border-gray-900 dark:border-gray-100">
                      <ProfileIcon className="h-12 w-12 p-1 text-gray-900 dark:text-gray-100" />
                    </div>
                  )}
                </Link>
              )}
              <NavLinks
                user={user}
                onClick={() => setModel(false)}
                isMobile={true}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
