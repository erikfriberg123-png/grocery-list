import { categorizeItem } from './categorize';

export type ParsedItem = {
  name: string;
  normalized_name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
};

const UNITS = new Set([
  'g', 'kg', 'mg', 'ml', 'l', 'dl', 'cl',
  'st', 'pcs', 'pack', 'stk', 'liter',
]);

/**
 * Client-side fallback parser. Handles patterns like:
 *   "2 bananas"  → qty=2, name="bananas"
 *   "2 kg flour" → qty=2, unit="kg", name="flour"
 *   "flour 500g" → qty=500, unit="g", name="flour"
 *   "flour 500 g"→ qty=500, unit="g", name="flour"
 */
export function parseItem(raw: string): ParsedItem {
  const parts = raw.trim().split(/\s+/);
  let name = raw.trim();
  let quantity: number | null = null;
  let unit: string | null = null;

  if (parts.length >= 2) {
    const first = Number(parts[0].replace(',', '.'));

    if (!isNaN(first) && first > 0) {
      // Leading number: "2 bananas" or "2 kg flour"
      quantity = first;
      const second = parts[1].toLowerCase();
      if (UNITS.has(second) && parts.length >= 3) {
        unit = second;
        name = parts.slice(2).join(' ');
      } else {
        name = parts.slice(1).join(' ');
      }
    } else {
      // Trailing quantity: "flour 500g" or "flour 500 g"
      const last = parts[parts.length - 1];
      const compound = last.match(/^(\d+(?:[.,]\d+)?)([a-zA-Z]+)$/);
      if (compound) {
        const num = Number(compound[1].replace(',', '.'));
        const u = compound[2].toLowerCase();
        if (num > 0 && UNITS.has(u)) {
          quantity = num;
          unit = u;
          name = parts.slice(0, -1).join(' ');
        }
      } else if (parts.length >= 3) {
        const secondLast = Number(parts[parts.length - 2].replace(',', '.'));
        const lastUnit = parts[parts.length - 1].toLowerCase();
        if (!isNaN(secondLast) && secondLast > 0 && UNITS.has(lastUnit)) {
          quantity = secondLast;
          unit = lastUnit;
          name = parts.slice(0, -2).join(' ');
        }
      }
    }
  }

  const finalName = name.trim() || raw.trim();
  return {
    name: finalName,
    normalized_name: finalName,
    quantity,
    unit,
    category: categorizeItem(finalName),
  };
}
