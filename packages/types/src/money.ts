/**
 * Money is always stored and passed as integer cents. Never floats.
 * Convention enforced repo-wide (see spec §11).
 */
export type Cents = number;

export function dollarsToCents(dollars: number): Cents {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: Cents): number {
  return cents / 100;
}

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCents(cents: Cents): string {
  return USD.format(cents / 100);
}
