# NLP Visual Lab

A guided, browser-local NLP course built around the 17 PDFs in `../.docs`, with verified primary-source extensions. The redesigned workspace has 13 lessons, 26 practice questions, a searchable glossary, source references, and progress saved in this browser.

Each lesson follows **Understand → Experiment → Check yourself**: plain-language intuition, an original worked example, an interactive calculation, and questions with explanatory feedback. Every lesson is available without prerequisites or an account.

## Run locally

Use pnpm 12.3.4, as pinned in `package.json`. Dependencies are locked in `pnpm-lock.yaml`.

```sh
cd nlp-visual-lab
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. To check the production build:

```sh
pnpm test
pnpm build
pnpm preview
```

The production output is `dist/`. See [DEPLOYMENT.md](DEPLOYMENT.md) for static hosting. There is no backend, API key, or inference service. The interface optionally loads DM Sans from Google Fonts and falls back to local fonts. The Chinese examples use a bundled Noto Sans SC subset.

## The learning path

| Chapter | Lessons |
| --- | --- |
| Language into numbers | What is NLP?; words and tokens; edit distance; context vectors; learning embeddings |
| Learning to predict | N-gram models; smoothing; evaluating predictions |
| From networks to language models | Neural networks; attention and transformers; BERT and masked language; language-model generation; responsible use |

The original tokenization workbenches remain available: token streams, normalization, morphemes, and BPE/WordPiece/Unigram/SentencePiece/byte-level comparisons. The embedding and neural-network labs train real tiny models. Attention computes explicit query/key/value projections, softmax weights, causal masks, and value mixtures. The BERT lab exposes selected-target loss and input corruption. The generation sandbox uses an explicitly disclosed, hand-authored score table to teach decoding.

Progress is stored under `nlp-visual-lab.progress.v2` in localStorage. A lesson is complete when both answers are correct. State inside an experiment survives tab changes within that lesson; navigating to another lesson resets its experiment. Disabled or malformed storage does not block the course.

## Project structure

- `src/data/course.ts`: lesson explanations, examples, quizzes, glossary, and primary references.
- `src/components/`: the course home, guided lesson view, reference pages, and shared UI.
- `src/labs/`: interactive lessons and the tokenization subtopics.
- `src/lib/math.js`, `tokenization.js`, `transformer.js`: pure calculation engines with TypeScript declarations.
- `src/styles.css`: the new course interface and responsive rules; `src/labs.css`: retained experiment styles adapted to the light palette.
- `SOURCE_AUDIT.md`: source mapping, teaching simplifications, corrected slide ambiguities, and validation details.

Navigation uses URL fragments, preserving existing links such as `#tokens` and `#embeddings`. New lessons include `#intro`, `#attention`, `#masked`, `#llms`, and `#responsible`. `#home`, `#glossary`, and `#sources` open the supporting pages. Search is available from the header or Ctrl/Cmd+K. Lesson tabs support arrow keys, Home, and End; animation honors reduced-motion settings.

## Validation

`pnpm test` verifies tokenization, edit distance, counts, smoothing, perplexity, training steps, attention, masking, positional encoding, and decoding. It includes a regression for unigram history handling.

Optional DOM interaction checks use `jsdom` and the production bundle:

```sh
# With jsdom available in your development environment:
ppnpm test:ui

# Or use an existing jsdom installation without changing this project's dependencies:
NLP_TEST_DOM_MODULE=/absolute/path/to/jsdom/lib/api.js ppnpm test:ui
```

These checks cover all lessons, all 26 quiz questions, feedback, persistence and malformed storage, search, tokenization subtopics, attention, BERT, generation, and training controls. They do not verify rendered layout. During the revamp, the execution environment prohibited local server sockets and Chromium startup; desktop/mobile screenshot verification remains a manual check.

The PDFs are not distributed in the site build. The old `design/embedding-workspace-concept.png` is a historical reference for the previous interface. The bundled CJK font license remains in `public/fonts/OFL-Noto-Sans-SC.txt`. Optional WebMCP support can open any lesson and train the embedding experiment in supporting browsers.
