export type EquationStep = {label: string; meaning: string};
type EquationStory = {
  title: string;
  idea: string;
  steps: EquationStep[];
  symbols: [string, string][];
  formula: string;
};
const step = (label: string, meaning: string): EquationStep => ({label, meaning});

export const equationStories = {
  intro: {
    title: 'Give language a job.',
    idea: 'Start with some text, turn it into usable pieces, and use those pieces to produce an answer.',
    steps: [step('Read text', 'The input can be a review, a question, or a conversation.'), step('Represent it', 'Tokens and numerical vectors give the model something to process.'), step('Do a task', 'The result depends on the task: a label, a translation, or a generated continuation.')],
    symbols: [['→', 'Pass the result to the next stage.']],
    formula: 'text → representation → model → task output',
  },
  tokens: {
    title: 'Count every occurrence. Then count the unique ones.',
    idea: 'Three cups on a tray can contain only two kinds of drink. Tokens and types work the same way.',
    steps: [step('Choose a splitting rule', 'The tokenizer decides where one piece ends and the next begins. Changing the rule can change the counts.'), step('Count every piece', 'Instances include repetitions. Tea, tea, coffee gives three occurrences after lowercasing.'), step('Group identical pieces', 'Types count distinct strings: tea and coffee are two types.')],
    symbols: [['instances', 'The length of the token stream.'], ['types', 'The number of different token strings.']],
    formula: 'instances = stream length; types = number of distinct strings',
  },
  'edit-distance': {
    title: 'Compare three routes. Keep the cheapest.',
    idea: 'For each pair of prefixes, ask whether deleting, inserting, or matching/replacing the next character costs least.',
    steps: [step('Look at earlier answers', 'The cells above, left, and diagonally above-left already tell us the best cost for smaller prefixes.'), step('Add one edit', 'Above + deletion cost; left + insertion cost; diagonal + replacement cost. A matching diagonal adds zero.'), step('Keep the lowest total', 'The smallest candidate becomes this cell. Repeat until you have compared the full strings.')],
    symbols: [['D[i,j]', 'Best cost for the first i source characters and j target characters.'], ['min', 'Pick the smallest candidate.'], ['i−1 / j−1', 'A prefix with one fewer character.'], ['del / ins / sub', 'Cost of deleting, inserting, or replacing a character.']],
    formula: 'D[i,j] = min(D[i−1,j]+del, D[i,j−1]+ins, D[i−1,j−1]+sub)',
  },
  'context-vectors': {
    title: 'Compare the direction, not the length.',
    idea: 'Two words can have similar patterns of neighbors even when one appears much more often.',
    steps: [step('Match the coordinates', 'Multiply each count in one vector by the matching count in the other, then add the products.'), step('Account for both lengths', 'Divide by the product of the two vector lengths so a larger copy of a vector keeps the same similarity.'), step('Read the alignment', 'Same direction gives 1; perpendicular gives 0. General vectors can give −1 for opposite directions. A zero vector has no direction.')],
    symbols: [['v · w', 'Multiply matching coordinates and add them.'], ['‖v‖', 'The length of vector v.'], ['cos', 'A measure of how closely two directions align.']],
    formula: 'cos(v,w) = (v · w) / (‖v‖ × ‖w‖)',
  },
  embeddings: {
    title: 'Look up a word. Make a prediction. Learn from it.',
    idea: 'An embedding is a list of numbers that training adjusts to make useful predictions about nearby words.',
    steps: [step('Look up the vector', 'For skip-gram, start with the center word’s input vector. For CBOW, average the nearby input vectors.'), step('Score possible words', 'Compare that vector with each output word vector using a dot product.'), step('Turn scores into chances', 'Softmax converts scores into positive probabilities that add to one.'), step('Measure the surprise', 'A high probability for the correct target means a small loss. Training adjusts both sets of vectors to reduce that loss.')],
    symbols: [['e', 'The selected input embedding.'], ['Ue', 'One dot-product score per output word.'], ['softmax', 'Turn scores into a probability distribution.'], ['−log P(target)', 'Surprise at the correct word: lower is better.']],
    formula: 'P(target | input) = softmax(Ue); loss = −log P(target)',
  },
  bigrams: {
    title: 'Slide a two-word window. Add a tally.',
    idea: 'A bigram count is just a record of how often one token follows another.',
    steps: [step('Mark each sentence', 'Add a start marker as history and an end marker as a possible prediction. Keep sentences separate.'), step('Read adjacent pairs', 'Move one position at a time: start → we, we → like, like → tea, tea → end.'), step('Add matching tallies', 'Repeated pairs add to the same count. Never connect the end of one sentence to the beginning of another.')],
    symbols: [['C(h,w)', 'How often word w follows history h.'], ['<s>', 'Start history, never a predicted output here.'], ['</s>', 'The end token the model predicts.']],
    formula: 'C(h,w) = number of observed h → w pairs',
  },
  ngrams: {
    title: 'Out of these chances, how often did this happen?',
    idea: 'If tea follows like three times out of six, this model gives tea a three-in-six chance after like.',
    steps: [step('Count this continuation', 'Count the times the chosen next word follows this exact history.'), step('Count all continuations', 'Count every observed next word after that same history. This is the total you divide by.'), step('Take its share', 'Divide the first count by the second. An unseen pair gets zero; a history with no observations has no MLE estimate.')],
    symbols: [['P(w | h)', 'Chance of next word w, given history h. The vertical bar means “given”.'], ['C(h,w)', 'Count of this continuation.'], ['C(h)', 'Count of all continuations after this history.']],
    formula: 'P(w | h) = C(h,w) / C(h)',
  },
  sequence: {
    title: 'Follow the whole path, one chance at a time.',
    idea: 'A sentence needs every prediction along its path to happen. Multiply their conditional chances together.',
    steps: [step('Get each next-token chance', 'Each probability uses the preceding history. An n-gram model approximates that history with a short window.'), step('Multiply along the path', 'For example, one-half followed by one-quarter gives one-eighth for that two-step path.'), step('Include the finish', 'This course also predicts the end token. One zero anywhere makes the whole path’s probability zero.')],
    symbols: [['∏', 'Multiply all the listed terms.'], ['P(wᵢ | hᵢ)', 'The next-token chance at position i, given its history.']],
    formula: 'P(sequence) = ∏ᵢ P(wᵢ | hᵢ)',
  },
  smoothing: {
    title: 'Give every possible next token a small head start.',
    idea: 'Add the same small pretend count to every known output, then divide by the new total.',
    steps: [step('Start with real tallies', 'Keep the observed counts. An unseen pair starts at zero.'), step('Add a little to every bucket', 'Add k to each possible output, including the end token. With nine outputs, the total grows by nine times k.'), step('Divide by the new total', 'This keeps all probabilities adding to one. Some chance moves from seen continuations to unseen combinations.')],
    symbols: [['k', 'The same extra count given to each possible output.'], ['|V|', 'How many output tokens are in the vocabulary.'], ['k|V|', 'The total amount added across all outputs.']],
    formula: 'Padd-k(w | h) = (C(h,w)+k) / (C(h)+k|V|)',
  },
  perplexity: {
    title: 'How surprised was the model, on average?',
    idea: 'Perplexity puts average prediction surprise on a scale we can compare: lower means the model assigned more probability to this same test text.',
    steps: [step('Turn each chance into surprise', 'A likely correct token gives a small −log probability. A zero probability gives infinite surprise.'), step('Average the surprises', 'Add them and divide by the number of predictions, including the end token in these labs.'), step('Convert back to a useful scale', 'Exponentiate the average. Always assigning 1/4 to each correct token gives perplexity 4, like four equally likely choices per prediction.')],
    symbols: [['−log p', 'Surprise measured using a natural logarithm.'], ['Σ', 'Add the contributions.'], ['N', 'Number of predictions, not vocabulary size.'], ['exp', 'Undo the natural logarithm after averaging.']],
    formula: 'PP = exp(−Σᵢ log P(wᵢ | hᵢ) / N)',
  },
  neural: {
    title: 'Mix the inputs. Open a gate. Make a prediction.',
    idea: 'A neuron multiplies inputs by adjustable strengths, adds a bias, then passes the result through an activation.',
    steps: [step('Mix and shift', 'Multiply each input by its weight, add the products, and add the bias.'), step('Keep positive activity', 'ReLU replaces a negative sum with zero. A positive sum passes through unchanged.'), step('Score the outputs', 'Another weighted mix produces output scores. Softmax turns them into class probabilities.'), step('Learn from the error', 'After measuring loss, gradients describe which parameter changes would increase it. Take a small step in the opposite direction.')],
    symbols: [['Wx + b', 'Weighted inputs plus bias.'], ['max(0,z)', 'Keep whichever is larger: zero or the hidden sum.'], ['θ', 'The trainable weights and biases.'], ['η', 'Learning rate: how large a step to take.'], ['∇loss', 'The local slope of loss with respect to each parameter.']],
    formula: 'z = Wx + b; a = max(0,z); θnew = θ − η∇loss',
  },
  gradient: {
    title: 'Look at the slope. Take a small step downhill.',
    idea: 'The gradient tells us which direction increases loss locally. Subtracting it moves the other way.',
    steps: [step('Read the current slope', 'A positive gradient says increasing this parameter would increase loss locally.'), step('Choose a step size', 'Multiply the gradient by the learning rate. Too large a step can overshoot.'), step('Update the parameter', 'Subtract that step from the current value. Then recompute the prediction and loss.')],
    symbols: [['θ', 'A trainable parameter, or all of them together.'], ['η', 'Learning rate.'], ['∇loss', 'Gradient: the local slope of the loss.']],
    formula: 'θnew = θ − η∇loss',
  },
  attention: {
    title: 'Compare. Share attention. Mix information.',
    idea: 'Each query compares itself with keys, gives them weights, and blends their value vectors.',
    steps: [step('Compare query with keys', 'Dot products score the match between one query and each key. Divide by the square root of their dimension to control the scale.'), step('Hide forbidden positions', 'A causal mask excludes future positions before turning scores into weights.'), step('Share one whole of attention', 'Softmax turns the allowed scores into weights adding to one for this query.'), step('Blend the values', 'Multiply each value vector by its weight and add them. The result is a vector, not a word probability.')],
    symbols: [['Q / K / V', 'Query: what to match; key: what to compare against; value: information to mix.'], ['QKᵀ', 'All query–key dot products.'], ['√dₖ', 'Square root of the key/query dimension.'], ['mask', 'Exclude forbidden positions before softmax.']],
    formula: 'Attention(Q,K,V) = softmax(QKᵀ / √dₖ + mask)V',
  },
  positions: {
    title: 'Give each position a pattern of waves.',
    idea: 'A position gets a numerical signature by sampling several waves. Some change quickly; others change slowly.',
    steps: [step('Choose a position', 'The position is the token’s index in the sequence.'), step('Read paired waves', 'For each frequency, take one sine value and one cosine value. The dimension pair determines the frequency.'), step('Add the signature', 'Collect the values into a vector and add it to the token embedding in the original transformer design.')],
    symbols: [['pos', 'The token’s position.'], ['2i / 2i+1', 'An even/odd pair of vector dimensions.'], ['d', 'Total number of dimensions.'], ['10000^(2i/d)', 'The scale that slows each successive wave pair.']],
    formula: 'PE(pos,2i) = sin(pos/10000^(2i/d)); PE(pos,2i+1) = cos(pos/10000^(2i/d))',
  },
  masked: {
    title: 'Score only the positions chosen for practice.',
    idea: 'BERT learns to recover original tokens at selected positions. Average the surprise at those targets.',
    steps: [step('Choose the targets', 'Only selected training positions enter this loss average. Other tokens still supply context.'), step('Check the original answers', 'Read the model’s probability for the original token, including selected tokens that were left unchanged.'), step('Average their surprise', 'Convert each target probability to −log probability, add, then divide by the number of selected targets.')],
    symbols: [['S', 'The selected target positions.'], ['|S|', 'How many positions were selected.'], ['Σᵢ∈S', 'Add only the contributions from selected targets.'], ['P(originalᵢ)', 'Probability assigned to the original token at position i.']],
    formula: 'LMLM = −(1/|S|) Σᵢ∈S log P(originalᵢ)',
  },
  llms: {
    title: 'Turn preference scores into shares of a whole.',
    idea: 'A raw score is not a probability. Softmax makes scores positive, then gives each token its share of the total.',
    steps: [step('Adjust the contrast', 'Divide scores by a positive temperature. A smaller temperature widens score differences.'), step('Make positive weights', 'Exponentiate the adjusted scores. Bigger scores produce bigger positive weights.'), step('Share the total', 'Divide each weight by the sum of all weights. The resulting probabilities add to one.')],
    symbols: [['zᵢ', 'Raw score, or logit, for token i.'], ['T', 'Positive temperature.'], ['exp', 'Turn a score into a positive weight.'], ['Σⱼ', 'Add the weights for all candidate tokens.']],
    formula: 'Pᵢ = exp(zᵢ/T) / Σⱼ exp(zⱼ/T)',
  },
  responsible: {
    title: 'Count correct answers before averaging.',
    idea: 'A larger group contributes more examples to the overall score. Changing the mix can change the headline without helping either group.',
    steps: [step('Count each group', 'Record how many examples come from each group.'), step('Find correct answers', 'Multiply each group’s size by its accuracy to find its contribution.'), step('Pool and divide', 'Add the correct answers and divide by all examples. Also inspect the individual group results.')],
    symbols: [['Σ', 'Add the contributions of all groups.'], ['group size × accuracy', 'The number of correct answers contributed by that group.'], ['total examples', 'The denominator that weights larger groups more heavily.']],
    formula: 'overall accuracy = Σ(group size × group accuracy) / total examples',
  },
  interpolation: {
    title: 'Let several context lengths vote.',
    idea: 'Mix the next-word distributions from short and long histories using shares that add to one.',
    steps: [step('Ask three models', 'A unigram ignores history, a bigram looks back one token, and a trigram looks back two.'), step('Give each a share', 'Multiply each prediction by its nonnegative mixing weight.'), step('Add their contributions', 'Weights adding to one preserve a probability distribution. This lab drops unavailable histories and renormalizes the remaining weights.')],
    symbols: [['λ', 'A mixing weight. All active weights must add to one.'], ['P(w | h)', 'A prediction using the specified history.']],
    formula: 'Pmix = λ₁P₁ + λ₂P₂ + λ₃P₃',
  },
  backoff: {
    title: 'When a long pattern is missing, try a shorter one.',
    idea: 'Stupid backoff uses a shorter history when it cannot find a count, reducing the score at every fallback.',
    steps: [step('Try the longest history', 'If the pair or triple was observed, use its relative frequency.'), step('Shorten when missing', 'Drop the oldest history token and multiply the eventual score by 0.4 for this fallback.'), step('Keep it as a score', 'Repeat if needed. These scores do not generally add to one, so they are not a probability distribution.')],
    symbols: [['α', 'The discount for each fallback; 0.4 in this lab.'], ['S', 'A ranking score, not a normalized probability.']],
    formula: 'S(w | h) = observed relative frequency, else α × S(w | shorter h)',
  },
  'good-turing': {
    title: 'Learn from how many things were seen rarely.',
    idea: 'Group event types by their frequency. Neighboring frequency groups suggest an adjusted count.',
    steps: [step('Group by count', 'N₁ counts types seen once; N₂ counts types seen twice. These are counts of types, not token occurrences.'), step('Compare neighboring groups', 'For events seen c times, compare how many types were seen c+1 times with how many were seen c times.'), step('Adjust the count', 'Multiply that ratio by c+1. Raw ratios need both groups; missing data needs an additional estimator.')],
    symbols: [['c', 'How many times an event was observed.'], ['N_c', 'Number of distinct event types seen c times.'], ['c*', 'The adjusted count for each event in that group.'], ['N₁/N', 'Total probability mass reserved for unseen events.'], ['N₀', 'Number of possible unseen event types.']],
    formula: 'c* = (c+1) N(c+1)/N(c); N = Σ cN(c); unseen mass = N₁/N',
  },
  wordpiece: {
    title: 'Prefer pieces that belong together.',
    idea: 'The illustrative WordPiece score compares a pair’s count with how common its two pieces are individually.',
    steps: [step('Count the pair', 'Count how often the two pieces appear next to each other.'), step('Count each piece', 'Multiply the individual piece frequencies to get the comparison denominator.'), step('Rank the association', 'Divide the pair count by that product. A high score favors pieces that occur together relative to their individual frequencies.')],
    symbols: [['count(pair)', 'Adjacent occurrences of the pair.'], ['count(left) × count(right)', 'Product of the individual piece frequencies.']],
    formula: 'score = count(pair) / (count(left) × count(right))',
  },
  bpe: {
    title: 'Join the neighbors you see together most.',
    idea: 'Each merge replaces a frequent adjacent pair with one new piece.',
    steps: [step('Count adjacent pairs', 'Each occurrence adds a tally to that pair.'), step('Pick the largest count', 'Choose a most frequent pair. This toy resolves equal counts with a stable lexical order.'), step('Join and recount', 'Replace that pair with one piece, then recompute pair counts for the next merge.')],
    symbols: [['left + right', 'Concatenate the pieces.'], ['→', 'Replace the pair with its merged piece.']],
    formula: 'most frequent adjacent pair → merged piece → recount',
  },
  unigram: {
    title: 'Keep the pieces that help explain the text.',
    idea: 'A candidate split is scored using its piece probabilities. Training considers all valid splits, then prunes pieces that help least.',
    steps: [step('Score possible splits', 'Multiply the piece probabilities along a split. Adding their log probabilities gives the same ranking.'), step('Try removing a piece', 'Measure the change in corpus negative log likelihood, summing probability over possible splits for each training sequence.'), step('Prune and refit', 'Remove the allowed piece with the smallest loss increase, then refit probabilities. Keep single characters so training text stays segmentable.')],
    symbols: [['Σ log p(piece)', 'Add the log probabilities along one split.'], ['NLL', 'Negative log likelihood: smaller is better.'], ['ΔNLL', 'Loss after removal minus loss before removal, before refitting. Negative means an improvement.']],
    formula: 'path score = Σ log p(piece); removal cost = NLLafter − NLLbefore',
  },
} satisfies Record<string, EquationStory>;

export type EquationConcept = keyof typeof equationStories;
