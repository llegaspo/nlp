export const LESSON_CORPUS: string[];
export const EXERCISE_CORPUS: string[];

export interface TokenOptions {lower?: boolean; punctuation?: boolean; normalize?: boolean}
export function words(text: string, options?: TokenOptions): string[];
export interface BpeMerge {left: string; right: string; count: number; units: string[][]}
export function bpe(text: string, merges?: number, options?: TokenOptions): {sequence: string[]; units: string[][]; history: BpeMerge[]};

export interface EditOperation {op: string; from: string; to: string}
export interface EditOption {op: string; value: number; from: number[]}
export function editDistance(source: string, target: string, costs?: {insert: number; delete: number; substitute: number}): {a: string[]; b: string[]; grid: number[][]; candidates: (EditOption[] | null)[][]; path: number[][]; operations: EditOperation[]; distance: number};

export function cooccurrence(lines: string[], radius?: number): {sentences: string[][]; vocab: string[]; counts: Record<string, Record<string, number>>};
export function cosine(v: number[], w: number[]): {dot: number; left: number; right: number; value: number | null};

export interface NgramModel {sentences: string[][]; vocab: string[]; maps: Record<1 | 2 | 3, Map<string, Map<string, number>>>; totals: Record<1 | 2 | 3, Map<string, number>>; total: number}
export function ngramModel(lines: string[]): NgramModel;
export function conditional(model: NgramModel, history: string[], token: string, order?: 1 | 2 | 3, method?: string, k?: number): {count: number; denominator: number; value: number | null};
export function interpolation(model: NgramModel, history: string[], token: string, weights?: number[]): {parts: unknown[]; value: number | null; divisor: number};
export function stupidBackoff(model: NgramModel, history: string[], token: string, order?: 1 | 2 | 3, alpha?: number): {value: number; used: number};
export function scoreSentence(model: NgramModel, sentence: string, order?: 1 | 2 | 3, method?: string, k?: number): {steps: {token: string; history: string[]; count: number; denominator: number; value: number}[]; logProbability: number; perplexity: number | null};
export function softmax(scores: number[]): number[];

export interface TrainerPair {inputs: number[]; target: number; sentence: string[]}
export interface TrainerForward {hidden: number[]; logits: number[]; probabilities: number[]; loss: number}
export interface TrainerUpdate {pair: TrainerPair; before: TrainerForward; after: TrainerForward; rate: number}
export interface Trainer {mode: string; vocab: string[]; E: number[][]; U: number[][]; pairs: TrainerPair[]; step: number; last: TrainerUpdate | null}
export function makeTrainer(mode?: string): Trainer;
export function trainerForward(trainer: Trainer, pair?: TrainerPair): TrainerForward;
export function trainStep(trainer: Trainer, rate?: number): TrainerUpdate;

export interface NetworkForward {z: number[]; a: number[]; logits: number[]; probabilities: number[]; loss: number}
export interface Network {x: number[]; W: number[][]; b: number[]; U: number[][]; c: number[]; target: number; rate: number; last: {before: NetworkForward; after: NetworkForward} | null}
export function makeNetwork(): Network;
export function networkForward(network: Network): NetworkForward;
export function networkStep(network: Network): {before: NetworkForward; after: NetworkForward};
