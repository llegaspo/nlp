import type {EquationConcept} from '../data/equations';
import {cosine, editDistance, softmax} from './math.js';
import {positionalEncoding, scaledAttention} from './transformer.js';

export type TinyExample = {
  choices: [string, string];
  parts: [string, string][];
  result: string;
  why: string;
  value?: number | null;
  bars?: [string, number][];
  tokens?: string[];
  vectors?: [number[], number[]];
  branches?: [string, number][];
};
const f = (n: number) => Number.isFinite(n) ? String(Number(n.toFixed(3))) : '∞';
const percent = (n: number) => `${Number((n * 100).toFixed(1))}%`;
const vector = (v: number[]) => `[${v.map(f).join(', ')}]`;

// Independent, deliberately small teaching examples. Live lab values stay in their panels.
export function equationExample(concept: EquationConcept, alternate = false): TinyExample {
  switch (concept) {
    case 'intro': return {
      choices: ['Find sentiment', 'Find a place'],
      parts: alternate ? [['Text', 'Meet me in Manila'], ['Pieces', 'Meet · me · in · Manila'], ['Task', 'Find a location']] : [['Text', 'I loved the tea'], ['Pieces', 'I · loved · the · tea'], ['Task', 'Classify sentiment']],
      result: alternate ? 'Location: Manila' : 'Sentiment: positive',
      why: 'These are hand-written illustrations of a task, not predictions from a running language model.',
    };
    case 'tokens': {
      const tokens = alternate ? ['tea', 'tea', 'tea', 'coffee'] : ['tea', 'tea', 'coffee'];
      return {choices: ['Three tokens', 'Add another tea'], tokens, parts: [['Every occurrence', String(tokens.length)], ['Different strings', String(new Set(tokens).size)]], result: `${tokens.length} instances · 2 types`, why: 'Adding another tea increases the number of occurrences, but adds no new type.', value: tokens.length};
    }
    case 'bigrams': {
      const tokens = alternate ? ['<s>', 'we', 'like', 'tea', '</s>'] : ['<s>', 'we', 'like', 'cake', '</s>'];
      return {choices: ['Order cake', 'Order tea'], tokens, parts: tokens.slice(1).map((token, i) => [`Pair ${i + 1}`, `${tokens[i]} → ${token}`]), result: '4 pairs from one 3-word order', why: 'One prediction for each word, plus one for the end. The start marker supplies history.', value: 4};
    }
    case 'ngrams': {
      const count = alternate ? 2 : 3;
      const p = count / 6;
      return {choices: ['Predict tea', 'Predict coffee'], parts: [['Matching continuations', `${count} tallies`], ['All continuations', '6 tallies'], ['Take the share', `${count} out of 6`]], bars: [['tea', .5], ['coffee', 2 / 6], ['cake', 1 / 6]], result: `${percent(p)} chance of ${alternate ? 'coffee' : 'tea'}`, why: 'This is a share of the observed continuations after “like”, not a claim about every customer.', value: p};
    }
    case 'smoothing': {
      const k = alternate ? 1 : 0;
      const counts = [1, 0, 0];
      const values = counts.map(n => (n + k) / (1 + 3 * k));
      return {choices: ['Only observed counts', 'Add 1 to every bucket'], parts: [['Cake count', `0 + ${k}`], ['New total', `1 + ${k} × 3 = ${1 + 3 * k}`]], bars: ['tea', 'coffee', 'cake'].map((name, i) => [name, values[i]]), result: `Unseen cake gets ${percent(values[2])}`, why: 'This miniature vocabulary has only three outputs. One extra tally per bucket adds three to the total. The café exercise uses nine outputs instead.', value: values[2]};
    }
    case 'sequence': {
      const second = alternate ? 0 : .25;
      return {choices: ['Both steps possible', 'One impossible step'], parts: [['First prediction', '1 in 2'], ['Final prediction', alternate ? '0 in 4' : '1 in 4'], ['Multiply', `0.5 × ${second}`]], result: `${percent(.5 * second)} for the complete path`, why: 'Imagine eight equally likely routes: with these conditional chances, only one follows both choices. A zero removes every route to that sequence.', value: .5 * second};
    }
    case 'perplexity': {
      const ps = alternate ? [.5, 0] : [.5, .125];
      const average = -ps.reduce((sum, p) => sum + Math.log(p), 0) / ps.length;
      const pp = Math.exp(average);
      return {choices: ['Different token chances', 'One zero chance'], parts: [['Correct-token chances', ps.map(percent).join(' · ')], ['Average surprise', f(average)], ['Convert back', `exp(${f(average)})`]], bars: [['token 1', ps[0]], ['end token', ps[1]]], result: `Perplexity ${f(pp)}`, why: alternate ? 'One zero makes surprise and perplexity infinite.' : 'The geometric mean of 1/2 and 1/8 is 1/4. Its inverse is 4. This is not the inverse of their ordinary arithmetic average.', value: pp};
    }
    case 'context-vectors': {
      const a = [2, 1], b = alternate ? [1, 2] : [4, 2];
      const c = cosine(a, b);
      return {choices: ['Same direction, longer', 'Change the direction'], vectors: [a, b], parts: [['Multiply & add', `${a[0]} × ${b[0]} + ${a[1]} × ${b[1]} = ${c.dot}`], ['Product of lengths', f(c.left * c.right)]], result: `Direction similarity: ${f(c.value!)}`, why: alternate ? 'The second arrow tilts away, so similarity falls to 0.8.' : 'The second arrow is twice as long but points the same way. Similarity stays 1.', value: c.value};
    }
    case 'edit-distance': {
      const replacement = alternate ? 3 : 1;
      const model = editDistance('a', 'b', {insert: 1, delete: 1, substitute: replacement});
      return {choices: ['Cheap replacement', 'Expensive replacement'], branches: [['Delete', 2], ['Insert', 2], ['Replace', replacement]], parts: [['Already solved prefixes', '0, 1, 1'], ['Compare final characters', 'a → b']], result: `Cheapest total: ${model.distance}`, why: alternate ? 'Replacing costs 3, but deleting a and inserting b costs only 2. Keep the cheaper route.' : 'Above + deletion = 2; left + insertion = 2; diagonal + replacement = 1.', value: model.distance};
    }
    case 'embeddings': {
      const p = alternate ? .8 : .2;
      return {choices: ['Target gets 20%', 'Target gets 80%'], parts: [['Input vector', 'Look up “tea”'], ['Target chance', percent(p)], ['Surprise', `−log(${p})`]], bars: [['correct target', p], ['other words combined', 1 - p]], result: `Loss ${f(-Math.log(p))}`, why: 'The word vectors and output weights produce the probabilities. Giving more probability to the correct target lowers its loss.', value: -Math.log(p)};
    }
    case 'neural': {
      const bias = alternate ? -3 : 0;
      const sum = 2 * .5 + 1 * 1 + bias;
      const active = Math.max(0, sum);
      return {choices: ['Positive hidden sum', 'Negative hidden sum'], parts: [['Two weighted inputs', '2 × 0.5 + 1 × 1 = 2'], ['Add the bias', `2 + (${bias}) = ${sum}`], ['ReLU gate', sum < 0 ? 'Close: replace with 0' : 'Open: keep the sum']], result: `Hidden output: ${active}`, why: 'The next layer uses this activity to score classes. A hidden activation is not itself a class probability.', value: active};
    }
    case 'gradient': {
      const rate = alternate ? 1.2 : .1;
      const current = 2, slope = 2 * current, next = current - rate * slope;
      return {choices: ['Small step: 0.1', 'Too large: 1.2'], parts: [['Current parameter', '2'], ['Slope of toy loss θ²', String(slope)], ['Subtract the step', `2 − ${rate} × 4 = ${f(next)}`]], result: `Loss: 4 → ${f(next ** 2)}`, why: alternate ? 'The step overshoots zero so far that the loss rises. A gradient step is not a guarantee of improvement.' : 'On this simple bowl-shaped loss, a small step toward zero reduces the loss.', value: next ** 2};
    }
    case 'llms': {
      const temperature = alternate ? .5 : 1;
      const logits = [2, 1, 0], weights = logits.map(score => Math.exp(score / temperature));
      const ps = softmax(logits.map(score => score / temperature));
      return {choices: ['Temperature 1', 'Temperature 0.5'], parts: [['Raw scores', '2 · 1 · 0'], ['Positive weights', weights.map(f).join(' · ')], ['Total weight', f(weights.reduce((a, b) => a + b, 0))]], bars: ['tea', 'coffee', 'cake'].map((name, i) => [name, ps[i]]), result: `Tea’s share: ${percent(ps[0])}`, why: 'The scores keep their order. Lower positive temperature concentrates more probability on the highest score; it does not make the answer more factual.', value: ps[0]};
    }
    case 'attention': {
      const q = [[1, 0]], keys = [[1, 0], [0, 1]], values = [[2, 0], [0, 2]];
      const result = scaledAttention(q, keys, values, alternate);
      return {choices: ['Both positions visible', 'Hide the future position'], parts: [['Query', '[1, 0]'], ['Scaled match scores', result.scores[0].map(n => n === -Infinity ? 'hidden' : f(n)).join(' · ')], ['Values to mix', '[2, 0] and [0, 2]']], bars: result.weights[0].map((p, i) => [`position ${i}`, p]), result: `Blended vector: ${vector(result.output[0])}`, why: alternate ? 'At position 0, a causal mask excludes position 1. All attention goes to the first value.' : 'About 67% of the first vector plus 33% of the second gives this blend. These weights refer to input positions.', value: result.weights[0][0]};
    }
    case 'positions': {
      const position = alternate ? 1 : 0, v = positionalEncoding(position, 4);
      return {choices: ['Position 0', 'Position 1'], parts: [['Position', String(position)], ['Fast sine / cosine', `${f(v[0])} · ${f(v[1])}`], ['Slow sine / cosine', `${f(v[2])} · ${f(v[3])}`]], result: `Signature: ${vector(v)}`, why: 'With four dimensions, the second pair uses position / 100. Each pair samples a different speed of wave.', value: v[0]};
    }
    case 'masked': {
      const ps = alternate ? [.8, .2] : [.8];
      const loss = -ps.reduce((sum, p) => sum + Math.log(p), 0) / ps.length;
      return {choices: ['Score one target', 'Score both targets'], tokens: ['the', '[cat]', 'likes', alternate ? '[tea]' : 'tea'], parts: [['Selected target chances', ps.map(percent).join(' · ')], ['Their surprises', ps.map(p => f(-Math.log(p))).join(' + ')], ['Divide by selected count', String(ps.length)]], result: `Mean target loss: ${f(loss)}`, why: 'Brackets mark selected targets, not necessarily literal [MASK] inputs. Context-only positions do not enter this average.', value: loss};
    }
    case 'responsible': {
      const a = alternate ? 80 : 20, b = 100 - a;
      const correctA = a * .95, correctB = b * .5;
      return {choices: ['20 examples from A', '80 examples from A'], parts: [['A: 95% accurate', `${a} examples → ${correctA} correct`], ['B: 50% accurate', `${b} examples → ${correctB} correct`], ['All examples', '100']], result: `Overall accuracy: ${correctA + correctB}%`, why: 'Neither group’s accuracy changes. The overall score changes only because the group sizes change.', value: (correctA + correctB) / 100};
    }
    case 'interpolation': {
      const weights = alternate ? [.6, .25, .15] : [.15, .25, .6], ps = [.1, .4, .8];
      const contributions = ps.map((p, i) => p * weights[i]);
      const result = contributions.reduce((a, b) => a + b, 0);
      return {choices: ['Favor long history', 'Favor short history'], parts: ps.map((p, i) => [`${i + 1}-gram contribution`, `${p} × ${weights[i]} = ${f(contributions[i])}`]), result: `Mixed next-word chance: ${percent(result)}`, why: 'Each model supplies a full distribution; these are its chances for one chosen word. The mixing weights sum to one.', value: result};
    }
    case 'backoff': {
      const discounts = alternate ? 2 : 1, score = .5 * .4 ** discounts;
      return {choices: ['Fall back once', 'Fall back twice'], parts: [['Available shorter estimate', '0.5'], ['Discount per fallback', '0.4'], ['Fallbacks needed', String(discounts)]], result: `Backoff score: ${f(score)}`, why: 'One fallback gives 0.4 × 0.5. Two give 0.4 × 0.4 × 0.5. Keep the result as a score, not a probability.', value: score};
    }
    case 'good-turing': {
      const once = 5, twice = alternate ? 5 : 3, adjusted = 2 * twice / once;
      const total = once + 2 * twice;
      return {choices: ['3 types seen twice', '5 types seen twice'], parts: [['Seen once', `${once} event types`], ['Seen twice', `${twice} event types`], ['Adjust a count of 1', `2 × ${twice} ÷ ${once}`]], result: `Adjusted count: ${f(adjusted)}`, why: `In this sample containing only counts 1 and 2, there are ${total} occurrences. The total unseen mass is 5/${total}, or ${percent(once / total)}. Dividing it among N₀ possible unseen types gives the per-type amount.`, value: adjusted};
    }
    case 'wordpiece': {
      const frequency = alternate ? 8 : 4, score = 4 / frequency ** 2;
      return {choices: ['Pieces usually together', 'Pieces also occur elsewhere'], parts: [['Pair occurrences', '4'], ['Each individual piece', `${frequency} occurrences`], ['Divide by their product', `4 ÷ (${frequency} × ${frequency})`]], result: `Association score: ${f(score)}`, why: 'The pair count stays the same. Its association score falls when each piece is common elsewhere. This is the illustrative training score used by the Hugging Face course.', value: score};
    }
    case 'bpe': {
      const tokens = alternate ? ['lo', 'w', 'lo', 'w'] : ['l', 'o', 'w', 'l', 'o', 'w'];
      return {choices: ['Before merging', 'Merge l + o'], tokens, parts: [['Chosen pair', 'l + o'], ['Adjacent occurrences', '2'], ['New piece', 'lo']], result: `${tokens.length} pieces after this stage`, why: 'The words are “low” and “low”, kept separate. Both l → o and o → w occur twice; this toy chooses l → o by its tie rule.', value: tokens.length};
    }
    case 'unigram': {
      const pa = .5, pb = .2, pab = .3;
      const before = pa * pb + pab;
      const after = (pa / (1 - pab)) * (pb / (1 - pab));
      return {choices: ['Two possible splits', 'Remove the ab piece'], parts: alternate ? [['Remaining split', 'a · b'], ['Renormalize probabilities', 'a: 5/7 · b: 2/7'], ['Text probability', f(after)]] : [['Split a · b', '0.5 × 0.2 = 0.1'], ['Split ab', '0.3'], ['Add both paths', f(before)]], result: alternate ? `Removal increases loss by ${f(-Math.log(after) + Math.log(before))}` : `Text loss: ${f(-Math.log(before))}`, why: 'This one-sequence example has piece probabilities a=0.5, b=0.2, ab=0.3. Training sums over splits; decoding chooses the highest-scoring split. Removal cost is measured after renormalizing, before refitting.', value: alternate ? -Math.log(after) + Math.log(before) : -Math.log(before)};
    }
  }
}
