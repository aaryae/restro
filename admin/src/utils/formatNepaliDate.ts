import { nepaliMonths } from "@/constants/StaticDropdownConstants";

export const formatNepaliDate = (bsDate: string) => {
  const dateParts = bsDate.split("-");
  const year = dateParts[0];
  const month = parseInt(dateParts[1]) - 1; // Convert to 0-based index
  const day = parseInt(dateParts[2]);

  const monthName = nepaliMonths[month];

  // Add ordinal suffix to day
  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  return `${day}${getOrdinalSuffix(day)} ${monthName}, ${year}`;
};
