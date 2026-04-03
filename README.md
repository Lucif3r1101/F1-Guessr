# F1 Guessr

A real-time Formula 1 guessing game for fans and party nights. Built with React + Vite. Content sourced live from Reddit — no server, no database, no storage required.

## What is F1 Guessr?

F1 Guessr challenges players to identify F1 moments from:
- **Pixelated images** — gradually reveal blurred race photos
- **Zoomed-in shots** — identify from close-up crop details
- **Video clips** — short Reddit clips you must identify
- **Fill in the blank** — type the answer at higher difficulty levels

Modeled after GeoGuessr with 10 escalating levels from "Rookie" to "F1 Legend". Multiple choice options at lower levels, fill-in-the-blank at higher levels. Hints available at a point penalty.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Animations**: Framer Motion
- **Data**: Reddit JSON API (r/formula1, r/formuladank) — no API key needed
- **State**: React hooks (no Redux, no backend)
- **Storage**: None — fully ephemeral per-session

## Game Features

- 10 difficulty levels, each with unique configs (time limits, lives, pixelation level)
- Scoring system with time bonuses and streak multipliers
- Multiple challenge types: pixelated, zoomed, video clip, fill-in-the-blank
- Hint system (costs 40% of potential points)
- Life system (lose lives for wrong answers)
- Session score tracking
- Animated transitions and feedback
- Reddit source links for each challenge
- Ad-placement-ready layout (designed with IAB standard ad zones in mind)

## Level Progression

| Level | Name | Time | Lives | Style |
|-------|------|------|-------|-------|
| 1 | Rookie | 30s | 5 | Wide, clear |
| 2 | Racing Fan | 28s | 4 | Slight blur |
| 3 | Paddock Pass | 25s | 4 | Medium blur + videos |
| 4 | Pit Crew | 22s | 3 | Heavy pixelation |
| 5 | Team Principal | 20s | 3 | Extreme zoom + fill-in-blank |
| 6 | Race Engineer | 18s | 3 | Extreme pixelation |
| 7 | Technical Director | 15s | 2 | Micro clips |
| 8 | Championship Contender | 12s | 2 | Blurred stills |
| 9 | World Champion | 10s | 2 | One-frame clips |
| 10 | F1 Legend | 8s | 1 | Impossible mode |

## Deployment Instructions

### Prerequisites

- Node.js 18+ (or 20+)
- pnpm v9+ (`npm install -g pnpm`)

### Local Development

```bash
# Install dependencies
pnpm install

# Run the dev server
pnpm --filter @workspace/f1-guessr run dev
```

The app runs on `http://localhost:<PORT>` (port is assigned automatically).

### Production Build

```bash
# Build for production
pnpm --filter @workspace/f1-guessr run build
```

Output is in `artifacts/f1-guessr/dist/public/`. Serve these static files with any web server.

### Serve with NGINX Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/f1-guessr/dist/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Deploy to Your Own Server

1. Run `pnpm --filter @workspace/f1-guessr run build`
2. Copy `artifacts/f1-guessr/dist/public/` to your server
3. Serve as a static site (Apache, NGINX, Caddy, etc.)
4. No environment variables required — everything is client-side

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Dev only | — | Port for Vite dev server |
| `BASE_PATH` | Dev only | `/` | URL base path |

For production static hosting: **no env vars needed**.

## Reddit API Note

F1 Guessr uses Reddit's public JSON API (no OAuth required):
- `https://www.reddit.com/r/formula1/hot.json`
- `https://www.reddit.com/r/formula1/top.json?t=year`

Reddit's public API has rate limits. For high-traffic production use, consider:
- Adding a lightweight proxy server to cache Reddit responses (60s TTL)
- Using Reddit OAuth app credentials for higher rate limits

## Adding Ads

The layout is built with ad zones in mind. To add ads:
- **Leaderboard (728x90)**: Add above the header in `GameScreen.tsx`
- **Rectangle (300x250)**: Add in `Lobby.tsx` sidebar area
- **Between levels**: Inject ad in `LevelComplete.tsx` before the "Next Level" button

Recommended: Google AdSense or any IAB-compliant ad network.

## Customization

### Adding more F1 entities to detect

Edit `artifacts/f1-guessr/src/lib/redditService.ts`:
- `ALL_DRIVERS` — add driver names
- `ALL_TEAMS` — add constructor names  
- `ALL_CIRCUITS` — add circuit names
- `F1_SUBREDDITS` — add more subreddits

### Changing difficulty levels

Edit `artifacts/f1-guessr/src/lib/gameEngine.ts`:
- `LEVEL_CONFIGS` array — modify time, lives, pixelation, zoom per level

## License

MIT — free to use, modify, and deploy.
