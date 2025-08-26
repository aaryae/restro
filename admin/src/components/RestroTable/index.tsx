import React from "react";

// Define the Table type based on the Sequelize schema
interface Table {
  id: number;
  floor: { id: number; floorNo: string };
  tableNo: string;
  name: string | null;
  type: "indoor" | "outdoor" | "vip" | "regular";
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentSessionId: string | null;
  sessionStartTime: string | null;
  isActive: boolean;
}

interface RestroTableProps {
  table: Table;
  onClick: (id: number) => void;
}

const RestroTable: React.FC<RestroTableProps> = ({ table, onClick }) => {
  return (
    <div
      onClick={() =>
        table.status !== "maintenance" && onClick(table.id, table.status)
      }
      className={`p-4 bg-white hover:cursor-pointer rounded-lg shadow-md border-l-4 
        ${
          table.status === "available"
            ? "border-green-500"
            : table.status === "occupied"
              ? "border-red-500"
              : table.status === "reserved"
                ? "border-yellow-500"
                : "border-gray-500 hover:cursor-default"
        } 
        hover:shadow-lg transition-shadow duration-200`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {table.floor.floorNo}
        </span>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full 
            ${
              table.status === "available"
                ? "bg-green-100 text-green-800"
                : table.status === "occupied"
                  ? "bg-red-100 text-red-800"
                  : table.status === "reserved"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
            }`}
        >
          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        </span>
      </div>
      <div className="flex justify-center">
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-bold text-lg
            ${
              table.status === "available"
                ? "bg-green-500"
                : table.status === "occupied"
                  ? "bg-red-500"
                  : table.status === "reserved"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
            }`}
        >
          {table.tableNo}
        </div>
      </div>
    </div>
  );
};

export default RestroTable;
