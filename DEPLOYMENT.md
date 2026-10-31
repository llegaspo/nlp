# Publish NLP Visual Lab yourself

The whole `nlp-visual-lab` directory is the source project. It is a React + TypeScript app built with Vite. It runs entirely in the browser; there is no server, database, login, GPT account, or API key needed to run the lessons.

## Build and check locally

From this directory:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm preview
```

Open the preview URL printed by Vite. The production files are in `dist/`. `pnpm preview` is for local inspection; use a static web host for production.

## Publish

You can either upload the **contents of `dist/`** to any static web server or connect this source directory to a static hosting provider. Use these settings:

| Setting | Value |
| --- | --- |
| Project or repository root | `nlp-visual-lab/` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output or publish directory | `dist` |
| Runtime environment variables | None |

The build uses relative asset URLs, so it can be served at a domain root or a subpath. The lesson navigation uses URL fragments (`#...`), so no special server rewrite rule is needed.

Check `git remote -v` before configuring a hosting repository; preserve any remote already configured. `node_modules/`, `dist/`, and `.openai/` are ignored by Git. The `.docs` lesson PDFs sit outside this project and are not needed by the published site.

The Google Fonts CSS request is optional; the interface falls back to system fonts if unavailable. Primary-source citations link to the original publications. Lesson progress is local to each browser and is not synchronized across devices.
