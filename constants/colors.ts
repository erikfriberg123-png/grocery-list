export const Colors = {
  cream:      '#faf8f3',
  creamCard:  '#ffffff',
  border:     '#e8e3d8',
  text:       '#2b2b2b',
  muted:      '#8a8475',
  green:      '#3a5a40',
  greenDark:  '#2d4733',
  greenLight: '#d8e2d4',
  category: {
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
  },
} as const;

export type CategoryKey = keyof typeof Colors.category;

export function categoryColor(key: string | null): string {
  if (!key) return Colors.category.other;
  return Colors.category[key as CategoryKey] ?? Colors.category.other;
}
