# Novelty check: Cards A, B and C

This judges novelty only, not whether a card is good, feasible or valuable.

## How hard I looked

I ran 10 web searches and attempted 14 page fetches in a time-boxed pass of a few minutes. This is weak evidence of absence.

- **Evidence marks:**
  - `[extract]` means I saw it only in a search result summary.
  - `[fetched]` means a fetch tool's summariser read the page and answered my questions, so I did not read the raw page. Quotes marked this way come through that summariser.
- **Failed fetches:** the Hyperproof article, the VendorAuditAI mirror and the FinNLP PDF (404) could not be read.
- **Not opened:** Whistic, Vanta's vendor risk product, Coverbase, Panorays, ProcessUnity, SecurityScorecard, and any product behind a demo wall. Absence from a help page does not show a product lacks a feature, and the commercial products were judged only from public pages.
- **Quality of the sources:** most are vendor marketing or help pages. Nothing here independently confirms what a product does.

**Shared by all three cards:** the shell of verdict, per-requirement status, source link and follow-up requests already exists (see Card A). B and C can only claim novelty for what they add to it.

## Card A: retrieved (a close call)

**Closest prior art:** Drata TPRM Agent, plus free Claude skills for vendor review.

- **Drata TPRM Agent:**
  - Criteria "roll up into Met, Partially met, Not met, and Inconclusive," and each result "links back to the specific requirements and source documentation."
  - It gives a residual-risk recommendation and can generate "follow-up questionnaires" ([Drata](https://help.drata.com/en/articles/16875282-conducting-an-end-to-end-vendor-review-with-the-drata-tprm-agent-training-video-new-experience)) `[fetched]`.
- **Vendor Security Review skill:**
  - It takes what the vendor does and what data it will access.
  - It gives a findings table and "Approve / Approve with conditions / Reject."
  - It requires "independent evidence," not self-attestation, for high tiers ([claudskills.com](https://claudskills.com/skills/vendor-security-review/SKILL.md)) `[fetched]`.
- **SOC 2 Vendor Review skill:** it gives risk ratings, a recommendation, exceptions, report freshness and "structured follow-up questions" ([MCP Market](https://mcpmarket.com/tools/skills/soc-2-vendor-review)) `[fetched]`.
- **Strike Graph Trust Chain TPRM:** it surfaces "gaps, discrepancies, and missing scope" and sends "a specific request to resubmit" ([Help Net Security](https://www.helpnetsecurity.com/2026/07/15/product-showcase-strike-graph-trust-chain-tprm/)) `[fetched]`.
- **UpGuard:** its next steps include "send a gap questionnaire," and it evaluates vendors against a control framework set by tier ([UpGuard](https://help.upguard.com/en/vendor-evaluation-process)) `[fetched]`.

**What is left over, and why this is close:**

- Drata selects criteria by inherent risk level and vendor type, and its article mentions neither use nor who made a statement ([Drata](https://help.drata.com/en/articles/16880318-tprm-agent-create-a-criteria)) `[fetched]`.
- So A's requirements derived from a one-line use, and speaker and period on every item, were not shown by the products I checked.
- The tiering is not a clean difference, because guides already say to tier "by the use case, not the product" ([search result list](https://thinktech.ngo/guides/ai-vendor-due-diligence)) `[extract; attribution to this page not confirmed]`.
- If a reader counts per-item speaker and period as the output, A moves to adapted. I do not: the free skill already separates independent evidence from self-attestation, at tier level.

## Card B: adapted

**Closest prior art:** nothing I found produces the n-of-N output. The nearest work is below.

- **Peer benchmarking in TPRM:** a listing says CyberVadis includes "benchmarking against peer companies" in every assessment ([CyberSecTools](https://cybersectools.com/compare/cybervadis-cyber-risk-assessment-vs-ceeyu-digital-questionnaires-for-tprm)) `[extract]`. When I fetched that page, the summariser found no such statement, so this is unconfirmed.
- **Public-page scans:**
  - One scan of 20 SaaS tools reports aggregate patterns only, with no per-vendor output ([DEV Community](https://dev.to/socialsatprarysoft/title-we-scanned-20-saas-tools-for-trust-readiness-heres-what-buyers-can-see-4j8l)) `[fetched]`.
  - TheCyberGrid covers the visible posture of 186 public SaaS companies ([press release](https://investor.wedbush.com/wedbush/article/marketersmedia-2026-7-14-thecybergridcom-publishes-state-of-saas-security-2026-quarterly-industry-report-on-public-saas-security-posture)) `[extract]`. I saw no per-item disclosure rates.
- **StackPosture:** it records published facts, and "No public evidence found" is explicitly "_not_ a statement that the vendor lacks the certification." The summariser found no cross-vendor counts ([StackPosture](https://stackposture.pages.dev/methodology/)) `[fetched]`. It deliberately declines the inference B makes.
- **Omission detection in filings:** a 2020 FinNLP paper defines a task for flagging risk factors missing from annual reports ([ACL preview](https://preview.aclanthology.org/fix_video/2020.finnlp-1.3.pdf)) `[extract; fetch returned 404]`. I do not know whether it uses peer rates.

**The specific difference:** per-item disclosure rates (n of N), counted across fetched vendor pages, rank one vendor's silences and set the hold line.

**Caveats:**

- One search on ESG and disclosure-theory work returned nothing useful, so this is the card most likely to have academic prior art that I missed.
- B's verdict, evidence tiers and requests are not new (see Card A).

## Card C: adapted

**Closest prior art:** ISNAD, "Grading the Narrators" ([Hugging Face Papers](https://huggingface.co/papers/2607.24117)) `[fetched]`, with its [PyPI package](https://pypi.org/project/isnad/) `[extract]`.

- **The match is close.** Each claim carries a transmission chain, chains are graded by their weakest link, content is checked separately from provenance, and a decision matrix routes each claim to serve, review or quarantine.
- **C's mechanism is the same one.** Its relayers, weakest-link grade, and separation of chain grade from plausibility all match, as does its continuity test (could this transmitter have witnessed it?). Classical hadith criticism is the shared source.
- **The domain differs.** ISNAD targets LLM-maintained knowledge bases, evaluated on physics textbooks and Wikipedia. The summariser found no mention of vendor security, compliance documents or third-party risk.
- **Within vendor risk:**
  - Bridge-letter sources already say the letter is management's, not the auditor's, and that treating it as audited assurance is a misreading ([Petronella](https://petronellatech.com/compliance/soc-2-bridge-letter/)) `[extract; attribution to this page not confirmed]`.
  - Evidence ladders already rank third-party assessment above vendor claims ([Rock Cyber](https://rockcyber.com/blog/third-party-ai-assurance-evidence)) `[extract]`.
  - The card itself concedes that "reviewers already ask 'who attested?'".

**The specific difference:** the chain is applied to vendor assurance text, using the roles observer, attester and author. It is reconstructed from a pasted document, the continuity test becomes a date check, and the output is a request for the first broken link. I found no vendor risk tool that outputs a chain per claim.

**Caveats:**

- ISNAD's chains appear to be recorded as a pipeline runs (my reading of the summary, not confirmed), whereas C infers them from prose. If so, that is a real difference, but in how the chain is obtained.
- Without the chain and first broken link, C's output is Card A's.
