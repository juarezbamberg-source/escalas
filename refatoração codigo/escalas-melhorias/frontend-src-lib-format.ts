export function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function buildFallbackDates() {
  const today = new Date();
  return Array.from({ length: 5 }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() + index);
    return toIsoDate(current);
  });
}

export function buildDateRangeFromBounds(start: string, end: string) {
  if (!start || !end || start > end) {
    return [];
  }
  const dates: string[] = [];
  const cursor = parseIsoDate(start);
  const last = parseIsoDate(end);
  while (cursor <= last) {
    dates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
