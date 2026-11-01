import {useState} from 'react';
import {Empty, Formula, Panel, Segmented} from '../../components/LabUI';
import {bytePieceLabel, byteUnits, decodeBytePieces, segmentUnigram, sentencePieceText} from '../../lib/tokenization.js';
import type {MergeEntry, UnigramModel} from '../../lib/tokenization.js';
import {algorithms, modelOutput} from './subwordModels';
import type {Algorithm, Models, SentencePieceMode} from './subwordModels';

interface Props {mode:Algorithm;setMode:(x:Algorithm)=>void;corpus:string;setCorpus:(x:string)=>void;input:string;setInput:(x:string)=>void;models:Models;spMode:SentencePieceMode;setSpMode:(x:SentencePieceMode)=>void}
export default function Subwords({mode,setMode,corpus,setCorpus,input,setInput,models,spMode,setSpMode}:Props) {
  const [step,setStep]=useState(0);
  const isUnigram=mode==='unigram'||(mode==='sentencepiece'&&spMode==='unigram');
  const mergeModel=mode==='wordpiece'?models.wordpiece:mode==='byte'?models.byte:mode==='sentencepiece'?models.sentenceBpe:models.bpe;
  const uniModel:UnigramModel=mode==='sentencepiece'?models.sentenceUnigram:models.unigram;
  const history=isUnigram?uniModel.history:mergeModel.history;
  const currentStep=Math.min(step,history.length);
  const pieces=modelOutput(mode,input,models,spMode,currentStep);
  const uniProb=isUnigram?(currentStep?uniModel.history[currentStep-1].probabilities:uniModel.initial):new Map<string,number>();
  const uniPaths=isUnigram?segmentUnigram(mode==='sentencepiece'?sentencePieceText(input):input.toLocaleLowerCase(),uniProb):[];
  const merge:MergeEntry|undefined=isUnigram?undefined:mergeModel.history[currentStep-1];
  const uniEntry=isUnigram?uniModel.history[currentStep-1]:undefined;
  const stageUnits=isUnigram?[]:currentStep?mergeModel.history[currentStep-1].units:mergeModel.initial;
  const normalizedInput=mode==='byte'?input:mode==='sentencepiece'?sentencePieceText(input):input.toLocaleLowerCase();
  const chooseMode=(next:Algorithm)=>{setMode(next);setStep(0);};
  return <div className="lesson1-stack">
    <Panel title="Train on a visible toy corpus" detail="PDF pp. 20–21">
      <p className="micro-copy">The first four nonempty lines, up to 55 characters each, are used. Edit them to change the learned pieces.</p>
      <textarea className="text-area" aria-label="Toy training corpus, one sentence per line" rows={4} value={corpus} onChange={event=>{setCorpus(event.target.value);setStep(0);}} />
      <div className="lesson1-corpus-used"><small>TRAINING LINES USED</small>{models.lines.length?models.lines.map((line,i)=><span key={i}>{i+1}. {line}</span>):<span>No training text</span>}</div>
    </Panel>
    <Panel title="Choose how pieces are learned" detail={<span className="panel-kicker">INTERACTIVE TRACE</span>}>
      <div className="lesson1-mode-list" role="group" aria-label="Subword approach">{algorithms.map(([id,label])=><button type="button" className={`button ${mode===id?'button-primary':''}`} aria-pressed={mode===id} key={id} onClick={()=>chooseMode(id)}>{label}</button>)}</div>
      {mode==='sentencepiece'&&<div className="lesson1-sp-switch"><span>SentencePiece algorithm</span><Segmented label="SentencePiece algorithm" options={[["bpe","BPE"],["unigram","Unigram"]]} value={spMode} onChange={next=>{setSpMode(next);setStep(0);}} /></div>}
      <div className="lesson1-input-line"><label className="field-label" htmlFor="subword-input">Input {mode==='byte'||mode==='sentencepiece'?'text':'word'}</label><input className="text-input" id="subword-input" value={input} onChange={event=>setInput(event.target.value)} /><button className="button button-quiet" type="button" onClick={()=>setInput('carefully')}>carefully</button><button className="button button-quiet" type="button" onClick={()=>setInput('café ☕')}>café ☕</button></div>
      <div className="lesson1-step-controls"><button className="button" type="button" disabled={currentStep===0} onClick={()=>setStep(currentStep-1)}>Previous</button><input type="range" aria-label="Training step" min="0" max={history.length} value={currentStep} onChange={event=>setStep(Number(event.target.value))} /><strong>Step {currentStep} / {history.length}</strong><button className="button button-primary" type="button" disabled={currentStep===history.length} onClick={()=>setStep(currentStep+1)}>{isUnigram?'Prune next':'Merge next'}</button></div>
      <div className="lesson1-subword-flow"><div><small>INPUT UNITS</small><strong>{mode==='byte'?byteUnits(input).map(bytePieceLabel).join(' · '):mode==='sentencepiece'?sentencePieceText(input):[...normalizedInput].join(' · ')||'—'}</strong></div><b aria-hidden="true">→</b><div><small>OUTPUT PIECES</small><strong>{pieces.map(piece=>mode==='byte'?`[${bytePieceLabel(piece)}]`:piece).join(' · ')||'—'}</strong></div></div>
      {mode==='byte'&&<p className="micro-copy">UTF-8 bytes: {byteUnits(input).map(bytePieceLabel).join(' ')||'—'}. Decoding the output pieces gives “{decodeBytePieces(pieces)}”. This toy demo omits GPT-2's pre-tokenization and visible-byte alphabet.</p>}
      {mode==='sentencepiece'&&<p className="micro-copy">The visible ▁ marks a space, including a start prefix in this teaching setup. SentencePiece is a raw-text framework for BPE or Unigram; production normalization and constraints are omitted.</p>}
      {mode==='wordpiece'&&<p className="micro-copy">This trace uses the <a href="https://huggingface.co/docs/course/en/chapter6/6" target="_blank" rel="noreferrer">Hugging Face course's illustrative pair score</a>, count(pair) / (count(left) × count(right)), then longest-match decoding with ## continuation pieces. It is not BERT's full training pipeline.</p>}
      {mode==='unigram'&&<p className="micro-copy">Candidate substrings start with count-based probabilities. A small EM fit estimates probabilities; each step removes the piece with the smallest immediate change in corpus negative log likelihood and refits. Production <a href="https://github.com/google/sentencepiece/blob/master/src/unigram_model_trainer.cc" target="_blank" rel="noreferrer">SentencePiece training</a> has additional refinements.</p>}
      {mode==='bpe'&&<p className="micro-copy">Word-internal BPE starts from characters and merges the most frequent adjacent pair. Ties use a stable lexical order. End-of-word markers and production refinements are omitted.</p>}
    </Panel>
    <div className="lesson1-grid">
      <Panel title={isUnigram?'Pruning decision':'Merge decision'} detail={`STEP ${currentStep} / ${history.length}`}>
        {currentStep>0&&<p className="micro-copy"><strong>This step:</strong> {isUnigram&&uniEntry?`Remove “${uniEntry.removed.piece}”; loss changes by ${uniEntry.removed.loss.toFixed(4)} before refitting.`:merge?`Join “${merge.left}” and “${merge.right}” into “${merge.joined}” (${merge.count} adjacent occurrences).`:''}</p>}
        {currentStep===0?<Formula concept={isUnigram?'unigram':mode==='wordpiece'?'wordpiece':'bpe'} caption={isUnigram?'Fit candidate probabilities first. Single characters stay, so training text remains segmentable.':mode==='wordpiece'?'Rank adjacent pairs by the association score.':'Count adjacent pairs in every training sequence.'}>{isUnigram?'candidate substrings → probabilities → prune':'initial units → pair scores → merge'}</Formula>:isUnigram&&uniEntry?<Formula concept="unigram" caption={`ΔNLL = ${uniEntry.removed.loss.toFixed(6)} before refitting; negative means removal improved the current model.`}>remove <strong>{uniEntry.removed.piece}</strong> · prior p = {uniEntry.removed.probability.toPrecision(3)}</Formula>:merge?<Formula concept={isUnigram?'unigram':mode==='wordpiece'?'wordpiece':'bpe'} caption={`${merge.count} adjacent occurrence${merge.count===1?'':'s'} before the merge.`}>{merge.left} + {merge.right} → <strong>{merge.joined}</strong>{mode==='wordpiece'?` · score ${merge.score.toFixed(4)}`:''}</Formula>:null}
        <h3 className="subheading">{isUnigram?'Lowest removal costs':'Top candidate pairs'}</h3>
        <div className="lesson1-candidates">{isUnigram?(uniEntry?.candidates||[]).map(item=><div key={item.piece}><span>{item.piece}</span><strong>loss change {item.loss.toFixed(4)}</strong></div>):(currentStep?merge?.candidates:mergeModel.history[0]?.candidates)?.map(item=><div key={`${item.left}-${item.right}`}><span>{item.left} + {item.right}</span><strong>{mode==='wordpiece'?item.score.toFixed(4):item.count}</strong></div>)}</div>
      </Panel>
      <Panel title={isUnigram?'Piece probabilities':'Training sequences'} detail={isUnigram?`${uniProb.size} candidates`:`${stageUnits.length} sequences`}>
        {isUnigram?<div className="lesson1-candidates lesson1-probabilities">{[...uniProb].sort((a,b)=>b[1]-a[1]).slice(0,16).map(([piece,p])=><div key={piece}><span>{piece}</span><strong>{p.toPrecision(3)}</strong></div>)}</div>:<div className="lesson1-training-units">{stageUnits.slice(0,16).map((unit,i)=><span key={i}>{unit.map(part=>mode==='byte'?bytePieceLabel(part):part).join(' · ')}</span>)}</div>}
        {!isUnigram&&stageUnits.length>16&&<p className="micro-copy">Showing the first 16 of {stageUnits.length} sequences.</p>}
      </Panel>
    </div>
    {isUnigram&&<Panel title="Alternative segmentations" detail="Highest log probability first">{uniPaths.length?<div className="lesson1-paths">{uniPaths.map((path,i)=><div key={i}><span>{path.pieces.join(' · ')}</span><strong>log score {path.score.toFixed(3)}</strong></div>)}</div>:<Empty>No path: the training alphabet does not cover this input. Try a word from the corpus.</Empty>}<p className="micro-copy">Add the log probability of each piece to score a split. A larger score means that split has a higher probability.</p></Panel>}
  </div>;
}
