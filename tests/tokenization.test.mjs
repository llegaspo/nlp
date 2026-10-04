import assert from 'node:assert/strict';
import {
  LESSON_SENTENCE, SUBWORD_CORPUS, byteUnits, countTypes, decodeBytePieces, encodeMerges,
  lessonTokens, lookupLemma, segmentUnigram, sentencePieceSequences, sentencePieceText,
  stripAccents, trainMerges, trainUnigram, wordSequences,
} from '../src/lib/tokenization.js';

for (const [options, instances, types] of [
  [{},17,16],
  [{lower:true},17,15],
  [{punctuation:true},19,18],
  [{punctuation:true,lower:true},19,17],
  [{splitClitic:true},18,17],
]) {
  const tokens=lessonTokens(LESSON_SENTENCE,options);
  assert.equal(tokens.length,instances,JSON.stringify(options));
  assert.equal(countTypes(tokens).size,types,JSON.stringify(options));
  assert.equal([...countTypes(tokens).values()].reduce((a,b)=>a+b,0),tokens.length);
}
assert.deepEqual(lessonTokens(''),[]);
assert.deepEqual(lessonTokens('I’m here.',{splitClitic:true}),['I','’m','here']);
assert.equal(stripAccents('naïve cliché'),'naive cliche');
assert.equal(lookupLemma('are'),'be');
assert.equal(lookupLemma('cars'),'car');
assert.equal('ＡＢＣ ①'.normalize('NFKC'),'ABC 1');

const bpe=trainMerges(wordSequences(['low low lower']),1,'bpe');
assert.equal(bpe.history[0].count,3);
assert.deepEqual(encodeMerges('low',bpe.history,'bpe',0,bpe.initial.flat()),['l','o','w']);
assert.deepEqual(encodeMerges('low',bpe.history,'bpe',1,bpe.initial.flat()),['lo','w']);

const wp=trainMerges(wordSequences(SUBWORD_CORPUS,'wordpiece'),2,'wordpiece');
const first=wp.history[0];
assert.equal(first.score,first.count/(wordSequences(SUBWORD_CORPUS,'wordpiece').flat().filter(x=>x===first.left).length*wordSequences(SUBWORD_CORPUS,'wordpiece').flat().filter(x=>x===first.right).length));
assert.deepEqual(encodeMerges('café',wp.history,'wordpiece',2,wp.initial.flat()),['[UNK]']);
assert.ok(encodeMerges('care',wp.history,'wordpiece',2,wp.initial.flat()).every((piece,i)=>i===0?!piece.startsWith('##'):piece.startsWith('##')));

const uni=trainUnigram(wordSequences(SUBWORD_CORPUS).map(x=>x.join('')),3);
assert.equal(uni.history.length,3);
assert.ok(uni.history.every(step=>![...step.probabilities].some(([piece])=>piece===step.removed.piece)));
const alternatives=segmentUnigram('carefully',uni.probabilities);
assert.ok(alternatives.length>1);
assert.equal(alternatives[0].pieces.join(''),'carefully');
assert.ok(alternatives[0].score>=alternatives[1].score);

assert.equal(sentencePieceText('care carefully'),'▁care▁carefully');
assert.equal(sentencePieceSequences(['care carefully'])[0].join(''),'▁care▁carefully');
for (const input of ['ASCII','café ☕','姚明进入总决赛']) {
  const bytes=byteUnits(input);
  const model=trainMerges([bytes],4,'byte');
  const pieces=encodeMerges(input,model.history,'byte');
  assert.equal(decodeBytePieces(pieces),input);
}
console.log('Lesson 1B tokenization calculations passed.');
