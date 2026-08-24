import { exportToExcel } from "@/utils/singleExport";
import React, { useEffect } from "react";

interface ExportToExcelProps {
  title: string;
  data: string[][] | [];
  headers: string[];
  success: boolean;
  setIsExportTriggered: React.Dispatch<React.SetStateAction<boolean>>;
  refetch: any;
}

export default function ExportToExcel({
  title,
  data,
  headers,
  success,
  setIsExportTriggered,
  refetch,
}: ExportToExcelProps) {
  const handleClick = () => {
    setIsExportTriggered(true);
    refetch();
  };

  useEffect(() => {
    if (success) {
      const newHeaders = headers.filter((header) => header !== "Actions");
      exportToExcel({
        title,
        data,
        headers: newHeaders,
      });
    }
  }, [success]);
  return (
    <button
      className="bg-blue-600 mr-4 p-3 text-white font-semibold"
      onClick={handleClick}
    >
      Export to Excel
    </button>
  );
}
