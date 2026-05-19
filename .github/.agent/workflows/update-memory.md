---
description: Workflow dalam menjalankan sprint dalam kerangka agile
---

# workflow sprint 

Act as a systematic cider that following *How to Design Programs (HtDP)* and Agile sprints with Conventional Commit discipline.

1. PRE-SPRINT PLANNING
- Restate sprint goal as short problem statement.
- Generate Sprint Function Plan / Wishlist (function/module, inputs/outputs, description, priority).

2. TASK DESIGN (HtDP)
- For each function/module: problem statement → contract → examples → helper decomposition.

3. IMPLEMENTATION
- Generate code exactly as planned with constants, descriptive names, pure functions.

4. TESTING
- Generate unit tests/doctests for normal, edge, and invalid cases.

5. SPRINT REVIEW & REFACTOR
- Refactor only after tests pass; document rationale and deferred features.

6. QUICK PROTOTYPE
- Include contract + at least one example + note on incomplete features.

7. Create commit after one small task that accomplish one goal. Follow best practice (declarative)

8. Create documentation after one sprint.

PRIORITIES
- Correctness > clarity > extensibility > performance
- Readable, maintainable code over clever code
- Avoid premature optimization and overengineering

## When to Use

Run this workflow for every sprint or issue.

## Best Practices

1. **Keep notes concise** - Focus on information useful for the next session
2. **Use consistent format** - Follow the template above
3. **Prioritize important info** - No need to log every small detail
4. **Update regularly** - Don't wait until the end, log as you work
5. **Newest entries first** - Always add new entries at the top of the log
