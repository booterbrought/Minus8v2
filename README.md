# Game Server

This is a game server built using Deno and the Oak framework. It supports creating games, joining games, and making moves within a game.

## Features

- Create a new game
- Join an existing game
- Make moves in a game
- Authentication for game actions

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) installed on your machine.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/booterbrought/Minus8v2.git
   cd gameserver
   ```

2. Run the server:

   ```bash
   deno run --allow-net --allow-read --unstable backend/server.ts
   ```

### Usage

- Access the server at `http://localhost:8000`.
- Use the provided endpoints to interact with the game server.

### Endpoints

- `POST /auth/login`: Login to the server.
- `POST /auth/register`: Register a new user.
- `POST /game`: Create a new game.
- `POST /game/:id/join`: Join an existing game.
- `GET /game/:id`: Get the current state of a game.
- `POST /game/:id/move`: Make a move in a game.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENСE](LICENCE.md) file for details.
