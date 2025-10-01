"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function GoToTop() {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;

      if (scrollTop) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`flex justify-end pb-4 z-30 ${
        isSticky
          ? "sticky bottom-2 right-6 opacity-100 visible"
          : "opacity-0 invisible"
      }`}
    >
      <button
        className="px-4 py-2 bg-gray-200 hover:bg-primary hover:text-white rounded-full cursor-pointer transition-all duration-300 shadow-lg"
        onClick={scrollToTop}
        aria-label="Go to top"
      >
        <ArrowUp size={20} className="" />
      </button>
    </div>
  );
}
