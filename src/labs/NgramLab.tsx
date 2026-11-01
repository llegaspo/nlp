import { useMemo, useState } from 'react';
import { EXERCISE_CORPUS, LESSON_CORPUS, conditional, ngramModel, scoreSentence } from '../lib/math.js';
import { Challenge, Formula, Panel, ProbabilityBars, Segmented, Stat, format } from '../components/LabUI';

export default function NgramLab() {
  const [corpus, setCorpus] = useState<'lesson' | 'exercise'>('lesson');
  const [order, setOrder] = useState<1 | 2 | 3>(2);
  const [context, setContext] = useState('the');
  const [next, setNext] = useState('cat');
  const [temperature, setTemperature] = useState(1);
  const [generated, setGenerated] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const sentences = corpus === 'lesson' ? LESSON_CORPUS : EXERCISE_CORPUS;
  const model = useMemo(() => ngramModel(sentences), [sentences]);
  const contexts: string[][] = [...model.totals[order].keys()].map(key => JSON.parse(key));
  const history = contexts.find(item => item.join(' ') === context) || contexts[0] || [];
  const word = model.vocab.includes(next) ? next : model.vocab[0];
  const result = conditional(model, history, word, order);
  const probabilities: [string, number][] = model.vocab.map((item): [string, number] => [item, conditional(model, history, item, order).value || 0]).sort((a, b) => b[1] - a[1]);
  const scored = scoreSentence(model, hasGenerated ? generated : 'the dog chased the cat', order, 'mle');

  function sampleSentence() {
    const past = Array(order - 1).fill('<s>');
    const output: string[] = [];
    for (let position = 0; position < 16; position++) {
      const weights = model.vocab.map((item: string) => {
        const probability = conditional(model, past, item, order).value || 0;
        return probability ? Math.pow(probability, 1 / temperature) : 0;
      });
      const total = weights.reduce((sum: number, value: number) => sum + value, 0);
      if (!total) break;
      let draw = Math.random() * total;
      let index = weights.findIndex((value: number) => (draw -= value) < 0);
      if (index < 0) index = weights.length - 1;
      const token = model.vocab[index];
      if (token === '</s>') break;
      output.push(token);
      past.push(token);
      if (past.length > order - 1) past.shift();
    }
    setGenerated(output.join(' '));
    setHasGenerated(true);
  }

  return <div className="lab-grid"><div className="lab-stack"><Panel title="Choose the evidence"><Segmented label="Training corpus" options={[["lesson", 'Cat & dog corpus'], ["exercise", 'Language corpus']]} value={corpus} onChange={value => {setCorpus(value); setContext(''); setGenerated(''); setHasGenerated(false);}} /><p className="micro-copy">{sentences.length} training sentences. The language corpus comes from Exercise 3 for exploration; the exercise solutions are not supplied.</p><details className="source-details corpus-details"><summary>Inspect the training sentences</summary><ol>{sentences.map(sentence => <li key={sentence}>{sentence}</li>)}</ol></details><div className="divider" /><div className="control-field"><label>N-gram order</label><Segmented label="N-gram order" options={[[1, 'Unigram'], [2, 'Bigram'], [3, 'Trigram']]} value={order} onChange={value => {setOrder(value); setContext(''); setGenerated(''); setHasGenerated(false);}} /></div><div className="control-row"><div className="control-field"><label htmlFor="ngram-history">History</label><select className="select-input" id="ngram-history" value={history.join(' ')} onChange={event => setContext(event.target.value)}>{contexts.map((item, index) => <option key={index} value={item.join(' ')}>{item.join(' ') || '(none)'}</option>)}</select></div><div className="control-field"><label htmlFor="ngram-next">Next token</label><select className="select-input" id="ngram-next" value={word} onChange={event => setNext(event.target.value)}>{model.vocab.map((item: string) => <option key={item}>{item}</option>)}</select></div></div></Panel>
      <Panel title="Next-token distribution" detail={<span className="panel-kicker">COUNT-BASED MLE</span>}><ProbabilityBars items={probabilities} selected={word} /><p className="micro-copy">Unseen continuations have probability zero under maximum likelihood.</p></Panel>
      <Panel title="Sample a sentence"><div className="control-row"><div className="button-line"><button className="button button-primary" onClick={sampleSentence}>Generate sentence</button></div><div className="control-field"><label htmlFor="temperature">Temperature: {format(temperature, 2)}</label><input id="temperature" type="range" min="0.3" max="2" step="0.1" value={temperature} onChange={event => setTemperature(Number(event.target.value))} /></div></div><div className="formula-block" style={{marginTop: 13}}><div className="formula-text">{hasGenerated ? generated || '(end token selected immediately)' : 'Generate a sentence to see a sample.'}</div></div><p className="micro-copy">Temperature changes sampling sharpness. It leaves the learned counts alone.</p></Panel></div>
    <div className="lab-stack"><Panel title="Inspect one conditional"><div className="stat-row"><Stat value={result.count} label="N-gram count" /><Stat value={result.denominator} label="History count" /><Stat value={format(result.value, 3)} label="Next-token chance" tone="mint" /></div><Formula concept="ngrams">P({word} | {history.join(' ') || '∅'}) = {result.count} / {result.denominator} = {format(result.value, 3)}</Formula><p className="micro-copy">The full chain rule uses every preceding token. This {order}-gram approximation uses only the previous {order - 1}.</p><div className="divider" /><div className="subheading">Chance of the whole sequence</div><Formula concept="sequence"/><div className="sequence-line">{scored.steps.map((step: {token: string; value: number}, index: number) => <span className={`sequence-token ${step.value ? '' : 'zero'}`} key={index}>{step.token}<small>P = {format(step.value, 3)}</small></span>)}</div><p className="micro-copy">P(“{hasGenerated ? generated : 'the dog chased the cat'}”) = {Number.isFinite(scored.logProbability) ? format(Math.exp(scored.logProbability), 6) : '0'}.</p></Panel><Challenge question="What changes when you move from bigrams to trigrams?" answer="The model uses a longer history. That can help when the combination was observed, but exact three-word combinations are sparser." /><div className="callout"><strong>Sentence boundaries</strong><br />Each sentence starts with &lt;s&gt; history and predicts &lt;/s&gt; as its final token. The start marker is never a possible next token.</div></div>
  </div>;
}
