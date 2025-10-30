import React from "react";

// Define the Table type based on the Sequelize schema

interface Floor {
  id: number;
  floorNo: string;
  isActive: boolean;
}
interface Table {
  id: number;
  floor: Floor;
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
        table.status !== "maintenance" &&
        table.floor.isActive &&
        onClick(table.id)
      }
      className={`px-4 pt-6 pb-14 bg-white rounded-lg shadow-md border-l-4 
        ${
          !table.floor.isActive
            ? "border-gray-400 cursor-not-allowed opacity-100"
            : table.status === "available"
              ? "border-green-700 hover:cursor-pointer"
              : table.status === "occupied"
                ? "border-red-500 hover:cursor-pointer"
                : table.status === "reserved"
                  ? "border-yellow-500 hover:cursor-pointer"
                  : "border-gray-500 hover:cursor-default"
        }
        hover:shadow-lg transition-shadow duration-200 ${!table.floor.isActive ? "pointer-events-none" : ""}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${table.floor.isActive ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
        >
          {table.floor.floorNo}
        </span>
        {table.floor.isActive && (
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
        )}
      </div>
      <div className="flex justify-center">
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg
            ${
              !table.floor.isActive
                ? "text-gray-400"
                : table.status === "available"
                  ? "text-green-700"
                  : table.status === "occupied"
                    ? "text-red-500"
                    : table.status === "reserved"
                      ? "text-yellow-500"
                      : "text-gray-500"
            }`}
        >
          {table.tableNo}
        </div>
      </div>
      {!table.floor.isActive && (
        <div className="flex justify-center">
          <span className="w-full text-center bg-gray-400 text-white text-xs py-0.5">
            Sorry this Floor is currently Renovating!
          </span>
        </div>
      )}
    </div>
  );
};

export default RestroTable;
