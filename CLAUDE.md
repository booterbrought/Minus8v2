# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minus8v2 is a two-player turn-based strategy game on an 8x8 grid. Player 1 moves horizontally, Player 2 moves vertically. The game uses a shared board where cells contain values from -8 to 8 (excluding 0), and players accumulate scores by eating cells.

## Tech Stack

- **Backend**: Bun runtime, Hono web framework, TypeScript
- **Frontend**: Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS, TypeScript
- **Real-time**: WebSocket for game state synchronization between players

## Commands

### Frontend (run from `frontend/`)

```bash
npm install            # Install dependencies
npm run dev            # Start Vite dev server (proxies /api to localhost:8000)
npm run build          # Type-check + production build
npm run build-only     # Production build without type-check
npm run type-check     # Run vue-tsc
npm run test:unit      # Run unit tests with Vitest (jsdom environment)
npm run preview        # Preview production build
```

### Backend (run from `backend/`)

```bash
bun install             # Install dependencies
bun run dev             # Start server with hot reload
bun run start           # Start server
```

Server runs on port 8000. Automatically uses HTTPS if Let's Encrypt certs are found at `/etc/letsencrypt/live/dmbr.lv/`.

### Docker

```bash
docker-compose up -d --build
```

## Architecture

### Backend (MVC)

- **Entry**: `backend/server.ts` — Hono app setup, CORS middleware, Bun.serve with static file serving from `frontend/dist`, health check endpoint
- **Routes** (`backend/routes/`): Define endpoints, mounted on `/api/...` prefix. WebSocket handler in `ws.ts` tracks connections in a `Map<string, WSContext>`
- **Controllers** (`backend/controllers/`): Business logic for auth, lobby (game creation), and game operations
- **Models** (`backend/models/gameState.ts`): `Game` class with board state, player management, and score tracking
- **State**: All game state is in-memory via `gameList: Map<string, Game>` in `gameController.ts` — no database

### Frontend (Vue 3 SPA)

- **Entry**: `frontend/src/main.ts` — mounts Vue app with Pinia and Vue Router
- **Router** (`frontend/src/router/`): Routes: `/` (Login), `/register`, `/menu/:id?` (GameMenu), `/game/:id` (Game)
- **Services** (`frontend/src/services/game.ts`): `GameService` class handles REST calls and WebSocket lifecycle; `fetchGameState()` standalone function
- **Stores** (`frontend/src/stores/`): Pinia stores (currently `userStore` for auth/player state)
- **Components** (`frontend/src/components/`): Single-file Vue components — `Game.vue` composes `Board.vue` + score panel

### Communication Flow

1. REST API for game actions (create, join, move, fetch state)
2. WebSocket (`/api/ws/:playerId`) for real-time game state push — backend broadcasts updated state to both players after each move
3. Vite dev server proxies `/api` requests to backend at `localhost:8000`

### Game Flow

1. Player registers/logs in → receives token and playerId
2. Player creates or joins a game via lobby endpoints
3. When 2 players have joined, game status transitions `waiting` → `playing`
4. Players take turns moving; move validation enforces horizontal (P1) / vertical (P2) constraints
5. WebSocket pushes updated `GameState` to both players after each move

## Key Patterns

- Backend uses `bun:sqlite` for database (built into Bun runtime) — no external SQLite dependency
- `@` path alias maps to `frontend/src/` in Vite and TypeScript config
- Tailwind CSS configured via PostCSS plugin in `vite.config.ts` (not a standalone config)
- In production, Bun serves the built frontend from `frontend/dist` with SPA fallback to `index.html`
