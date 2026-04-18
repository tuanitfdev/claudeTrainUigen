# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest test suite
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Force reset the SQLite database
```

All scripts use `NODE_OPTIONS='--require ./node-compat.cjs'` for Node compatibility — don't remove this.

To run a single test file: `npx vitest run src/lib/transform/jsx-transformer.test.ts`

## Environment

Copy `.env.example` to `.env.local`. Set `ANTHROPIC_API_KEY` for real AI generation; if absent, the app falls back to a `MockLanguageModel` that returns hardcoded components (Counter, ContactForm, Card). `JWT_SECRET` is required for auth.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in natural language; Claude writes code into a virtual file system; the result is rendered live in a sandboxed iframe.

### Three-panel layout (`src/app/main-content.tsx`)

- **Left (35%)**: Chat interface
- **Right (65%)**: Tabs — Preview (iframe) or Code (file tree + Monaco editor)

### Virtual file system (`src/lib/file-system.ts`)

`VirtualFileSystem` is an in-memory, no-disk abstraction. It serializes to JSON, gets sent with every chat API request so Claude always sees current state, and gets saved to the DB on message completion. All file mutations in the UI and from AI tool calls go through this class.

### AI tool system

The API route (`src/app/api/chat/route.ts`) gives Claude two tools:

- **`str_replace_editor`** — `view`, `create`, `str_replace`, `insert`, `undo_edit` on the virtual FS
- **`file_manager`** — `rename`, `delete` on the virtual FS

Tool calls stream back to the client and are processed by `handleToolCall()` in `src/lib/contexts/chat-context.tsx`, which updates the `FileSystemContext` in real time.

### JSX rendering pipeline (`src/lib/transform/jsx-transformer.ts`)

Files in the virtual FS are transformed for the iframe preview:

1. Babel standalone (in-browser) compiles JSX → JS
2. Blob URLs are created for each file
3. An import map resolves `@/` aliases → blob URLs, third-party packages → esm.sh CDN, and missing imports → placeholder React components
4. CSS imports are extracted into a `<style>` tag; Tailwind CDN is injected
5. The iframe `srcdoc` contains the import map + error boundary + `ReactDOM.render`

### State management

- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): holds the VirtualFS instance, selected file, and a refresh counter that triggers preview re-renders
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): wraps Vercel AI SDK's `useChat`, serializes the current FS into every request, processes tool calls

### Auth & persistence

- JWT tokens (7-day), stored in httpOnly cookies; managed in `src/lib/auth.ts`
- Server actions (sign up / sign in / sign out) in `src/actions/index.ts`
- Prisma + SQLite; schema in `prisma/schema.prisma` — `User` and `Project` models
- Anonymous users are tracked in-memory via `src/lib/anon-work-tracker.ts` (no DB writes)
- Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem`; public routes are unrestricted

### AI prompting

The system prompt (`generationPrompt`) instructs Claude to:
- Always use `/App.jsx` as the root entry point
- Use `@/` alias for local imports
- Use Tailwind CSS classes (not inline styles)
- Keep responses brief — tool calls do the work

Max tokens: 10 000; max steps: 40 (4 for mock provider).
