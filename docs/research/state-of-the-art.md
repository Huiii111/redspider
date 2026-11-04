# GRC Engineering: State of the Art

Researched 2026-11-04 in a time-boxed pass. This report records what exists and what remains unsolved. It contains no product ideas.

## How to read the evidence labels

| Label | Meaning |
|---|---|
| PRIMARY | Standards body document, official product documentation, or repository metadata, read directly |
| PRESS | Independent reporting |
| PRACTITIONER | A user's own words on a review site or forum. Anecdotal, not systematic |
| INTERESTED | Written by an audit firm, consultancy or analyst that has a commercial stake |
| VENDOR | The company's own marketing or a competitor's comparison page |
| ALLEGED | An unproven claim, and disputed where noted |
| UNVERIFIED | Could not be confirmed against a primary source |

`[snippet]` means the text was seen only in a search result extract and the page itself was not opened.

## Main findings

- **Assurance failure is the largest public event in this domain.** The Delve allegations of March 2026 are unproven and denied, but they rest on a leaked corpus of 494 SOC 2 reports containing near-identical text.
- **The AICPA named the underlying risks in 2021.** A tool that malfunctions can produce an erroneous audit opinion, and auditors must evaluate the reliability of tool output.
- **Absent data can drop out of view instead of showing as a failure.** Vanta's own documentation says tests can leave the audit evidence view even if they failed earlier in the window. Prowler's documentation has analogous behaviours.
- **No independent measure of accuracy was found** for any compliance automation tool or AI questionnaire product. Published accuracy figures are vendor claims.
- **Evidence on enterprise GRC is thin.** It consists mostly of anonymised anecdotes and review-site aggregates.

## 1. Commercial compliance automation (Vanta, Drata, Secureframe, Sprinto)

### What is demonstrably done

