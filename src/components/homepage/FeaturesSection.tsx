import { Code, LayoutGrid, Search, Sparkles, Terminal, File as FileIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/homepage/Reveal";
import { ITEM_TYPE_COLORS } from "@/components/homepage/item-colors";
import { Card, CardContent } from "@/components/ui/card";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const FEATURES: Feature[] = [
  {
    title: "Code Snippets",
    description:
      "Save, tag, and syntax-highlight reusable code across every language you use.",
    icon: Code,
    color: ITEM_TYPE_COLORS.snippet,
  },
  {
    title: "AI Prompts",
    description:
      "Build a library of the prompts that actually work, ready to reuse anywhere.",
    icon: Sparkles,
    color: ITEM_TYPE_COLORS.prompt,
  },
  {
    title: "Instant Search",
    description:
      "Full-text search across content, tags, titles and types — find anything in seconds.",
    icon: Search,
    color: ITEM_TYPE_COLORS.link,
  },
  {
    title: "Commands",
    description:
      "Stop digging through shell history for that one command you always forget.",
    icon: Terminal,
    color: ITEM_TYPE_COLORS.command,
  },
  {
    title: "Files & Docs",
    description:
      "Store reference files and images alongside the knowledge that explains them.",
    icon: FileIcon,
    color: ITEM_TYPE_COLORS.file,
  },
  {
    title: "Collections",
    description:
      "Group any item type into collections — a project, a topic, an interview prep list.",
    icon: LayoutGrid,
    color: ITEM_TYPE_COLORS.image,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-30">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Everything, in one place
          </h2>
          <p className="mt-2.5 text-muted-foreground">
            Seven kinds of knowledge. One searchable hub.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Reveal key={feature.title}>
              <Card
                className="h-full border-t-2 transition-transform hover:-translate-y-1"
                style={{ borderTopColor: feature.color }}
              >
                <CardContent className="flex flex-col gap-1">
                  <div
                    className="mb-3 flex size-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${feature.color}26`, color: feature.color }}
                  >
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
