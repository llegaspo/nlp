// Small, inspectable teaching models for Lesson 1B. None are production tokenizers.
export const LESSON_SENTENCE = 'They grabbed the sandwich that I’m holding, then they ran back to the house and started singing.';
export const SUBWORD_CORPUS = ['low lower lowest', 'new newer newest', 'care careful carefully', 'wash washing washed'];

export function lessonTokens(text, {lower = false, punctuation = false, splitClitic = false, nfkc = false} = {}) {
  let source = nfkc ? text.normalize('NFKC') : text;
  if (lower) source = source.toLocaleLowerCase();
  const matches = source.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu) || [];
  const result = [];
  for (const token of matches) {
    if (splitClitic && /['’]m$/iu.test(token) && token.length > 2) {
      result.push(token.slice(0, -2), token.slice(-2));
    } else if (punctuation || /[\p{L}\p{N}]/u.test(token)) result.push(token);
  }
  return result;
}

export function countTypes(tokens) {
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  return counts;
}

export function stripAccents(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

export const LEMMAS = new Map([
  ['am', 'be'], ['are', 'be'], ['is', 'be'], ['car', 'car'], ["car’s", 'car'], ["cars’", 'car'], ['cars', 'car'],
  ["boy’s", 'boy'], ['different', 'differ'], ['colors', 'color'],
]);
export function lookupLemma(form) { return LEMMAS.get(form.toLocaleLowerCase()) || form.toLocaleLowerCase(); }

export const MORPHEMES = [
  {word:'work-ed', kind:'inflection', parts:[['work','free root','work / action'],['-ed','inflection','past tense']]},
  {word:'care-ful-ly', kind:'derivation', parts:[['care','free root','concern'],['-ful','derivation','forms an adjective'],['-ly','derivation','forms an adverb']]},
  {word:'wash-ing', kind:'inflection', parts:[['wash','free root','clean'],['-ing','inflection','progressive form in this example']]},
  {word:'glass-es', kind:'inflection', parts:[['glass','free root','glass'],['-es','inflection','plural']]},
  {word:'I’m', kind:'clitic', parts:[['I','free form','pronoun'],['’m','clitic','reduced am; syntactically a word']]},
  {word:'quick-er', kind:'inflection', parts:[['quick','free root','fast'],['-er','inflection','comparative']]},
  {word:'quick-ness', kind:'derivation', parts:[['quick','free root','fast'],['-ness','derivation','forms a noun']]},
];

function pairsFrom(units, frequencies) {
  const counts = new Map(), singles = new Map();
  for (let w = 0; w < units.length; w++) {
    const pieces = units[w], frequency = frequencies[w];
    for (let i = 0; i < pieces.length; i++) singles.set(pieces[i], (singles.get(pieces[i]) || 0) + frequency);
    for (let i = 0; i < pieces.length - 1; i++) {
      const key = JSON.stringify([pieces[i], pieces[i + 1]]);
      counts.set(key, (counts.get(key) || 0) + frequency);
    }
  }
  return {counts, singles};
}

function replacePair(units, left, right, joined) {
  return units.map(parts => {
    const next = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === left && parts[i + 1] === right) { next.push(joined); i++; }
      else next.push(parts[i]);
    }
    return next;
  });
}

