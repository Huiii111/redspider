# Frame

Rewritten after the team chose its own idea. The earlier vendor-review frame is in git history. This frame was not tested by the tournament. See docs/angles/status.txt.

## 1. Who pays, and who first sees it?

- **Buyer:** the head of security or GRC lead who relies on automated code scanning as compliance evidence.
- **At the screen:** the GRC engineer choosing or defending that scanner.
- **The bad day:** a scan comes back clean, and an auditor or incident review asks how anyone knows the tool would have caught the fault.

## 2. What one decision does this change?

**Which open-source tool or tools to rely on for auditing infrastructure code, and which faults must be covered some other way.**

Made by the GRC engineer and signed off by the buyer, when adopting a tool and when defending its output.

## 3. What do they do today?

They pick by popularity, by the tool's own framework claims, or by which tool reports the most findings on a sample repository. Our research found no independent accuracy measure for any compliance tool. That rests on a time-boxed search and does not prove none exists.

## 4. Which one pain?

Ranked:

1. **A clean result cannot be interpreted, because nobody knows what the tool stays silent on.**
2. Tools report too many findings.
3. Control mappings differ between tools.

We keep pain 1 only.

## 5. What would prove this frame wrong?

The tools catch nearly the same faults, so choosing between them changes nothing. Or a practitioner says tool choice is not made or defended on this basis.

## 6. What can the room type in?

Terraform. A judge edits a clean example or pastes their own, and sees which tools noticed the change and which stayed silent.

## Known limit

The tools graded are open-source infrastructure-code scanners that carry compliance mappings, not full GRC platforms. Say so plainly.

## Rubric this frame serves

Security: does it solve the problem and hold up in a real environment? Curiosity: how curious, creative and applicable is the idea? Market fit: is it filling a genuine gap, or the same old?
