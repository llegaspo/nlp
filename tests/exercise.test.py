"""Execute the exact Python cells shown in the exercise, without notebook packages."""
import contextlib
import copy
import io
import json
import math
from pathlib import Path

exercise = json.loads((Path(__file__).resolve().parents[1] / "src/data/cafeExercise.json").read_text())
namespace = {}


def run_cell(code, expected, scope=namespace):
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        exec(compile(code, "<exercise cell>", "exec"), scope)
    assert output.getvalue().strip() == expected, (output.getvalue(), expected)


run_cell(exercise["setup"], exercise["setupOutput"])
assert namespace["TRAIN_TEXT"] == exercise["training"]
assert namespace["TEST_TEXT"] == exercise["test"]
assert exercise["test"] not in exercise["training"]
for mission in exercise["steps"]:
    compile(mission["starter"], "<starter cell>", "exec")
    run_cell(mission["solution"], mission["output"])

tokenize = namespace["tokenize"]
probability = namespace["next_probability"]
perplexity = namespace["perplexity"]
counts_before = copy.deepcopy(namespace["counts"])
vocabulary_before = namespace["vocabulary"][:]
assert len(vocabulary_before) == 9
assert sum(sum(row.values()) for row in counts_before.values()) == 29
assert sum(counts_before["<s>"].values()) == 6
assert sum(row["</s>"] for row in counts_before.values()) == 6
assert "</s>" not in counts_before  # No pair ever crosses a sentence boundary.
assert counts_before["like"] == {"tea": 3, "coffee": 2, "cake": 1}
assert tokenize("Tea? TEA! Cake. 123") == ["tea", "tea", "cake"]
assert tokenize("can't café") == ["can", "t", "caf"]
assert tokenize("!!! 123") == []
assert probability("new-history", "tea", 0) is None
assert math.isclose(probability("new-history", "tea", 1), 1 / 9)
assert probability("we", "espresso", 1) == 0
assert probability("we", "<s>", 1) == 0
try:
    probability("we", "tea", -1)
    raise AssertionError("Negative smoothing must be rejected")
except ValueError:
    pass

# Independently enumerate the five add-one factors, including the final </s>.
factors = [2 / 15, 1 / 10, 6 / 14, 2 / 15, 2 / 10]
assert math.isclose(perplexity(exercise["test"], 1), math.prod(factors) ** (-1 / 5))
assert math.isinf(perplexity(exercise["test"], 0))
assert math.isinf(perplexity("we would like espresso", 1))
assert math.isfinite(perplexity("i would like cake", 0))
assert math.isclose(perplexity("", 1), 15)  # Just the end token, with start history.

probabilities = []
for history in ["<s>", "like", "would", "we", "tea", "new-history"]:
    for k in [0, 0.1, 0.5, 1]:
        values = [probability(history, word, k) for word in vocabulary_before]
        if all(value is not None for value in values):
            assert math.isclose(sum(values), 1)
        probabilities.append({"history": history, "k": k, "values": values})

scores = []
for sentence in [exercise["test"], "i would like cake", "we like tea", "we would like espresso", "", "TEA, tea & COFFEE!", "123?!", "café"]:
    for k in [0, 0.1, 0.5, 1]:
        value = perplexity(sentence, k)
        scores.append({"sentence": sentence, "k": k, "value": value if math.isfinite(value) else None})

# Scoring and looking up missing histories must not mutate the trained model.
assert namespace["counts"] == counts_before
assert namespace["vocabulary"] == vocabulary_before
run_cell(exercise["bonus"], exercise["bonusOutput"])
assert namespace["counts"] == counts_before
assert namespace["vocabulary"] == vocabulary_before
assert exercise["test"] not in namespace["new_training"]

# The all-in-one copy block must also work in a fresh Python kernel.
run_cell(
    "\n".join([exercise["setup"]] + [step["solution"] for step in exercise["steps"]]),
    "\n".join([exercise["setupOutput"]] + [step["output"] for step in exercise["steps"]]),
    {},
)
print(json.dumps({"vocabulary": vocabulary_before, "probabilities": probabilities, "scores": scores}))
