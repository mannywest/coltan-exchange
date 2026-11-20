# Hosting the demo on Cloudflare Pages

The demo is one static file (preview/dist/index.html) with no server and no secrets. All data is invented.

## Settings in Cloudflare Pages (connect to GitHub: mannywest/coltan-exchange, branch main)
- Framework preset: None
- Build command: `npm run build:demo`
- Build output directory: `preview/dist`
- Environment variable: `NODE_VERSION` = `22`

## Put it on a Plerosis address
- Pages project, Custom domains, add for example `demo.plerosis.com` (the domain's DNS must be on Cloudflare, or add the CNAME Cloudflare shows you).

## Keep it private-ish
- The page is marked noindex and robots.txt blocks crawlers, so search engines should skip it.
- For a password gate, use Cloudflare Access (Zero Trust) on the Pages project and allow only named emails.

## Access code
The demo opens on a "Private demo" screen. Only a hash of the code is in the repo.
- Change the code: `node scripts/set-access-code.mjs "new code"`, then rebuild and redeploy.
- This keeps casual visitors out; it is not real security (the check runs in the browser). For real protection, add Cloudflare Access in front of the hosted demo.
