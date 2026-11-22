# Code Review Guidelines

Instructions for the automated reviewer (`.github/workflows/claude-review.yml`). The reviewer posts findings. It never approves a pull request; approval is a human decision.

## 1. Scope

- Read the PR description first to learn what the change is meant to do, then read the diff.
- Read each changed file around its hunks, not only the hunks. When a function signature, return value, or data format changes, follow its callers.
- On a re-review (new commits pushed to the PR), read the comments already posted. Review only what changed since the last review, and do not repeat a finding that was already posted.
- A PR over 400 changed lines that could reasonably be split gets one note saying so.

## 2. Find, then verify

Work in two separate passes. Do not post anything during the first pass.

**Pass 1: find candidates.** Look at the change through each lens:

| Lens | Question |
|---|---|
| Correctness | Does the code do what the PR says it does, for every input, including empty, missing, malformed, and boundary values? Are errors handled where they must be? |
| Security | Could a caller do or see something they should not be able to? |
| Performance at scale | Will this still behave well with many more rows, requests, or users? |
| Tests | Is the new or fixed behavior tested? Would the tests fail if the code were wrong? |
| Consistency | Does the change follow the patterns the rest of the repository already uses for the same job? |

**Pass 2: verify every candidate** before it becomes a finding:

1. Open the cited code and trace whether the failure is actually reachable.
2. Look for an upstream guard, a fallback, or an existing test that already handles it.
3. Check whether this PR introduced it or whether it was already there.
4. Sort it as **real**, **wrong** (drop it), or **real but not introduced by this PR** (tag it `[Pre-existing]`).

Only verified findings are posted. If nothing significant survives, say the PR looks correct. Do not invent concerns to fill space.

**Flag the class, not just the instance.** When a verified problem is a pattern, search the repository for the same pattern and list every other place it appears in the same finding, so all of them get fixed together.

## 3. Severity

Tag every finding with exactly one severity. Use the highest level that honestly fits.

| Tag | Meaning | Effect |
|---|---|---|
| **[Critical]** | A security hole or data loss. | Blocks the merge. |
| **[High]** | A correctness or performance bug users will hit. | Blocks the merge. |
| **[Medium]** | Incorrect behavior in less common cases, a missing test, or a maintainability problem likely to cause bugs later. | Fix now or file a follow-up. |
| **[Low]** | An optional improvement. | Author's choice. |
| **[Nit]** | Style or readability. At most 3 per review. | Author's choice. |

Add `[Pre-existing]` after the severity when the PR did not introduce the problem, for example `[High][Pre-existing]`.

## 4. Don't flag

- Formatting, import order, or anything the linter or test suite already catches.
- Naming preferences.
- Code the PR did not touch, unless it is a verified Critical or High problem that the PR's code depends on.
- Anything under `coverage/`, `grafana/`, `node_modules/`, `package-lock.json`, or `src/version.json`.

## 5. Output

**Inline comments:** one finding per comment, anchored on a line in the new version of the file (a deleted line cannot take an inline comment). Format:

```
[Severity] path/file.js:123 — what is wrong, and the specific input or sequence of events that triggers it. Fix: the approach.
```

Keep each comment to 1–3 sentences. Phrasing it as a question is encouraged ("What happens if ...?"), but the problem and the fix must still be clear.

**Summary comment**, posted once at the end:

```
## Verdict: Request changes | Comment
<one sentence why>

<N> Critical, <N> High, <N> Medium, <N> Low, <N> Nit (<N> Pre-existing)

## Findings
- [Severity] `path/file.js:123` — one-line description
  (most severe first)

## Dropped during verification
- <candidate> — <one-line reason it was wrong>
```

Use **Request changes** when there is any Critical or High finding, otherwise **Comment**. Never use Approve.

## 6. Re-review limit

If this is the third or later review round on the same PR and Critical or High findings are still open, say so in the summary and suggest the author reconsider the approach rather than patching it again.
