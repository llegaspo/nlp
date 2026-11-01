import type { ReactNode } from 'react';
import EquationGuide from './EquationGuide';
import type {EquationConcept} from '../data/equations';

export function Panel({title, detail, children, className = ''}: {title: string; detail?: ReactNode; children: ReactNode; className?: string}) {
  return <section className={`panel ${className}`}><div className="panel-heading"><h2>{title}</h2>{detail && <div className="panel-detail">{detail}</div>}</div><div className="panel-content">{children}</div></section>;
}

export function Formula({children, caption, concept}: {children?: ReactNode; caption?: ReactNode; concept: EquationConcept}) {
  return <EquationGuide key={concept} concept={concept} compact caption={caption}>{children}</EquationGuide>;
}

export function Segmented<T extends string | number>({options, value, onChange, label}: {options: [T, string][]; value: T; onChange: (value: T) => void; label: string}) {
  return <div className="segmented" role="group" aria-label={label}>{options.map(([option, text]) => <button key={option} type="button" className={value === option ? 'selected' : ''} aria-pressed={value === option} onClick={() => onChange(option)}>{text}</button>)}</div>;
}

export function Stat({value, label, tone}: {value: ReactNode; label: string; tone?: 'mint' | 'amber'}) {
  return <div className={`stat ${tone || ''}`}><strong>{value}</strong><span>{label}</span></div>;
}

export function ProbabilityBars({items, selected, max = 1}: {items: [string, number][]; selected?: string; max?: number}) {
  return <div className="probability-bars">{items.map(([name, value]) => <div className={`probability-row ${selected === name ? 'is-selected' : ''}`} key={name}><span title={name}>{name}</span><div className="bar-track"><div className="bar-fill" style={{width: `${Math.max(0, Math.min(100, 100 * value / max))}%`}} /></div><strong>{format(value, 3)}</strong></div>)}</div>;
}

export function format(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'undefined';
  if (value === -Infinity) return '−∞';
  if (value === Infinity) return '∞';
  return Number(value.toFixed(digits)).toString();
}

export function Challenge({question, answer}: {question: string; answer: string}) {
  return <details className="challenge"><summary><span>Quick prediction</span>{question}</summary><p>{answer}</p></details>;
}

export function Empty({children}: {children: ReactNode}) {
  return <div className="empty-state">{children}</div>;
}
