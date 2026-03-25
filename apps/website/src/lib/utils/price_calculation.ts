export function calculateLineTotal(qty: number, unitCostCents: number): number {
  return Math.round(qty * unitCostCents);
}

export function calculateSubtotal(items: { lineTotalCents: number }[]): number {
  return items.reduce((sum, item) => sum + item.lineTotalCents, 0);
}

export function calculateTotal(
  subtotalCents: number,
  vatCents: number,
  discountCents: number,
  freightCents: number,
): number {
  return subtotalCents + vatCents - discountCents + freightCents;
}
