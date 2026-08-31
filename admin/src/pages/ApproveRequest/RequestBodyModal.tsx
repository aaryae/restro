import useTranslation from "@/locale/useTranslation";
import { useState } from "react";

// Modal component for displaying the full request body
export default function RequestBodyModal({ data }: { data: object }) {
  const [isOpen, setIsOpen] = useState(false);
  const translate = useTranslation();

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <button onClick={handleToggle} className="text-blue-500 underline">
        {translate("View Details")}
      </button>
      {isOpen && (
        <div className="serve-overlay fixed inset-0 z-50 flex items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            className="serve-modal w-full max-w-lg rounded-lg p-4"
          >
            <button onClick={handleToggle} className="text-red-500 float-right">
              Close
            </button>
            <h2 className="text-lg font-bold mb-2">Request Body Details</h2>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
