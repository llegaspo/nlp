import {softmax} from './math.js';

// Explicit teaching vectors. These are not weights from a pretrained model.
export const ATTENTION_TOKENS = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
export const ATTENTION_INPUTS = [[0.2, 0.8], [1, 0.2], [0.6, -0.4], [-0.2, 0.7], [0.3, 0.9], [0.8, 0.1]];
export const ATTENTION_HEADS = [
  {Q: [[1, 0], [0, 1]], K: [[1, 0], [0, 1]], V: [[1, 0.5], [-0.5, 1]]},
  {Q: [[0, 1], [-1, 0]], K: [[0.7, -0.5], [0.4, 1]], V: [[0.5, -1], [1, 0.5]]},
];

export function project(rows, weights) {
  return rows.map(row => weights[0].map((_, col) => row.reduce((sum, x, i) => sum + x * weights[i][col], 0)));
}

export function scaledAttention(Q, K, V, causal = false) {
  if (!Q.length || !K.length || K.length !== V.length || !Q[0].length ||
      Q.some(row => row.length !== K[0].length) || K.some(row => row.length !== Q[0].length) ||
      V.some(row => row.length !== V[0].length) || ![...Q, ...K, ...V].flat().every(Number.isFinite)) {
    throw new Error('Attention requires nonempty finite matrices with compatible dimensions.');
  }
  const scores = Q.map((q, i) => K.map((k, j) => causal && j > i ? -Infinity : q.reduce((sum, x, d) => sum + x * k[d], 0) / Math.sqrt(q.length)));
  const weights = scores.map(softmax);
  const output = weights.map(row => V[0].map((_, d) => row.reduce((sum, weight, j) => sum + weight * V[j][d], 0)));
  return {scores, weights, output};
}

export function attentionExample(head = 0, causal = false) {
  const projection = ATTENTION_HEADS[head];
  const Q = project(ATTENTION_INPUTS, projection.Q);
  const K = project(ATTENTION_INPUTS, projection.K);
  const V = project(ATTENTION_INPUTS, projection.V);
  return {Q, K, V, ...scaledAttention(Q, K, V, causal)};
}

export function positionalEncoding(position, dimensions = 8) {
  return Array.from({length: dimensions}, (_, d) => {
    const angle = position / Math.pow(10000, 2 * Math.floor(d / 2) / dimensions);
    return d % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
  });
}

export function decodingDistribution(logits, temperature = 1, topK = logits.length) {
  if (!logits.length || !logits.every(Number.isFinite) || !Number.isFinite(temperature) || temperature <= 0 || !Number.isInteger(topK) || topK < 1) {
    throw new Error('Use finite logits, positive temperature, and a positive integer top-k.');
  }
  const ranked = logits.map((value, index) => ({value, index})).sort((a, b) => b.value - a.value || a.index - b.index);
  const keep = new Set(ranked.slice(0, topK).map(item => item.index));
  return softmax(logits.map((value, i) => keep.has(i) ? value / temperature : -Infinity));
}

export function sampleIndex(probabilities, draw = Math.random()) {
  if (draw < 0 || draw >= 1) throw new Error('A random draw must be in [0,1).');
  let total = 0;
  for (let i = 0; i < probabilities.length; i++) {
    total += probabilities[i];
    if (draw < total) return i;
  }
  return probabilities.findLastIndex(p => p > 0);
}

export const GENERATION_VOCAB = ['cat', 'dog', 'sat', 'slept', 'on', 'the', 'mat', 'sofa', '.', '</s>'];
// Hand-authored last-token score table to isolate decoding, not a learned LLM.
export const GENERATION_LOGITS = {
  the: [3.2, 2.6, -1, -1.2, -1, -2, 2, 1.6, -2, -3],
  cat: [-2, -2, 3.1, 2.5, -1, -1, -2, -2, 0, -1],
  dog: [-2, -2, 2.3, 3.2, -1, -1, -2, -2, 0, -1],
  sat: [-2, -2, -1, -1, 3.5, -1, -2, -2, 1, 0],
  slept: [-2, -2, -1, -1, 2.8, -1, -2, -2, 2.5, 1],
  on: [-1, -1, -2, -2, -2, 4, -1, -1, -2, -3],
  mat: [-2, -2, -1, -1, -1, -1, -2, -2, 3.5, 2],
  sofa: [-2, -2, -1, -1, -1, -1, -2, -2, 3.5, 2],
  '.': [-2, -2, -2, -2, -2, 1, -2, -2, -2, 5],
};
