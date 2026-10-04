import {useMemo, useState} from 'react';
import {Challenge, Empty, Formula, Panel, Stat} from '../../components/LabUI';
import {LESSON_SENTENCE, countTypes, lessonTokens} from '../../lib/tokenization.js';
import type {LessonTokenOptions} from '../../lib/tokenization.js';

// These are the green-highlighted spans on slide 10, including “then” and “I’m”.
const functionWords = new Set(['they','the','that','i’m',"i'm",'i','’m',"'m",'then','to','and']);
const contentWords = new Set(['grabbed','sandwich','holding','ran','back','house','started','singing']);
const defaultOptions: LessonTokenOptions = {lower:false,punctuation:false,splitClitic:false,nfkc:false};

export default function TokenStream() {
  const [text,setText] = useState(LESSON_SENTENCE);
  const [options,setOptions] = useState<LessonTokenOptions>(defaultOptions);
  const [prior,setPrior] = useState<{tokens:string[];rule:string}|null>(null);
  const [selected,setSelected] = useState('the');
  const [annotate,setAnnotate] = useState(false);
  const tokens = useMemo(()=>lessonTokens(text,options),[text,options]);
  const counts = useMemo(()=>countTypes(tokens),[tokens]);
  const rows = [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  const focus = counts.has(selected)?selected:tokens[0];
  const rule = `punctuation ${options.punctuation?'separate':'excluded'} · case ${options.lower?'folded':'preserved'} · clitic ${options.splitClitic?'split':'attached'}`;
  const changeRule = (key:keyof LessonTokenOptions,checked:boolean)=>{setPrior({tokens,rule});setOptions({...options,[key]:checked});};
  const reset = ()=>{setText(LESSON_SENTENCE);setOptions(defaultOptions);setPrior(null);setSelected('the');};
  const canAnnotate=text===LESSON_SENTENCE;
  return <div className="lesson1-grid">
    <Panel title="Choose the counting rule" detail="PDF pp. 3–13">
      <div className="lesson1-control-head"><label className="field-label" htmlFor="lesson1-text">Sentence</label><button className="button button-quiet" type="button" onClick={reset}>Reset slide example</button></div>
      <textarea className="text-area" id="lesson1-text" value={text} rows={3} onChange={event=>{setText(event.target.value);setPrior(null);}} />
      <div className="lesson1-rule-grid">
        <label><input type="checkbox" checked={!!options.punctuation} onChange={event=>changeRule('punctuation',event.target.checked)} /> Count punctuation as separate tokens</label>
        <label><input type="checkbox" checked={!!options.lower} onChange={event=>changeRule('lower',event.target.checked)} /> Case fold before counting</label>
        <label><input type="checkbox" checked={!!options.splitClitic} onChange={event=>changeRule('splitClitic',event.target.checked)} /> Split <code>I’m</code> into <code>I</code> + <code>’m</code></label>
        <label><input type="checkbox" checked={!!options.nfkc} onChange={event=>changeRule('nfkc',event.target.checked)} /> Unicode NFKC <span className="lesson1-extra">extra</span></label>
      </div>
      <p className="micro-copy">The clitic rule applies to forms ending in <code>’m</code> or <code>'m</code>. Other punctuation is counted only when selected.</p>
    </Panel>
    <Panel title="Count the stream" detail={<span className="panel-kicker">LIVE RESULT</span>}>
      <div className="stat-row"><Stat value={tokens.length} label="Token instances" /><Stat value={counts.size} label="Distinct types" /><Stat value={tokens.length?(counts.size/tokens.length).toFixed(2):'—'} label="Types / tokens" tone="mint" /></div>
      <Formula caption="An instance is one entry in the stream. A type is one distinct exact string after the selected rules.">N = {tokens.length} entries · |V| = {counts.size} distinct strings</Formula>
      <p className="micro-copy">{rule}{options.nfkc?' · NFKC on':''}</p>
      {prior&&<div className="lesson1-delta"><strong>Rule change</strong><span>{prior.rule}: {prior.tokens.length} instances / {countTypes(prior.tokens).size} types</span><span>Now: {tokens.length} instances / {counts.size} types</span></div>}
    </Panel>
    <Panel title="Every occurrence" detail={`${tokens.length} numbered entries`}>
      {tokens.length?<div className="lesson1-stream">{tokens.map((token,index)=><button type="button" className={`lesson1-occurrence ${focus===token?'active':''} ${counts.get(token)!>1?'repeated':''}`} aria-pressed={focus===token} onClick={()=>setSelected(token)} key={`${index}-${token}`} title={`${token}: ${counts.get(token)} occurrence${counts.get(token)===1?'':'s'}`}><small>{index+1}</small><strong>{token}</strong></button>)}</div>:<Empty>Enter text to create tokens.</Empty>}
      {focus&&<p className="lesson1-inspect"><strong>{focus}</strong> occurs {counts.get(focus)} time{counts.get(focus)===1?'':'s'} at position{counts.get(focus)===1?'':'s'} {tokens.flatMap((token,index)=>token===focus?[index+1]:[]).join(', ')}.</p>}
      <div className="lesson1-control-head"><span className="field-label">Example word classes</span><label className="lesson1-small-check"><input type="checkbox" checked={annotate} onChange={event=>setAnnotate(event.target.checked)} disabled={!canAnnotate} /> Annotate slide sentence</label></div>
      {annotate&&canAnnotate&&<div className="lesson1-annotation">{tokens.map((token,index)=>{const key=token.toLowerCase();const kind=functionWords.has(key)?'function':contentWords.has(key)?'content':/[\p{L}\p{N}]/u.test(key)?'context dependent':'punctuation';return <span key={index}><b>{token}</b><small>{kind}</small></span>;})}</div>}
      <p className="micro-copy">These labels follow the green function-word highlights on slide 10, including “I’m” and “then.” Arbitrary text is not tagged.</p>
    </Panel>
    <Panel title="Complete type inventory" detail={`Σ frequencies = ${[...counts.values()].reduce((a,b)=>a+b,0)}`}>
      {rows.length?<div className="lesson1-table-wrap"><table className="lesson1-table"><thead><tr><th scope="col">Type</th><th scope="col">Frequency</th><th scope="col">Positions</th></tr></thead><tbody>{rows.map(([type,count])=><tr key={type} className={focus===type?'is-selected':''}><th scope="row"><button type="button" onClick={()=>setSelected(type)}>{type}</button></th><td>{count}</td><td>{tokens.flatMap((token,index)=>token===type?[index+1]:[]).join(', ')}</td></tr>)}</tbody></table></div>:<Empty>No types yet.</Empty>}
      <Challenge question="Why does folding case change 16 types to 15 in the slide example?" answer="The two spellings “They” and “they” become one type. Both occurrences remain in the 17-entry stream." />
    </Panel>
  </div>;
}
