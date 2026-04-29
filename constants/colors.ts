const lightPalette = {
  cream:        '#faf8f3',
  creamCard:    '#ffffff',
  border:       '#e8e3d8',
  text:         '#2b2b2b',
  muted:        '#8a8475',
  green:        '#3a5a40',
  greenDark:    '#2d4733',
  greenLight:   '#d8e2d4',
  // Semantic
  dangerText:   '#c0392b',
  dangerBg:     '#fef2f2',
  dangerBorder: '#f5c6c6',
  checkBorder:  '#d4cfc1',
  pressedBg:    '#f5f1e8',
};

const darkPalette = {
  cream:        '#181c18',
  creamCard:    '#222722',
  border:       '#2e352e',
  text:         '#ede8df',
  muted:        '#7a8a7b',
  green:        '#5c8c65',
  greenDark:    '#7db885',
  greenLight:   '#243028',
  // Semantic
  dangerText:   '#e05252',
  dangerBg:     '#2d1a1a',
  dangerBorder: '#4a2828',
  checkBorder:  '#3d4a3e',
  pressedBg:    '#2a2e2a',
};

export const category = {
  produce:  '#7ba05b',
  dairy:    '#6b9bc4',
  meat:     '#c47b6b',
  seafood:  '#c47b6b',
  pantry:   '#c49b5e',
  bakery:   '#d4a373',
  frozen:   '#88b8d4',
  drinks:   '#a584c4',
  snacks:   '#d4a373',
  hygiene:  '#a8a29e',
  cleaning: '#a8a29e',
  pets:     '#a8a29e',
  baby:     '#a8a29e',
  pharmacy: '#a8a29e',
  other:    '#a8a29e',
} as const;

export type ThemePalette = typeof lightPalette & { category: typeof category };
export type CategoryKey = keyof typeof category;

export const LightPalette = lightPalette;
export const DarkPalette  = darkPalette;

// Static export kept for screens that don't need live theming (auth, onboarding)
export const Colors = { ...lightPalette, category } as const;

export function categoryColor(key: string | null): string {
  if (!key) return category.other;
  return category[key as CategoryKey] ?? category.other;
}
