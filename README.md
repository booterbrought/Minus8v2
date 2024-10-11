# Minus8v2 Game Server

A Deno-based game server using Oak framework for creating, joining, and playing games.

## Quick Start

1. Install [Deno](https://deno.land/)
2. Clone and run:
   ```bash
   git clone https://github.com/booterbrought/Minus8v2.git
   cd Minus8v2
   cd frontend
   npm install
   npm run build
   cd ..
   deno run --allow-net --allow-read --unstable backend/server.ts
   ```
3. Server runs at `http://localhost:8000`

## Key Endpoints

- `POST /auth/login`: Login
- `POST /auth/register`: Register
- `POST /game`: Create game
- `POST /game/:id/join`: Join game
- `GET /game/:id`: Get game state
- `POST /game/:id/move`: Make move

## Tech Stack

- Backend: Deno + Oak
- Frontend: Vite + Vue + TypeScript

## Contributing

Issues and pull requests welcome.

## License

MIT
