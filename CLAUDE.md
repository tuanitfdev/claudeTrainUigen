# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npx vitest run src/path/to/__tests__/file.test.ts  # Single test file
npm run db:reset     # Drop and recreate SQLite database
```

## Architecture

UIGen is a Next.js 15 App Router application that lets users describe React components in a chat interface, generates them live via Claude, and renders them in a sandboxed iframe — all without writing files to disk.

### Three-Panel Layout

`src/app/main-content.tsx` is the top-level shell. It uses `react-resizable-panels` to split the UI into:
- **Left panel** — Chat interface (`src/components/chat/`)
- **Right top** — Preview iframe or code editor tabs
- **Right bottom** — File tree + Monaco code editor

### Virtual File System

`src/lib/file-system.ts` provides a `VirtualFileSystem` class — an in-memory tree of files. All component code lives here, never on disk. The context (`src/lib/contexts/file-system-context.tsx`) makes it available across the component tree. Projects persist by serializing the VFS to JSON in the Prisma `Project.data` column.

### AI Integration

- **Provider** (`src/lib/provider.ts`): Wraps `@ai-sdk/anthropic` with a `MockLanguageModel` fallback when `ANTHROPIC_API_KEY` is absent.
- **Chat API** (`src/app/api/chat/route.ts`): Streams tool-use responses from Claude. Two tools are defined in `src/lib/tools/`: `str_replace_editor` (create/edit files in the VFS) and `file_manager` (rename/delete). Prompt caching is enabled via `anthropic-beta: prompt-caching-2024-07-31`.
- **System prompt** lives in `src/lib/prompts/generation.tsx`.
- Current model: `claude-haiku-4-5` (defined in `src/lib/provider.ts`).

### Live Preview

`src/components/preview/PreviewFrame.tsx` renders an iframe. `src/lib/transform/jsx-transformer.ts` converts JSX files in the VFS into a self-contained HTML document using Babel standalone — no build step required at preview time.

### Auth

JWT sessions stored in httpOnly cookies (`src/lib/auth.ts`). Secret from `JWT_SECRET` env var (defaults to `"development-secret-key"`). Protected routes enforced in `src/middleware.ts`. Anonymous users can work freely; projects only persist to SQLite for authenticated users.

### Data Layer

Prisma with SQLite (`prisma/schema.prisma`). Two models: `User` and `Project`. The `Project.messages` field stores the chat history as a JSON string; `Project.data` stores the serialized VFS.

## Environment Variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key — app falls back to mock if unset |
| `ANTHROPIC_BASE_URL` | Optional proxy base URL |
| `JWT_SECRET` | Cookie signing key |

## Path Alias

`@/*` maps to `src/*` throughout the codebase.
