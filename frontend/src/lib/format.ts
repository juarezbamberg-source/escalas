export function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function buildFallbackDates() {
  const today = new Date();
  return Array.from({ length: 5 }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() + index);
    return current.toISOString().slice(0, 10);
  });
}

export function buildDateRangeFromBounds(start: string, end: string) {
  if (!start || !end || start > end) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}
