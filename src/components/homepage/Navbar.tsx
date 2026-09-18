import Link from "next/link";

import { MobileNavMenu } from "@/components/homepage/MobileNavMenu";
import { NavbarShell } from "@/components/homepage/NavbarShell";
import { BRAND_GRADIENT } from "@/components/homepage/item-colors";
import { Button } from "@/components/ui/button";

export function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <NavbarShell>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span
            className="rounded-md px-1.5 py-0.5 font-mono text-sm text-white"
            style={{ background: BRAND_GRADIENT }}
          >
            {"</>"}
          </span>
          <span>DevStash</span>
        </Link>

        <div className="hidden gap-7 sm:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
          <MobileNavMenu />
        </div>
      </div>
    </NavbarShell>
  );
}
