import {useEffect, useRef, useState, type ComponentType} from 'react';
import TokensLab from './labs/TokensLab';
import EditDistanceLab from './labs/EditDistanceLab';
import ContextVectorsLab from './labs/ContextVectorsLab';
import EmbeddingsLab from './labs/EmbeddingsLab';
import NgramLab from './labs/NgramLab';
import SmoothingLab from './labs/SmoothingLab';
import PerplexityLab from './labs/PerplexityLab';
import NeuralLab from './labs/NeuralLab';
import IntroLab from './labs/IntroLab';
import AttentionLab from './labs/AttentionLab';
import LLMLab from './labs/LLMLab';
import ResponsibleLab from './labs/ResponsibleLab';
import MaskedLab from './labs/MaskedLab';
import CourseHome from './components/CourseHome';
import ExercisesPage from './components/ExercisesPage';
import LessonPage from './components/LessonPage';
import {Glossary, Sources} from './components/ReferencePages';
import Icon from './components/Icons';
import ThemeToggle from './components/ThemeToggle';
import {groups, lessons} from './data/course';

const labs:Record<string,ComponentType>={'intro':IntroLab,'tokens':TokensLab,'edit-distance':EditDistanceLab,'context-vectors':ContextVectorsLab,'embeddings':EmbeddingsLab,'ngrams':NgramLab,'smoothing':SmoothingLab,'perplexity':PerplexityLab,'neural':NeuralLab,'attention':AttentionLab,'masked':MaskedLab,'llms':LLMLab,'responsible':ResponsibleLab};
type Progress={answers:Record<string,number[]>;lastLesson:string};
const storageKey='nlp-visual-lab.progress.v2';
function readProgress():Progress {
  try {
    const data=JSON.parse(localStorage.getItem(storageKey)||'{}');
    const answers:Record<string,number[]>={};
    for(const lesson of lessons) {
      const values=data?.answers?.[lesson.id];
      if(Array.isArray(values)) answers[lesson.id]=lesson.questions.map((q,i)=>Number.isInteger(values[i])&&values[i]>=0&&values[i]<q.options.length?values[i]:-1);
    }
    return {answers,lastLesson:lessons.some(l=>l.id===data?.lastLesson)?data.lastLesson:'intro'};
  } catch { return {answers:{},lastLesson:'intro'}; }
}
function routeFromHash() {return location.hash.slice(1)||'home';}

