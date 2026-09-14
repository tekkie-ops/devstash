import Link from "next/link";

import { BRAND_GRADIENT } from "@/components/homepage/item-colors";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

const COMPANY_LINKS = [
  { label: "About", href: "#" },
  { label: "Blog", href: "#" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3.5 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
        {title}
      </h4>
      <div className="flex flex-col gap-2.5">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-8 pb-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span
                className="rounded-md px-1.5 py-0.5 font-mono text-sm text-white"
                style={{ background: BRAND_GRADIENT }}
              >
                {"</>"}
              </span>
              <span>DevStash</span>
            </Link>
            <p className="mt-3 max-w-60 text-sm text-muted-foreground/70">
              One hub for all developer knowledge.
            </p>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <p className="border-t border-border pt-6 text-center text-sm text-muted-foreground/70">
          &copy; {new Date().getFullYear()} DevStash. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
