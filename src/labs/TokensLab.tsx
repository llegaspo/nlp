import {useState} from 'react';
import {SUBWORD_CORPUS} from '../lib/tokenization.js';
import TokenStream from './tokens/TokenStream';
import Normalization from './tokens/Normalization';
import Morphemes from './tokens/Morphemes';
import Subwords from './tokens/Subwords';
import Comparison from './tokens/Comparison';
import {useSubwordModels} from './tokens/subwordModels';
import type {Algorithm,SentencePieceMode} from './tokens/subwordModels';

type Section='stream'|'normalization'|'morphemes'|'subwords'|'comparison';
const sections:[Section,string][]=[['stream','01 Token stream'],['normalization','02 Normalize'],['morphemes','03 Morphemes'],['subwords','04 Subwords'],['comparison','05 Compare']];

export default function TokensLab() {
  const [section,setSection]=useState<Section>('stream');
  const [mode,setMode]=useState<Algorithm>('bpe');
  const [corpus,setCorpus]=useState(SUBWORD_CORPUS.join('\n'));
  const [input,setInput]=useState('carefully');
  const [spMode,setSpMode]=useState<SentencePieceMode>('bpe');
  const models=useSubwordModels(corpus);
  const intro={stream:'Count what the chosen tokenization rule actually produces.',normalization:'Change a form or matching rule and see which strings become equivalent.',morphemes:'Inspect meaningful linguistic pieces and compare them with learned subwords.',subwords:'Watch a small training corpus turn into reusable pieces, one decision at a time.',comparison:'Compare the five approaches listed in the lesson on the same input.'};
  return <div className="lesson1-root"><nav className="lesson1-section-nav" aria-label="Lesson 1 topics">{sections.map(([id,label])=><button type="button" className={section===id?'active':''} aria-current={section===id?'step':undefined} key={id} onClick={()=>setSection(id)}>{label}</button>)}</nav><div className="lesson1-section-heading"><span className="eyebrow">WORDS AND TOKENS · LESSON 1B</span><p>{intro[section]}</p></div>{section==='stream'?<TokenStream/>:section==='normalization'?<Normalization/>:section==='morphemes'?<Morphemes/>:section==='subwords'?<Subwords mode={mode} setMode={setMode} corpus={corpus} setCorpus={setCorpus} input={input} setInput={setInput} models={models} spMode={spMode} setSpMode={setSpMode}/>:<Comparison input={input} setInput={setInput} models={models} spMode={spMode} setSpMode={setSpMode}/>}</div>;
}
