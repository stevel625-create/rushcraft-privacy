/**
 * Monetization plan: all six levels are free in this prototype. Paid content is planned as
 * future chapters, cosmetic outfits, and a complete-adventure bundle.
 *
 * Expo Go cannot run real in-app purchases (they need native store modules, i.e. a development
 * build with a library such as expo-iap or react-native-purchases). The Store screen therefore
 * uses a mock: confirming a purchase only sets a local flag. No money moves, no store credentials.
 */
export type ProductKind = 'chapter' | 'cosmetic' | 'bundle';

export interface Product {
  id: string;
  title: string;
  kind: ProductKind;
  blurb: string;
}

export const PRODUCTS: Product[] = [
  { id: 'lostworld.chapter2', title: 'Chapter 2 Expansion', kind: 'chapter', blurb: 'Planned: a new region after the temple.' },
  { id: 'lostworld.chapter3', title: 'Chapter 3 Expansion', kind: 'chapter', blurb: 'Planned: the final chapter.' },
  { id: 'lostworld.outfit.explorer', title: 'Explorer Outfit', kind: 'cosmetic', blurb: 'Cosmetic look for Jason.' },
  { id: 'lostworld.outfit.safari', title: 'Safari Outfit', kind: 'cosmetic', blurb: 'Cosmetic look for Elena.' },
  { id: 'lostworld.bundle.complete', title: 'Complete Adventure', kind: 'bundle', blurb: 'Every chapter and outfit.' },
];
