type WebTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: {readOnlyHint: boolean; untrustedContentHint: boolean};
  execute: (input: unknown) => unknown | Promise<unknown>;
};
type ModelContext = {registerTool: (tool: WebTool, options?: {signal?: AbortSignal}) => void | Promise<void>};
type WebDocument = Document & {modelContext?: ModelContext};

const lessons = ['intro', 'tokens', 'edit-distance', 'context-vectors', 'embeddings', 'ngrams', 'smoothing', 'perplexity', 'neural', 'attention', 'masked', 'llms', 'responsible'];

export function registerWebTools() {
  const context = (document as WebDocument).modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  const tools: WebTool[] = [
    {
      name: 'open_nlp_lesson',
      title: 'Open an NLP lesson',
      description: 'Navigate to one of the thirteen interactive course lessons.',
      inputSchema: {type: 'object', properties: {lesson: {type: 'string', enum: lessons}}, required: ['lesson'], additionalProperties: false},
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      async execute(input) {
        const lesson = (input as {lesson?: unknown})?.lesson;
        if (typeof lesson !== 'string' || !lessons.includes(lesson)) throw new Error('lesson must be a known lesson id');
        location.hash = lesson;
        await nextFrame();
        await nextFrame();
        return {lesson, heading: document.querySelector('h1')?.textContent || null};
      },
    },
    {
      name: 'train_nlp_embedding',
      title: 'Train the word embedding',
      description: 'Run 1 to 100 updates of the visible CBOW or skip-gram experiment and return its step and loss.',
      inputSchema: {type: 'object', properties: {steps: {type: 'integer', minimum: 1, maximum: 100}}, required: ['steps'], additionalProperties: false},
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      async execute(input) {
        const steps = (input as {steps?: unknown})?.steps;
        if (!Number.isInteger(steps) || (steps as number) < 1 || (steps as number) > 100) throw new Error('steps must be an integer from 1 to 100');
        location.hash = 'embeddings';
        for (let attempt = 0; attempt < 5 && !document.querySelector('[data-active-lab="embeddings"]'); attempt++) await nextFrame();
        if (!document.querySelector('[data-active-lab="embeddings"]')) throw new Error('Embedding lesson could not open');
        document.querySelector<HTMLButtonElement>('[data-open-experiment]')?.click();
        await nextFrame();
        return new Promise((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error('Embedding lesson did not respond')), 3000);
          window.dispatchEvent(new CustomEvent('nlp:train-embedding', {detail: {steps, resolve: (value: unknown) => {window.clearTimeout(timeout); resolve(value);}}}));
        });
      },
    },
  ];
  for (const tool of tools) {
    try { void Promise.resolve(context.registerTool(tool, {signal: lifecycle.signal})).catch(() => {}); } catch { /* Unsupported browser context. */ }
  }
  window.addEventListener('pagehide', () => lifecycle.abort(), {once: true});
}
