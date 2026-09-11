# Devstash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and types.

## Attention

**IMPORTANT:** Do not add Claude to any commit messages.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev        # start dev server (http://localhost:3000)
npm run build      # production build
npm run start      # serve production build
npm run lint       # eslint (flat config: eslint.config.mjs)
npm test           # run unit tests once (vitest)
npm run test:watch # run unit tests in watch mode
npm run db:test    # Prisma/Neon connection smoke test
npm run db:seed    # seed the database (prisma db seed)
npm run db:clean-users # delete all users except demo@devstash.io (dry-run; --yes to execute)
```

Unit tests use **Vitest** (`node` environment) and cover **server actions and utilities only** —
`src/actions/**` and `src/lib/**`. Components and React Server Components are not unit-tested;
they are verified in the browser. Config: `vitest.config.ts`. Tests are colocated as
`*.test.ts` next to the file under test.

## Neon MCP

- Project: **devstash** (project ID `falling-tree-26252092`).
- Default branch to use: **development** (branch ID `br-patient-tree-ay3qaiw6`).
- Always target the `development` branch for any Neon MCP action (queries, migrations, etc.) unless I explicitly say to use `production` (branch ID `br-wandering-sun-ayp6jwsy`) for that specific request.
- Never run destructive or write operations against `production` without explicit, per-request confirmation from me.

