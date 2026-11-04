# Card 3: What this use depends on

- **Value claim:** The analyst sees which claims this use depends on, which of those anyone other than the vendor vouches for, and what to request for the rest.

- **Decision changed:** Instead of accepting a headline or sending a generic questionnaire, the analyst approves, sets named conditions, or holds with requests tied to the gaps for this use.

- **Trivial heuristic:** `grep -qiE 'SOC ?2 Type (2|II)|ISO.?27001' vendor.txt && echo "APPROVE WITH CONDITIONS: obtain report" || echo "HOLD: request SOC 2 Type 2"`

- **Why it beats that:** The heuristic ignores intended use and cannot separate an auditor's statement from the vendor's. The output lists what this use requires, each item with a verbatim quote, speaker, period covered, system named and follow-up request.

- **Ground truth:** Partial. For facts (speaker, period, criteria, system), a teammate hand-labels the AWS SOC 3 and five public vendor pages before seeing output. For the decision, none exists unless a practitioner decides three document-and-use pairs blind. Otherwise blank.

- **Falsifier:** Any one kills it:
  - Across five vendor pages, each with two contrasting uses, the decision never changes with use.
  - Every run returns HOLD.
  - Decisions match the grep's.
  - A bare "summarise and recommend" Claude prompt gives the same decisions and requests.
  - A practitioner says documents do not settle the outcome.

- **Numbers:**
  - Requirements for this use: count of Claude's list, labelled model judgement.
  - Established, appears-only, absent: tallies of that list.
  - Quotes rejected: count failing a code-run exact substring check.
  - Days since coverage ended: today minus the quoted date (AWS SOC 3: 583, from March 31, 2025).
  - No scores or thresholds.

- **The first screen:** One word (HOLD, CONDITIONS or APPROVE) above the requirements this use depends on, each with its status, quote and request.

- **The live moment:** A judge pastes a real vendor's security page and one line of use. The decision and reasons appear (speed unmeasured). The judge changes the use line, or deletes a claim's sentence, and the screen updates. Whether the decision flips is the live test, not a guarantee.

- **Build:** Real: paste-and-use page, structured Claude call, code-run quote check, date arithmetic, fact labels compared with output. Not real: PDF upload, testing on a full SOC 2 report or completed questionnaire (none available), buyer-specific policy, workflow, validated requirement lists.
