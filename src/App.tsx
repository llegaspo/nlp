import { useEffect, useState } from 'react';
import TokensLab from './labs/TokensLab';
import EditDistanceLab from './labs/EditDistanceLab';
import ContextVectorsLab from './labs/ContextVectorsLab';
import EmbeddingsLab from './labs/EmbeddingsLab';
import NgramLab from './labs/NgramLab';
import SmoothingLab from './labs/SmoothingLab';
import PerplexityLab from './labs/PerplexityLab';
import NeuralLab from './labs/NeuralLab';

const lessons = [
  {id: 'tokens', name: 'Text & tokens', section: 'Represent text', source: '[1b] Words and Tokens.pdf · pp. 3–21', component: TokensLab},
  {id: 'edit-distance', name: 'Edit distance', section: 'Compare text', source: '[2a] Edit Distance.pdf · pp. 5–19', component: EditDistanceLab},
  {id: 'context-vectors', name: 'Context vectors', section: 'Represent text', source: '[2b] Word Embedding.pdf · pp. 3–12', component: ContextVectorsLab},
  {id: 'embeddings', name: 'Learning embeddings', section: 'Learn representations', source: '[2b] Word Embedding.pdf · pp. 13–18', component: EmbeddingsLab},
  {id: 'ngrams', name: 'N-gram models', section: 'Predict language', source: '[3a] ngram language modelling.pdf · pp. 6–28', component: NgramLab},
  {id: 'smoothing', name: 'Smoothing', section: 'Predict language', source: '[3c] smoothing.pdf · pp. 2–9; Good-Turing Smoothing.pdf · pp. 1–2', component: SmoothingLab},
  {id: 'perplexity', name: 'Perplexity', section: 'Evaluate', source: '[3b] Evaluating Language Models.pdf · pp. 2–7', component: PerplexityLab},
  {id: 'neural', name: 'Neural networks', section: 'Learn representations', source: '[4a] Neural Networks for NLP.pdf · pp. 7–21', component: NeuralLab},
] as const;

function lessonIndexFromHash() {
  const id = location.hash.slice(1);
  const found = lessons.findIndex(lesson => lesson.id === id);
  return found < 0 ? 3 : found;
}

export default function App() {
  const [active, setActive] = useState(lessonIndexFromHash);
  useEffect(() => {
    const onHash = () => setActive(lessonIndexFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const lesson = lessons[active];
  return <div className="app-shell">
    <header className="global-header">
      <a href="#embeddings" className="brand"><span className="brand-mark" aria-hidden="true">N</span><span>NLP <em>Visual Lab</em></span></a>
      <div className="header-current"><span className="header-dot" />Interactive lessons <span className="header-divider">/</span> {lesson.name}</div>
    </header>
    <div className="app-body">
      <aside className="sidebar">
        <div className="sidebar-caption"><span>COURSE MAP</span><span className="mobile-nav-hint">Swipe to browse →</span></div>
        <nav aria-label="NLP lessons">{lessons.map((item, index) => <a key={item.id} href={`#${item.id}`} className={`lesson-link ${index === active ? 'active' : ''}`} aria-current={index === active ? 'page' : undefined}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.name}</strong><small>{item.section}</small></span></a>)}</nav>
        <div className="sidebar-bottom"><span className="sidebar-bottom-label">SOURCE MATERIAL</span><strong>12 course PDFs</strong><p>Every experiment uses explicit data and equations.</p></div>
      </aside>
      <main className="main-workspace" id="main-content">
        <div className="lesson-intro"><div><div className="eyebrow">LESSON {String(active + 1).padStart(2, '0')} <span>/</span> {String(lessons.length).padStart(2, '0')}</div><h1>{lesson.name}</h1><p>{active === 3 ? 'Train a small word prediction model and watch its vectors change with each update.' : lesson.section + ' through a live experiment. Change an input to see the calculation respond.'}</p></div><div className="source-pill"><span>LESSON SOURCE</span><strong>{lesson.source}</strong></div></div>
        {lessons.map((item, index) => {
          const Lesson = item.component;
          return <div key={item.id} hidden={index !== active} data-active-lab={index === active ? item.id : undefined}><Lesson /></div>;
        })}
        <footer className="workspace-footer">Numbers are recomputed from the examples shown. The supplied exercise sheets remain independent practice.</footer>
      </main>
    </div>
  </div>;
}
