# NLP Visual Lab

An interactive React and TypeScript study app based on the PDFs in `../.docs`. It includes eight labs: tokens, normalization, morphemes, and five subword approaches; edit distance; context vectors; trainable CBOW/skip-gram embeddings; n-gram models; smoothing; perplexity; and a small neural network.

## Run locally

```sh
cd nlp-visual-lab
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` produces a static `dist` directory; `npm test` checks the key lesson calculations. The lessons themselves run in the browser without a backend or account. An optional web font and an attribution link to the original Word2Vec paper use the network.

## Publish on your own host

See [DEPLOYMENT.md](DEPLOYMENT.md). This is a standard static site: your host installs with `npm ci`, builds with `npm run build`, and serves `dist/`. No GPT hosting or API is required.

The high fidelity UI reference was generated before the React implementation and saved at [`design/embedding-workspace-concept.png`](design/embedding-workspace-concept.png). Its prompt and usage notes are in [`design/README.md`](design/README.md). The mockup is a design reference: the app's topics, graph points, and numbers come from the course material and live calculations.

`src/lib/math.js` and `src/lib/tokenization.js` hold the calculation engines, with TypeScript interfaces alongside them. `src/labs` contains the interactive React lessons. `SOURCE_AUDIT.md` records the calculation conventions and discrepancies in rounded or inconsistent slide examples. The source PDFs are not bundled into the hosted output.

The app feature-detects WebMCP and, where supported, exposes tools to open a lesson and train the small embedding model.

Lesson 1B includes a 4.5 KB local subset of Noto Sans SC for the exact Chinese and fullwidth examples in the lesson, so those examples render on devices without CJK fonts. Its SIL Open Font License is at [`public/fonts/OFL-Noto-Sans-SC.txt`](public/fonts/OFL-Noto-Sans-SC.txt); the subset was generated from the [Noto Sans SC Google Fonts distribution](https://github.com/google/fonts/tree/main/ofl/notosanssc).
