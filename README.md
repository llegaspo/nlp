# NLP Visual Lab

A guided, browser-local NLP course built around the 17 PDFs in `../.docs`, with verified primary-source extensions. The redesigned workspace has 13 lessons, 26 practice questions, a searchable glossary, source references, and progress saved in this browser.

Each lesson follows **Understand → Experiment → Check yourself**: plain-language intuition, an original worked example, an interactive calculation, and questions with explanatory feedback. Every lesson is available without prerequisites or an account.

Equations begin with **Picture the idea**: a clickable diagram of the steps, a small example you can change, and an optional **See the symbols** drawer with a plain-language symbol key. All 13 lessons, lab equation panels, and Python missions use this approach. The mini examples are explicitly separate from the current lab inputs. Diagrams use the shared dark/light palette and adapt to narrow panels.

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

Dark mode is the default. Use the sun/moon button in the header to switch to light or dark mode; the choice is saved under `nlp-visual-lab.theme` and restored before the page paints. The toggle remains usable when browser storage is unavailable.

Progress is stored under `nlp-visual-lab.progress.v2` in localStorage. A lesson is complete when both answers are correct. State inside an experiment survives tab changes within that lesson; navigating to another lesson resets its experiment. Disabled or malformed storage does not block the course.

## Python exercise: Moonlight Café

Open **Python exercise** in the sidebar or visit `#exercises`. Build a café autocomplete in five missions: tokenization, bigram counts, maximum-likelihood prediction, add-k smoothing, and held-out perplexity. Allow about 30 minutes, plus an optional bonus.

Everything is on the exercise page: Colab/Jupyter setup, copyable Python cells, TODO starter code, progressive hints, worked versions, expected output, live previews, and prediction checkpoints. Copy Cell 0 into a Python 3 notebook, then complete and run Cells 1–5 in order. The code uses only Python's standard library. The Python runs in your notebook; the website previews the same calculations in JavaScript.

The bonus adds a new training order while keeping the test order held out. A complete working code block is available on the page for comparison. Exercise progress is stored separately under `nlp-visual-lab.cafe.v1`; solved checkpoints do not imply that notebook code was executed. Clipboard restrictions fall back to selecting the code for manual copying.

## Project structure

- `src/data/course.ts`: lesson explanations, examples, quizzes, glossary, and primary references.
- `src/data/equations.ts`, `src/components/EquationGuide.tsx`: equation stories, clickable diagrams, examples, and symbol keys.
- `src/lib/equationExamples.ts`, `src/equations.css`: computed mini examples and responsive equation layouts.
- `src/data/cafeExercise.json`: the original exercise corpus, instructions, Python code, hints, checkpoints, and verified outputs.
- `src/components/`: the course home, guided lesson view, reference pages, and shared UI.
- `src/labs/`: interactive lessons and the tokenization subtopics.
- `src/lib/math.js`, `tokenization.js`, `transformer.js`: pure calculation engines with TypeScript declarations.
- `src/styles.css`: the course interface and responsive rules; `src/labs.css`: shared experiment styles; `src/theme.css`: semantic colors for both themes.
- `src/exercises.css`: the café exercise and notebook cell layout, using the shared theme colors.
- `SOURCE_AUDIT.md`: source mapping, teaching simplifications, corrected slide ambiguities, and validation details.

Navigation uses URL fragments, preserving existing links such as `#tokens` and `#embeddings`. New lessons include `#intro`, `#attention`, `#masked`, `#llms`, and `#responsible`. `#home`, `#exercises`, `#glossary`, and `#sources` open the supporting pages. Search is available from the header or Ctrl/Cmd+K. Lesson tabs support arrow keys, Home, and End; animation honors reduced-motion settings.

## Validation

`pnpm test` verifies tokenization, edit distance, counts, smoothing, perplexity, training steps, attention, masking, positional encoding, and decoding. It includes a regression for unigram history handling.

It also verifies equation coverage for every lesson and the mini examples: probability normalization, geometric-mean perplexity, masked attention, gradient overshooting, and the distinction between segmentation-path and whole-text probability. DOM checks cover diagram steps, changed examples, collapsed notation, and formula-family changes in the labs.

`pnpm test:exercise` requires Python 3 on PATH. It executes every displayed worked cell and the bonus, checks the expected outputs and held-out evaluation, and compares Python probabilities and perplexities with the JavaScript preview engine. This requires no Python packages.

Optional DOM interaction checks use `jsdom` and the production bundle:

```sh
# With jsdom available in your development environment:
pnpm test:ui

# Or use an existing jsdom installation without changing this project's dependencies:
NLP_TEST_DOM_MODULE=/absolute/path/to/jsdom/lib/api.js pnpm test:ui
```

These checks cover all lessons, all 26 quiz questions, feedback, persistence and malformed storage, search, tokenization subtopics, attention, BERT, generation, and training controls. They also cover exercise navigation, all five checkpoints, live previews, code copying and its fallback, hints, and separate progress storage. They do not verify rendered layout. During the revamp, the execution environment prohibited local server sockets and Chromium startup; desktop/mobile screenshot verification remains a manual check.

The PDFs are not distributed in the site build. The old `design/embedding-workspace-concept.png` is a historical reference for the previous interface. The bundled CJK font license remains in `public/fonts/OFL-Noto-Sans-SC.txt`. Optional WebMCP support can open any lesson and train the embedding experiment in supporting browsers.
