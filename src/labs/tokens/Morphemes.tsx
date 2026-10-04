import {useMemo, useState} from 'react';
import {Panel} from '../../components/LabUI';
import {MORPHEMES, SUBWORD_CORPUS, encodeMerges, trainMerges, wordSequences} from '../../lib/tokenization.js';

export default function Morphemes() {
  const [word,setWord] = useState(MORPHEMES[1].word);
  const [chinese,setChinese] = useState(0);
  const selected=MORPHEMES.find(item=>item.word===word)||MORPHEMES[0];
  const bpe=useMemo(()=>trainMerges(wordSequences(SUBWORD_CORPUS),8),[]);
  const form=selected.word.replaceAll('-','');
  const mechanical=encodeMerges(form,bpe.history,'bpe',8,bpe.initial.flat());
  const readings=[
    {parts:['姚明','进入','总决赛'],note:'Name · reaches · finals'},
    {parts:['姚','明','进入','总','决赛'],note:'Name split; finer meaning units'},
    {parts:[...'姚明进入总决赛'],note:'Characters as basic elements'},
  ];
  return <div className="lesson1-grid">
    <Panel title="Build meaning from pieces" detail="PDF pp. 17–19" className="lesson1-wide">
      <div className="lesson1-choice-list" role="group" aria-label="Morpheme example">{MORPHEMES.map(item=><button type="button" className={`button ${word===item.word?'button-primary':''}`} aria-pressed={word===item.word} key={item.word} onClick={()=>setWord(item.word)}>{item.word}</button>)}</div>
      <div className="lesson1-morph-strip">{selected.parts.map(([piece,kind,meaning],i)=><div className={`lesson1-morph-piece ${kind.replaceAll(' ','-')}`} key={i}><strong>{piece}</strong><span>{kind}</span><small>{meaning}</small></div>)}</div>
      <p className="micro-copy">A free morpheme can stand alone. An inflection marks grammar; a derivation can change meaning or word class. A clitic acts syntactically like a word but attaches in reduced form.</p>
    </Panel>
    <Panel title="Linguistic vs learned split" detail="Same visible word"><div className="lesson1-two-splits"><div><small>MORPHEMES</small><strong>{selected.parts.map(x=>x[0]).join(' · ')}</strong><span>Curated linguistic analysis</span></div><div><small>TOY BPE</small><strong>{mechanical.join(' · ')}</strong><span>Frequent pair merges from the toy corpus</span></div></div><p className="micro-copy">A tokenizer's pieces are statistical units. They do not have to match roots or affixes.</p></Panel>
    <Panel title="Where are word boundaries?" detail="PDF p. 18"><p className="micro-copy">The slide shows alternate segmentations of “姚明进入总决赛.” Choose a boundary interpretation.</p><div className="button-line">{readings.map((_,i)=><button type="button" className={`button ${chinese===i?'button-primary':''}`} aria-pressed={chinese===i} key={i} onClick={()=>setChinese(i)}>{i===0?'Words':i===1?'Finer units':'Characters'}</button>)}</div><div className="lesson1-chinese">{readings[chinese].parts.map((part,i)=><span key={i}>{part}</span>)}</div><p className="micro-copy">{readings[chinese].note}. Spaces are not a universal word-boundary rule; subwords can represent new words from reusable pieces (p. 20).</p></Panel>
  </div>;
}
