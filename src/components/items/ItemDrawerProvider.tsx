"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ItemDrawer } from "@/components/items/ItemDrawer";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerContextValue {
  /** Open the drawer and fetch the given item's full detail. */
  openItem: (id: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}

/**
 * Holds the drawer's open/selected/loading state so the pages that render item
 * cards can stay server components. Fetches detail on click via /api/items/[id]
 * — no navigation.
 */
export function ItemDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against a slow earlier fetch resolving after a newer one.
  const requestRef = useRef(0);

  const openItem = useCallback((id: string) => {
    const requestId = ++requestRef.current;
    setOpen(true);
    setLoading(true);
    setError(null);
    setDetail(null);

    void (async () => {
      try {
        const res = await fetch(`/api/items/${id}`);
        const body = await res.json();
        if (requestId !== requestRef.current) return;

        if (!res.ok || !body.success) {
          setError(body.error ?? "Failed to load item");
          return;
        }

        setDetail({
          ...body.data,
          createdAt: new Date(body.data.createdAt),
          updatedAt: new Date(body.data.updatedAt),
        });
      } catch {
        if (requestId !== requestRef.current) return;
        setError("Failed to load item");
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    })();
  }, []);

  const handleDeleted = useCallback(() => {
    setOpen(false);
    setDetail(null);
  }, []);

  return (
    <ItemDrawerContext.Provider value={{ openItem }}>
      {children}
      <ItemDrawer
        open={open}
        onOpenChange={setOpen}
        detail={detail}
        loading={loading}
        error={error}
        onSaved={setDetail}
        onDeleted={handleDeleted}
      />
    </ItemDrawerContext.Provider>
  );
}