export default function App() {
  const [route,setRoute]=useState(routeFromHash);
  const [progress,setProgress]=useState(readProgress);
  const [storageAvailable,setStorageAvailable]=useState(true);
  const [menuOpen,setMenuOpen]=useState(false);
  const [search,setSearch]=useState('');
  const searchDialog=useRef<HTMLDialogElement>(null);
  const searchInput=useRef<HTMLInputElement>(null);
  const mainRef=useRef<HTMLElement>(null);
  const lesson=lessons.find(l=>l.id===route);
  const completed=lessons.filter(l=>l.questions.every((q,i)=>progress.answers[l.id]?.[i]===q.correct)).map(l=>l.id);
  useEffect(()=>{
    const navigate=()=>{setRoute(routeFromHash());setMenuOpen(false);searchDialog.current?.close();window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>mainRef.current?.focus({preventScroll:true}));};
    window.addEventListener('hashchange',navigate);
    return ()=>window.removeEventListener('hashchange',navigate);
  },[]);
  useEffect(()=>{
    if(lesson) setProgress(prev=>prev.lastLesson===lesson.id?prev:{...prev,lastLesson:lesson.id});
    document.title=`${lesson?.title||({home:'Learn by doing',glossary:'Glossary',sources:'Sources',exercises:'Build a café autocomplete'}[route]||'Page not found')} · NLP Visual Lab`;
  },[route,lesson]);
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(progress));setStorageAvailable(true);}catch{setStorageAvailable(false);}},[progress]);
  useEffect(()=>{
    const shortcut=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();searchDialog.current?.showModal();searchInput.current?.focus();}if(e.key==='Escape')setMenuOpen(false);};
    window.addEventListener('keydown',shortcut);
    return ()=>window.removeEventListener('keydown',shortcut);
  },[]);
  const openSearch=()=>{setSearch('');searchDialog.current?.showModal();searchInput.current?.focus();};
  const matched=lessons.filter(l=>`${l.title} ${l.subtitle} ${l.intuition} ${l.source}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="app-shell"><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();mainRef.current?.focus();}}>Skip to content</a><header className="global-header"><div className="header-brand"><button className="icon-button mobile-menu" aria-label={menuOpen?'Close course navigation':'Open course navigation'} aria-expanded={menuOpen} aria-controls="course-sidebar" onClick={()=>setMenuOpen(!menuOpen)}><Icon name={menuOpen?'close':'menu'}/></button><a href="#home" className="brand"><span className="brand-mark"><Icon name="spark" size={23}/></span><span>NLP<span className="brand-divider">/</span><em>visual lab</em></span></a></div><div className="header-current"><span className="header-dot"/>A space to understand language</div><div className="header-actions"><button className="header-search" onClick={openSearch}><Icon name="search" size={17}/><span>Search lessons</span><kbd>⌘ K</kbd></button><ThemeToggle/></div></header>
    <div className="app-body">{menuOpen&&<button className="nav-backdrop" aria-label="Close course navigation" onClick={()=>setMenuOpen(false)}/>}<aside id="course-sidebar" className={`sidebar ${menuOpen?'open':''}`}><div className="sidebar-top"><span className="sidebar-caption">YOUR WORKSPACE</span><a href="#home" aria-current={route==='home'?'page':undefined} className={`overview-link ${route==='home'?'active':''}`} onClick={()=>setMenuOpen(false)}><Icon name="grid" size={18}/>Learning path<Icon name="arrow" size={15}/></a></div><nav className="course-nav" aria-label="Course lessons">{groups.map((group,i)=><div className="nav-group" key={group.title}><span className="nav-group-title">0{i+1} <span>{['The foundations','Predicting language','The bigger picture'][i]}</span></span>{lessons.filter(l=>l.group===i).map(item=><a key={item.id} href={`#${item.id}`} onClick={()=>setMenuOpen(false)} className={`lesson-link ${item.id===route?'active':''}`} aria-current={item.id===route?'page':undefined}><span className={`lesson-number ${completed.includes(item.id)?'completed':''}`}>{completed.includes(item.id)?<Icon name="check" size={13}/>:String(lessons.indexOf(item)+1).padStart(2,'0')}</span><span>{item.title}</span>{route===item.id&&<i/>}</a>)}</div>)}</nav><div className="sidebar-resources"><a href="#exercises" aria-current={route==='exercises'?'page':undefined} className={route==='exercises'?'active':''} onClick={()=>setMenuOpen(false)}><Icon name="code" size={17}/>Python exercise<Icon name="coffee" size={16}/></a><a href="#glossary" aria-current={route==='glossary'?'page':undefined} className={route==='glossary'?'active':''} onClick={()=>setMenuOpen(false)}><Icon name="book" size={17}/>Glossary<span>22</span></a><a href="#sources" aria-current={route==='sources'?'page':undefined} className={route==='sources'?'active':''} onClick={()=>setMenuOpen(false)}><Icon name="link" size={17}/>Sources & reading<Icon name="external" size={14}/></a></div><div className="sidebar-bottom"><div><strong>Your learning journey</strong><span>{Math.round(completed.length/lessons.length*100)}%</span></div><div className="progress-track"><i style={{width:`${completed.length/lessons.length*100}%`}}/></div><p>{completed.length} of {lessons.length} lessons complete</p><small>{storageAvailable?'Progress saved in this browser':'Storage unavailable · progress lasts this visit'}</small></div></aside>
    <main className="main-workspace" id="main-content" ref={mainRef} tabIndex={-1}>{lesson?<LessonPage key={lesson.id} lesson={lesson} Lab={labs[lesson.id]} answers={progress.answers[lesson.id]||[]} onAnswer={(index,answer)=>setProgress(prev=>{const answers=[...(prev.answers[lesson.id]||[])];answers[index]=answer;return {...prev,answers:{...prev.answers,[lesson.id]:answers}};})}/>:route==='home'?<CourseHome completed={completed} lastLesson={progress.lastLesson}/>:route==='exercises'?<ExercisesPage/>:route==='glossary'?<Glossary/>:route==='sources'?<Sources/>:<div className="not-found"><span className="eyebrow">A SMALL DETOUR</span><h1>That lesson isn’t here.</h1><p>You can find every lesson on the learning path.</p><a href="#home" className="button button-primary">Back to the course <Icon name="arrow" size={17}/></a></div>}<footer className="workspace-footer"><span>NLP / visual lab</span><span>Made for curiosity. Grounded in evidence.</span><a href="#sources">Sources & conventions ↗</a></footer></main></div>
    <dialog className="search-dialog" ref={searchDialog} aria-labelledby="search-title" onClick={e=>{if(e.target===e.currentTarget)searchDialog.current?.close();}}><div className="search-dialog-header"><Icon name="search"/><label id="search-title" className="sr-only" htmlFor="lesson-search">Search lessons</label><input ref={searchInput} id="lesson-search" type="search" placeholder="Search concepts, lessons, or source material…" value={search} onChange={e=>setSearch(e.target.value)}/><button className="icon-button" aria-label="Close search" onClick={()=>searchDialog.current?.close()}><Icon name="close" size={18}/></button></div><div className="search-results">{matched.map(item=><a key={item.id} href={`#${item.id}`} onClick={()=>searchDialog.current?.close()}><span className="course-symbol">{item.symbol}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><Icon name="arrow" size={17}/></a>)}{!matched.length&&<p>No matching lessons. Try “tokens”, “attention”, or “probability”.</p>}</div><div className="search-footer">{matched.length} lessons · Esc to close</div></dialog>
  </div>;
}
