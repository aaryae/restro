import React from "react";
import styles from "./RestroTable.module.css";

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

function statusLabel(status: Table["status"], floorActive: boolean) {
  if (!floorActive) return "Closed";
  if (status === "maintenance") return "Unavailable";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const RestroTable: React.FC<RestroTableProps> = ({ table, onClick }) => {
  const floorActive = table.floor.isActive;
  const canOpen = floorActive && table.status !== "maintenance";
  const metaBits = [
    table.capacity ? `${table.capacity} seats` : null,
    table.type && table.type !== "regular" ? table.type : null,
  ].filter(Boolean);

  return (
    <div
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : -1}
      onClick={() => canOpen && onClick(table.id)}
      onKeyDown={(e) => {
        if (canOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(table.id);
        }
      }}
      data-status={table.status}
      data-inactive={floorActive ? "false" : "true"}
      className={`${styles.card} ${canOpen ? styles.interactive : styles.disabled}`}
    >
      <div className={styles.top}>
        <span className={styles.floor}>{table.floor.floorNo}</span>
        <span className={styles.status}>
          <span className={styles.statusDot} aria-hidden />
          {statusLabel(table.status, floorActive)}
        </span>
      </div>
      <div className={styles.body}>
        <p className={styles.number}>{table.tableNo}</p>
        {metaBits.length > 0 && (
          <p className={styles.meta}>{metaBits.join(" · ")}</p>
        )}
        {!floorActive && (
          <p className={styles.renovation}>This floor is currently renovating</p>
        )}
      </div>
    </div>
  );
};

export default RestroTable;
