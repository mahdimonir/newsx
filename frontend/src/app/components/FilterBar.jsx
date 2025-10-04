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
    ".NET",
    "Blockchain",
    "Blog",
    "Businesses",
    "Data Engineering",
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
    "Technology",
    "Web",
    "Adventure",
    "Food",
    "Technologies",
    "Travel",
    "Art",
  ];

  // Conditionally include "Pending" sort option if user is authenticated
  const sortOptions = user
    ? ["Newest", "Oldest", "Most Liked", "Most Commented", "Pending"]
    : ["Newest", "Oldest", "Most Liked", "Most Commented"];

  return (
    <div className="flex flex-col lg:flex-row items-center mb-6 gap-3 w-full max-w-[1200px] mx-auto">
      {/* Category Filters */}
      <div className="w-full lg:flex-1 min-w-0">
        {/* Dropdown for small screens */}
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="block sm:hidden w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-base"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Scrollable buttons for larger screens */}
        <div className="hidden sm:flex gap-2 overflow-x-auto whitespace-nowrap pb-2 pr-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                activeCategory === category
                  ? "bg-primary text-white"
                  : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2 w-full sm:w-52 lg:w-56 flex-shrink-0">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Sort By:
        </span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
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
