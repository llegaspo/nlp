import { useEffect, useMemo, useState } from 'react';
import { makeTrainer, trainerForward, trainStep } from '../lib/math.js';
import { Challenge, Formula, Panel, ProbabilityBars, Segmented, Stat, format } from '../components/LabUI';

const corpus = ['cats chase mice', 'dogs chase balls', 'cats like milk', 'dogs like bones'];

export default function EmbeddingsLab() {
  const [trainer, setTrainer] = useState(() => makeTrainer('skipgram'));
  const [rate, setRate] = useState(0.45);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState('cats');
  const initial = useMemo(() => makeTrainer(trainer.mode).E, [trainer.mode]);
  const pair = trainer.pairs[trainer.step % trainer.pairs.length];
  const forward = trainerForward(trainer, pair);
  const targetWord = trainer.vocab[pair.target];
  const scores: [string, number][] = trainer.vocab.map((word, index): [string, number] => [word, forward.probabilities[index]]).sort((a, b) => b[1] - a[1]);

  function step(count = 1) {
    setTrainer(previous => {
      const next = structuredClone(previous);
      for (let index = 0; index < count; index++) trainStep(next, rate);
      return next;
    });
  }

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => step(), 180);
    return () => window.clearInterval(timer);
  }, [playing, rate]);

  useEffect(() => {
    const pauseWhenLeaving = () => {if (location.hash !== '#embeddings') setPlaying(false);};
    const pause = () => setPlaying(false);
    window.addEventListener('hashchange', pauseWhenLeaving);
    window.addEventListener('nlp:pause-animation', pause);
    return () => {window.removeEventListener('hashchange', pauseWhenLeaving);window.removeEventListener('nlp:pause-animation', pause);};
  }, []);

  useEffect(() => {
    type TrainRequest = {steps: number; resolve: (value: unknown) => void};
    const onTrain = (event: Event) => {
      const {steps, resolve} = (event as CustomEvent<TrainRequest>).detail;
      setTrainer(previous => {
        const next = structuredClone(previous);
        for (let index = 0; index < steps; index++) trainStep(next, rate);
        requestAnimationFrame(() => resolve({mode: next.mode, totalSteps: next.step, currentLoss: trainerForward(next).loss}));
        return next;
      });
    };
    window.addEventListener('nlp:train-embedding', onTrain);
    return () => window.removeEventListener('nlp:train-embedding', onTrain);
  }, [rate]);

  function setMode(mode: string) {
    setPlaying(false);
    setTrainer(makeTrainer(mode));
  }

  const scale = Math.max(0.65, ...trainer.E.flat().map(Math.abs), ...initial.flat().map(Math.abs)) * 1.24;
  const position = (vector: number[]) => ({x: 340 + vector[0] / scale * 260, y: 210 - vector[1] / scale * 155});
  const selectedIndex = trainer.vocab.indexOf(selected);
  const selectedVector = trainer.E[selectedIndex] || trainer.E[0];

  return <div className="embedding-workspace" data-embedding-workspace>
    <Panel title="Word embeddings" detail={<div className="plot-header-actions"><span className="panel-kicker">ACTUAL 2D WEIGHTS</span><button className="button button-primary" onClick={() => step()}>Train one step</button></div>} className="embedding-plot-panel">
      <div className="plot-legend"><span><i className="legend-dot mint" />Current vector</span><span><i className="legend-dot outline" />Initial position</span><span><i className="legend-line" />Movement</span></div>
      <svg className="embedding-svg" viewBox="0 0 680 420" role="img" aria-label="Two-dimensional plot of the current learned input vectors and their initial positions">
        <rect x="0" y="0" width="680" height="420" fill="transparent" />
        {[80, 210, 340, 470, 600].map(x => <line key={`x${x}`} x1={x} y1="25" x2={x} y2="390" className="chart-grid" />)}
        {[55, 132, 210, 288, 365].map(y => <line key={`y${y}`} x1="35" y1={y} x2="650" y2={y} className="chart-grid" />)}
        <line x1="340" y1="25" x2="340" y2="390" className="chart-axis" /><line x1="35" y1="210" x2="650" y2="210" className="chart-axis" />
        <text x="570" y="407" className="axis-label">dimension 1</text><text x="12" y="116" className="axis-label" transform="rotate(-90 12 116)">dimension 2</text>
        {trainer.vocab.map((word: string, index: number) => {
          const from = position(initial[index]); const to = position(trainer.E[index]);
          const isSelected = word === selected;
          return <g key={word} className="plot-point" onClick={() => setSelected(word)} tabIndex={0} role="button" aria-label={`${word}: vector ${trainer.E[index].map((x: number) => format(x, 3)).join(', ')}`} onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); setSelected(word);}}}>
            {trainer.step > 0 && <><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="movement-line" /><circle cx={from.x} cy={from.y} r="5" className="initial-point" /></>}
            <circle cx={to.x} cy={to.y} r={isSelected ? 9 : 6.5} className={isSelected ? 'current-point selected' : 'current-point'} />
            <text x={to.x + 12} y={to.y - 10} className={isSelected ? 'point-label selected' : 'point-label'}>{word}</text>
          </g>;
        })}
      </svg>
      <div className="word-picker" aria-label="Select a plotted word">{trainer.vocab.map((word: string) => <button key={word} type="button" className={word === selected ? 'active' : ''} onClick={() => setSelected(word)}>{word}</button>)}</div>
      <div className="plot-caption"><span>Step <strong>{trainer.step}</strong></span><span>Selected: <strong>{selected}</strong> [{selectedVector.map((x: number) => format(x, 3)).join(', ')}]</span></div>
    </Panel>

    <Panel title="Prediction inspector" className="embedding-inspector">
      <div className="inspector-target"><span>Target word for this update</span><strong>{targetWord}</strong></div>
      <div className="inspector-label">SOFTMAX PROBABILITIES</div>
      <ProbabilityBars items={scores} selected={targetWord} />
      <div className="loss-box"><span>Current example loss</span><strong>{format(forward.loss, 4)}</strong><small>−log P({targetWord})</small></div>
      {trainer.last && <p className="fine-print">Last updated pair: {format(trainer.last.before.loss, 3)} → {format(trainer.last.after.loss, 3)} loss immediately after its update.</p>}
    </Panel>

    <Panel title="One training example" detail={<span className="panel-kicker">{trainer.mode === 'skipgram' ? 'SKIP-GRAM' : 'CBOW'}</span>} className="training-panel">
      <div className="training-flow">
        <div className="flow-stage"><span>{trainer.mode === 'skipgram' ? 'Center word' : 'Context words'}</span><strong>{pair.inputs.map((index: number) => trainer.vocab[index]).join(' + ')}</strong></div>
        <span className="flow-connector" aria-hidden="true">→</span>
        <div className="flow-stage vector-stage"><span>{trainer.mode === 'skipgram' ? 'Input vector' : 'Averaged input vectors'}</span><strong>[{forward.hidden.map((x: number) => format(x, 3)).join(', ')}]</strong></div>
        <span className="flow-connector" aria-hidden="true">→</span>
        <div className="flow-stage"><span>Model predicts</span><strong className="mint-text">{targetWord}</strong></div>
      </div>
      <div className="training-controls"><Segmented options={[["skipgram", 'Skip-gram'], ["cbow", 'CBOW']]} value={trainer.mode} onChange={setMode} label="Embedding training mode" /><label className="range-control">Learning rate <strong>{format(rate, 2)}</strong><input type="range" min="0.05" max="1" step="0.05" value={rate} onChange={event => setRate(Number(event.target.value))} /></label><div className="training-buttons"><button className="button button-primary" onClick={() => step()}>Train one step</button><button className="button" onClick={() => step(20)}>Train 20</button><button className="button button-quiet" aria-pressed={playing} onClick={() => setPlaying(value => !value)}>{playing ? 'Pause' : 'Play'}</button><button className="button button-quiet" onClick={() => {setPlaying(false); setTrainer(makeTrainer(trainer.mode));}}>Reset</button></div></div>
      <p className="fine-print">Training text: {corpus.map(sentence => `“${sentence}”`).join(' · ')}. Context radius = 1. The plotted coordinates are the model’s input weights; output weights are trained separately.</p>
    </Panel>

    <div className="embedding-bottom">
      <Panel title="Under the hood"><div className="stat-row"><Stat value={trainer.vocab.length} label="Vocabulary" /><Stat value={pair.inputs.length} label="Input words" /><Stat value={format(forward.probabilities[pair.target], 4)} label="Target probability" tone="mint" /></div><Formula concept="embeddings" caption="The model takes the selected input vector, scores every output word with a dot product, normalizes those scores with softmax, and adjusts both weight tables to reduce loss.">P(target | input) = softmax(U · embedding)<br />loss = −log P(target | input)</Formula></Panel>
      <div className="side-notes"><Challenge question="What changes in the plot when you train one step?" answer="The displayed dots use the trainable input vectors. An update changes some of those weights, so the corresponding dots move. The output weight table also changes, though it is not plotted." /><div className="concept-note"><strong>Course note</strong><p>CBOW predicts a center word from its neighbors; skip-gram predicts neighbors from the center word. The lecture slide describes a nonlinear CBOW hidden layer. This demo uses the log-linear architecture in the <a href="https://arxiv.org/abs/1301.3781" target="_blank" rel="noreferrer">original Word2Vec paper</a>.</p></div></div>
    </div>
  </div>;
}
