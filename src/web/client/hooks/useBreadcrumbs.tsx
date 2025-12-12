import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbsContextValue = {
  items: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
};

const BreadcrumbsContext = createContext<BreadcrumbsContextValue | null>(null);

export function BreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  const value = useMemo(
    () => ({
      items,
      setBreadcrumbs: setItems,
    }),
    [items]
  );

  return <BreadcrumbsContext.Provider value={value}>{children}</BreadcrumbsContext.Provider>;
}

export function useBreadcrumbs(): BreadcrumbsContextValue {
  const context = useContext(BreadcrumbsContext);
  if (!context) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbsProvider");
  }
  return context;
}
