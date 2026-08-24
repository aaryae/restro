export function formatDate(date: Date): string {
  const day: number = date.getDate();
  const year: number = date.getFullYear();
  const month: string = date.toLocaleString("en-US", { month: "long" });

  const getOrdinal = (n: number): string => {
    if (n > 3 && n < 21) return n + "th";
    switch (n % 10) {
      case 1:
        return n + "st";
      case 2:
        return n + "nd";
      case 3:
        return n + "rd";
      default:
        return n + "th";
    }
  };

  return `${getOrdinal(day)} ${month}, ${year}`;
}
