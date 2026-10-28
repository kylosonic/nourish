# Nourish website

The public marketing site for Nourish. It is a dependency-free static site built
with semantic HTML, CSS, and small ES modules.

Live site: <https://nourish-kylosonic.vercel.app/>

The current design is a neo-brutalist product tour built around real app
captures and approved Ethiopian food photography. The fixed bottom dock behaves
like an Apple Store product tab bar: it stays reachable, tracks the section in
view, and keeps the download action available without covering page content.

## Structure

```
apps/website/
  index.html                 marketing page and live release panel
  privacy.html               privacy policy
  terms.html                 terms of service
  cookies.html               cookie and tracking notice
  health-disclaimer.html     health and nutrition disclaimer
  data-deletion.html         data deletion
  robots.txt / sitemap.xml   SEO
  latest.json                Vercel copy of releases/latest.json
  assets/
    tokens.css               colour, type, spacing, rule, and motion tokens
    styles.css               layout and interaction styles
    app.js                   release panel, bottom dock, tour, and gram preview
    download-logic.mjs       platform and download decisions
    screens/                 current app captures
    images/                  approved Ethiopian food photography
    fonts/                   bundled Inter and Bricolage Grotesque faces
  test/                      download and release integration tests
```

The site makes no third-party requests. Fonts, images, and icons are local or
inline SVG.

## Run locally

From the repository root:

```bash
npx http-server -p 8080 -c-1
```

Open <http://127.0.0.1:8080/apps/website/>. The site reads its local
`latest.json` first and the canonical `releases/latest.json` as a development
fallback.

## Verify

```bash
node --test "apps/website/test/*.test.mjs"
npx --yes html-validate@9 "apps/website/*.html"
node scripts/generate-latest-json.mjs --check
```

The page is checked at 320, 375, 414, and 768 CSS pixels with no horizontal page
scroll and no wrapped navigation or CTA labels.

## Release behavior

- Android visitors receive the direct APK link only when release metadata
  contains a checksummed APK.
- iPhone and iPad visitors receive no install link until a signed Apple
  distribution build exists. The unsigned IPA is never offered.
- If metadata cannot be reached, all visitors fall back to
  [GitHub Releases](https://github.com/kylosonic/nourish/releases).
- The release table shows version, file size, and SHA-256 for every available
  Android artifact.

The decision logic lives in `assets/download-logic.mjs` and is covered by the
tests in `test/`, rather than being enforced by comments alone.

## Deployment

Production is served by the Vercel project `nourish`, with `apps/website` as its
repository root. The custom project domain is
<https://nourish-kylosonic.vercel.app/>.

Vercel's GitHub integration handles production and preview deployments.
`latest.json` is committed beside the site so a static deployment always has
working release metadata; the release workflow updates both copies together.
GitHub Pages is not used.
