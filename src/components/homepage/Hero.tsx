import Link from "next/link";

import { ChaosVisual } from "@/components/homepage/ChaosVisual";
import { DashboardPreview } from "@/components/homepage/DashboardPreview";
import { Reveal } from "@/components/homepage/Reveal";
import { TransformArrow } from "@/components/homepage/TransformArrow";
import { ITEM_TYPE_COLORS } from "@/components/homepage/item-colors";
import { Button } from "@/components/ui/button";

export function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="mx-auto flex max-w-6xl flex-col items-center gap-18 px-6 pt-40 pb-24 sm:pt-44">
      <Reveal className="flex max-w-2xl flex-col items-center text-center">
        <p
          className="mb-4 text-sm font-semibold"
          style={{ color: ITEM_TYPE_COLORS.prompt }}
        >
          One hub for everything you build
        </p>
        <h1 className="mb-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Stop Losing Your{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${ITEM_TYPE_COLORS.snippet}, ${ITEM_TYPE_COLORS.prompt} 50%, ${ITEM_TYPE_COLORS.image})`,
            }}
          >
            Developer Knowledge
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
          Snippets, prompts, commands, notes, files and links scattered across
          a dozen tools. DevStash brings it all into one fast, searchable,
          AI-enhanced hub.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5">
          <Button asChild size="lg">
            <Link href={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#features">See Features</a>
          </Button>
        </div>
      </Reveal>

      <Reveal className="flex w-full flex-col items-center gap-7 lg:flex-row lg:justify-center">
        <ChaosVisual />
        <TransformArrow />
        <DashboardPreview />
      </Reveal>
    </header>
  );
}
