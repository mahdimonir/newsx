export const navItems = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Post",
    href: "/post",
  },
  {
    title: "Profile",
    href: "/profile",
  },
];

export const calculateReadTime = (content) => {
  const wordsPerMinute = 120;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-UK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const capitalizeFirstLetter = (string) => {
  if (!string) return "Unknown";
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Format numbers for likes and comments (e.g., 1000 -> "1k", 1000000 -> "1M")
export const formatNumber = (num) => {
  if (typeof num !== "number" || isNaN(num)) {
    return "0"; // Return "0" if num is not a valid number
  }
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};
