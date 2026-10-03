import assert from 'node:assert/strict';
import { LESSON_CORPUS, bpe, cooccurrence, conditional, editDistance, interpolation, makeNetwork, makeTrainer, networkStep, ngramModel, scoreSentence, trainStep, trainerForward, words } from '../src/lib/math.js';

assert.deepEqual(words('The the.', {punctuation: true}), ['the', 'the', '.']);
assert.equal(bpe('low low lower', 1).history[0].count, 3);

const unitEdit = editDistance('STRENGTH', 'TREND');
const costlySubstitution = editDistance('STRENGTH', 'TREND', {insert: 1, delete: 1, substitute: 2});
assert.equal(unitEdit.distance, 4);
assert.equal(costlySubstitution.distance, 5);
assert.equal(unitEdit.operations.filter(operation => operation.op !== 'match').length, 4);

const context = cooccurrence(LESSON_CORPUS, 1);
assert.equal(context.counts.cat.the, 3);
assert.equal(context.counts.dog.the, 2);

const model = ngramModel(LESSON_CORPUS);
assert.equal(conditional(model, ['the'], 'cat', 2).count, 3);
assert.equal(conditional(model, ['the'], 'cat', 2).denominator, 8);
assert.equal(conditional(model, ['cat'], 'chased', 2).value, 0);
for (const history of ['the', 'cat', 'dog']) {
  for (const method of ['mle', 'laplace', 'addk']) {
    const sum = model.vocab.reduce((total, word) => total + (conditional(model, [history], word, 2, method, 0.3).value || 0), 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${method} sums to 1 after ${history}`);
  }
  const sum = model.vocab.reduce((total, word) => total + (interpolation(model, ['the', history], word).value || 0), 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `interpolation sums to 1 after ${history}`);
}
assert.equal(scoreSentence(model, 'the cat chased the fish', 2, 'mle').perplexity, Infinity);
assert.ok(Number.isFinite(scoreSentence(model, 'the cat chased the fish', 2, 'addk').perplexity));

for (const mode of ['cbow', 'skipgram']) {
  const trainer = makeTrainer(mode);
  const pair = trainer.pairs[0];
  const before = trainerForward(trainer, pair).loss;
  trainStep(trainer, 0.45);
  assert.ok(trainerForward(trainer, pair).loss < before, `${mode} step lowers loss on its pair`);
}
const network = makeNetwork();
const result = networkStep(network);
assert.ok(result.after.loss < result.before.loss);

console.log('Core lesson calculations passed.');
