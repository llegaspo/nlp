import {useState} from 'react';
import {Panel, ProbabilityBars, Segmented, Formula, format} from '../components/LabUI';
import {GENERATION_VOCAB as vocab, GENERATION_LOGITS, decodingDistribution, sampleIndex} from '../lib/transformer.js';

const stages = [
  {title:'Pretraining', input:'Large collections of text', target:'Predict training tokens', result:'General language patterns in model weights', note:'A next-token objective supplies a training signal from text itself. Predictive success does not guarantee factual correctness.'},
  {title:'Instruction tuning', input:'Instruction + example response', target:'Imitate useful demonstrations', result:'Weights adapted to instruction-following behavior', note:'Supervised fine-tuning uses desired responses. It updates parameters, unlike putting examples into a prompt.'},
  {title:'Preference training', input:'Comparisons between candidate responses', target:'Favor preferred responses', result:'Weights adapted using preference signals', note:'The InstructGPT paper trains a reward model and uses reinforcement learning. Preference data is not an oracle for truth, and other methods also exist.'},
  {title:'Retrieval at inference', input:'A question + external document collection', target:'Retrieve relevant passages for the prompt', result:'Additional context for generation', note:'This separate extension supplies evidence without requiring a weight update at inference. Retrieved text can still be irrelevant or misused.'},
];

export default function LLMLab() {
  const [sequence,setSequence]=useState(['the']);
  const [temperature,setTemperature]=useState(1);
  const [topK,setTopK]=useState(10);
  const [mode,setMode]=useState<'sample'|'greedy'>('sample');
  const [stage,setStage]=useState(0);
  const [history,setHistory]=useState<{token:string;p:number;mode:string}[]>([]);
  const [prompt,setPrompt]=useState('the');
  const last=sequence[sequence.length-1];
  const ended=last==='</s>';
  const logits=GENERATION_LOGITS[last] || GENERATION_LOGITS['.'];
  const probabilities=decodingDistribution(logits,temperature,topK);
  const reset=(value=prompt)=>{setSequence(value.split(' '));setHistory([]);};
  function generate() {
    const index=mode==='greedy'?probabilities.indexOf(Math.max(...probabilities)):sampleIndex(probabilities);
    setSequence(prev=>[...prev,vocab[index]]);
    setHistory(prev=>[...prev,{token:vocab[index],p:probabilities[index],mode}]);
  }
  return <div className="lab-stack"><div className="callout"><strong>A transparent decoding sandbox</strong><br/>The scores below are hand-authored and depend only on the last token. This is not a running LLM. It isolates the sampling mechanics so you can see every number.</div><div className="lab-grid"><div className="lab-stack"><Panel title="Build a sequence, one token at a time" detail={`${history.length} GENERATED`}><div className="control-field"><label htmlFor="generation-prompt">Starting context</label><select id="generation-prompt" className="select-input" value={prompt} onChange={e=>{setPrompt(e.target.value);reset(e.target.value);}}><option>the</option><option>the cat</option><option>the dog slept</option></select></div><div className="generated-sequence" aria-live="polite">{sequence.map((token,i)=><span key={i} className={i<prompt.split(' ').length?'prompt-token':''}>{token==='</s>'?'END':token}</span>)}</div><div className="button-line"><button className="button button-primary" disabled={ended||history.length>=24} onClick={generate}>{ended?'Sequence complete':'Generate next token'} {!ended&&'→'}</button><button className="button" onClick={()=>reset()}>Reset</button><button className="button button-quiet" disabled={!history.length} onClick={()=>{setSequence(prev=>prev.slice(0,-1));setHistory(prev=>prev.slice(0,-1));}}>Undo</button></div>{history.length>=24&&!ended&&<p className="micro-copy">Reached the 24-token demo limit. Reset to start again.</p>}<div className="divider"/><Segmented label="Decoding method" options={[["sample",'Sample'],["greedy",'Greedy (highest score)']]} value={mode} onChange={setMode}/><div className="control-field" style={{marginTop:18}}><label htmlFor="decode-temperature">Temperature <strong>{temperature.toFixed(1)}</strong></label><input id="decode-temperature" type="range" min="0.1" max="2" step="0.1" value={temperature} onChange={e=>setTemperature(Number(e.target.value))}/></div><div className="control-field"><label htmlFor="decode-topk">Top-k <strong>{topK===10?'all 10 tokens':topK}</strong></label><input id="decode-topk" type="range" min="1" max="10" step="1" value={topK} onChange={e=>setTopK(Number(e.target.value))}/></div><p className="micro-copy">{mode==='greedy'?'Greedy always selects a highest-scoring token; temperature does not change the ordering.':'Sampling draws from the displayed distribution, so results can differ between runs.'} Top-k zeros excluded candidates and renormalizes the rest.</p></Panel>
      {history.length>0&&<Panel title="Generation trace"><div className="generation-history">{history.map((entry,i)=><div key={i}><small>{i+1}</small><strong>{entry.token}</strong><span>{entry.mode==='sample'?'sampled':'argmax'} · P = {format(entry.p,3)}</span></div>)}</div></Panel>}
    </div><Panel title={ended?'End token reached':`Next-token distribution after “${last}”`}>{ended?<div className="completion-inline"><span>✓</span><h3>The sequence has ended.</h3><p>The end token is a possible output, too. Reset or undo to explore another continuation.</p></div>:<><ProbabilityBars items={vocab.map((token,i):[string,number]=>[token,probabilities[i]]).sort((a,b)=>b[1]-a[1])}/><Formula concept="llms" caption="These are vocabulary probabilities, unlike the attention weights over input positions.">P(next) = softmax(logits / T)</Formula><details className="source-details"><summary>Inspect the raw logits</summary><div className="math-lines">{vocab.map((token,i)=><div className="math-line" key={token}><span>{token}</span><strong>{logits[i]}</strong></div>)}</div></details></>}</Panel></div>
    <Panel title="Training and using a language model"><div className="stage-tabs">{stages.map((item,i)=><button key={item.title} aria-pressed={stage===i} className={stage===i?'selected':''} onClick={()=>setStage(i)}><span>0{i+1}</span>{item.title}</button>)}</div><div className="training-flow"><div className="flow-stage"><span>Input</span><strong>{stages[stage].input}</strong></div><span className="flow-connector">→</span><div className="flow-stage"><span>Process</span><strong>{stages[stage].target}</strong></div><span className="flow-connector">→</span><div className="flow-stage"><span>Result</span><strong>{stages[stage].result}</strong></div></div><p className="micro-copy">{stages[stage].note}</p></Panel>
  </div>;
}
