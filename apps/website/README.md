# Nourish website

The marketing site for Nourish: static HTML, CSS and one ES module, deployed to
Cloudflare Pages. It contains **no cookies, no analytics and no third-party
requests** — including the fonts, which are bundled in `assets/fonts/`.

```
apps/website/
  index.html                 hero, demo, how it works, Ethiopian food, features,
                             privacy, pricing, download, FAQ, contact
  privacy.html               Privacy Policy
  terms.html                 Terms of Service
  cookies.html               Cookie & Tracking Notice
  health-disclaimer.html     Health & Nutrition Disclaimer
  data-deletion.html         Data Deletion
  robots.txt / sitemap.xml   SEO
  latest.json                (not committed — copied from releases/latest.json at deploy)
  assets/
    styles.css               tokens taken from Design/nourish/DESIGN.md
    app.js                   DOM wiring only
    download-logic.mjs       device detection + download decisions (unit tested)
    screens/                 approved Stitch screens
    fonts/                   Inter 400/600/700
  test/download-logic.test.mjs
```

## Run it locally

```bash
# from the repository root — any static server works
npx http-server -p 8080 -c-1
# then open http://127.0.0.1:8080/apps/website/
```

`app.js` looks for the release metadata at `latest.json` (next to the site, how
it is deployed) and then at `../releases/latest.json` (the repository copy,
which is what a local preview serves). If neither is reachable the download area
degrades to the GitHub Releases link — it never shows a stale hardcoded URL.

## Verify it

```bash
node --test "apps/website/test/*.test.mjs"   # device + download rules
npx --yes html-validate@9 "apps/website/*.html"          # markup
node scripts/generate-latest-json.mjs --check            # release metadata
```

## What the download area guarantees

- **Android** visitors get a direct APK link taken from the release metadata,
  with the version, file size and SHA-256 shown so the file can be verified.
- **iPhone/iPad** visitors get “IPHONE VERSION COMING SOON” and an explanation,
  and **no download link at all**, until a genuinely signed Apple distribution
  build exists. An unsigned IPA is never presented as an installable app.
- **Desktop** visitors get the Android call to action plus the releases page.
- A binary is only linked when its checksum is published; a release that has not
  happened yet is a real state, not a broken link.

These rules live in `assets/download-logic.mjs` and are asserted by
`test/download-logic.test.mjs`, because a rule this easy to get wrong should not
be enforced by a comment.

## Publishing a release

See [the release process](../../docs/release-process.md). The site reads the
metadata at runtime, so publishing a new APK never requires editing or
rebuilding the website.
