# Implementation Plan

## 1. Phase 1 Goal

The first implementation will not build a complete educational application.

The goal is to construct and evaluate the smallest possible system that can answer the following question:

> Can an LLM reliably replace human semantic correctness judgment for open-ended comprehension responses?

The initial prototype will therefore focus on offline evaluation.

---

## 2. Minimal Data Structure

Each evaluation instance will contain:

```text
passage
question
expected_answer
student_response
human_label
```

Example:

```json
{
  "passage": "Minsu carried an umbrella to school because it was raining.",
  "question": "What did Minsu carry?",
  "expected_answer": "umbrella",
  "student_response": "The thing you use when it rains.",
  "human_label": "CORRECT"
}
```

For instructional simulation, the following field will also be used:

```text
current_state
```

---

## 3. Step 1 — Freeze the Instructional Protocol

Define the deterministic state machine.

Initial version:

```text
S0: Independent response

CORRECT
→ PRAISE_AND_NEXT

INCORRECT
→ S1
```

```text
S1: Relevant passage rereading

CORRECT
→ PRAISE_AND_NEXT

INCORRECT
→ S2
```

```text
S2: Answer-containing sentence rereading

CORRECT
→ PRAISE_AND_NEXT

INCORRECT
→ S3
```

```text
S3: Correct-answer modeling
```

The protocol will be based on common least-to-most prompting components reported in the shared-text reading literature.

No LLM-generated instructional action will be allowed in Phase 1.

---

## 4. Step 2 — Define the Human Annotation Rubric

Create explicit criteria for evaluating student responses.

Initial labels:

```text
CORRECT
PARTIAL_OR_UNDERSPECIFIED
CONTRADICTORY
IRRELEVANT
NO_RESPONSE
UNINTERPRETABLE
```

Examples:

```text
Expected answer:
umbrella
```

```text
"umbrella"
→ CORRECT
```

```text
"the thing you use when it rains"
→ CORRECT
```

```text
"that thing"
→ PARTIAL_OR_UNDERSPECIFIED
```

```text
"bag"
→ CONTRADICTORY
```

```text
"it was raining"
→ IRRELEVANT
```

A pilot annotation will be conducted before full-scale labeling.

---

## 5. Step 3 — Pilot Human Annotation

Initial target:

```text
30–100 responses
```

Procedure:

1. Two annotators independently label each response.
2. Calculate inter-rater agreement.
3. Identify disagreement cases.
4. Refine annotation rules.
5. Repeat if necessary.

Primary agreement metric:

```text
Cohen's kappa
```

After the rubric is stable, disagreements in the final dataset will be resolved through discussion or an additional rater.

---

## 6. Step 4 — Build Evaluation Dataset

Target data format:

```text
passage
question
expected answer
student response
gold label
response type
```

Target initial scale:

```text
approximately 1,000 responses
```

Response types should include challenging semantic cases such as:

* exact answers
* synonyms
* paraphrases
* descriptive answers
* incomplete answers
* passage-related distractors
* contradictory answers
* mixed correct/incorrect statements

Possible data sources will include existing short-answer datasets and task-specific constructed examples.

The use of actual responses from students with intellectual disabilities will be considered in a later phase if appropriate data can be obtained.

---

## 7. Step 5 — Implement Lexical Baseline

Initial baseline:

```text
keyword / answer matching
```

Possible implementation:

```python
def lexical_match(expected_answer, student_response):
    return expected_answer.lower() in student_response.lower()
```

The actual implementation may additionally support manually defined aliases.

Purpose:

Provide a simple lower-bound baseline.

---

## 8. Step 6 — Implement Embedding Baseline

Generate vector embeddings for:

```text
expected_answer
student_response
```

Calculate cosine similarity.

Example logic:

```text
similarity >= threshold
→ CORRECT

similarity < threshold
→ INCORRECT
```

Thresholds will be tuned using a development split rather than the final test set.

Different embedding models may be compared if necessary.

---

## 9. Step 7 — Implement LLM Evaluator

Input:

```text
Passage
Question
Expected Answer
Student Response
```

Output schema:

```json
{
  "label": "CORRECT"
}
```

or:

```json
{
  "label": "INCORRECT"
}
```

The prompt will explicitly instruct the model to evaluate whether the response sufficiently answers the question based on the passage, rather than only measuring semantic relatedness.

Model settings and prompt versions will be recorded to ensure reproducibility.

---

## 10. Step 8 — Semantic Evaluation

Compare:

```text
Lexical baseline
vs.
Embedding baseline
vs.
LLM evaluator
```

Primary metrics:

* Accuracy
* Precision
* Recall
* F1 score
* False Positive Rate
* False Negative Rate

Performance will also be analyzed by response type.

Example:

```text
Paraphrase
Synonym
Incomplete
Contradictory
Irrelevant
Mixed response
```

---

## 11. Step 9 — Error Analysis

Inspect false positives and false negatives.

Example:

```text
Human:
IRRELEVANT

LLM:
CORRECT
```

Possible error category:

```text
passage-related distractor
```

The goal is to determine not only how often the evaluator fails, but which semantic response patterns cause the failure.

---

## 12. Step 10 — Instructional State Simulation

Feed evaluator outputs into the deterministic state machine.

For every prediction, compare:

```text
Gold-label state transition
```

with:

```text
Evaluator-based state transition
```

Primary instructional error types:

### Prompt Omission

```text
Human label:
INCORRECT

Evaluator:
CORRECT

Expected:
S0 → S1

Actual system:
S0 → NEXT
```

### Unnecessary Prompting

```text
Human label:
CORRECT

Evaluator:
INCORRECT

Expected:
S0 → NEXT

Actual system:
S0 → S1
```

Measures may include:

* number of incorrect state transitions
* prompt omission rate
* unnecessary prompting rate
* error rate by response category

Phase 1 will not claim that these errors directly cause measurable learning loss.

---

## 13. Suggested Repository Structure

```text
id-response-evaluator/
│
├── README.md
├── implementation plan.md
│
├── data/
│   ├── raw/
│   ├── annotated/
│   └── processed/
│
├── src/
│   ├── evaluators/
│   │   ├── lexical.py
│   │   ├── embedding.py
│   │   └── llm.py
│   │
│   ├── protocol/
│   │   └── state_machine.py
│   │
│   └── evaluation/
│       ├── metrics.py
│       └── error_analysis.py
│
├── prompts/
│   └── evaluator_prompt.md
│
├── experiments/
│
└── results/
```

---

## 14. Initial Development Milestones

### Milestone 1

Finalize:

* task definition
* annotation rubric
* instructional state machine

### Milestone 2

Create pilot dataset and conduct human annotation.

### Milestone 3

Implement lexical and embedding baselines.

### Milestone 4

Implement the LLM evaluator.

### Milestone 5

Run benchmark evaluation.

### Milestone 6

Conduct error taxonomy analysis.

### Milestone 7

Simulate instructional state transitions.

### Milestone 8

Decide whether Phase 2 should include:

* real student responses
* speech-to-text
* AAC
* inferential questions
* actual educational intervention

---

## 15. Phase 1 Success Criteria

Phase 1 should answer three practical questions.

1. Can semantic correctness of open-ended responses be reliably annotated by humans?
2. Does an LLM provide meaningful performance gains over simpler baselines?
3. Are the remaining LLM errors acceptable for use inside a deterministic instructional protocol, or do they create instructional risks that require human review?

The result of Phase 1 will determine whether development should proceed toward a real student-facing system.
