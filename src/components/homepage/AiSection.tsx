import { Check } from "lucide-react";

import { Reveal } from "@/components/homepage/Reveal";
import { ITEM_TYPE_COLORS } from "@/components/homepage/item-colors";
import { Badge } from "@/components/ui/badge";

const AI_CHECKLIST = [
  "AI auto-tag suggestions",
  "One-click AI summaries",
  '"Explain this code" on any snippet',
  "AI prompt optimizer",
];

const AI_TAGS = ["javascript", "performance", "utility", "hooks"];

export function AiSection() {
  return (
    <section className="border-y bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent py-30">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <Reveal>
          <Badge
            variant="outline"
            className="mb-4"
            style={{ color: ITEM_TYPE_COLORS.command, borderColor: `${ITEM_TYPE_COLORS.command}4d` }}
          >
            PRO FEATURE
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Let AI do the busywork
          </h2>
          <p className="mt-2.5 mb-6 text-muted-foreground">
            Auto-tagging, summaries, and explanations so your knowledge stays
            organized without the manual effort.
          </p>
          <ul className="flex flex-col gap-3">
            {AI_CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${ITEM_TYPE_COLORS.link}26`, color: ITEM_TYPE_COLORS.link }}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-border bg-[#0d0d0d] shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-secondary/60 px-3.5 py-3">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                debounce.ts
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[0.85rem] text-foreground/90">
              <code>
                <span style={{ color: ITEM_TYPE_COLORS.prompt }}>function</span>{" "}
                <span style={{ color: ITEM_TYPE_COLORS.snippet }}>debounce</span>
                {"(fn, delay) {\n  "}
                <span style={{ color: ITEM_TYPE_COLORS.prompt }}>let</span>
                {" timer;\n  "}
                <span style={{ color: ITEM_TYPE_COLORS.prompt }}>return</span>
                {" (...args) => {\n    "}
                <span style={{ color: ITEM_TYPE_COLORS.prompt }}>clearTimeout</span>
                {"(timer);\n    timer = "}
                <span style={{ color: ITEM_TYPE_COLORS.prompt }}>setTimeout</span>
                {"(() => fn(...args), delay);\n  };\n}"}
              </code>
            </pre>
            <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-white/10 px-5 py-4">
              <span className="mb-1 w-full text-[0.72rem] tracking-wide text-muted-foreground uppercase">
                AI Generated Tags
              </span>
              {AI_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-2.5 py-1 text-xs"
                  style={{
                    backgroundColor: `${ITEM_TYPE_COLORS.prompt}26`,
                    borderColor: `${ITEM_TYPE_COLORS.prompt}40`,
                    color: ITEM_TYPE_COLORS.prompt,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
