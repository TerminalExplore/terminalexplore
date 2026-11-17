# profile-views

Cloudflare Worker that serves an SVG "views" badge and counts every request.

Deploy (from this folder):

```
npx wrangler login
npx wrangler kv namespace create VIEWS   # paste the id into wrangler.toml
npx wrangler deploy
```

Then in the profile README:

```
https://profile-views.<your-subdomain>.workers.dev/?username=TerminalExplore&theme=dark
```

Notes: every request counts (repeat visits, bots, your own). KV's free tier
allows 1000 writes/day; past that the badge still renders but stops saving.
To start from a given number: `npx wrangler kv key put views:terminalexplore 1234 --binding VIEWS`.
