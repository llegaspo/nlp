import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {conditional, ngramModel, scoreSentence} from '../src/lib/math.js';

const exercise = JSON.parse(readFileSync(new URL('../src/data/cafeExercise.json', import.meta.url), 'utf8'));
// Python executes and validates the displayed cells, then sends its results on stdin.
const expected = JSON.parse(readFileSync(0, 'utf8'));
const model = ngramModel(exercise.training);
assert.deepEqual([...model.vocab].sort(), expected.vocabulary);
const near = (actual, value) => assert.ok(Math.abs(actual - value) < 1e-10, `${actual} ≠ ${value}`);
for (const {history, k, values} of expected.probabilities) {
  expected.vocabulary.forEach((word, i) => {
    const {value} = conditional(model, [history], word, 2, k === 0 ? 'mle' : 'addk', k);
    if (values[i] === null) assert.equal(value, null);
    else near(value, values[i]);
  });
}
for (const {sentence, k, value} of expected.scores) {
  const normalized = (sentence.toLowerCase().match(/[a-z]+/g) || []).join(' ');
  const actual = scoreSentence(model, normalized, 2, k === 0 ? 'mle' : 'addk', k).perplexity;
  if (value === null) assert.equal(actual, Infinity);
  else near(actual, value);
}
console.log('Exercise cells, displayed outputs, bonus, sentence boundaries, held-out evaluation, and Python/preview parity passed.');
