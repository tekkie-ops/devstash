import Link from "next/link";

import { Reveal } from "@/components/homepage/Reveal";
import { ITEM_TYPE_COLORS } from "@/components/homepage/item-colors";
import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div
            className="rounded-3xl border border-border px-8 py-16 text-center"
            style={{
              background: `linear-gradient(135deg, ${ITEM_TYPE_COLORS.snippet}1a, ${ITEM_TYPE_COLORS.prompt}1a)`,
            }}
          >
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Organize Your Knowledge?
            </h2>
            <p className="mt-3 mb-7 text-muted-foreground">
              Join developers who stopped losing their best code, prompts, and
              ideas.
            </p>
            <Button asChild size="lg">
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
