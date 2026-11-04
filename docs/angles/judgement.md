# Judgement

Judged blind on the three shuffled cards, the frame, the obvious tool and the novelty labels. All three cards survive; none is eliminated.

## Criteria

| # | Criterion | Card A | Card B | Card C |
|---|-----------|--------|--------|--------|
| 1 | Viewer and decision | Pass: analyst; approve, conditions or hold with requests tied to gaps | Pass: analyst; approve moves to hold, shared omissions become conditions | Pass: analyst; hold or condition on named broken claims |
| 2 | Value beyond the feature | Pass, thin: separates vendor-only claims from vouched ones, for this use | Pass: separates statements that inform from ones any vendor would make | Pass, thin: close to describing the chain itself, but maps to pain 1 |
| 3 | Heuristic is a real competitor | Pass: grep is real, and a bare prompt appears as a kill condition | Pass: its grep alone is weak, but it names the bare prompt as the stronger rival | Pass: grep is real, but the card never confronts the bare prompt |
| 4 | Ground truth independent and obtainable | Pass, partial: facts hand-labelled before output; decision truth blank without a practitioner | Pass, partial: checked, see below; answers are self-reported and decision truth is absent | Pass, partial: seeded edits known by construction; tests sensitivity, not whether the verdict is right |
| 5 | No invented numbers | Pass: counts and dates; 583 days checks out as of 2026-11-04 | Pass: counted and computed, though N and the corpus are our choice | Pass: counts and dates; 19 months checks out |
| 6 | One screen | Pass | Pass | Pass: may crowd with many chains |
| 7 | Buildable in the time | Pass: simplest | Pass, tightest: adds corpus fetch, 106-item extraction and the CAIQ check | Pass |
| 8 | Live moment a judge wants to try | Pass: flip not guaranteed | Pass: strongest, as "n of N peers say this, yours does not" is a new fact to the reader | Pass: seeded edits work, but real pages may show the same break every time |
| 9 | Mechanism changes the output | Pass: no mechanism, so it has no novelty claim | Pass: without it the counts, ranking and hold line vanish | Pass, narrowly: by its own account the output changes "modestly", and the result sits close to Card A |

### Is Card B's ground truth really obtainable?

The card had not checked the registry, so I tested it once:

- The CSA STAR public registry shows 2,897 listings.
- One listing's CAIQ v4.0.2 file, dated 2026-11-03, downloaded as an .xlsx with no login, form or NDA.
- That file holds 253 answered questions: 226 Yes, 20 Not Applicable, 7 No. Every answer has a description. So non-Yes answers exist, but they are few.

This is one file from one vendor. Search results show that some vendors gate their copy behind a form. The STAR API documentation returned HTTP 530, so I could not check it.

Three limits remain:

- The card's items are CSF 2.0 subcategories, while CAIQ questions map to CCM controls. It does not budget for this crosswalk. If Claude does the mapping, the check loses independence, so a teammate should map the items by hand.
- With so few No and Not Applicable answers, a handful of vendors may give an inconclusive result.
- Not Applicable does not mean a weakness, and the answers are the vendor's own. The check tests whether silence carries information, not whether a decision is correct.

This also changes a frame limit: a real completed questionnaire is publicly obtainable. Licence limits still apply, so do not commit these files to a public repository without checking.

## Pick: Card B

It is the only card that gives the reader a measured fact neither the document nor a bare prompt can supply, and it has the largest expected gap over the heuristic, with nothing found that outputs these rates.

## Runner-up: Card C

It has a sound rule-based verdict and cheap tests, but on vendor-only pages it risks collapsing to "request report", and it can be pitched as adapted, not new. Card A ranks third: it is solid and easiest to build, but it is retrieved, sits close to a commercial agent and a free skill, and may never be pitched as new.

## Biggest risk of the pick

The hold line may not discriminate. Disclosure rates come from a small, mixed corpus we chose, and by construction about half the items sit above the median. Public pages are silent on most of 106 subcategories, so nearly every vendor could land on HOLD with a long request list, or the rates could be nearly flat. Either result makes the ranking meaningless and matches the card's own falsifier. Check this first: fetch the corpus and look at the rate distribution and verdict spread before building the interface. If it fails, fall back to Card C.
