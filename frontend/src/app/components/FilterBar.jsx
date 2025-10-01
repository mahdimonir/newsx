"use client";

export default function FilterBar({
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
  user, // Add user prop
}) {
  const categories = [
    "All",
    "Adventure",
    "Food",
    "Technologies",
    "Travel",
    "Art",
    "Trending",
  ];

  // Conditionally include "Pending" sort option if user is authenticated
  const sortOptions = user
    ? ["Newest", "Oldest", "Most Liked", "Most Commented", "Pending"]
    : ["Newest", "Oldest", "Most Liked", "Most Commented"];

  return (
    <div className="flex flex-col lg:flex-row justify-between mb-6 gap-4">
      {/* Category Filters */}
      <div className="w-full sm:w-auto">
        {/* Dropdown for small screens */}
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="block sm:hidden w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Buttons for larger screens */}
        <div className="hidden sm:flex gap-4">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full ${
                activeCategory === category
                  ? "bg-primary text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Sort By:
        </span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
