import {useMemo} from 'react';
import {byteUnits, encodeMerges, segmentUnigram, sentencePieceSequences, sentencePieceText, trainMerges, trainUnigram, wordSequences} from '../../lib/tokenization.js';

export type Algorithm='bpe'|'wordpiece'|'unigram'|'sentencepiece'|'byte';
export type SentencePieceMode='bpe'|'unigram';
export const algorithms: [Algorithm,string][]=[['bpe','BPE'],['wordpiece','WordPiece'],['unigram','Unigram'],['sentencepiece','SentencePiece'],['byte','Byte-level BPE']];

export function useSubwordModels(corpus:string) {
  return useMemo(()=>{
    const lines=corpus.split(/\r?\n/u).filter(line=>line.trim()).slice(0,4).map(line=>line.slice(0,55)).filter(line=>line.trim());
    const wordLines=lines.map(x=>x.toLocaleLowerCase());
    const wordSeq=wordSequences(wordLines);
    const spSeq=sentencePieceSequences(lines);
    return {
      lines,
      bpe:trainMerges(wordSeq,8,'bpe'),
      wordpiece:trainMerges(wordSequences(wordLines,'wordpiece'),8,'wordpiece'),
      unigram:trainUnigram(wordSeq.map(x=>x.join('')),6),
      sentenceBpe:trainMerges(spSeq,8,'bpe'),
      sentenceUnigram:trainUnigram(spSeq.map(x=>x.join('')),6),
      byte:trainMerges(lines.map(byteUnits),8,'byte'),
    };
  },[corpus]);
}
export type Models=ReturnType<typeof useSubwordModels>;

export function modelOutput(mode:Algorithm,input:string,models:Models,spMode:SentencePieceMode,stage?:number):string[] {
  const lower=input.toLocaleLowerCase();
  if(mode==='bpe')return encodeMerges(lower,models.bpe.history,'bpe',stage??models.bpe.history.length,models.bpe.initial.flat());
  if(mode==='wordpiece')return encodeMerges(lower,models.wordpiece.history,'wordpiece',stage??models.wordpiece.history.length,models.wordpiece.initial.flat());
  if(mode==='unigram'){const m=models.unigram;return segmentUnigram(lower,stage===undefined?m.probabilities:stage?m.history[Math.min(stage,m.history.length)-1].probabilities:m.initial)[0]?.pieces||['[no path]'];}
  if(mode==='sentencepiece'){
    const marked=sentencePieceText(input);
    if(spMode==='bpe')return encodeMerges(marked,models.sentenceBpe.history,'sentencepiece',stage??models.sentenceBpe.history.length,models.sentenceBpe.initial.flat());
    const m=models.sentenceUnigram;return segmentUnigram(marked,stage===undefined?m.probabilities:stage?m.history[Math.min(stage,m.history.length)-1].probabilities:m.initial)[0]?.pieces||['[no path]'];
  }
  return encodeMerges(input,models.byte.history,'byte',stage??models.byte.history.length);
}
