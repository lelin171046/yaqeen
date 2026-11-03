const bdtFormatter = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 0,
});

export function formatBdt(amount: number): string {
  return bdtFormatter.format(amount);
}

export function toPoisha(taka: number): number {
  return Math.round(taka * 100);
}

export function fromPoisha(poisha: number): number {
  return poisha / 100;
}
