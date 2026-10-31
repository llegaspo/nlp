import {useEffect, useRef, useState} from 'react';
import cafe from '../data/cafeExercise.json';
import {conditional, ngramModel, scoreSentence} from '../lib/math.js';
import {format, ProbabilityBars, Segmented, Stat} from './LabUI';
import CodeCell from './CodeCell';
import Icon from './Icons';

const model = ngramModel(cafe.training);
const tokenize = (text: string) => text.toLowerCase().match(/[a-z]+/g) || [];
type Mission = typeof cafe.steps[number];
const storageKey = 'nlp-visual-lab.cafe.v1';

function readProgress(): {stage: number; completed: string[]} {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return {
      stage: Number.isInteger(saved?.stage) && saved.stage >= 0 && saved.stage < cafe.steps.length ? saved.stage : 0,
      completed: Array.isArray(saved?.completed) ? cafe.steps.filter(step => saved.completed.includes(step.id)).map(step => step.id) : [],
    };
  } catch {
    return {stage: 0, completed: []};
  }
}

function CafePreview({mission}: {mission: string}) {
  const [text, setText] = useState('Tea, tea & COFFEE!');
  const [history, setHistory] = useState('like');
  const [k, setK] = useState(1);
  const [test, setTest] = useState(cafe.test);
  const tokens = tokenize(text);

  if (mission === 'tokens') return <div className="cafe-preview">
    <div className="preview-heading"><Icon name="flask" size={19}/><h3>Try a different order</h3><span>LIVE PREVIEW</span></div>
    <label htmlFor="cafe-token-input">Text to tokenize</label>
    <input id="cafe-token-input" className="text-input" value={text} maxLength={200} onChange={e => setText(e.target.value)}/>
    <div className="cafe-token-stream">{tokens.length ? tokens.map((token, i) => <span key={i}><small>{i + 1}</small>{token}</span>) : <p>No a–z tokens yet. Try “tea”.</p>}</div>
    <div className="cafe-preview-result"><strong>{tokens.length}</strong> token instances <span>·</span><strong>{new Set(tokens).size}</strong> distinct types</div>
    <p className="micro-copy">This preview uses the same lowercase a–z rule as the Python. Punctuation and numbers are excluded; accented words and contractions may split.</p>
  </div>;

  if (mission === 'evaluate') {
    const normalized = tokenize(test).join(' ');
    const result = scoreSentence(model, normalized, 2, k === 0 ? 'mle' : 'addk', k);
    const unknown = [...new Set(tokenize(test).filter(word => !model.vocab.includes(word)))];
    const inTraining = cafe.training.includes(normalized);
    return <div className="cafe-preview">
      <div className="preview-heading"><Icon name="flask" size={19}/><h3>The taste-test bench</h3><span>LIVE PREVIEW</span></div>
      <div className="control-row"><div className="control-field"><label htmlFor="cafe-test-input">Order to evaluate</label><input id="cafe-test-input" className="text-input" value={test} maxLength={160} onChange={e => setTest(e.target.value)}/></div><div className="control-field"><label htmlFor="cafe-eval-k">Smoothing k = {k.toFixed(1)}</label><input id="cafe-eval-k" type="range" min="0" max="1" step="0.1" value={k} onChange={e => setK(Number(e.target.value))}/></div></div>
      <div className="cafe-score"><Stat label="Predictions, including end" value={result.steps.length}/><Stat label="Perplexity" value={format(result.perplexity, 3)} tone="mint"/></div>
      <div className="cafe-prediction-trace">{result.steps.map((step, i) => {
        const undefinedEstimate = k === 0 && step.denominator === 0 && model.vocab.includes(step.token);
        return <div key={i} className={step.value === 0 ? 'unseen' : ''}><span>{step.history.join(' ')} → {step.token}</span><strong>{format(undefinedEstimate ? null : step.value, 4)}</strong><small>{undefinedEstimate ? 'history has no counts' : step.value === 0 ? 'zero probability' : 'conditional probability'}</small></div>;
      })}</div>
      {unknown.length > 0 && <p className="callout">Outside the vocabulary: <strong>{unknown.join(', ')}</strong>. Add-k cannot create a new output token.</p>}
      {inTraining && <p className="callout">This exact order appears in training. Its score illustrates the calculation, but it is not a held-out evaluation.</p>}
      <p className="micro-copy">The model still trains on the original six orders. Editing this field changes only the test text. Compare k values with the same test text and tokenization.</p>
    </div>;
  }

  const smoothing = mission === 'smooth';
  const selectedHistory = smoothing ? 'we' : history;
  const items: [string, number][] = model.vocab.map(word => {
    const result = conditional(model, [selectedHistory], word, 2, smoothing ? 'addk' : 'mle', smoothing ? k : 0);
    return [word, mission === 'counts' ? result.count : result.value ?? 0];
  });
  const countTotal = conditional(model, [selectedHistory], 'tea', 2).denominator;
  return <div className="cafe-preview">
    <div className="preview-heading"><Icon name="flask" size={19}/><h3>{smoothing ? 'Make room for “would”' : mission === 'counts' ? 'Follow the evidence' : 'Your autocomplete, under the hood'}</h3><span>LIVE PREVIEW</span></div>
    <div className="cafe-distribution-layout"><div>
      {smoothing ? <><label htmlFor="cafe-smoothing-k">Pseudocount k = {k.toFixed(1)}</label><input id="cafe-smoothing-k" type="range" min="0" max="1" step="0.1" value={k} onChange={e => setK(Number(e.target.value))}/><div className="cafe-feature-number"><span>P(would | we)</span><strong>{format(conditional(model, ['we'], 'would', 2, 'addk', k).value, 3)}</strong></div><p>Only <strong>we → like</strong> was observed. A larger k allocates more probability to the other eight possible outputs.</p></> : <><label htmlFor="cafe-history">Look at what follows</label><select id="cafe-history" className="select-input" value={history} onChange={e => setHistory(e.target.value)}>{['like', 'would', '<s>', 'we', 'tea'].map(word => <option key={word} value={word}>{word === '<s>' ? '<s> (start of order)' : word}</option>)}</select><div className="cafe-feature-number"><span>Observed continuations</span><strong>{countTotal}</strong></div><p>{mission === 'counts' ? 'The bars are raw counts. Each training occurrence contributes one.' : 'Each bar is a count divided by the history’s total. Zero means that continuation was not seen.'}</p></>}
    </div><div><ProbabilityBars items={items} max={mission === 'counts' ? Math.max(1, countTotal) : 1} selected={smoothing ? 'would' : 'tea'}/><p className="micro-copy">{mission === 'counts' ? 'Raw counts; bar scale = total continuations.' : `Probability total = ${items.reduce((total, [, p]) => total + p, 0).toFixed(3)}.`} The nine outputs include &lt;/s&gt;, never &lt;s&gt;.</p></div></div>
  </div>;
}

