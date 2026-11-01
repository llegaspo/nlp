import {useId, useState, type ReactNode} from 'react';
import {equationStories, type EquationConcept} from '../data/equations';
import {equationExample} from '../lib/equationExamples';
import Icon from './Icons';

function TinyExample({concept}: {concept: EquationConcept}) {
  const [alternate, setAlternate] = useState(false);
  const example = equationExample(concept, alternate);
  const unique = useId().replace(/:/g, '');
  return <div className="equation-playground">
    <p className="equation-example-note">A separate mini example. Change one thing and watch what happens.</p>
    <div className="equation-example-choices" role="group" aria-label="Mini example scenario">{example.choices.map((choice, i) => <button type="button" key={choice} aria-pressed={alternate === Boolean(i)} onClick={() => setAlternate(Boolean(i))}>{choice}</button>)}</div>
    {example.tokens && <div className="equation-token-tray" aria-label="Example pieces">{example.tokens.map((token, i) => <span key={i}><small>{i + 1}</small>{token}</span>)}</div>}
    {example.vectors && <svg className="equation-vectors" viewBox="0 0 290 130" role="img" aria-label={`First vector [${example.vectors[0]}], second vector [${example.vectors[1]}]. ${example.result}`}>
      <defs>{['first', 'second'].map((name, i) => <marker key={name} id={`${unique}-${name}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={i ? 'var(--violet-text)' : 'var(--accent)'}/></marker>)}</defs>
      <path d="M25 10V110H270" fill="none" stroke="var(--border-strong)"/>
      {[...example.vectors].reverse().map((v, i) => <path key={i} d={`M25 110L${25 + v[0] * 48} ${110 - v[1] * 35}`} stroke={i ? 'var(--accent)' : 'var(--violet-text)'} strokeWidth={i ? 4 : 2} strokeDasharray={i ? undefined : '5 4'} markerEnd={`url(#${unique}-${i ? 'first' : 'second'})`} fill="none"/>)}
      <text x="35" y="20">solid: first</text><text x="145" y="20">dashed: second</text>
    </svg>}
    {example.branches && <div className="equation-branches" aria-label="Compare the edit routes">{example.branches.map(([label, value]) => <div key={label} className={value === example.value ? 'cheapest' : ''}><span>{label}</span><strong>{value}</strong><small>{value === example.value ? 'lowest cost' : 'higher cost'}</small><span aria-hidden="true">↓</span></div>)}</div>}
    <div className="equation-example-parts">{example.parts.map(([label, value], i) => <div key={label}><span className="equation-part-index" aria-hidden="true">{i + 1}</span><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>
    {example.bars && <div className="equation-share-bars" aria-label="Shares of one whole">{example.bars.map(([label, value]) => <div key={label}><span>{label}</span><div><i style={{width: `${Math.max(0, Math.min(100, value * 100))}%`}}/></div><strong>{Number((value * 100).toFixed(1))}%</strong></div>)}</div>}
    <div className="equation-example-result" role="status"><span>NOW IT MEANS</span><strong>{example.result}</strong><p>{example.why}</p></div>
  </div>;
}

export default function EquationGuide({concept, children, caption, compact = false}: {concept: EquationConcept; children?: ReactNode; caption?: ReactNode; compact?: boolean}) {
  const story = equationStories[concept];
  const [selected, setSelected] = useState(0);
  const id = useId();
  const active = Math.min(selected, story.steps.length - 1);
  return <section className={`equation-guide ${compact ? 'compact' : ''}`} data-equation={concept} aria-labelledby={`${id}-title`}>
    <div className="equation-kicker"><Icon name="spark" size={15}/><span>PICTURE THE IDEA</span></div>
    <h3 id={`${id}-title`}>{story.title}</h3><p className="equation-idea">{story.idea}</p>
    <p className="equation-invitation">Tap a step to unpack it.</p>
    <ol className="equation-flow">{story.steps.map((part, i) => <li key={part.label}><button type="button" aria-pressed={active === i} aria-controls={`${id}-explanation`} onClick={() => setSelected(i)}><span>{String(i + 1).padStart(2, '0')}</span><strong>{part.label}</strong><Icon name="arrow" size={16}/></button></li>)}</ol>
    <div id={`${id}-explanation`} className="equation-explanation" aria-live="polite"><span>STEP {active + 1}</span><p>{story.steps[active].meaning}</p></div>
    <details className="equation-example" open={!compact}><summary><Icon name="flask" size={16}/>Try a tiny example<span>CHANGE ONE THING</span></summary><TinyExample key={concept} concept={concept}/></details>
    <details className="equation-symbols"><summary><Icon name="code" size={16}/>See the symbols<span>THE SAME IDEA, IN SHORTHAND</span></summary><div className="equation-formal">{children || story.formula}</div><dl>{story.symbols.map(([symbol, meaning]) => <div key={symbol}><dt>{symbol}</dt><dd>{meaning}</dd></div>)}</dl>{caption && <p className="equation-notation">{caption}</p>}</details>
  </section>;
}
