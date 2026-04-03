export function formatRelativeDate(date: Date | string | number): string {
  const now = new Date();
  const articleDate = new Date(date);
  const diffInMs = now.getTime() - articleDate.getTime();
  
  const msInMinute = 60 * 1000;
  const msInHour = 60 * msInMinute;
  const msInDay = 24 * msInHour;

  if (diffInMs < msInMinute) {
    return "hace unos segundos";
  } else if (diffInMs < msInHour) {
    const minutes = Math.floor(diffInMs / msInMinute);
    return `hace ${minutes} minuto${minutes === 1 ? '' : 's'}`;
  } else if (diffInMs < msInDay) {
    const hours = Math.floor(diffInMs / msInHour);
    return `hace ${hours} hora${hours === 1 ? '' : 's'}`;
  } else {
    // If more than 24 hours, return the regular date
    return articleDate.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
}