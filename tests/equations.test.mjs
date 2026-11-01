import assert from 'node:assert/strict';
import {equationStories} from '../src/data/equations.ts';
import {equationExample} from '../src/lib/equationExamples.ts';
import {lessons} from '../src/data/course.ts';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);
for (const lesson of lessons) assert.ok(equationStories[lesson.id], `Missing diagram for ${lesson.id}`);
for (const concept of Object.keys(equationStories)) {
  const before = equationExample(concept, false), after = equationExample(concept, true);
  assert.notDeepEqual(before, after, `${concept}: changing the example must do something`);
  for (const example of [before, after]) {
    assert.ok(example.parts.length >= 2);
    assert.ok(example.result && example.why);
    if ('value' in example) assert.ok(!Number.isNaN(example.value), concept);
    if (example.bars) {
      assert.ok(example.bars.every(([, value]) => value >= 0 && value <= 1));
      // Perplexity bars describe distinct predictions, not one shared distribution.
      if (concept !== 'perplexity') near(example.bars.reduce((sum, [, p]) => sum + p, 0), 1);
    }
  }
}
const value = (concept, alternate = false) => equationExample(concept, alternate).value;
assert.equal(value('tokens'), 3);
assert.equal(value('tokens', true), 4);
assert.equal(value('bigrams'), 4);
assert.equal(value('ngrams'), 0.5);
near(value('ngrams', true), 1 / 3);
assert.equal(value('smoothing'), 0);
assert.equal(value('smoothing', true), 0.25);
assert.equal(value('sequence'), 1 / 8);
assert.equal(value('sequence', true), 0);
near(value('perplexity'), 4);
assert.equal(value('perplexity', true), Infinity);
near(value('context-vectors'), 1);
near(value('context-vectors', true), 0.8);
assert.equal(value('edit-distance'), 1);
assert.equal(value('edit-distance', true), 2);
assert.ok(value('embeddings', true) < value('embeddings'));
assert.equal(value('neural'), 2);
assert.equal(value('neural', true), 0);
assert.ok(value('gradient') < 4);
assert.ok(value('gradient', true) > 4);
assert.ok(value('llms', true) > value('llms'));
assert.equal(value('attention', true), 1);
assert.equal(equationExample('attention', true).bars[1][1], 0);
assert.equal(value('positions'), 0);
near(value('positions', true), Math.sin(1));
assert.ok(value('masked', true) > value('masked'));
near(value('responsible'), .59);
near(value('responsible', true), .86);
near(value('interpolation'), .595);
near(value('interpolation', true), .28);
near(value('backoff'), .2);
near(value('backoff', true), .08);
near(value('good-turing'), 1.2);
near(value('good-turing', true), 2);
near(value('wordpiece'), .25);
near(value('wordpiece', true), .0625);
assert.equal(value('bpe'), 6);
assert.equal(value('bpe', true), 4);
// All segmentation paths are summed; probabilities are renormalized on removal.
near(value('unigram'), -Math.log(.4));
near(value('unigram', true), Math.log(.4 / (10 / 49)));
console.log('Every equation has a diagram; miniature examples, normalization, masking, and mathematical edge cases passed.');
