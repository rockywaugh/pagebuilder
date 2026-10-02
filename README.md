# PageBuilder

An online studio for composing a marketing page in conversation. Prompts sit on the left. A **printed preview** (PNG) sits on the right. The first page is free to compose. Files are generated on the server only after an account and payment.

## Why the preview is not HTML

View Source and DevTools inspect whatever the browser received as a document. If the working page were an iframe or a React tree of the customer’s site, a web-savvy visitor could copy it.

PageBuilder keeps the real page as a JSON spec and uploaded binaries **on the server**. `/api/preview` rasterizes that spec to a PNG. The studio shows an `<img>`. That is not source-proof — someone can still recreate a simple layout from pixels — but it is the honest front-facing limit. There is no reliable browser trick that “disables source retrieval” of an HTML page you already sent.

Membership publish (`/{slug}`) serves HTML **after** payment, on purpose. Login for hosted members is `/{slug}/login`. Older `/live/{slug}` URLs redirect there.

## Safeguards

- Prompts are treated as data. Script-like input, jailbreaks, phishing, and source-grab requests are refused.
- Rate limits and same-origin checks on mutating routes.
- Uploads: JPEG/PNG/WebP only (magic bytes), size and dimension floors/ceilings, blur check, skin-ratio decency heuristic, optional OpenAI omni-moderation, re-encode to WebP (EXIF stripped).
- Example search uses a curated library, not an open web scrape. Queries are filtered before anything is shown.

## Scripts

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio).

Without Stripe keys, create an account and use **demo checkout** to unlock download or membership. Without `OPENAI_API_KEY`, the guided steps still compose a full page from your answers.
# pagebuilder
