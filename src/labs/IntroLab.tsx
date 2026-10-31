import {useState} from 'react';
import {Panel, Segmented} from '../components/LabUI';

const tasks = [
  {name: 'Sentiment', input: 'The visuals made this lesson easy to follow.', output: 'positive', explanation: 'Classification maps a whole input to a label. Here the label is a curated example, not a sentiment prediction from a running model.'},
  {name: 'Entities', input: 'Maya visited Manila on Monday.', output: 'Maya → PERSON · Manila → PLACE · Monday → DATE', explanation: 'Named entity recognition locates and labels spans within a sentence. A single sentence may contain several entities.'},
  {name: 'Translation', input: 'Good morning.', output: 'Magandang umaga.', explanation: 'Translation generates a sequence in another language while trying to preserve meaning. Word-by-word substitutions are often insufficient.'},
  {name: 'Question answering', input: 'Passage: The workshop starts at 9 AM. Question: When does it start?', output: '9 AM', explanation: 'This example extracts an answer supported by the passage. A useful answer must connect to the evidence, not merely sound plausible.'},
];

export default function IntroLab() {
  const [attachment, setAttachment] = useState<'verb' | 'noun'>('verb');
  const [task, setTask] = useState(0);
  return <div className="lab-grid"><div className="lab-stack">
    <Panel title="Same words. Two different scenes." detail="STRUCTURAL AMBIGUITY">
      <p className="large-example">I saw the person <mark>with a telescope.</mark></p>
      <Segmented label="Interpret the telescope phrase" options={[["verb", 'I used the telescope'], ["noun", 'The person had it']]} value={attachment} onChange={setAttachment}/>
      <svg className="ambiguity-diagram" viewBox="0 0 600 230" role="img" aria-label={attachment === 'verb' ? 'The phrase with a telescope connects to the action saw.' : 'The phrase with a telescope connects to the person.'}>
        <path d={attachment === 'verb' ? 'M180 75 C180 175 465 175 465 75' : 'M330 75 C330 140 465 140 465 75'} fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="5 5"/>
        {[['I',65,70],['saw',180,70],['the person',330,125],['with a telescope',485,170]].map(([word,x,width]) => <g key={word}><rect x={Number(x)-Number(width)/2} y="25" width={Number(width)} height="48" rx="10" fill={word==='with a telescope'?'var(--accent-soft)':'var(--surface)'} stroke="var(--border)"/><text x={x} y="54" textAnchor="middle" fill="var(--ink)" fontSize="16">{word}</text></g>)}
        <text x="300" y="195" textAnchor="middle" fontSize="16" fill="var(--accent)">{attachment === 'verb' ? 'The telescope helps me see.' : 'The telescope belongs to the person.'}</text>
      </svg>
      <div className="callout"><strong>What changed?</strong><br/>The attachment of one phrase, not the words. A model needs evidence about syntax and context to choose a reading.</div>
    </Panel>
  </div><div className="lab-stack"><Panel title="One field, different tasks"><div className="task-pickers">{tasks.map((item,i)=><button key={item.name} className={task===i?'selected':''} aria-pressed={task===i} onClick={()=>setTask(i)}>{item.name}</button>)}</div><div className="io-card"><span>INPUT</span><p>{tasks[task].input}</p></div><div className="io-arrow">↓</div><div className="io-card output"><span>OUTPUT · CURATED EXAMPLE</span><p>{tasks[task].output}</p></div><p className="micro-copy">{tasks[task].explanation}</p></Panel>
    <Panel title="The ideas you’ll connect"><ol className="plain-steps"><li>Split text into tokens.</li><li>Represent those tokens with numbers.</li><li>Learn or count useful patterns.</li><li>Evaluate predictions on new examples.</li><li>Use the output with appropriate evidence.</li></ol></Panel>
  </div></div>;
}
