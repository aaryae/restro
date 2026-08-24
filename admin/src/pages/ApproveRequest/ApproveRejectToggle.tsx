import useTranslation from "@/locale/useTranslation";
import { useState } from "react";

export default function ApproveRejectToggle({
  id,
  currentStatus,
  onToggle,
}: {
  id: number;
  currentStatus: string;
  onToggle: (id: number, newStatus: string) => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const translate = useTranslation();

  const handleToggle = (newStatus: string) => {
    setStatus(newStatus);
    onToggle(id, newStatus);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-sm rounded bg-green-500 text-white"
          onClick={() => handleToggle("Approved")}
        >
          {translate("Approve")}
        </button>
        <button
          className="px-3 py-1 text-sm rounded bg-red-500 text-white"
          onClick={() => handleToggle("Rejected")}
        >
          {translate("Reject")}
        </button>
      </div>
    </div>
  );
}
