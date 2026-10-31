import { useMemo, useState } from 'react';
import { cooccurrence, cosine } from '../lib/math.js';
import { Challenge, Empty, Formula, Panel, Stat, format } from '../components/LabUI';

const defaultCorpus = 'the cat sat on the mat\nthe dog sat on the mat\nthe cat ate the fish\nthe dog chased the cat';

export default function ContextVectorsLab() {
  const [text, setText] = useState(defaultCorpus);
  const [radius, setRadius] = useState(1);
  const [first, setFirst] = useState('cat');
  const [second, setSecond] = useState('dog');
  const model = useMemo(() => cooccurrence(text.split('\n'), radius), [text, radius]);
  const vocabulary: string[] = model.vocab;
  const wordA = vocabulary.includes(first) ? first : vocabulary[0];
  const wordB = vocabulary.includes(second) ? second : vocabulary[1] || vocabulary[0];
  const vectorA = vocabulary.map(word => model.counts[wordA]?.[word] || 0);
  const vectorB = vocabulary.map(word => model.counts[wordB]?.[word] || 0);
  const similarity = cosine(vectorA, vectorB);
  const largest = Math.max(1, ...vocabulary.flatMap(word => vocabulary.map(context => model.counts[word][context])));

  return <div className="lab-grid"><div className="lab-stack"><Panel title="Create the context evidence"><div className="control-field"><label htmlFor="context-corpus">Tiny corpus · one sentence per line</label><textarea className="text-area" id="context-corpus" rows={4} value={text} onChange={event => setText(event.target.value)} /></div><div className="control-field"><label htmlFor="context-radius">Context window: {radius} word{radius === 1 ? '' : 's'} on each side</label><input id="context-radius" type="range" min="1" max="4" value={radius} onChange={event => setRadius(Number(event.target.value))} /></div></Panel><Panel title="Co-occurrence matrix" detail={<span className="panel-kicker">{vocabulary.length} × {vocabulary.length}</span>}>{vocabulary.length ? <div className="matrix-scroll"><table className="matrix" aria-label="Target word by context word co-occurrence matrix"><thead><tr><th>target ↓ / context →</th>{vocabulary.map(word => <th key={word}>{word}</th>)}</tr></thead><tbody>{vocabulary.map(word => <tr key={word}><th>{word}</th>{vocabulary.map(context => <td key={context} title={`${word} near ${context}: ${model.counts[word][context]}`} style={{background: `rgba(var(--heatmap-rgb),${0.1 + 0.68 * model.counts[word][context] / largest})`}}>{model.counts[word][context]}</td>)}</tr>)}</tbody></table></div> : <Empty>Enter at least one sentence.</Empty>}<p className="micro-copy">Every neighbor within the window adds one count to the target–context cell. The same word can appear more than once.</p></Panel></div>
    <div className="lab-stack"><Panel title="Compare two rows"><div className="control-row"><div className="control-field"><label htmlFor="compare-a">First word</label><select className="select-input" id="compare-a" value={wordA || ''} onChange={event => setFirst(event.target.value)}>{vocabulary.map(word => <option key={word}>{word}</option>)}</select></div><div className="control-field"><label htmlFor="compare-b">Second word</label><select className="select-input" id="compare-b" value={wordB || ''} onChange={event => setSecond(event.target.value)}>{vocabulary.map(word => <option key={word}>{word}</option>)}</select></div></div><div className="stat-row" style={{marginTop: 13}}><Stat value={format(similarity.dot, 1)} label="Dot product" /><Stat value={format(similarity.left, 2)} label="‖first‖" /><Stat value={format(similarity.value, 3)} label="Cosine" tone="mint" /></div><p className="subheading">{wordA || '—'} = [{vectorA.join(', ')}]</p><p className="subheading">{wordB || '—'} = [{vectorB.join(', ')}]</p><Formula caption="A zero vector has no direction; its cosine similarity is undefined.">cos(v,w) = (v · w) / (‖v‖ ‖w‖)</Formula></Panel><Challenge question="Can the cosine similarity go down when the window grows?" answer="Yes. The raw counts do not decrease, but the vector directions can change in different ways, so their cosine may rise or fall." /><div className="callout"><strong>From counts to embeddings</strong><br />These rows are count vectors. The next lab learns dense vectors by changing trainable weights to predict words.</div></div>
  </div>;
}
