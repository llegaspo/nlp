import {useEffect, useRef, useState, type ReactNode} from 'react';
import Icon from './Icons';

function highlight(line: string): ReactNode[] {
  const pattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(#.*$)|\b(def|return|for|in|if|else|not|and|or|from|import|as|raise|assert|True|False|None)\b|\b(\d+(?:\.\d+)?)\b/g;
  const fragments: ReactNode[] = [];
  let cursor = 0;
  for (const match of line.matchAll(pattern)) {
    const index = match.index!;
    fragments.push(line.slice(cursor, index));
    const kind = match[1] ? 'string' : match[2] ? 'comment' : match[3] ? 'keyword' : 'number';
    fragments.push(<span key={index} className={`syntax-${kind}`}>{match[0]}</span>);
    cursor = index + match[0].length;
  }
  fragments.push(line.slice(cursor));
  return fragments;
}

export default function CodeCell({code, title}: {code: string; title: string}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle');
  const codeRef = useRef<HTMLElement>(null);
  useEffect(() => setStatus('idle'), [code]);
  useEffect(() => {
    if (status === 'idle') return;
    const timer = window.setTimeout(() => setStatus('idle'), 5000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code);
      setStatus('copied');
    } catch {
      if (codeRef.current) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(codeRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setStatus('manual');
    }
  }

  return <section className="code-cell" aria-label={title}>
    <div className="code-cell-header">
      <div><Icon name="code" size={17}/><span>{title}</span><small>PYTHON 3</small></div>
      <button type="button" className="code-copy" onClick={copy} aria-label={`Copy ${title}`}>
        <Icon name={status === 'copied' ? 'check' : 'copy'} size={15}/>{status === 'copied' ? 'Copied!' : 'Copy code'}
      </button>
    </div>
    <pre tabIndex={0} aria-label={`${title} Python source`}><code ref={codeRef}>{code.trimEnd().split('\n').map((line, i, lines) =>
      <span className="code-line" key={i}>{highlight(line)}{i < lines.length - 1 ? '\n' : ''}</span>,
    )}</code></pre>
    <div className={`copy-status ${status === 'manual' ? 'manual-copy' : ''}`} role="status">
      {status === 'copied' ? 'Code copied. Paste it into a notebook code cell.' : status === 'manual' ? 'Code selected. Press Ctrl+C or Cmd+C to copy, or select the code manually.' : ''}
    </div>
  </section>;
}
