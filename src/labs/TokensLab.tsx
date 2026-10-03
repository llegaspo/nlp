import { useMemo, useState } from 'react';
import { bpe, words } from '../lib/math.js';
import { Challenge, Empty, Formula, Panel, Stat } from '../components/LabUI';

const defaultText = 'They grabbed the sandwich that I’m holding, then they ran back to the house.';

export default function TokensLab() {
  const [text, setText] = useState(defaultText);
  const [lower, setLower] = useState(true);
  const [punctuation, setPunctuation] = useState(true);
  const [normalize, setNormalize] = useState(false);
  const [merges, setMerges] = useState(4);
  const [step, setStep] = useState(0);
  const tokens: string[] = useMemo(() => words(text, {lower, punctuation, normalize}), [text, lower, punctuation, normalize]);
  const counts = useMemo(() => new Map<string, number>(tokens.map(token => [token, tokens.filter(other => other === token).length])), [tokens]);
  const training = useMemo(() => bpe(text, merges, {lower, normalize}), [text, merges, lower, normalize]);
  const stage: string[][] = step === 0 ? training.sequence.map((word: string) => [...word]) : training.history[Math.min(step, training.history.length) - 1]?.units || training.units;
  const merge = training.history[step - 1];
  const vocabulary = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return <div className="lab-grid">
    <div className="lab-stack">
      <Panel title="Start with text" detail="Change the rules, then compare"><div className="control-field"><label htmlFor="token-input">Sentence</label><textarea className="text-area" id="token-input" value={text} onChange={event => {setText(event.target.value); setStep(0);}} rows={3} /></div><div className="checkbox-line"><label><input type="checkbox" checked={lower} onChange={event => {setLower(event.target.checked); setStep(0);}} />Case fold</label><label><input type="checkbox" checked={punctuation} onChange={event => setPunctuation(event.target.checked)} />Keep punctuation</label><label><input type="checkbox" checked={normalize} onChange={event => {setNormalize(event.target.checked); setStep(0);}} />Unicode NFKC</label></div></Panel>
      <Panel title="Token stream" detail={<span className="panel-kicker">LIVE RESULT</span>}><div className="stat-row"><Stat value={tokens.length} label="Instances" /><Stat value={counts.size} label="Types" /><Stat value={tokens.length ? (counts.size / tokens.length).toFixed(2) : '—'} label="Type / token" tone="mint" /></div><div className="token-list">{tokens.length ? tokens.map((token, index) => <span className={`token-chip ${counts.get(token)! > 1 ? 'repeated' : ''}`} title={`${counts.get(token)} occurrence(s)`} key={`${index}-${token}`}>{token}</span>) : <Empty>Enter text to create tokens.</Empty>}</div><p className="micro-copy">Repeated types are highlighted. A word boundary depends on the tokenization rule chosen.</p></Panel>
      <Panel title="Build subwords with BPE" detail={<span className="panel-kicker">STEP {step} / {training.history.length}</span>}><div className="control-row"><div className="control-field"><label htmlFor="merge-budget">Merge budget: {merges}</label><input id="merge-budget" type="range" min="0" max="12" value={merges} onChange={event => {setMerges(Number(event.target.value)); setStep(0);}} /></div><div className="button-line"><button className="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Previous</button><button className="button button-primary" disabled={step >= training.history.length} onClick={() => setStep(step + 1)}>Next merge</button></div></div><div className="divider" />{merge ? <Formula caption={`${merge.count} adjacent occurrences before this merge.`}>{merge.left} + {merge.right} → <strong>{merge.left + merge.right}</strong></Formula> : <Formula caption="Count each adjacent character pair; merge the most frequent pair first.">characters → frequent pairs → reusable pieces</Formula>}<div className="token-list" style={{marginTop: 13}}>{stage.map((parts, index) => <span className="token-chip alt" key={index}>{parts.join(' · ')}</span>)}</div><p className="micro-copy">This small word-internal BPE demo learns from the entered text. It omits production tokenizer refinements.</p></Panel>
    </div>
    <div className="lab-stack"><Panel title="Vocabulary counts"><div className="math-lines">{vocabulary.slice(0, 18).map(([token, count]) => <div className="math-line" key={token}><span>{token}</span><strong>{count}</strong></div>)}{!vocabulary.length && <Empty>No vocabulary yet.</Empty>}</div></Panel><Challenge question="If “The” and “the” both occur, what does case folding change?" answer="It can merge two types into one while leaving the number of token instances unchanged." /><div className="callout"><strong>From the lesson</strong><br />Token instances count occurrences. Types count distinct forms. Subwords let a model reuse smaller pieces inside unfamiliar words.</div></div>
  </div>;
}
