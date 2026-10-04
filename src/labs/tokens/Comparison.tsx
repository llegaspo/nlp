import {useState} from 'react';
import {Panel, Segmented} from '../../components/LabUI';
import {bytePieceLabel} from '../../lib/tokenization.js';
import {modelOutput} from './subwordModels';
import type {Algorithm, Models, SentencePieceMode} from './subwordModels';

const comparisons:{id:Algorithm;name:string;operation:string;models:string;strength:string;tradeoff:string;inspect:string}[]=[
  {id:'bpe',name:'BPE',operation:'Merge most frequent token pair',models:'GPT; early NMT models',strength:'Simple, efficient; reduces vocabulary',tradeoff:'Frequency may ignore morphology',inspect:'Pair counts and each merge'},
  {id:'wordpiece',name:'WordPiece',operation:'Choose merge by likelihood-oriented criterion',models:'BERT',strength:'Better segmentation; fewer unknown words',tradeoff:'More complex training',inspect:'Pair score and ## continuation'},
  {id:'unigram',name:'Unigram',operation:'Prune unlikely pieces from a large vocabulary',models:'SentencePiece; T5',strength:'Flexible, probabilistic',tradeoff:'More computation',inspect:'Probabilities and alternative paths'},
  {id:'sentencepiece',name:'SentencePiece',operation:'Framework: BPE or Unigram on raw text',models:'T5; ALBERT',strength:'Language-independent; no pre-tokenization required',tradeoff:'Depends on chosen algorithm',inspect:'▁ space marker and both modes'},
  {id:'byte',name:'Byte-level BPE',operation:'Apply BPE to byte sequences',models:'GPT-2; RoBERTa',strength:'Covers Unicode; no unknown bytes',tradeoff:'Can need more pieces',inspect:'UTF-8 bytes and byte merges'},
];

export default function Comparison({input,setInput,models,spMode,setSpMode}: {input:string;setInput:(x:string)=>void;models:Models;spMode:SentencePieceMode;setSpMode:(x:SentencePieceMode)=>void}) {
  const [pair,setPair]=useState<[Algorithm,Algorithm]>(['bpe','byte']);
  const select=(id:Algorithm)=>{if(pair.includes(id))return;setPair([pair[1],id]);};
  return <div className="lesson1-stack">
    <Panel title="Five approaches at a glance" detail="PDF p. 21"><p className="micro-copy">The first five columns follow the slide. “Inspect here” describes the teaching demos. Select two rows to compare their splits of the current input. On a phone, swipe the table sideways to see every column.</p><div className="lesson1-table-wrap"><table className="lesson1-table lesson1-comparison"><thead><tr><th scope="col">Approach</th><th scope="col">Core operation</th><th scope="col">Used by on slide</th><th scope="col">Strength</th><th scope="col">Tradeoff</th><th scope="col">Inspect here</th></tr></thead><tbody>{comparisons.map(row=><tr key={row.id} className={pair.includes(row.id)?'is-selected':''}><th scope="row"><button type="button" aria-pressed={pair.includes(row.id)} onClick={()=>select(row.id)}>{row.name}</button></th><td>{row.operation}</td><td>{row.models}</td><td>{row.strength}</td><td>{row.tradeoff}</td><td>{row.inspect}</td></tr>)}</tbody></table></div><p className="micro-copy">Model names are examples on the lesson slide. Actual tokenizers can vary by model and version.</p></Panel>
    <Panel title="Same input, two splits" detail={`Input: ${input||'empty'}`}><div className="lesson1-compare-controls"><label className="control-field" htmlFor="compare-input">Input text<input className="text-input" id="compare-input" value={input} onChange={event=>setInput(event.target.value)} /></label><div><span className="field-label">SentencePiece mode</span><Segmented label="SentencePiece comparison mode" options={[["bpe","BPE"],["unigram","Unigram"]]} value={spMode} onChange={setSpMode} /></div></div><div className="lesson1-compare-output">{pair.map(id=><div key={id}><small>{comparisons.find(row=>row.id===id)?.name}</small><strong>{modelOutput(id,input,models,spMode).map(piece=>id==='byte'?`[${bytePieceLabel(piece)}]`:piece).join(' · ')||'—'}</strong></div>)}</div><p className="micro-copy">These toy models share the visible corpus. SentencePiece uses the selected {spMode.toUpperCase()} mode. Piece counts depend on the learned toy vocabularies.</p></Panel>
  </div>;
}