function MissionContent({step, number, completed, onComplete, onNext}: {step: Mission; number: number; completed: boolean; onComplete: () => void; onNext: () => void}) {
  const [version, setVersion] = useState<'starter' | 'solution'>('starter');
  const [hints, setHints] = useState(0);
  const [answer, setAnswer] = useState<number | null>(completed ? step.correct : null);
  const [verdict, setVerdict] = useState<boolean | null>(completed ? true : null);

  function checkAnswer() {
    if (answer === null) return;
    const correct = answer === step.correct;
    setVerdict(correct);
    if (correct) onComplete();
  }

  return <section className="cafe-mission" aria-labelledby="cafe-mission-title">
    <header className="cafe-mission-header"><div><span className="eyebrow">MISSION {String(number).padStart(2, '0')} / 05 · {step.concept}</span><h2 id="cafe-mission-title" tabIndex={-1}>{step.title}</h2><p>{step.subtitle}</p></div><span className="mission-time"><Icon name="clock" size={15}/>{step.minutes} min</span></header>
    <div className="cafe-workspace">
      <div className="cafe-brief"><p>{step.story}</p><h3>Your mission</h3><ol>{step.instructions.map(text => <li key={text}>{text}</li>)}</ol>
        <div className="mission-hints"><button className="text-button" disabled={hints === step.hints.length} onClick={() => setHints(count => count + 1)}><Icon name="spark" size={15}/>{hints ? hints === step.hints.length ? 'Both hints revealed' : 'One more hint' : 'A little nudge?'}</button>{step.hints.slice(0, hints).map((hint, i) => <p key={hint}><strong>Hint {i + 1}.</strong> {hint}</p>)}</div>
        <a className="mission-lesson-link" href={`#${step.lesson}`}><Icon name="book" size={16}/>Revisit the visual lesson <span>↗</span></a>
      </div>
      <div className="cafe-code-workspace">
        <div className="mission-code-toolbar"><Segmented label="Exercise code version" options={[["starter", 'Your turn'], ["solution", 'Worked version']]} value={version} onChange={setVersion}/><span>{version === 'starter' ? 'Replace the TODO lines.' : 'Compare after you try.'}</span></div>
        <CodeCell code={step[version]} title={`Cell ${number} · ${step.title}`}/>
        <div className="expected-output"><div><span className="output-dot"/>EXPECTED OUTPUT · WORKED CODE</div><pre tabIndex={0}>{step.output}</pre><p>The assertions below the code check your result. An AssertionError means a check needs another look.</p></div>
      </div>
    </div>
    <CafePreview mission={step.id}/>
    <div className="mission-checkpoint"><div><span className="eyebrow">BEFORE YOU MOVE ON</span><h3>{step.predict}</h3><p>Make a prediction. Then use the code or preview to check it.</p></div><div className="checkpoint-interaction"><div className="checkpoint-options" role="group" aria-label="Mission checkpoint answers">{step.options.map((option, i) => <button key={option} aria-pressed={answer === i} className={answer === i ? 'selected' : ''} onClick={() => {setAnswer(i); setVerdict(null);}}><span>{String.fromCharCode(65 + i)}</span>{option}</button>)}</div><button className="button button-primary" disabled={answer === null} onClick={checkAnswer}>Check my prediction <Icon name="check" size={16}/></button>{verdict !== null && <div className={`answer-feedback ${verdict ? 'correct' : 'retry'}`} role="status"><strong>{verdict ? 'Order up. You’ve got it!' : 'Give that another taste.'}</strong><p>{step.feedback}</p></div>}</div></div>
    <div className="cafe-remix"><Icon name="spark" size={22}/><div><h3>Make it yours</h3><p>{step.remix}</p></div></div>
    <div className="mission-takeaway"><span>TAKE THIS WITH YOU</span><p>{step.takeaway}</p></div>
    {number < cafe.steps.length && <div className="mission-next"><span>Explore freely here. Run Python cells in order.</span><button className="button button-primary" onClick={onNext}>Next mission <Icon name="arrow" size={17}/></button></div>}
  </section>;
}

