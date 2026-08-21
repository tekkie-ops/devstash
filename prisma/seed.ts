import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const SYSTEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("12345678", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {},
    create: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  const types = new Map<string, { id: string }>();
  for (const type of SYSTEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { userId: null, name: type.name },
    });
    const created =
      existing ??
      (await prisma.itemType.create({
        data: {
          name: type.name,
          icon: type.icon,
          color: type.color,
          isSystem: true,
        },
      }));
    types.set(type.name, created);
  }

  const typeId = (name: (typeof SYSTEM_TYPES)[number]["name"]) => types.get(name)!.id;

  async function createCollection(
    name: string,
    description: string,
    items: {
      title: string;
      typeName: (typeof SYSTEM_TYPES)[number]["name"];
      content?: string;
      url?: string;
      description?: string;
      language?: string;
    }[]
  ) {
    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId: user.id,
      },
    });

    for (const item of items) {
      await prisma.item.create({
        data: {
          title: item.title,
          contentType: "text",
          content: item.content,
          url: item.url,
          description: item.description,
          language: item.language,
          userId: user.id,
          itemTypeId: typeId(item.typeName),
          collections: {
            create: { collectionId: collection.id },
          },
        },
      });
    }

    return collection;
  }

  await createCollection("React Patterns", "Reusable React patterns and hooks", [
    {
      title: "useDebounce",
      typeName: "snippet",
      language: "typescript",
      description: "Debounce a fast-changing value",
      content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
`,
    },
    {
      title: "useLocalStorage",
      typeName: "snippet",
      language: "typescript",
      description: "Sync state with localStorage",
      content: `import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
`,
    },
    {
      title: "Compound Component Pattern",
      typeName: "snippet",
      language: "typescript",
      description: "Context-driven compound components",
      content: `import { createContext, useContext, useState, type ReactNode } from "react";

type TabsContextValue = {
  active: string;
  setActive: (id: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

export function Tab({ id, children }: { id: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab must be used within Tabs");
  return (
    <button onClick={() => ctx.setActive(id)} aria-selected={ctx.active === id}>
      {children}
    </button>
  );
}
`,
    },
  ]);

  await createCollection("AI Workflows", "AI prompts and workflow automations", [
    {
      title: "Code Review Prompt",
      typeName: "prompt",
      description: "Thorough PR review prompt",
      content: `Review the following code change for correctness, security, and maintainability.

Focus on:
- Logic errors and edge cases
- Security issues (input validation, auth checks)
- Performance (unnecessary re-renders, N+1 queries)
- Whether it matches existing patterns in the codebase

Be specific and cite line numbers where possible.`,
    },
    {
      title: "Documentation Generator",
      typeName: "prompt",
      description: "Generate docs from source code",
      content: `Generate clear, concise documentation for the following code.

Include:
- A one-sentence summary of what it does
- Parameters/props with types and descriptions
- Return value
- One realistic usage example

Keep it terse — no restating obvious behavior.`,
    },
    {
      title: "Refactoring Assistant",
      typeName: "prompt",
      description: "Guided refactor without behavior changes",
      content: `Refactor the following code for clarity and simplicity without changing its external behavior.

Constraints:
- Do not change the public API
- Do not add new dependencies
- Preserve existing tests' expectations
- Explain each change in one line`,
    },
  ]);

  await createCollection("DevOps", "Infrastructure and deployment resources", [
    {
      title: "Multi-stage Dockerfile",
      typeName: "snippet",
      language: "dockerfile",
      description: "Production Next.js image",
      content: `FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
`,
    },
    {
      title: "Deploy to Production",
      typeName: "command",
      description: "Run migrations then deploy",
      content: `npx prisma migrate deploy && npm run build && npm run start`,
    },
    {
      title: "Next.js Deployment Docs",
      typeName: "link",
      url: "https://nextjs.org/docs/app/building-your-application/deploying",
      description: "Official Next.js deployment guide",
    },
    {
      title: "Prisma Deployment Guide",
      typeName: "link",
      url: "https://www.prisma.io/docs/orm/prisma-migrate/workflows/deploying-migrations",
      description: "Deploying Prisma migrations to production",
    },
  ]);

  await createCollection("Terminal Commands", "Useful shell commands for everyday development", [
    {
      title: "Undo last commit, keep changes",
      typeName: "command",
      description: "Soft reset one commit back",
      content: `git reset --soft HEAD~1`,
    },
    {
      title: "Remove stopped containers and dangling images",
      typeName: "command",
      description: "Docker cleanup",
      content: `docker system prune -f`,
    },
    {
      title: "Find and kill process on a port",
      typeName: "command",
      description: "Free up a busy port",
      content: `lsof -ti:3000 | xargs kill -9`,
    },
    {
      title: "List outdated npm packages",
      typeName: "command",
      description: "Check for available updates",
      content: `npm outdated`,
    },
  ]);

  await createCollection("Design Resources", "UI/UX resources and references", [
    {
      title: "Tailwind CSS Docs",
      typeName: "link",
      url: "https://tailwindcss.com/docs",
      description: "Official Tailwind CSS documentation",
    },
    {
      title: "shadcn/ui",
      typeName: "link",
      url: "https://ui.shadcn.com",
      description: "Component library built on Radix UI",
    },
    {
      title: "Radix Primitives",
      typeName: "link",
      url: "https://www.radix-ui.com/primitives",
      description: "Unstyled, accessible UI primitives",
    },
    {
      title: "Lucide Icons",
      typeName: "link",
      url: "https://lucide.dev",
      description: "Open-source icon library",
    },
  ]);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
