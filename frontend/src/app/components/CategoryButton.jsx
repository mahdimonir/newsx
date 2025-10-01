import Link from "next/link";

export default function CategoryButton({ category, active = false }) {
  return (
    <Link
      href={`/category/${category.toLowerCase()}`}
      className={`px-4 py-1 rounded-full text-sm ${
        active ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
      }`}
    >
      {category}
    </Link>
  );
}