export default function ExercisesPage() {
  const [progress, setProgress] = useState(readProgress);
  const [saved, setSaved] = useState(true);
  const [environment, setEnvironment] = useState<'colab' | 'jupyter'>('colab');
  const previousStage = useRef(progress.stage);
  const step = cafe.steps[progress.stage];
  useEffect(() => {
    try {localStorage.setItem(storageKey, JSON.stringify(progress)); setSaved(true);}
    catch {setSaved(false);}
  }, [progress]);
  useEffect(() => {
    if (previousStage.current === progress.stage) return;
    previousStage.current = progress.stage;
    const heading = document.getElementById('cafe-mission-title');
    heading?.focus({preventScroll: true});
    heading?.scrollIntoView?.({block: 'start'});
  }, [progress.stage]);

  function chooseStage(stage: number) {
    setProgress(previous => ({...previous, stage}));
  }

  return <div className="exercise-page">
    <header className="exercise-hero"><div><span className="eyebrow"><Icon name="code" size={16}/> THE BUILD-IT-YOURSELF SERIES · 01</span><h1>A tiny café.<br/><em>A model you built.</em></h1><p>You’re opening Moonlight Café. Its order autocomplete needs a brain. Build one in five small Python missions, from messy text to predictions you can explain.</p><div className="exercise-tags"><span><Icon name="clock" size={14}/>About 30 minutes</span><span>Python basics</span><span>No extra packages</span></div></div>
      <div className="cafe-receipt" aria-label="Moonlight Cafe training receipt"><div className="receipt-top"><Icon name="coffee" size={30}/><span>MOONLIGHT<br/><strong>CAFÉ</strong></span><small>EST. TODAY</small></div><div className="receipt-rule"/><span className="receipt-label">TODAY’S TRAINING ORDERS</span>{[['tea',3],['coffee',2],['cake',1]].map(([name,count]) => <div className="receipt-order" key={name}><span>{name}</span><span>× {count}</span></div>)}<div className="receipt-rule"/><div className="receipt-order total"><span>Orders to learn from</span><strong>{cafe.training.length}</strong></div><p>Customer: “we would like…”<br/><strong>Your model: that’s your job.</strong></p><div className="receipt-barcode" aria-hidden="true"/><small>SMALL DATA. BIG AHA.</small></div>
    </header>
    <section className="exercise-setup" aria-labelledby="exercise-setup-title"><div className="exercise-section-heading"><div><span className="eyebrow">BEFORE THE FIRST ORDER</span><h2 id="exercise-setup-title">Set up your kitchen.</h2></div><Segmented label="Notebook environment" options={[["colab",'Google Colab'],["jupyter",'Jupyter']]} value={environment} onChange={setEnvironment}/></div>
      <div className="notebook-instructions">{environment === 'colab' ? <><p><strong>1.</strong> <a href="https://colab.research.google.com/" target="_blank" rel="noreferrer">Open Google Colab <Icon name="external" size={13}/></a> and create a new notebook. The standard Python runtime is enough; no GPU is needed.</p><p><strong>2.</strong> Copy Cell 0 below into a code cell. Press <kbd>Shift</kbd> + <kbd>Enter</kbd> to run it.</p><p><strong>3.</strong> Add a new code cell for each mission. Replace its TODOs, then run the cells in order.</p></> : <><p><strong>1.</strong> In your installed Jupyter Notebook or JupyterLab, create a notebook with a Python 3 kernel.</p><p><strong>2.</strong> Paste Cell 0 into a code cell and run it with <kbd>Shift</kbd> + <kbd>Enter</kbd>.</p><p><strong>3.</strong> Add each mission as another cell. If you restart the kernel, rerun earlier cells to restore the data and functions.</p></>}</div>
      <p className="notebook-note">Run the Python in your notebook. The page below provides hints, worked code, and live previews to help you check your intuition. Unfinished TODO cells will stop until you complete them.</p>
      <details className="setup-code" open><summary><Icon name="code" size={17}/>Cell 0 · Your six training orders<span>RUN THIS FIRST</span></summary><CodeCell code={cafe.setup} title="Cell 0 · Cafe setup"/><div className="setup-result">Expected: <code>{cafe.setupOutput}</code></div></details>
    </section>
    <div className="mission-progress"><div><span className="eyebrow">YOUR APPRENTICESHIP</span><strong>{progress.completed.length} / {cafe.steps.length} checkpoints solved</strong></div><div className="progress-track" role="progressbar" aria-label="Exercise checkpoints solved" aria-valuemin={0} aria-valuemax={cafe.steps.length} aria-valuenow={progress.completed.length}><i style={{width:`${progress.completed.length / cafe.steps.length * 100}%`}}/></div><small>{saved ? 'Saved in this browser' : 'Progress lasts this visit'}</small></div>
    <nav className="mission-nav" aria-label="Exercise missions">{cafe.steps.map((item, i) => <button key={item.id} aria-current={progress.stage === i ? 'step' : undefined} className={`${progress.stage === i ? 'active' : ''} ${progress.completed.includes(item.id) ? 'complete' : ''}`} onClick={() => chooseStage(i)}><span>{progress.completed.includes(item.id) ? <Icon name="check" size={17}/> : String(i + 1).padStart(2,'0')}</span><strong>{item.concept}</strong></button>)}</nav>
    <MissionContent key={step.id} step={step} number={progress.stage + 1} completed={progress.completed.includes(step.id)} onComplete={() => setProgress(previous => ({...previous, completed: [...new Set([...previous.completed, step.id])]}))} onNext={() => chooseStage(Math.min(cafe.steps.length - 1, progress.stage + 1))}/>
    {progress.completed.length === cafe.steps.length && <section className="cafe-finished" role="status"><Icon name="coffee" size={34}/><div><span className="eyebrow">ORDER UP!</span><h2>All five checkpoints solved.</h2><p>Compare your notebook’s results with the expected outputs. Then give your cafe one more order to learn from.</p></div></section>}
    <details className="exercise-extension"><summary><Icon name="spark" size={19}/><span>Bonus round: one new order, a new prediction</span><small>5 MIN EXTRA</small></summary><div><p>Add <strong>“we would like coffee”</strong> to the training data, then score the original test order again. It is still held out. Why is its unsmoothed perplexity now finite?</p><CodeCell code={cafe.bonus} title="Bonus · A new training order"/><div className="expected-output"><div>EXPECTED OUTPUT · WORKED CODE</div><pre tabIndex={0}>{cafe.bonusOutput}</pre></div><p className="micro-copy">You supplied the missing we → would pair through a different sentence. The model combines known local patterns. That is different from memorizing the test order.</p></div></details>
    <details className="exercise-extension completed-project"><summary><Icon name="code" size={19}/><span>Compare with the completed project</span><small>ALL SIX CELLS</small></summary><div><p>After you’ve tried the missions, copy the working project into a fresh Python notebook and run it from top to bottom.</p><CodeCell title="Completed cafe project" code={[cafe.setup,...cafe.steps.map(item => item.solution)].join('\n')}/></div></details>
    <div className="exercise-troubleshooting"><h3>If the kitchen gets a little smoky…</h3><dl><div><dt>NameError?</dt><dd>Run Cell 0 and all earlier mission cells. After editing a function, rerun the cell that defines it.</dd></div><div><dt>NotImplementedError or TypeError?</dt><dd>Replace the TODO placeholders. In Mission 4, both None values need a formula.</dd></div><div><dt>AssertionError?</dt><dd>Compare your output with the worked version. Keep the six training orders unchanged until the bonus round.</dd></div><div><dt>Different output after the bonus?</dt><dd>The bonus restores the original counts at the end. Rerun Cell 0 and the mission cells if you stopped it early.</dd></div></dl></div>
    <details className="source-details"><summary><Icon name="link" size={15}/>Sources & exercise conventions</summary><p>Original practice based on [1b] Words and Tokens, [3a] ngram language modelling, [3b] Evaluating Language Models, and [3c] smoothing in .docs. These are new examples, not completed course assignments.</p><p>The corpus is invented, sentence boundaries are explicit, and perplexity includes the end token. The tokenizer keeps lowercase a–z sequences. This tiny count model teaches mechanics; it is not a pretrained language model. Exploring k on one sentence is a demonstration, not a reliable model-selection protocol.</p><ul><li><a href="https://web.stanford.edu/~jurafsky/slp3/3.pdf" target="_blank" rel="noreferrer">Jurafsky & Martin · N-gram Language Models ↗</a></li><li><a href="https://research.google.com/colaboratory/faq.html" target="_blank" rel="noreferrer">Google Colab · official FAQ ↗</a></li><li><a href="https://docs.jupyter.org/en/latest/running.html" target="_blank" rel="noreferrer">Jupyter · running notebooks ↗</a></li></ul></details>
  </div>;
}