export function trainMerges(sequences, budget = 6, mode = 'bpe') {
  const frequencies = sequences.map(() => 1);
  let units = sequences.map(x => [...x]);
  const initial = units.map(x => [...x]);
  const vocab = new Set(units.flat());
  const history = [];
  for (let step = 0; step < Math.max(0, Math.min(16, budget)); step++) {
    const {counts, singles} = pairsFrom(units, frequencies);
    const candidates = [...counts].map(([key, count]) => {
      const [left, right] = JSON.parse(key);
      const score = mode === 'wordpiece' ? count / (singles.get(left) * singles.get(right)) : count;
      return {left, right, count, score};
    }).sort((a, b) => b.score - a.score || b.count - a.count || JSON.stringify([a.left,a.right]).localeCompare(JSON.stringify([b.left,b.right])));
    if (!candidates.length) break;
    const best = candidates[0];
    const joined = mode === 'wordpiece' ? best.left + best.right.replace(/^##/, '') : mode === 'byte' ? `${best.left}.${best.right}` : best.left + best.right;
    units = replacePair(units, best.left, best.right, joined);
    vocab.add(joined);
    history.push({...best, joined, candidates: candidates.slice(0, 8), units: units.map(x => [...x]), vocab: [...vocab]});
  }
  return {initial, units, history, vocab: [...vocab]};
}

export function wordSequences(lines, mode = 'bpe') {
  const words = lines.flatMap(line => lessonTokens(line, {lower: true}));
  if (mode === 'wordpiece') return words.map(word => [...word].map((char, i) => i ? `##${char}` : char));
  return words.map(word => [...word]);
}

export function encodeMerges(input, history, mode = 'bpe', stage = history.length, initialVocab = []) {
  if (mode === 'wordpiece') {
    const vocab = new Set(initialVocab);
    for (const entry of history.slice(0, stage)) vocab.add(entry.joined);
    const chars = [...input.toLocaleLowerCase()];
    const output = [];
    for (let i = 0; i < chars.length;) {
      let found = null, end = i;
      for (let j = chars.length; j > i; j--) {
        const piece = (i ? '##' : '') + chars.slice(i, j).join('');
        if (vocab.has(piece)) {found = piece; end = j; break;}
      }
      if (!found) return ['[UNK]'];
      output.push(found); i = end;
    }
    return output;
  }
  let units = mode === 'byte' ? byteUnits(input) : [...(mode === 'sentencepiece' ? input : input.toLocaleLowerCase())];
  if (mode !== 'byte' && units.some(unit => !initialVocab.includes(unit))) return ['[UNK]'];
  for (const entry of history.slice(0, stage)) units = replacePair([units], entry.left, entry.right, entry.joined)[0];
  return units;
}

export function byteUnits(text) { return [...new TextEncoder().encode(text)].map(byte => byte.toString(16).padStart(2, '0')); }
export function bytePieceLabel(piece) { return piece.split('.').map(hex => hex.toUpperCase()).join(' '); }
export function decodeBytePieces(pieces) {
  const bytes = pieces.flatMap(piece => piece.split('.').map(hex => parseInt(hex, 16)));
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

export function sentencePieceText(text) { const trimmed = text.trim(); return trimmed ? '▁' + trimmed.replace(/\s+/gu, '▁') : ''; }
export function sentencePieceSequences(lines) { return lines.filter(line => line.trim()).map(line => [...sentencePieceText(line)]); }

function logAdd(a, b) {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  const max = Math.max(a, b);
  return max + Math.log(Math.exp(a - max) + Math.exp(b - max));
}

function unigramLattice(text, probabilities) {
  const chars = [...text], n = chars.length;
  const forward = Array(n + 1).fill(-Infinity), backward = Array(n + 1).fill(-Infinity);
  forward[0] = 0; backward[n] = 0;
  const edges = Array.from({length:n}, () => []);
  for (let i = 0; i < n; i++) for (let end = i + 1; end <= Math.min(n, i + 6); end++) {
    const piece = chars.slice(i, end).join(''), p = probabilities.get(piece);
    if (p) edges[i].push({end, piece, logp: Math.log(p)});
  }
  for (let i = 0; i < n; i++) for (const edge of edges[i]) forward[edge.end] = logAdd(forward[edge.end], forward[i] + edge.logp);
  for (let i = n - 1; i >= 0; i--) for (const edge of edges[i]) backward[i] = logAdd(backward[i], edge.logp + backward[edge.end]);
  return {chars, edges, forward, backward, logLikelihood: forward[n]};
}

function fitUnigram(sequences, starting, iterations = 4) {
  let probabilities = new Map(starting);
  for (let iteration = 0; iteration < iterations; iteration++) {
    const expected = new Map([...probabilities.keys()].map(piece => [piece, 0]));
    for (const text of sequences) {
      const {edges, forward, backward, logLikelihood} = unigramLattice(text, probabilities);
      if (!Number.isFinite(logLikelihood)) continue;
      for (let i = 0; i < edges.length; i++) for (const edge of edges[i]) {
        const value = Math.exp(forward[i] + edge.logp + backward[edge.end] - logLikelihood);
        expected.set(edge.piece, expected.get(edge.piece) + value);
      }
    }
    // A tiny floor keeps candidate probabilities inspectable until pruning.
    const total = [...expected.values()].reduce((sum, x) => sum + x + 1e-6, 0);
    probabilities = new Map([...expected].map(([piece, x]) => [piece, (x + 1e-6) / total]));
  }
  return probabilities;
}

function corpusLikelihood(sequences, probabilities) {
  return sequences.reduce((sum, text) => sum + unigramLattice(text, probabilities).logLikelihood, 0);
}

export function segmentUnigram(text, probabilities, limit = 3) {
  const {chars, edges} = unigramLattice(text, probabilities);
  const paths = Array.from({length:chars.length + 1}, () => []);
  paths[0] = [{pieces:[], score:0}];
  for (let i = 0; i < chars.length; i++) for (const path of paths[i]) for (const edge of edges[i]) {
    paths[edge.end].push({pieces:[...path.pieces, edge.piece], score:path.score + edge.logp});
    paths[edge.end].sort((a, b) => b.score - a.score || a.pieces.join('|').localeCompare(b.pieces.join('|')));
    paths[edge.end] = paths[edge.end].slice(0, limit);
  }
  return paths[chars.length];
}

export function trainUnigram(sequences, removals = 5) {
  const seeds = new Map();
  for (const text of sequences) {
    const chars = [...text];
    for (let i = 0; i < chars.length; i++) for (let end = i + 1; end <= Math.min(chars.length, i + 6); end++) {
      const piece = chars.slice(i, end).join('');
      seeds.set(piece, (seeds.get(piece) || 0) + 1);
    }
  }
  const seedTotal = [...seeds.values()].reduce((a, b) => a + b, 0);
  let probabilities = fitUnigram(sequences, new Map([...seeds].map(([piece, count]) => [piece, count / seedTotal])));
  const initial = new Map(probabilities), history = [];
  const required = new Set(sequences.join('').split(''));
  for (let step = 0; step < Math.max(0, Math.min(removals, 10)); step++) {
    const baseline = corpusLikelihood(sequences, probabilities);
    const candidates = [];
    for (const piece of probabilities.keys()) {
      if (required.has(piece)) continue;
      const reduced = new Map(probabilities);
      reduced.delete(piece);
      const mass = [...reduced.values()].reduce((a,b) => a+b,0);
      for (const [key, p] of reduced) reduced.set(key, p / mass);
      const loss = baseline - corpusLikelihood(sequences, reduced);
      if (Number.isFinite(loss)) candidates.push({piece, loss, probability:probabilities.get(piece)});
    }
    candidates.sort((a,b) => a.loss-b.loss || a.piece.localeCompare(b.piece));
    if (!candidates.length) break;
    const removed = candidates[0];
    probabilities.delete(removed.piece);
    const mass = [...probabilities.values()].reduce((a,b) => a+b,0);
    probabilities = fitUnigram(sequences, new Map([...probabilities].map(([piece,p]) => [piece,p/mass])), 2);
    history.push({removed, candidates:candidates.slice(0, 8), probabilities:new Map(probabilities)});
  }
  return {initial, history, probabilities};
}
