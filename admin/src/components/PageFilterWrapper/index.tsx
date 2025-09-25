import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PageFilterWrapper({
  title,
  children,
  defaultCollapsed = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="mb-6 border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={toggleCollapse}
          >
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-gray-900">
              {title}
            </h3>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={isCollapsed ? "Expand filters" : "Collapse filters"}
            >
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
          {/* <div className="flex items-center gap-3">
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                Clear all
              </Button>
            )}
            <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white px-6">
              Apply Filters
            </Button>
          </div> */}
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "max-h-0 opacity-0 overflow-hidden"
            : "max-h-[2000px] opacity-100 pb-6 px-6"
        }`}
      >
        {children}
      </div>

      {/* Active filters */}
      {/* {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600 font-medium py-1">Active filters:</span>
            {activeFilters.includes("name") && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                Name: {filters.name}
                <X className="h-3 w-3 cursor-pointer hover:text-red-900" onClick={() => removeFilter("name")} />
              </Badge>
            )}
            {activeFilters.includes("email") && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                Email: {filters.email}
                <X className="h-3 w-3 cursor-pointer hover:text-red-900" onClick={() => removeFilter("email")} />
              </Badge>
            )}
            {activeFilters.includes("verified") && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                {filters.verified ? "Verified" : "Not Verified"}
                <X className="h-3 w-3 cursor-pointer hover:text-red-900" onClick={() => removeFilter("verified")} />
              </Badge>
            )}
            {activeFilters.includes("date") && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
                Date: {filters.date?.toLocaleDateString()}
                <X className="h-3 w-3 cursor-pointer hover:text-red-900" onClick={() => removeFilter("date")} />
              </Badge>
            )}
          </div>
        )} */}
    </div>
  );
}
