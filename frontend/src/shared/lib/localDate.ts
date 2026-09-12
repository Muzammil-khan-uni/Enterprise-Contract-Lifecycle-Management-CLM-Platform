

export function parseLocalDateInput(dateOnlyString: string): Date {
  const [year, month, day] = dateOnlyString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function localDateInputToISOString(dateOnlyString: string): string {
  return parseLocalDateInput(dateOnlyString).toISOString();
}
