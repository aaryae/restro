export function TimeDifference(serverTime: Date | number | string): string {
  const serverDate = new Date(serverTime);
  const currentDate = new Date();

  const diffInSeconds = Math.floor(
    (currentDate.getTime() - serverDate.getTime()) / 1000,
  );

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, "seconds");
  if (diffInSeconds < 3600)
    return rtf.format(-Math.floor(diffInSeconds / 60), "minutes");
  if (diffInSeconds < 86400)
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hours");

  return rtf.format(-Math.floor(diffInSeconds / 86400), "days");
}
