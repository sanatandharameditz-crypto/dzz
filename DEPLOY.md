# Deploy DuelZone to Cloudflare Pages

## Prerequisites

- GitHub account
- Cloudflare account with `duelzone.online` domain
- This folder pushed to a GitHub repository

## 1. Initialize and push

```powershell
cd "c:\Users\Aashish\Desktop\DUELZONE DESIGN"
git init
git add .
git commit -m "DuelZone relaunch — hub, platform layer, 25 games"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/duelzone.git
git push -u origin main
```

## 2. Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the `duelzone` repository
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/` (root)
4. Deploy

## 3. Custom domain

1. Pages project → **Custom domains** → Add `duelzone.online` and `www.duelzone.online`
2. Update DNS at your registrar if not already on Cloudflare:
   - `CNAME` `duelzone.online` → `<project>.pages.dev`
   - Or use Cloudflare nameservers for full proxy

## 4. URL routing

The site uses query-param routing (`index.html?game=chess`). Cloudflare serves static files directly — no special rules required.

Optional clean URLs (future):

```
/*  /index.html  200
```

Add as `_redirects` in project root if using Cloudflare Pages redirects.

## 5. Post-deploy QA

Run the checklist in `docs/IMPLEMENTATION_PLAN.md`.

## 6. Ads (production)

Replace placeholder interstitial in `dz-ads.js` with your ad network snippet. **Do not remove** `dzShowInterstitial` triggers — monetization depends on them.

## Local preview

```powershell
npx serve .
```

Open `http://localhost:3000`
