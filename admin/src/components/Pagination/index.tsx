import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";

export default function Pagination({ media, handlePageChange }) {
  return (
    <div className="mt-auto w-full flex justify-between font-[400] text-[14px] text-[#2F2B3D] py-[1rem] px-[0.5rem] ">
      <div className="text-xs sm:text-sm whitespace-nowrap">
        Show: {media.data.limit ?? 0} Entries
      </div>
      <div className="font-[500] text-[#333333] text-xs sm:text-[0.75rem] flex justify-center gap-1 sm:gap-[0.25rem]">
        {/* Left Arrow */}
        <button
          className="rounded-full bg-white border flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
          onClick={() => handlePageChange(media.data.page - 1)} // Decrement page
        >
          <MdKeyboardArrowLeft />
        </button>

        {/* Pagination Numbers */}
        {Array.from({ length: media.data.totalPages }).map((_, index) => {
          const pageNumber = index + 1;
          const isCurrentPage = media.data.page === pageNumber;
          const isNextPage = media.data.page + 1 === pageNumber;

          // Render only the current and next pages
          if (isCurrentPage || isNextPage) {
            return (
              <button
                key={index}
                onClick={() => handlePageChange(pageNumber)} // Change page
                className={`rounded-full flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer ${
                  isCurrentPage
                    ? "bg-primaryColor text-white"
                    : "bg-white border"
                }`}
              >
                {pageNumber}
              </button>
            );
          }

          // Add ellipsis after the current and next pages
          if (pageNumber === media.data.page + 2) {
            return (
              <div
                key="ellipsis"
                className="text-[#999999] flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
              >
                ...
              </div>
            );
          }

          return null; // Skip other items
        })}

        {/* Right Arrow */}
        <button
          className="rounded-full bg-white border flex justify-center items-center py-[0.5rem] px-[0.75rem] cursor-pointer"
          onClick={() => handlePageChange(media.data.page + 1)}
          // Increment page
        >
          <MdKeyboardArrowRight />
        </button>
      </div>

      <div className="flex justify-center gap-2 sm:gap-6 text-xs sm:text-sm">
        <p className="whitespace-nowrap">
          Page {media.data.page ?? 0} of {media.data.totalPages ?? 0}
        </p>
        <p className="whitespace-nowrap">Total: {media.data.total ?? 0}</p>
      </div>
    </div>
  );
}
