import assert from 'node:assert/strict';
import {attentionExample, scaledAttention, positionalEncoding, decodingDistribution, sampleIndex, project} from '../src/lib/transformer.js';
import {conditional, ngramModel, scoreSentence, interpolation} from '../src/lib/math.js';
const close = (a,b) => assert.ok(Math.abs(a-b) < 1e-10, `${a} ≈ ${b}`);

// Analytic attention: equal scores must average values, independently of Q/K labels.
const equal = scaledAttention([[0,0]], [[1,0],[0,1]], [[2,4],[6,8]]);
assert.deepEqual(equal.weights, [[0.5,0.5]]);
assert.deepEqual(equal.output, [[4,6]]);
assert.deepEqual(project([[1,2]], [[3,4],[5,6]]), [[13,16]]);
for (let head=0; head<2; head++) for (const causal of [true,false]) {
  const model=attentionExample(head, causal);
  model.weights.forEach((row,i)=> {
    close(row.reduce((s,p)=>s+p,0),1);
    row.forEach((p,j)=> {if(causal && j>i) assert.equal(p,0);});
    for(let d=0;d<2;d++) {
      const vals=model.V.map(v=>v[d]);
      assert.ok(model.output[i][d] >= Math.min(...vals)-1e-10 && model.output[i][d] <= Math.max(...vals)+1e-10);
    }
  });
  if(causal) assert.deepEqual(model.output[0],model.V[0]);
}
assert.notDeepEqual(attentionExample(0).weights,attentionExample(1).weights);
assert.deepEqual(positionalEncoding(0,4),[0,1,0,1]);
close(positionalEncoding(1,4)[2],Math.sin(0.01));
assert.deepEqual(decodingDistribution([2,1,0],1,1),[1,0,0]);
close(decodingDistribution([2,1,0]).reduce((a,b)=>a+b),1);
assert.ok(decodingDistribution([2,1,0],0.2)[0] > decodingDistribution([2,1,0],2)[0]);
assert.deepEqual(decodingDistribution([10002,10001],1),decodingDistribution([2,1],1));
assert.throws(()=>decodingDistribution([1,2],0));
assert.equal(sampleIndex([0,0.25,0.75],0),1);
assert.equal(sampleIndex([0,0.25,0.75],0.25),2);
assert.equal(sampleIndex([0.25,0.75,0],0.999),1);

// Regression: unigram estimates must ignore every supplied history (slice(-0) does not).
const model=ngramModel(['a b','a c']);
close(conditional(model,['unseen','history'],'a',1).value,2/6);
close(scoreSentence(model,'a b',1,'mle').perplexity,Math.pow(54,1/3));
close(model.vocab.reduce((s,w)=>s+interpolation(model,['unseen','history'],w).value,0),1);
console.log('Attention, decoding, positional encoding, and unigram regression checks passed.');
