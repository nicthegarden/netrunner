# NETRUNNER

NETRUNNER is a browser-based cyberpunk idle game with a local Node/SQLite backend for authentication, admin tools, and server-backed saves. The client is built with vanilla HTML, CSS, and ES modules. There is no frontend build step.

## What You Get

- 24 skills across hacking, netrunning, street, tech, fixer, and ripper categories
- Idle progression with offline gains, mastery, combat, crafting, inventory, and prestige
- Multi-grind support with shared efficiency debuffs
- A bottom-docked terminal that shows both live hacking output and gameplay event feed
- Authenticated accounts with persistent server-side saves
- Admin dashboard for user management, moderation, account access changes, and audit visibility
- Rotating shop inventory, large item catalog support, curated cyberpunk gear, and achievements

## Tech Stack

- Frontend: vanilla HTML, CSS, JavaScript ES modules
- Backend: Node.js, Express, SQLite
- Storage: browser `localStorage` plus SQLite save persistence
- Auth: JWT access and refresh token flow
- Build tooling: none required for the frontend

## Quick Start

### Prerequisites

- Node.js 18+ recommended
- npm
- Python 3 recommended for the static frontend server

### Start Everything

From the repository root:

```bash
chmod +x start-all.sh serve.sh
./start-all.sh
```

What the script does:

- installs backend dependencies in `server/` if needed
- starts the backend on `http://localhost:3000`
- starts the static frontend on `http://localhost:8000`
- prints the game, auth, and admin URLs
- keeps both processes attached until you press `Ctrl+C`

Compatibility note:

- `./serve.sh` still works and now forwards to `./start-all.sh`

## Local URLs

- Game: `http://localhost:8000/index.html`
- Login/Register: `http://localhost:8000/auth.html`
- Admin Panel: `http://localhost:8000/admin.html`
- Backend Health Check: `http://localhost:3000/health`

## Manual Startup

If you prefer to start services manually:

### Backend

```bash
cd server
npm install
npm run server
```

### Frontend

```bash
python3 -m http.server 8000
```

You can also use `python -m SimpleHTTPServer 8000` or `npx http-server -p 8000` if needed.

## Environment and Ports

The launcher supports custom ports:

```bash
PORT=8080 AUTH_PORT=3001 ./start-all.sh
```

Defaults:

- `PORT=8000`
- `AUTH_PORT=3000`

## How Authentication Works

- `auth.html` handles login and registration
- access tokens are stored in browser local storage
- refresh tokens are used to renew expired sessions
- `index.html` reads the saved auth state and redirects to login when needed
- the backend exposes auth endpoints under `/api/auth/*`

Primary auth routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Admin Panel

The admin UI lives at `admin.html`.

Current admin capabilities include:

- list and search users
- inspect account details and recent save information
- ban and unban accounts
- reset player progress
- nerf player stats
- update email and admin access
- reset passwords
- revoke active sessions
- view admin actions and server stats

Access expectations:

- localhost access is supported for development
- local network admin access also allows `192.168.1.x` addresses

## Gameplay Overview

### Skills

The game includes 24 skills grouped into six categories:

- Hacking: Intrusion, Decryption, ICE Breaking, Daemon Coding
- Netrunning: Deep Dive, Data Mining, Black ICE Combat, Neural Surfing
- Street: Combat, Stealth, Street Cred, Smuggling
- Tech: Cyberware Crafting, Weapon Modding, Vehicle Tuning, Drone Engineering
- Fixer: Trading, Corpo Infiltration, Info Brokering, Fencing
- Ripper: Cyberware Installation, Biotech, Neural Enhancement, Chrome Surgery

### Core Systems

- skill XP and level progression to 99
- per-activity mastery progression
- combat with enemies, loot, and abilities
- crafting, equipment, consumables, and cyberware
- prestige progression and upgrades
- rotating shop inventory
- offline progress for time away from the game
- server save upload and restore flow

### Terminal Feed

The bottom terminal is a core part of the UI.

- `All` shows the event feed plus live hacking stream
- `Loot`, `XP`, `Combat`, and `System` filters narrow the event feed
- loot notifications are rendered with readable names and icons
- repeated loot messages are merged to reduce offline progress spam

## Save System

NETRUNNER uses two save layers:

- local browser save for instant persistence and offline progress timestamps
- backend save storage in SQLite for authenticated persistence and admin inspection

Save-related backend routes:

- `POST /api/saves/upload`
- `GET /api/saves/latest`
- `GET /api/saves/list`
- `GET /api/saves/:saveId`
- `POST /api/saves/:saveId/restore`

## Project Structure

```text
netrunner/
├── index.html
├── auth.html
├── admin.html
├── start-all.sh
├── serve.sh
├── css/
│   └── main.css
├── js/
│   ├── app.js
│   ├── main.js
│   ├── data/
│   │   ├── skillData.js
│   │   └── worldData.js
│   ├── engine/
│   │   ├── events.js
│   │   ├── gameLoop.js
│   │   ├── offline.js
│   │   └── save.js
│   ├── systems/
│   │   ├── abilities.js
│   │   ├── combat.js
│   │   ├── crafting.js
│   │   ├── economy.js
│   │   ├── equipment.js
│   │   ├── inventory.js
│   │   ├── passiveStats.js
│   │   ├── player.js
│   │   ├── prestige.js
│   │   └── skills.js
│   └── ui/
│       ├── hackerTerminal.js
│       └── main.js
└── server/
    ├── package.json
    ├── server.js
    ├── db.js
    ├── middleware/
    └── routes/
```

## Development Notes

- there is no frontend bundler or transpiler
- edit files directly and reload the browser
- backend code lives entirely in `server/`
- the frontend is expected to run on a static host while the API runs on port `3000`
- `server/game.db` is a local runtime file and should not be committed

## Common Tasks

### Install Backend Dependencies

```bash
cd server
npm install
```

### Run Backend Only

```bash
cd server
npm run server
```

### Run Backend in Watch Mode

```bash
cd server
npm run dev
```

### Start Frontend Only

```bash
python3 -m http.server 8000
```

## Troubleshooting

### Login Page Loads but Auth Fails

- make sure the backend is running on port `3000`
- open `http://localhost:3000/health` and confirm it returns JSON
- confirm the frontend is loaded from `http://localhost:8000`, not directly from `file://`

### Admin Page Says Token Is Invalid or Expired

- log in again through `auth.html`
- confirm `localStorage` contains the auth tokens
- make sure the backend is reachable at `http://localhost:3000`

### Script Cannot Start the Frontend

- install Python 3 or Node.js
- if a port is already in use, stop the existing service or choose another port with `PORT=...`

### Script Cannot Start the Backend

- install Node.js and npm
- run `cd server && npm install`
- verify `server/server.js` exists and `http://localhost:3000/health` responds

## GitHub Workflow

Typical update flow:

```bash
git status
git add .
git commit -m "Your message"
git push origin main
```

## License

MIT
