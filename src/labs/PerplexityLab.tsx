import { useMemo, useState } from 'react';
import { LESSON_CORPUS, ngramModel, scoreSentence, words } from '../lib/math.js';
import { Challenge, Formula, Panel, Segmented, Stat, format } from '../components/LabUI';

type Estimator = 'mle' | 'laplace' | 'addk';

export default function PerplexityLab() {
  const [testText, setTestText] = useState('the cat chased the fish');
  const [order, setOrder] = useState<1 | 2 | 3>(2);
  const [estimator, setEstimator] = useState<Estimator>('mle');
  const [k, setK] = useState(0.3);
  const model = useMemo(() => ngramModel(LESSON_CORPUS), []);
  const result = scoreSentence(model, testText, order, estimator, k);
  const unknown: string[] = [...new Set<string>(words(testText).filter((word: string) => !model.vocab.includes(word)))];

  return <div className="lab-grid"><div className="lab-stack"><Panel title="Test on held-out text"><div className="control-field"><label htmlFor="held-out">Sentence to score</label><input className="text-input" id="held-out" value={testText} onChange={event => setTestText(event.target.value)} /></div><div className="control-field"><label>Model order</label><Segmented label="Model order" value={order} onChange={setOrder} options={[[1, 'Unigram'], [2, 'Bigram'], [3, 'Trigram']]} /></div><div className="control-field"><label>Estimator</label><Segmented label="Perplexity estimator" value={estimator} onChange={setEstimator} options={[["mle", 'MLE'], ["laplace", 'Add one'], ["addk", 'Add k']]} /></div><div className="control-field"><label htmlFor="eval-k">Add-k amount: {format(k, 2)}</label><input id="eval-k" type="range" min="0.05" max="1" step="0.05" value={k} onChange={event => setK(Number(event.target.value))} /></div><p className="micro-copy">The four cat-and-dog sentences are training data. Your test sentence does not enter their counts.</p><details className="source-details corpus-details"><summary>Inspect the training sentences</summary><ol>{LESSON_CORPUS.map(sentence => <li key={sentence}>{sentence}</li>)}</ol></details>{unknown.length > 0 && <div className="callout" style={{marginTop: 12}}><strong>Outside the vocabulary:</strong> {unknown.join(', ')}. Add-k covers unseen sequences of known words; these tokens need an unknown-word or subword strategy.</div>}</Panel>
      <Panel title="Inspect every prediction" detail={<span className="panel-kicker">{result.steps.length} TERMS</span>}><div className="math-lines">{result.steps.map((step: {history: string[]; token: string; value: number}, index: number) => <div className="math-line" key={index}><span><span style={{color: 'var(--muted)'}}>{step.history.join(' ') || '∅'} → </span>{step.token}</span><strong className={step.value ? '' : 'mint-text'}>{format(step.value, 4)}</strong></div>)}</div><p className="micro-copy">One zero makes the sequence probability zero. Its log probability is −∞ and its perplexity is ∞.</p></Panel></div>
    <div className="lab-stack"><Panel title="Perplexity result"><div className="stat-row"><Stat value={result.steps.length} label="Predictions" /><Stat value={format(result.logProbability, 3)} label="Log P(test)" /><Stat value={format(result.perplexity, 3)} label="Perplexity" tone="mint" /></div><Formula caption="N counts predicted tokens, including the end-of-sentence token. This is the inverse geometric mean of the model's conditional probabilities.">PP(W) = exp(−Σ log P(wᵢ | hᵢ) / N)</Formula><p className="micro-copy">Compare two models only on the same test text and tokenization. The lesson slide rounds intermediate probabilities; this lab computes from exact counts.</p></Panel><Challenge question="What happens if one bigram has MLE probability zero?" answer="The full sentence probability is zero, log probability is negative infinity, and perplexity is infinity." /><div className="callout"><strong>Why hold out text?</strong><br />A model can memorize training sentences. Held-out text tests whether its estimates generalize beyond those examples.</div></div>
  </div>;
}
