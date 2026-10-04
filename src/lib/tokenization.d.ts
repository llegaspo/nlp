export const LESSON_SENTENCE: string;
export const SUBWORD_CORPUS: string[];
export interface LessonTokenOptions {lower?: boolean; punctuation?: boolean; splitClitic?: boolean; nfkc?: boolean}
export function lessonTokens(text: string, options?: LessonTokenOptions): string[];
export function countTypes(tokens: string[]): Map<string, number>;
export function stripAccents(text: string): string;
export const LEMMAS: Map<string, string>;
export function lookupLemma(form: string): string;
export interface MorphemeExample {word: string; kind: string; parts: [string, string, string][]}
export const MORPHEMES: MorphemeExample[];
export interface MergeCandidate {left: string; right: string; count: number; score: number}
export interface MergeEntry extends MergeCandidate {joined: string; candidates: MergeCandidate[]; units: string[][]; vocab: string[]}
export interface MergeModel {initial: string[][]; units: string[][]; history: MergeEntry[]; vocab: string[]}
export function trainMerges(sequences: string[][], budget?: number, mode?: 'bpe' | 'wordpiece' | 'byte'): MergeModel;
export function wordSequences(lines: string[], mode?: 'bpe' | 'wordpiece'): string[][];
export function encodeMerges(input: string, history: MergeEntry[], mode?: 'bpe' | 'wordpiece' | 'byte' | 'sentencepiece', stage?: number, initialVocab?: string[]): string[];
export function byteUnits(text: string): string[];
export function bytePieceLabel(piece: string): string;
export function decodeBytePieces(pieces: string[]): string;
export function sentencePieceText(text: string): string;
export function sentencePieceSequences(lines: string[]): string[][];
export interface UnigramCandidate {piece: string; loss: number; probability: number}
export interface UnigramStep {removed: UnigramCandidate; candidates: UnigramCandidate[]; probabilities: Map<string, number>}
export interface UnigramModel {initial: Map<string, number>; history: UnigramStep[]; probabilities: Map<string, number>}
export function trainUnigram(sequences: string[], removals?: number): UnigramModel;
export interface UnigramPath {pieces: string[]; score: number}
export function segmentUnigram(text: string, probabilities: Map<string, number>, limit?: number): UnigramPath[];
