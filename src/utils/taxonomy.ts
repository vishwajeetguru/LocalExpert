import { Category, ID } from '../types/models';

/** Two-level taxonomy helpers — groups (parentId null) hold leaf subcategories. */
export const isGroup = (c: Category): boolean => !c.parentId;

export const childrenOf = (cats: Category[], id: ID): Category[] =>
  cats.filter((c) => c.parentId === id);

export const parentOf = (cats: Category[], id: ID): Category | null => {
  const self = cats.find((c) => c.id === id);
  if (!self?.parentId) return null;
  return cats.find((c) => c.id === self.parentId) ?? null;
};

export const groupOf = (cats: Category[], leafId: ID): Category | null => parentOf(cats, leafId);

export const groupsOf = (cats: Category[], section?: string): Category[] =>
  cats.filter((c) => !c.parentId && (!section || c.section === section));

export const popularGroups = (cats: Category[]): Category[] =>
  cats.filter((c) => !c.parentId && c.popular);
