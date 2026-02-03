# Agent Guidelines for Cherry Tree

This document provides essential information for AI coding agents working on the Cherry Tree codebase.

## Project Overview

Cherry Tree is a React + TypeScript application for managing chunked blobs on Blossom servers, built with Vite and using Nostr protocol for decentralized file storage.

### Chunked Blobs Specification

This application implements a custom Nostr-based protocol for chunking large files. See `NIP.md` for the complete specification:

- **Kind 2001 events** store ordered lists of chunk hashes
- Large blobs are broken into chunks (recommended: 1MB or 4MB)
- Chunks are distributed across Blossom servers
- Metadata includes filename, mime type, size, and recommended servers

## Build, Lint, and Test Commands

### Package Manager

- **Always use `pnpm`** (version 9.14.4)
- Install dependencies: `pnpm install`

### Build Commands

- **Development server**: `pnpm dev` (starts Vite dev server)
- **Production build**: `pnpm build` (runs TypeScript compilation then Vite build)
- **Preview production build**: `pnpm preview`
- **Format code**: `pnpm format` (runs Prettier on all files)

### Testing

- **No test suite is currently configured** in this project
- If adding tests, consider using Vitest (natural fit with Vite)

### Type Checking

- Run TypeScript compiler: `pnpm exec tsc -b`
- Check types without emitting: `pnpm exec tsc --noEmit`

## Code Style Guidelines

### Formatting

- **Prettier** is configured and enforced
- Tab width: 2 spaces
- Print width: 120 characters
- No tabs (use spaces)
- Run `pnpm format` before committing

### TypeScript Configuration

- **Strict mode enabled** - all strict type checks are on
- Target: ES2020
- Module: ESNext with Bundler resolution
- JSX: react-jsx (React 18+ automatic runtime)
- No unused locals or parameters allowed
- No fallthrough cases in switch statements
- File extensions in imports are allowed (`.ts`, `.tsx`)

### Import Conventions

1. **Import order** (by convention observed in codebase):
   - External libraries (React, Chakra UI, third-party)
   - Blank line
   - Local helpers and utilities (starting with `../` or `./`)
   - Local services
   - Local components
   - Local types

2. **Import style**:
   - Use named imports when possible
   - Use default imports for React components and default exports
   - Group related imports from same package

Example:

```typescript
import { Container } from "@chakra-ui/react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";

import { ErrorBoundary } from "./components/error-boundary";
import HomeView from "./views/home";
import Header from "./components/header";
```

### File Structure

- **Components**: `src/components/` (kebab-case filenames, e.g., `file-card.tsx`)
- **Views/Pages**: `src/views/` (kebab-case, e.g., `home.tsx`)
- **Services**: `src/services/` (kebab-case, e.g., `local-wallet.ts`)
- **Helpers/Utilities**: `src/helpers/` (kebab-case, e.g., `blob.ts`)
- **Hooks**: `src/hooks/` (kebab-case with `use-` prefix, e.g., `use-uploader.ts`)
- **Types**: Either colocated or in `.d.ts` files (e.g., `nostr-extensions.d.ts`)

### React Conventions

1. **Use functional components** with hooks (no class components)
2. **Props destructuring** in function signature
3. **Type all props** with interfaces or types
4. **Use Chakra UI** for all UI components
5. **Use React Router** (v6) for routing with `createBrowserRouter`

### State Management

- **RxJS BehaviorSubjects** for global state (see `src/services/state.ts`)
- **React hooks** for local component state
- **LocalStorage** for persistence (wrapped in BehaviorSubjects)

Example pattern:

```typescript
const files = new BehaviorSubject<ChunkedFile[]>([]);
const downloaders = new BehaviorSubject(parseInt(localStorage.getItem("downloaders") ?? "5"));
downloaders.subscribe((c) => localStorage.setItem("downloaders", String(c)));
```

### Error Handling

1. **Try-catch blocks** for async operations
2. **Chakra UI toast** for user-facing errors
3. **Error boundaries** for React component errors (see `error-boundary.tsx`)
4. **Error state** in hooks and components

Example:

```typescript
try {
  // async operation
} catch (error) {
  if (error instanceof Error) {
    setError(error);
    toast({ status: "error", description: error.message });
  }
}
```

### Async/Await

- **Prefer async/await** over raw promises
- Use `Promise.all()` for parallel operations
- Handle cleanup with `useEffect` return functions

### Comments

- Use JSDoc-style comments for complex functions
- Inline comments for non-obvious logic
- Keep comments concise and relevant

## Architecture Patterns

### Key Libraries

- **Nostr**: nostr-tools, applesauce-\* libraries for protocol interaction
- **Blossom**: blossom-client-sdk for file storage
- **UI**: Chakra UI with react-icons
- **Crypto**: @noble/hashes for SHA-256
- **State**: RxJS for reactive state management

### Worker Pattern

- Web Workers for CPU-intensive tasks (see `src/worker/hasher.ts`)
- Fallback to main thread if workers fail

### Service Pattern

- Singleton services in `src/services/` (pool, loaders, stores, state)
- Export configured instances as default

## Common Pitfalls to Avoid

1. **Don't use class components** - use functional components with hooks
2. **Don't ignore TypeScript errors** - strict mode is enabled for a reason
3. **Don't use `any` type** - use proper types or `unknown` with type guards
4. **Don't forget to cleanup** - use `useEffect` cleanup for subscriptions/controllers
5. **Don't mutate state directly** - use setState or BehaviorSubject.next()
6. **Don't use `ts-ignore`** unless absolutely necessary (few exceptions exist)

## File Additions

When creating new files:

- Follow the existing file structure conventions
- Use kebab-case for filenames
- Include proper TypeScript types
- Export types alongside implementations when relevant
