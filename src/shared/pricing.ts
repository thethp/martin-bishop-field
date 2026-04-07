export const DEPOSIT_AMOUNT = 50000; // $500 in cents

export function getRate(date: string): number {
  const day = new Date(date + 'T12:00:00').getDay();
  if (day === 0 || day === 6) return 130000; // Sat/Sun: $1,300
  if (day === 5) return 85000;               // Fri: $850
  return 55000;                               // Mon–Thu: $550
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}