**Vanta (PRIMARY)**
- A test is an automated configuration check that gives pass/fail evidence against controls, with statuses such as OK, NEEDS_ATTENTION and NOT_APPLICABLE ([developer docs](https://developer.vanta.com/docs/concepts/tests)) `[snippet]`.
- Custom tests are pass/fail rules over resource data Vanta already syncs. They cannot be edited after creation: logic changes are made on a copy, so the original stays for audit purposes ([developer docs](https://developer.vanta.com/docs/concepts/tests.md)) `[snippet]`.
- Vanta is not a CPA firm and does not issue the SOC 2 report ([soc2auditors.org](https://soc2auditors.org/software/vanta/)) `[snippet]`.

**Secureframe and Sprinto**
- Secureframe is described as running continuous automated tests through API integrations, with timestamped evidence ([soc2auditors.org, third-party review](https://soc2auditors.org/insights/secureframe-review/)) `[snippet]`.
- Sprinto says its evidence module collects continuously ([Sprinto, VENDOR](https://sprinto.com/blog/sprinto-vs-secureframe/)) `[snippet]`.
- G2 lists Sprinto at 4.8 (1,653 reviews) and Secureframe at 4.7 (801 reviews) ([G2](https://www.g2.com/compare/secureframe-vs-sprinto-inc)) `[snippet]`.
- No help-centre documentation was read for either product, so their mechanisms are unverified here.

### Documented limits

**Vanta's handling of non-applicable tests (PRIMARY).** From the [help article on test history](https://help.vanta.com/en/articles/11345515-automated-test-history), read directly:
- If an integration is not connected, Vanta "will automatically mark that test as not applicable."
- Tests relying on a deleted integration "may disappear from your tests page and audit evidence view."
- A test that becomes inapplicable on or before audit creation "won't appear in the audit evidence view, even if it failed earlier in the audit window."

**Practitioner complaints, in their own words**
- Drata: "their UI shows many false positives, indicating that requirements are taken care of even when they're not." Jonathan Samples, CTO, Revyse ([PeerSpot](https://peerspot.com/questions/what-needs-improvement-with-drata)).
- Drata, on controls that combine monitoring with manual evidence: "they don't show that secondary requirement at all." Same reviewer and page.
- Drata: "it is a lot of work to actually individually and manually upload all the evidence in Drata." Jacqueline Segooa, same page.
- Vanta: a reviewer warned that the implementer must verify resources are compliant, because Vanta can give false positives ([Capterra](https://capterra.com/p/211459/Vanta/reviews/?page=2)) `[snippet]`. The page returned 403 when fetched.
- Vanta: a reviewer lost trust in agent and user compliance tracking after repeated false negatives, and another said notification volume was too much. These came from AWS Marketplace reviews (for example [this listing](https://aws.amazon.com/marketplace/reviews/reviews-list/prodview-5ophamrbfxt44?page=219)) `[snippet]`. The exact listing page was not pinned, so treat them as UNVERIFIED.
- Integrations: "that API only checks if the tool is on or not; it doesn't yield any real evidence for auditing." u/kembrelstudio, r/Infosec, via a [Reddit mirror](https://reddit.sentinel-team.org/posts/1s1y8fs/snapshots/2026-03-25T03%3A40%3A19.565209Z).
- Established organisations: "You can't do it if you already have established processes because each technical decision an org has made from day 1 has mutated into this Frankenstein environment." u/TheCyberThor, same thread.
- Buyers: "The only flag they care about is can you get me SOC 2 as fast as possible with as minimal work." u/TheCyberThor, same thread.
- Timing: "nothing worse than paying for a compliance tool to auto-collect evidence for controls you haven't even properly defined yet." u/Scary-Whereas-1025, r/Information_Security, via a [Reddit mirror](https://reddit.sentinel-team.org/posts/1tsfoj9/snapshots/2026-06-01T16%3A42%3A12.525392Z).
- Cost: "$20k/year before you even know what you're missing doesn't make sense." u/Low_Fly_2612, same thread. This commenter promotes their own AWS evidence tool.
- SOC 2 itself: "The entire system largely hinges on your auditor's trust in your screenshots." Vanta is "not a villain," but "Currently, they are the enablers of a flawed system." Can Duruk ([Margins, 31 July 2025](https://www.readmargins.com/p/the-soc2-kabuki-theater)).

**Unverified or biased complaints**
- Quoted Reddit remarks such as Vanta's tests being "not comprehensive" appear on a competitor-affiliated blog ([Cyber Sierra](https://cybersierra.co/blog/vanta-drata-review/)) `[snippet]`. The original posts were not found. UNVERIFIED.
- Renewal price complaints, including a 167% increase and a jump from $7,500 to $20,000, appear on review and comparison sites such as [ComplyJet](https://www.complyjet.com/blog/vanta-reviews) `[snippet]`. Attribution to a specific page was not pinned. UNVERIFIED.
- Sprinto says Secureframe is "automated, but only to an extent" ([Sprinto, VENDOR, a competitor](https://sprinto.com/blog/sprinto-vs-secureframe/)) `[snippet]`.

## 2. Standards position: what the AICPA says about tools

Source: [AICPA FAQ, "Effect of the use of software tools on SOC 2 examinations", as of 30 June 2021](https://linfordco.com/wp-content/uploads/2022/06/FAQ-use-of-SOC-2-Software-Tools.pdf). Pages 1 to 10 were read directly from a copy hosted by the audit firm Linford & Co, not from aicpa.org. The FAQ describes itself as nonauthoritative AICPA staff guidance. PRIMARY.

- **Erroneous opinions:** a tool that does not function as intended "could result in the service organization furnishing the service auditor with incorrect information; this in turn could result in an erroneous opinion." The example given is an API connection that does not operate correctly.
- **Predefined controls:** overreliance on a tool's predefined controls "could fail to identify and assess all relevant risks." This could lead to a modified auditor's opinion.
- **Tool output as evidence:** tool-generated information is information produced by the entity. Management is expected to have evaluated its accuracy and completeness, and the auditor must evaluate whether it is sufficiently reliable (AT-C 205, paragraph .35).
- **Tool assurance:** a SOC 2 report on the tool's processing integrity "might help" the auditor evaluate its functionality.
- **Independence:** business relationships between auditors and tool providers can threaten compliance with independence and other rules. A listed example is a provider promoting an auditor's services with a discount, with or without a referral fee.

Linford & Co adds that if an integration breaks, "the auditor could place reliance on outdated information," and that auditors "cannot simply download a SOC 2 report from a SOC 2 automation tool" ([Linford, INTERESTED](https://linfordco.com/blog/soc-2-automation-tools-aicpa-faqs)).

## 3. Public failure: the Delve case

**Status: allegations. No court ruling or regulatory finding was found.** Delve denied the main allegations.

### Alleged, by the anonymous author "DeepDelver"

From the [original Substack post](https://deepdelver.substack.com/p/delve-fake-compliance-as-a-service). ALLEGED. Only the first 100,000 of about 190,000 characters were read.

- **Corpus:** 575 files (494 SOC 2 reports and 81 ISO 27001 forms), obtained from a Google spreadsheet the author says was publicly accessible until Delve revoked it.
- **Boilerplate:** the same sentence appears in 493 of 494 SOC 2 files, and a grammatically flawed sentence in 492.
- **Identical conclusions:** the same "no incidents" conclusion appears in 259 of 259 Type II reports. So does the same cybersecurity-insurance conclusion.
- **Pre-written audit content:** draft reports allegedly already contained auditor verdicts, test procedures and conclusions, with customers completing only highlighted fields.
- **Evidence:** pre-written board minutes and pre-populated incident tasks, and boilerplate evidence for late-onboarded staff.
- **Trust pages and questionnaires:** trust pages allegedly listed measures never implemented. The questionnaire AI allegedly answered that the company had an MDM and a 200-hour pentest.
- **Auditors:** "99%+" of clients in the prior six months allegedly went through Accorp or Gradient. The post also names Glocert, DKPC, Accorian, Prudence Advisors and BQC Assessment as alleged rubber-stamp firms.
- **Scope mismatch:** Duos Edge's Sections 2 and 3 allegedly claim four further criteria while Section 4 covers only Security.

### Reported

- Delve called the post "misleading" and said "Final reports and opinions are issued solely by independent, licensed auditors, not Delve," and "Draft templates are not the same as 'pre-filled evidence'" ([TechCrunch, 22 March 2026](https://www.techcrunch.com/2026/03/22/delve-accused-of-misleading-customers-with-fake-compliance/)). PRESS.
- TechCrunch says the response did not address several allegations, including the AI claims and the trust page claims. Same article.
- X users said they gained access to sensitive information such as employee background checks. Same article.
- Sim.ai's CEO said on record that Delve had no license agreement: "We knew they planned to use Sim for something and later tried unsuccessfully to sell them an agreement." Whether Pathways was a fork of SimStudio remains an allegation ([TechCrunch, 1 April 2026](https://techcrunch.com/2026/04/01/the-reputation-of-troubled-yc-startup-delve-has-gotten-even-worse/)). PRESS.
- TechCrunch observed that many pages appeared scrubbed from Delve's site, and that Insight Partners' post on its $32 million investment was briefly unavailable. Same article.

### Unverified aftermath

Each of these comes from secondary sources only.

- Y Combinator removed Delve from its directory and asked the founders to leave, dated 3 to 4 April 2026 ([WeMoral](https://wemoral.com/whistleblower/delve-fake-compliance-scandal)). UNVERIFIED.
- A class action was filed on 21 April 2026 in the Northern District of California. No case number or docket was given (same source). UNVERIFIED.
- The founders apologised on video and promised free re-audits and a new auditor network (same source). UNVERIFIED.
- A claim that a public company cited a Delve-based SOC 2 Type II status in SEC filings was seen only in secondary coverage. The filing was not checked. UNVERIFIED.
- No statement from any named audit firm was found.

### Expert commentary (INTERESTED)

- "A SOC 2 Type II report was never meant to be a security guarantee." Jeff Brown, IANS Faculty ([IANS, 24 March 2026](https://www.ians.com/news/delve-allegations-expose-weak-points-in-modern-compliance)). The identical sentence appears under Clarence Chio's byline two months later ([Corporate Compliance Insights, 21 May 2026](https://www.corporatecomplianceinsights.com/soc-2-broken-delve-scandal-shows/)). Chio is CEO of Coverbase, a third-party risk vendor.
- Brown also said "hundreds of companies apparently accepted pre-populated evidence without questioning it" (IANS).
- Coalfire, an audit firm, calls Delve "an extreme case" but warns of reports that are "Not fabricated, perhaps, but not meaningfully tested either" ([Coalfire](https://coalfire.com/the-coalfire-blog/fraudulent-grc-allegations-cautionary-tale-or-wake-up-call)). It also says "The automation is real, and when done right it does reduce burden."
- Baker Tilly advises caution about "SOC 2 in days" guarantees and about relying only on a tool provider's auditor referral ([Baker Tilly](https://www.bakertilly.com/insights/trust-in-soc-2-report-efficiency)) `[snippet]`.

## 4. Enterprise GRC (ServiceNow, OneTrust, AuditBoard/Optro)

### What is demonstrably done

**ServiceNow**
- Its own regulated-markets team built nine IRM indicators with little or no code to detect control failures, and reports a 20% cut in compliance failure risk ([ServiceNow, VENDOR](https://www.servicenow.com/customers/now-on-now-compliance-monitoring.html)) `[snippet]`. The method behind the figure was not seen.
- Indicators can be fully automated through scheduled tasks or can be manual ([ServiceNow community](https://www.servicenow.com/community/grc-forum/1st-line-control-testing/td-p/3175827)) `[snippet]`.
- A job listing describes translating control requirements into deterministic pass/fail rules through native scripting ([Dice](https://www.dice.com/job-detail/5461556a-b3a4-48e2-97ef-7da93dc81add)) `[snippet]`. That suggests automation is built per customer, though one job listing is weak evidence.

**AuditBoard/Optro**
- AuditBoard rebranded as Optro on 9 March 2026 ([press release](https://tools.prnewswire.com/en-us/live/20823/release/20260309EN03678)) `[snippet]`.
- Capterra shows 4.7 from 414 reviews ([Capterra](https://www.capterra.com/p/148230/SOXHUB/reviews/?page=4)) `[snippet]`.

**OneTrust**
- G2 lists OneTrust Tech Risk & Compliance at 4.6 from 109 reviews, with Complex Implementation and Difficult Setup among the listed cons ([G2](https://g2.com/compare/auditboard-vs-onetrust-tech-risk-compliance)) `[snippet]`.

### Documented limits

Anonymised accounts from [GRC 20/20](https://grc2020.com/2025/04/22/the-servicenow-emperor-has-no-grc-clothes-or-needs-a-better-tailor/), INTERESTED. The author appears from the page to be analyst Michael Rasmussen, and the firm sells advisory services. None of the accounts could be independently verified.

- "ServiceNow is an ITSM platform they've tried to adapt for GRC. It's tedious, unintuitive, and painful to maintain."
- "Every new version potentially breaks something. We live in fear of upgrades."
- "We never had a chance to weigh in. IT made the decision, and now we're stuck."
- "We cannot afford the ongoing implementation and maintenance costs."
- The author says GRC 20/20's research puts ServiceNow's total cost of ownership highest in the GRC market. The underlying data was not seen.
- A high-tech firm reportedly turned off ServiceNow for GRC and returned to manual processes in many areas.

### Gaps

- No practitioner evidence was found on continuous control monitoring or evidence collection for OneTrust or Optro. G2's monitoring and integration sections show "Not enough data" for OneTrust ([G2](https://www.g2.com/compare/onetrust-tech-risk-compliance-vs-optro)) `[snippet]`.
- A Gartner document, "ServiceNow IRM for Enterprise GRC: What Works, What Doesn't, and How to Succeed", exists but is paywalled ([Gartner](https://www.gartner.com/en/documents/7988237)). Its findings are unknown.

## 5. Open-source tooling

Repository metadata was read from the GitHub API on 2026-11-04. PRIMARY.

| Project | Stars | Archived | Last push | Licence |
|---|---:|---|---|---|
| [prowler-cloud/prowler](https://github.com/prowler-cloud/prowler) | 15,166 | No | 2026-11-04 | Apache-2.0 |
| [turbot/steampipe](https://github.com/turbot/steampipe) | 7,994 | No | 2026-11-04 | AGPL-3.0 |
| [cloud-custodian/cloud-custodian](https://github.com/cloud-custodian/cloud-custodian) | 6,106 | No | 2026-11-03 | Apache-2.0 |
| [ComplianceAsCode/content](https://github.com/ComplianceAsCode/content) | 2,833 | No | 2026-11-04 | Not detected |
| [trycompai/comp](https://github.com/trycompai/comp) | 2,078 | No | 2026-11-04 | AGPL-3.0 |
| [getprobo/probo](https://github.com/getprobo/probo) | 1,497 | No | 2026-11-04 | MIT |
| [usnistgov/OSCAL](https://github.com/usnistgov/OSCAL) | 964 | No | 2026-11-02 | Not detected |
| [turbot/powerpipe](https://github.com/turbot/powerpipe) | 525 | No | 2026-11-03 | AGPL-3.0 |
| [opencontrol/compliance-masonry](https://github.com/opencontrol/compliance-masonry) | 388 | No | 2026-02-16 | Not detected |
| [oscal-compass/compliance-trestle](https://github.com/oscal-compass/compliance-trestle) | 290 | No | 2026-11-03 | Apache-2.0 |

### What each does

- **Prowler (PRIMARY):** maps each check to one or more frameworks, so one scan yields technical findings and framework-level results ([docs](https://docs.prowler.com/user-guide/cli/tutorials/compliance)). A requirement is FAIL if any referenced check produces a FAIL for an in-scope resource ([developer guide](https://docs.prowler.com/developer-guide/security-compliance-framework)).
- **Steampipe/Powerpipe:** publish benchmark mods that map cloud configuration to frameworks, including SOC 2 ([Powerpipe Hub](https://hub.powerpipe.io/mods/turbot/steampipe-mod-gcp-compliance/controls/benchmark.soc_2_2017_cc_6_7_2)) `[snippet]`.
- **Cloud Custodian:** applies policy as code with auto-remediation, runnable in AWS Lambda, and the guide recommends a dry run first ([AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/compliance-as-code-and-auto-remediation-with-cloud-custodian)) `[snippet]`.
- **Compliance Trestle:** manages compliance as code using NIST OSCAL. Older README text says it natively handles only JSON and YAML, while OSCAL also supports XML ([GitHub](https://github.com/oscal-compass/compliance-trestle)) `[snippet]`. Sources conflict on maturity: an older README says beta and [PyPI](https://pypi.org/project/compliance-trestle/3.4.0) says stable.
- **Comp AI (VENDOR):** claims a device agent, generated tests that run daily, and AI browser checks that take screenshots ([Comp AI](https://www.trycomp.ai/vanta-alternative)). The same page is inconsistent: it gives "580+ integrations" and "11 native integrations," and both "Bring your own auditor" and a "fixed-fee auditor included." Its stated averages are SOC 2 Type I in about 10 days and Type II in about 14. Agent code was not reviewed for this report.
- **Probo:** an open-source compliance platform with a managed option ([OpenAlternative](https://openalternative.co/alternatives/probo)) `[snippet]`.

### Documented limits

**Prowler (PRIMARY)**
- A framework requirement with no automatable check stays in the file with an empty check list and still counts toward the report total. The developer guide does not state a status for it.
- The PDF configuration has an `include_manual` option, and the example sets it to `false` ([developer guide](https://docs.prowler.com/developer-guide/security-compliance-framework)).
- In the CLI, a requirement with no matching resource "is omitted from the output" ([docs](https://docs.prowler.com/user-guide/cli/tutorials/compliance)).
- The CLI tutorial page contained no statement that output is not a certification or audit opinion. Other pages were not checked.

**OSCAL**
- A NIST workshop deck says legacy RMF tools and processes "do not define compliance to the granularity required for OSCAL" ([NIST, 2025](https://csrc.nist.gov/csrc/media/Projects/open-security-controls-assessment-language/images-media/2025/oscal-mini-workshop-32-USAI/2.19.2025_USAI_SlideDeck.pdf)) `[snippet]`.
- RegScale, which sells OSCAL tooling, describes adoption as uneven ([Security Boulevard](https://securityboulevard.com/2025/12/regscale-open-sources-oscal-hub-to-further-compliance-as-code-adoption/)) `[snippet]`.
- Elevate Consult and Platform28 say FedRAMP handled more than 100 Rev5 authorizations in 2025 with no OSCAL submission ([Elevate](https://elevateconsult.com/insights/fedramp-automation-when-oscal-saves-time/), [Platform28](https://platform28.com/blog/oscal-implementation-guide)) `[snippet]`. No official FedRAMP source was found for this. UNVERIFIED.

**FedRAMP direction**
- FedRAMP's [RFC-0024](https://www.fedramp.gov/rfcs/0024) proposes that Rev5 providers produce machine-readable authorization data `[snippet]`.
- FedRAMP's [Key Security Indicators page](https://www.fedramp.gov/docs/20x/phase1/key-security-indicators/) describes indicators as measurable validation rather than one-time requirements `[snippet]`.
- Secondary sources conflict on the indicator count: [Secureframe](https://secureframe.com/hub/fedramp/key-security-indicators-ksi.md) says 46, and [Knox Systems](https://knoxsystems.com/resources/fedramp-news-2026) says 56 for Low and 61 for Moderate `[snippet]`.

**Not established**
- No independent assessment of coverage for Steampipe, Cloud Custodian, OpenControl or Comp AI was found.
- The activity of compliance-masonry beyond the GitHub push date was not assessed.

## 6. AI entrants, including questionnaire automation

### Claims (VENDOR, unverified)

- Conveyor claims 95%+ answer accuracy and a hallucination rate below 0.01%, and Vanta is listed with a 95% AI acceptance figure ([ComplyJet review](https://www.complyjet.com/blog/best-security-questionnaire-automation)) `[snippet]`. ComplyJet is itself a compliance vendor.
- Comp AI's agent claims are in section 5. Secureframe AI reportedly adds risk assessment and policy drafting ([third-party review](https://compliancestronghold.pages.dev/reviews/secureframe)) `[snippet]`.

### Failure modes described

These sources are vendors, some of which sell human review, and none publishes independent measurement.

- SecurityPal says tools claim 90 to 95% accuracy "without showing the methodology" ([SecurityPal](https://www.securitypalhq.com/blog/ai-security-questionnaire-accuracy)) `[snippet]`.
- SecurityPal reports a case where AI answered "No" to whether a service includes AI or ML functionality when the answer was "Yes," with 13 cascaded errors at 90% confidence (same page) `[snippet]`.
- Another SecurityPal post lists knowledge drift, inconsistent responses, and generic answers "technically true but misleading or incomplete." It presents no error rates or methodology ([SecurityPal](https://www.securitypalhq.com/blog/why-your-ai-questionnaire-tool-gets-answers-wrong)).
- Wolfia names stating a certification the company does not hold as a predictable hallucination ([Wolfia](https://wolfia.com/blog/how-ai-accuracy-affects-security-questionnaire-deal-velocity)) `[snippet]`.
- The Delve post alleges a real-world instance, described in section 3. ALLEGED.

### Gaps

- No independent head-to-head benchmark of questionnaire tools was found.
- No accuracy evidence was found for Loopio or Responsive.

## 7. What remains unsolved

Each item records an evidenced gap. "Not found" means not found in this time-boxed search, not proof of absence.

1. **Verifying the verifier.** The AICPA says tool malfunction can lead to an erroneous opinion and that auditors must judge reliability ([FAQ](https://linfordco.com/wp-content/uploads/2022/06/FAQ-use-of-SOC-2-Software-Tools.pdf)). Practitioners report false positives and false negatives (section 1). No independent measure of tool test accuracy was found.
2. **Silent absence of evidence.** Disconnected or deleted data sources can remove tests from the audit evidence view, even tests that failed earlier in the window ([Vanta](https://help.vanta.com/en/articles/11345515-automated-test-history)). Prowler's requirements with no check have no documented status, and requirements with no matching resource are omitted from CLI output ([Prowler](https://docs.prowler.com/user-guide/cli/tutorials/compliance)).
3. **Configuration state versus control operation.** A practitioner says an API "only checks if the tool is on or not" ([Reddit mirror](https://reddit.sentinel-team.org/posts/1s1y8fs/snapshots/2026-03-25T03%3A40%3A19.565209Z)). Another reports that combined monitoring and manual requirements are hidden ([PeerSpot](https://peerspot.com/questions/what-needs-improvement-with-drata)).
4. **Evidence provenance.** Duruk describes screenshot-based evidence and notes no chain of custody or authentication ([Margins](https://www.readmargins.com/p/the-soc2-kabuki-theater)). Comp AI still lists AI-taken screenshots as evidence ([Comp AI, VENDOR](https://www.trycomp.ai/vanta-alternative)).
5. **Report consumers cannot judge report quality.** The reported Delve text similarity surfaced only through a leaked corpus. IANS advises buyers to ask what the auditor accesses and at what stage, and to spot-check 5 to 10 controls ([IANS](https://www.ians.com/news/delve-allegations-expose-weak-points-in-modern-compliance)). No scalable method for buyers was found.
6. **Auditor independence in bundled models.** The AICPA flags referral and discount relationships as potential threats ([FAQ](https://linfordco.com/wp-content/uploads/2022/06/FAQ-use-of-SOC-2-Software-Tools.pdf)). Bundled auditor offers persist in the market, as Comp AI's page shows ([Comp AI, VENDOR](https://www.trycomp.ai/vanta-alternative)).
7. **Generic controls versus an organisation's real risks.** The AICPA warns predefined controls may miss unique risks ([FAQ](https://linfordco.com/wp-content/uploads/2022/06/FAQ-use-of-SOC-2-Software-Tools.pdf)). Practitioners report poor fit with established environments ([Reddit mirror](https://reddit.sentinel-team.org/posts/1s1y8fs/snapshots/2026-03-25T03%3A40%3A19.565209Z)).
8. **Questionnaire answers that outrun reality.** Published accuracy figures lack visible methodology, per a vendor source ([SecurityPal](https://www.securitypalhq.com/blog/ai-security-questionnaire-accuracy)) `[snippet]`, and no independent benchmark was found.
9. **Machine-readable compliance is not yet normal practice.** NIST material cites a granularity mismatch with legacy tools (section 5). The figure for FedRAMP submissions without OSCAL is unverified.
10. **Enterprise GRC cost and maintainability.** Evidence is anecdotal and comes from an interested source ([GRC 20/20](https://grc2020.com/2025/04/22/the-servicenow-emperor-has-no-grc-clothes-or-needs-a-better-tailor/)). No systematic data was found.

## 8. Limits of this research

- **Time box:** this was a short pass, and many items rest on search extracts, marked `[snippet]`.
- **Reddit:** threads were read through a third-party mirror (`reddit.sentinel-team.org`) with partial comment capture, so they were not confirmed on Reddit. A commenter in the same thread as the quoted remarks had a username suggesting a bot, and that comment was excluded.
- **Blocked sources:** Capterra and NewsBytes returned 403, and one Hacker News mirror returned 404.
- **Delve source:** about 90,000 characters of the Substack post were not read. No court docket or regulator record was checked.
- **Not read:** Drata and Sprinto documentation, Secureframe documentation, and ServiceNow, OneTrust and Optro official documentation.
- **Conflict of interest:** most commentary on this subject comes from parties with a commercial stake. Labels above mark this where known.
