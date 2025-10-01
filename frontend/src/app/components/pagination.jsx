"use client";

import { DOTS, usePagination } from "../hooks/usePagination";

const PaginationClient = ({
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
}) => {
  const paginationRange = usePagination({ totalCount, pageSize, currentPage });

  if (!paginationRange || paginationRange.length < 2) return null;

  const lastPage = Math.ceil(totalCount / pageSize);

  return (
    <ul className="flex gap-2 items-center mt-4">
      <li
        onClick={() => onPageChange(currentPage - 1)}
        className={`px-3 py-1 border rounded cursor-pointer ${
          currentPage === 1 ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        Prev
      </li>

      {paginationRange.map((page, index) => (
        <li
          key={index}
          onClick={() => page !== DOTS && onPageChange(page)}
          className={`px-3 py-1 border rounded cursor-pointer ${
            page === currentPage ? "bg-primary text-white" : ""
          }`}
        >
          {page}
        </li>
      ))}

      <li
        onClick={() => onPageChange(currentPage + 1)}
        className={`px-3 py-1 border rounded cursor-pointer ${
          currentPage === lastPage ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        Next
      </li>
    </ul>
  );
};

export default PaginationClient;
