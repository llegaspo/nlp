import {useState} from 'react';
import {Panel, Segmented} from '../../components/LabUI';
import {lookupLemma, stripAccents} from '../../lib/tokenization.js';

function Transform({before,after,note}: {before:string;after:string;note:string}) {
  return <div className="lesson1-transform"><span>{before}</span><b aria-hidden="true">→</b><strong>{after}</strong><small>{note}</small></div>;
}

export default function Normalization() {
  const [canonical,setCanonical] = useState(['USA','USA','USA']);
  const [query,setQuery] = useState<'window'|'windows'|'Windows'>('window');
  const [related,setRelated] = useState(true);
  const [accents,setAccents] = useState(false);
  const [accentExample,setAccentExample] = useState<'naive'|'cliche'>('naive');
  const [caseExample,setCaseExample] = useState<'The/the'|'US/us'|'Fed/fed'|'Bush/bush'>('The/the');
  const [caseFold,setCaseFold] = useState(false);
  const [lemmaExample,setLemmaExample] = useState<'be'|'car'|'sentence'>('be');
  const [useLemma,setUseLemma] = useState(true);
  const [nfkc,setNfkc] = useState(false);
  const canonicalForms=['U.S.A.','USA','US'];
  const expansions={window:['window','windows'],windows:['Windows','windows','window'],Windows:['Windows']};
  const accentForms=accentExample==='naive'?['naive','naïve']:['cliche','cliché'];
  const caseForms=caseExample.split('/');
  const lemmaForms=lemmaExample==='be'?['am','are','is']:lemmaExample==='car'?['car','car’s','cars’','cars']:['the','boy’s','car','are','different','colors'];
  const lemmaOutput=useLemma?lemmaForms.map(lookupLemma):lemmaForms;
  const nfkcInput='ＡＢＣ ①';
  return <div className="lesson1-grid">
    <Panel title="One chosen form" detail="PDF p. 14"><p className="micro-copy">Edit the target of each source form. Equal targets become one type for this chosen application.</p><div className="lesson1-mapping">{canonicalForms.map((form,index)=><label key={form}><span>{form} →</span><input className="text-input" aria-label={`Canonical form for ${form}`} value={canonical[index]} onChange={event=>setCanonical(canonical.map((value,i)=>i===index?event.target.value:value))} /></label>)}</div><Transform before={`${canonicalForms.length} source types`} after={`${new Set(canonical).size} mapped types`} note="A domain-specific equivalence class; US may mean something else elsewhere." /></Panel>
    <Panel title="Asymmetric expansion" detail="PDF p. 14"><label className="field-label" htmlFor="asym-query">Search query</label><select className="select-input" id="asym-query" value={query} onChange={event=>setQuery(event.target.value as typeof query)}>{Object.keys(expansions).map(value=><option key={value}>{value}</option>)}</select><Transform before={query} after={expansions[query].join(' · ')} note={`1 query → ${expansions[query].length} search forms. Direction matters: the reverse query can expand differently.`} /></Panel>
    <Panel title="Query expansion" detail="PDF p. 14"><label className="lesson1-small-check"><input type="checkbox" checked={related} onChange={event=>setRelated(event.target.checked)} /> Include related terms for “car”</label><Transform before="car" after={related?'car · automobile · vehicle':'car'} note={related?'Broader retrieval: related words are included, not made identical.':'Only the literal query is searched.'} /></Panel>
    <Panel title="Accents and diacritics" detail="PDF p. 15"><Segmented label="Accent example" options={[["naive","naive / naïve"],["cliche","cliche / cliché"]]} value={accentExample} onChange={setAccentExample} /><label className="lesson1-small-check"><input type="checkbox" checked={accents} onChange={event=>setAccents(event.target.checked)} /> Remove accents for matching</label><Transform before={accentForms.join(' · ')} after={(accents?accentForms.map(stripAccents):accentForms).join(' · ')} note={`${new Set(accents?accentForms.map(stripAccents):accentForms).size} distinct forms. Accent folding is language and task dependent; the slide warns about Spanish.`} /></Panel>
    <Panel title="Case folding" detail="PDF p. 15"><label className="field-label" htmlFor="case-example">Compare forms</label><select className="select-input" id="case-example" value={caseExample} onChange={event=>setCaseExample(event.target.value as typeof caseExample)}>{['The/the','US/us','Fed/fed','Bush/bush'].map(value=><option key={value}>{value}</option>)}</select><label className="lesson1-small-check"><input type="checkbox" checked={caseFold} onChange={event=>setCaseFold(event.target.checked)} /> Lowercase both forms</label><Transform before={caseForms.join(' · ')} after={(caseFold?caseForms.map(x=>x.toLocaleLowerCase()):caseForms).join(' · ')} note={`${new Set(caseFold?caseForms.map(x=>x.toLocaleLowerCase()):caseForms).size} distinct forms. Folding can erase a proper name or acronym. Truecasing is a separate learned task.`} /></Panel>
    <Panel title="Lemmatization" detail="PDF p. 16"><label className="field-label" htmlFor="lemma-example">Source example</label><select className="select-input" id="lemma-example" value={lemmaExample} onChange={event=>setLemmaExample(event.target.value as typeof lemmaExample)}><option value="be">am · are · is</option><option value="car">car forms</option><option value="sentence">the boy’s car are different colors</option></select><label className="lesson1-small-check"><input type="checkbox" checked={useLemma} onChange={event=>setUseLemma(event.target.checked)} /> Apply curated lemma lookup</label><Transform before={lemmaForms.join(' ')} after={lemmaOutput.join(' ')} note={`${new Set(lemmaForms).size} input types → ${new Set(lemmaOutput).size} output types. A real lemmatizer must choose a dictionary headword using context.`} /></Panel>
    <Panel title="Unicode NFKC" detail="EXTRA · outside PDF list" className="lesson1-wide"><label className="lesson1-small-check"><input type="checkbox" checked={nfkc} onChange={event=>setNfkc(event.target.checked)} /> Apply compatibility normalization</label><Transform before={nfkcInput} after={nfkc?nfkcInput.normalize('NFKC'):nfkcInput} note="Fullwidth ABC and circled 1 become ordinary ABC and 1 with NFKC. This Unicode transform is separate from the slide's normalization examples." /></Panel>
  </div>;
}
