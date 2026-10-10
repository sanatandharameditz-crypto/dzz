# DuelZone

Browser game hub — 25+ games, zero download, zero login. By VGWA.

## Quick start

```bash
npx serve .
```

Open [http://localhost:3000](http://localhost:3000)

## Structure

- `index.html` — Hub with search, filters, bottom nav
- `chess.html`, `ludo.html`, `tetris.html` — Featured games
- `play.html?game=<id>` — Mini-game loader
- `dz-*.js` — Platform (theme, routing, ads, share)
- `games/` — Mini-game logic
- `duelzone.css` — Design system

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Cloudflare Pages instructions.

## Docs

- [docs/DUELZONE_SPEC.md](./docs/DUELZONE_SPEC.md)
- [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)
