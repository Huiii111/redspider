**Value claim:** For each claim this use depends on, the analyst sees who observed it, who only repeated it, and the exact missing link to request.

**Decision changed:** A page saying "SOC 2 audited, encrypted at rest" stops reading as approve-pending-report. The analyst holds or conditions on named broken claims and sends those requests, not a generic questionnaire.

**Trivial heuristic:** `grep -qiE 'SOC ?2 Type (2|II)|ISO ?27001' doc.txt && echo "approve; request report" || echo "hold; send questionnaire"`

**Why it beats that:** Grep gives one verdict and ignores the use. This gives a chain per claim (observer, attester, author), the first broken link quoted, and a request for that link.

Discipline: hadith criticism, isnad grading. Similarity: a statement arrives through relayers who may not have witnessed it. Output changes: chains are graded apart from how plausible the content sounds; a claim's grade is its weakest link, so no blended score; the continuity test (could this transmitter have witnessed it?) becomes a date check. Removing it leaves a claim table with source labels, and reviewers already ask "who attested?". The output changes, modestly.

**Ground truth:** Partial. Seeded edits: delete the period or attester from an AWS SOC 3 excerpt; correct change known by construction. Bridge letter: secondary sources say the service organisation signs it, so its chain must stop at management. Nothing here verifies the verdict itself.

**Falsifier:** A seeded deletion leaves the grade unchanged; two different uses yield identical requests; or on real public pages every claim breaks at vendor self-statement, so the output collapses to grep's "request report".

**Numbers:** Links per chain, claims per grade, needed claims with no chain: counted from the output. Months since attested period end: review date minus document date (AWS sample: 31 March 2025, 19 months). No scores, percentages or thresholds.

**The first screen:** A verdict such as HOLD above the claims this use depends on, each with quote, chain, first broken link in red, and request.

**The live moment:** A judge pastes vendor text and a use line; verdict and chains return from one Claude call (speed unmeasured). Edit either, rerun; changed claims and requests are marked.

**Build:** Real: paste form, Claude extraction, code rejecting any quote not verbatim in the input, verdict by chain rule. Labelled model judgement: which claims this use needs, proposed conditions. Not real: PDF upload, real SOC 2 Type 2 testing, practitioner validation.
