"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The nav's background/blur/border react to scroll position — the only part
 * of the navbar that needs to be a client component. Content (logo, links,
 * session-aware actions) is passed in as server-rendered children.
 */
export function NavbarShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-background/95 backdrop-blur-md"
          : "border-transparent bg-background/40 backdrop-blur-md",
      )}
    >
      {children}
    </nav>
  );
}
