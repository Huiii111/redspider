# GRC Engineering: methods, standards, and how practitioners are judged

Research date: 2026-11-04. Facts only; no product ideas.

## How to read the evidence labels

| Label | Meaning |
|---|---|
| **[parsed]** | I downloaded the file and read or counted it directly. Strongest. |
| **[read]** | Fetched the page. The fetch tool returns a model-extracted reading, so quotes were not compared to the page by eye. |
| **[extract]** | Seen only in a search-engine extract. The page was not opened, and the search summary did not always tie a claim to one link, so the link given is the likely source from that result set. |
| **[unverified]** | From memory, or the source was paywalled or unreachable. Do not rely on it. |

Primary texts I could not open: AICPA AT-C 205, the AICPA Audit Sampling guide, the AICPA SOC 2 guide, the 2027 exposure draft itself, ISO 27001/27006-1 (paywalled), Open Group O-RA/O-RT (login redirect), Cox 2008 (HTTP 403), and EUR-Lex (the fetcher got empty pages). Claims about those texts are secondhand.

## 1. Corrections to `grc-eng.md`

### Confirmed

| Claim | Result | Source |
|---|---|---|
| SOC 2 CC1-CC9 = 33 criteria | Correct. Also A=3, C=2, PI=5, P=18 (61 in total). | [parsed] [AICPA TSP 100, third-party-hosted copy](https://arpio.io/wp-content/uploads/2020/08/trust-services-criteria.pdf) |
| CSF 2.0: 6 functions, 22 categories, 106 subcategories, and the category lists | Correct, after excluding 12 withdrawn CSF 1.1 categories that the catalog still carries. Subcategories: GV 31, ID 21, PR 22, DE 11, RS 13, RC 8. | [parsed] [NIST OSCAL CSF catalog](https://github.com/usnistgov/oscal-content) |
| CIS 18 controls, 153 safeguards | Correct. IG1 is exactly 56, not "~56". IG2 adds 74, IG3 adds 23. | [extract] [CIS](https://www.cisecurity.org/controls/implementation-groups) |
| PCI v4.0.1 June 2024; future-dated requirements effective 31 March 2025 | Correct. No requirements added or deleted in 4.0.1. | [extract] [PCI SSC](https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1) |
| OSCAL CSF and 800-53 repository paths | Correct: `nist.gov/CSF/v2.0/json/` and `nist.gov/SP800-53/rev5/json/`. | [parsed] [repo tree](https://github.com/usnistgov/oscal-content) |
| ISO 27001 Annex A 93 controls (37/8/14/34) | Arithmetic is consistent. Not checked against the paywalled standard. | [unverified] |

### Wrong or out of date

1. **SOC 2 is about to change, and the notes do not say so.** On 28 Oct 2026 the AICPA proposed a "targeted restructuring" of the criteria, with comments due 15 Jan 2027. It would apply to engagements beginning on or after 31 Dec 2027, with early adoption permitted. The 2017 criteria with 2022 points of focus stay current until then. [read] [AICPA](https://www.aicpa-cima.com/news/article/aicpa-proposes-update-of-soc-2-r-trust-services-criteria-to-enhance-the-relevance-usability-and-value-of-cpas-reports), [Journal of Accountancy](https://www.journalofaccountancy.com/news/2026/oct/aicpa-proposes-improvements-to-soc-2-trust-services-criteria/)
   - One secondary source reports the draft's counts as 61 to 50 criteria overall and CC 33 to 20, with series CC1-CC8. It says the CC5 series goes, COSO references are dropped, and AI wording appears in points of focus under 17 criteria, with no AI-specific criterion. The per-criterion crosswalk is that author's reading, not the AICPA's. The publisher is a non-CPA, ad-supported site that sells audit-firm placement. [read] [SOC2Auditors.org](https://soc2auditors.org/insights/soc-2-trust-services-criteria-2027/)
2. **Fixture 1 maps database encryption at rest to CC6.7. That is the wrong criterion.** CC6.7 covers transmission, movement and removal. "Uses Encryption to Protect Data ... at rest" is a point of focus in the CC6.1 section of this copy. The copy is the 2017 text, and I did not check the 2022 point-of-focus wording. [parsed] [TSP 100 copy](https://arpio.io/wp-content/uploads/2020/08/trust-services-criteria.pdf)
3. **Fixture 1 maps "no incident response plan" to CC7.3.** CC7.3 is evaluating security events. CC7.4 is "executing a defined incident-response program". [parsed] same source.
4. **The CC9 row lists "risk acceptance".** The criterion statements are CC9.1 (mitigation for business disruptions) and CC9.2 (vendors and business partners). Neither statement mentions risk acceptance. [parsed] same source.
5. **The MFA cross-map cites the wrong CSF subcategory, and misquotes it.** PR.AA-02 actually reads "Identities are proofed and bound to credentials based on the context of interactions". PR.AA-03, "Users, services, and hardware are authenticated", is the closer fit. [parsed] [NIST CSF catalog](https://github.com/usnistgov/oscal-content)
6. **`github.com/GSA/fedramp-automation` returns 404 today**, from both the website and the API. The live machine-readable source I found is [`FedRAMP/rules`](https://github.com/FedRAMP/rules), last pushed 2 Nov 2026, which [fedramp.gov](https://www.fedramp.gov/2026/) links. [parsed] I did not establish whether the old repo moved or was deleted, or whether baselines exist elsewhere.
7. **The OSCAL model list omits Control Mapping**, added in v1.2.0. The latest release is v1.2.3 (7 Aug 2026). [read] [OSCAL releases](https://github.com/usnistgov/OSCAL/releases)
8. **"SP 800-53 to CSF mapping is in the OSCAL content repo" was not confirmed.** A path search of the repo tree for "map" found nothing. I did not check whether the listing was truncated. [parsed]

### Could not verify

- PCI "~280 sub-requirements". No source found.
- PCI 8.4 as "MFA for all non-console administrative access". From memory that wording fits 8.4.1, not the 8.4 parent. [unverified]
- NVD rate limits. The page did not render for the fetcher.
- "No official REST API exists" for OSCAL. Not checked.
- The 5x5 action bands (Accept/Monitor/Treat/Urgent). The notes cite nothing, and I found no standard prescribing them. Treat them as an unsourced convention.

## 2. Frameworks in force

| Framework | Status on 2026-11-04 | Structure | Source |
|---|---|---|---|
| SOC 2 TSC | 2017 with 2022 points of focus; exposure draft open | 61 criteria; Security mandatory (per the notes) | See section 1 |
| ISO/IEC 27001:2022 | 2013-edition transition closed 31 Oct 2025 | Clauses 4-10 plus Annex A | [extract] [TUV rules](https://stagegr.tuv.at/wp-content/uploads/sites/67/2025/08/VB-BA-ZET-MS-All-004-Ann-CR-27001-27701-EN.pdf) |
| NIST CSF 2.0 | Current | 6 / 22 / 106 | [parsed] [catalog](https://github.com/usnistgov/oscal-content) |
| SP 800-53 Rev 5 | Release 5.2.0, 27 Aug 2025 (added SA-15(13), SA-24, SI-02(07)) | 20 families; 324 base controls + 872 enhancements = 1,196 entries, of which 182 withdrawn, so 1,014 active (my count) | [read] [NIST](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final); [parsed] catalog, modified 22 Oct 2026 |
| OSCAL | v1.2.3 | Repo also holds AI RMF, SP 800-171r3, 800-172r3 and 800-218 catalogs | [read] [repo](https://github.com/usnistgov/oscal-content) |
| PCI DSS | v4.0.1 is the only active version; v4.0 retired 31 Dec 2024 | 12 requirements; 64 new in v4, 51 of them future-dated | [extract] [PCI SSC](https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1) |
| CIS Controls | v8.1 is the latest I could see; no evidence of v9, but not ruled out | 18 / 153 | [extract] [CIS](https://www.cisecurity.org/controls/cis-controls-navigator) |

### EU regulation that binds security teams

**DORA**
- Applies since 17 Jan 2025. [read] [EIOPA](https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en)
- The management body bears "ultimate responsibility" for ICT risk and sets the acceptable level of it (Art 5). [read] [unofficial mirror](https://www.digital-operational-resilience-act.com/Article_5.html)
- The register of all ICT contracts must distinguish those supporting critical or important functions, with at least annual reporting to authorities (Art 28(3)). Exit plans are tested and reviewed periodically (Art 28(8)). [read] [mirror](https://www.digital-operational-resilience-act.com/Article_28.html)
- Threat-led penetration testing at least every 3 years for qualifying entities (Art 26). [read] [mirror](https://www.digital-operational-resilience-act.com/Article_26.html)
- Major incidents: initial notification within 4 hours of classification and no later than 24 hours after awareness; intermediate report within 72 hours of the initial notification. [extract] [RTS 2025/301 via Advisera](https://advisera.com/cdr-2025-301/time-limits-for-the-initial-notification-and-for-the-intermediate-and-final-reports/), [Springlex](https://www.springlex.eu/en/packages/dora/rts-ir-regulation/article-5/)
- Secondary sources conflict on what starts the one-month final-report clock. Unresolved.

**NIS2**
- Transposition deadline 17 Oct 2024; 18 sectors; medium and large entities; top management accountable. [read] [European Commission](https://digital-strategy.ec.europa.eu/en/policies/nis2-directive)
- Reporting: 24-hour early warning, 72-hour notification, final report one month after the notification. [read] [Art 23 mirror](https://www.nis-2-directive.com/NIS_2_Directive_Article_23.html)
- Maximum fines of at least EUR 10m or 2% of worldwide turnover for essential entities, EUR 7m or 1.4% for important entities, whichever is higher. [read] [Art 34 mirror](https://www.nis-2-directive.com/NIS_2_Directive_Article_34.html)
- On 20 Jan 2026 the Commission proposed amendments it says would ease compliance for 28,700 companies. The page describes this as a proposal. [read] [European Commission](https://digital-strategy.ec.europa.eu/en/policies/nis2-directive)

**EU AI Act**
- Regulation (EU) 2026/1744 (the AI Omnibus) was published 24 July 2026 and entered into force 27 July 2026.
- Annex III high-risk duties move from 2 Aug 2026 to 2 Dec 2027. AI embedded in regulated products moves to 2 Aug 2028.
- Transparency duties stayed on 2 Aug 2026.
- [read] [Legal 500, secondary](https://www.legal500.com/intelligence/european-union/technology/eu-digital-omnibus-on-ai-enters-into-force). The Official Journal text was not checked.
- The high-risk cybersecurity requirement (Art 15) is [unverified] here.

## 3. How auditors sample and test

**No mandated sample size exists.** AT-C 205 .32 is reported to require only a sample large enough to reduce sampling risk to "an acceptably low level", and representative of the population. It points to the AICPA Audit Sampling guide as guidance that "may be useful". Firms use their own methods, so two firms can size the same population differently. [read, secondhand] [SOC2Auditors.org](https://soc2auditors.org/insights/soc-2-sample-size/)

| Control frequency | Typical sample | Source note |
|---|---|---|
| Annual | 1 of 1 | "adapted from" the 2019 AICPA guide, and called "a sense check, not a rule" |
| Quarterly | 2 of 4 | same |
| Monthly | 2-4 of 12 (Linford's example tests 3) | same |
| Semimonthly | 3-8 of 24 | same |
| Weekly | 5-9 of 52 | same |
| Large population (250+; daily or event-driven) | Start at 25, 40 after one deviation, 60 after two | Linford table, 90% minimum confidence |

Sources: [read] [SOC2Auditors.org](https://soc2auditors.org/insights/soc-2-sample-size/), [Linford & Co](https://linfordco.com/blog/audit-sampling/). Linford is a CPA firm selling these audits. I saw the guide's numbers only through these two sources. Search extracts from other sites gave different numbers (for example weekly 15-20), so these are not settled.

**Deviations**
- In Linford's example (389 employees, sample of 25), one deviation expands the sample to 40 and a second to 60. A third stops sampling and the control is deemed not operating effectively. Other firms set their own stopping points.
- For small populations, such as a monthly reconciliation, any deviation is a failure in Linford's example. [read] [Linford](https://linfordco.com/blog/audit-sampling/)
- An item that cannot be tested because the evidence does not exist counts as a deviation, and the cause of each deviation must be investigated. [read, secondhand] [SOC2Auditors.org](https://soc2auditors.org/insights/soc-2-sample-size/)

**Type 2 population.** The population is every control instance in the observation window, so a monthly control over six months has six instances. [read] same source. A required or typical window length was **not verified**; the usual "3-12 months" came from no source I read.

**Exception versus opinion**
- Exceptions are recorded test results. The opinion is the overall conclusion after weighing them, so an unqualified opinion can sit alongside listed exceptions. [extract] [Sensiba](https://knowledge.sensiba.com/audit-findings-in-soc-1-soc-2-audits-what-do-they-mean), [Bastion](https://bastion.tech/learn/soc2/soc2-report/)
- Modified opinions, according to an A-LIGN audit manager reposted by CSA (A-LIGN sells audits): [read] [CSA](https://cloudsecurityalliance.org/blog/2022/10/13/can-you-fail-a-soc-2-examination)
  - **Qualified:** deficiencies or deviations in the description or control design, or controls that "did not operate effectively throughout the specified period", limited to some aspects.
  - **Adverse:** deficiencies "pervasive throughout the description or across all or most of the control objectives".
  - **Disclaimer:** the auditor is "unable to obtain sufficient, appropriate information", for example when management refuses to give a written assertion.

**Evidence reliability (IPE).** Auditors must test the completeness and accuracy of system-generated reports, or test the controls over them, and judge whether they are precise enough. A report is not evidence merely because a system produced it. Accuracy can be tested by tracing samples back to source transactions. [extract, audit firms] [BDO](https://www.bdo.com/insights/assurance/it-audit-considerations-for-information-produced-by-the-entity-ipe), [Linford](https://linfordco.com/blog/iuc-ipe-audit-procedures-for-soc-audits/), [Schneider Downs](https://schneiderdowns.com/our-thoughts-on/ipe-testing-methodologies-key-risks/)

**Other report mechanics** [extract, vendor blogs, standard not read]
- Carve-out excludes a subservice organisation's controls from the audit. [getAgency](https://blog.getagency.com/articles/complete-soc-2-glossary)
- Complementary user entity controls are the customer's assumed controls. [OneUptime](https://oneuptime.com/blog/post/2026-08-04-how-buyers-read-soc-2-type-ii/markdown)
- A bridge letter is a management representation with no auditor procedures over the gap period. [TCSA](https://www.tcsa.in/learn/soc-2-bridge-letters)

**ISO 27001 audits** [extract, certification body and consultancy sources; ISO 27006-1 and 17021-1 not read]
- Stage 1 reviews documentation and readiness. Only Stage 2 can lead to certification. One certification body caps the gap between them at six months. [TUV rules](https://stagegr.tuv.at/wp-content/uploads/sites/67/2025/08/VB-BA-ZET-MS-All-004-Ann-CR-27001-27701-EN.pdf)
- Certificates last three years, with surveillance audits sampling part of the ISMS and then recertification. Sources number the years inconsistently. [Schellman](https://hub.schellman.com/blog/iso-27001-certification-process)

## 4. Risk methods and the evidence on them

**Risk matrices (including 5x5)**
- Cox (2008, *Risk Analysis* 28(2):497-512) is an analytical argument, not an experiment. As reported by Krisper: matrices can rank a lower risk above a higher one, can be worse than random under negative correlation between inputs, and cannot be fully consistent on ordinal scales. [read, secondhand; the original returned 403] [Krisper, arXiv 2103.05440](https://ar5iv.labs.arxiv.org/html/2103.05440)
- Thomas, Bratvold and Bickel (SPE 166269), oil and gas:
  - Reversing the score scale can reverse a risk's rank.
  - Small boundary changes alter priorities.
  - Scoring distorts relative distance.
  - The authors were "unable to find instances of published scientific studies demonstrating that RMs improve risk-management decisions".
  - Their sample narrowed from 527 search hits to 30 papers. Most coloured cells inconsistently.
  - [read] [JPT summary](https://jpt.spe.org/inherent-flaws-risk-matrices-may-preclude-them-being-best-practices)
- Krisper lists 24 problems and says there is "little to no evidence that qualitative risk matrices work". It is a preprint whose author is developing a competing quantitative tool (RISKEE), which is an interest to weigh. [read] same arXiv link.

**FAIR**
- FAIR is published by The Open Group as O-RT (taxonomy) and O-RA (analysis process). Version numbers conflict: Open Group pages in my results show O-RA 2.0.1, while one third-party site lists O-RT 3.1 (May 2025) and O-RA 2.1. Unresolved. [extract] [Open Group](https://pubs.opengroup.org/security/o-ra), [SmartSuite](https://www.smartsuite.com/frameworks/open-fair-risk-taxonomy-and-risk-analysis-standards)
- The decomposition (loss event frequency times loss magnitude, estimated as ranges) is from memory. [unverified]

**Head-to-head evidence**
- **I found no controlled or field study comparing FAIR or calibrated estimation with matrices on real security outcomes.** This rests on a few searches, so it does not prove none exists.
- The critiques are mathematical. FAIR's originator Jack Jones presents the quantitative advantage as settled in a FAIR Institute post, and the Institute promotes FAIR. [read] [FAIR Institute, 8 Mar 2018](https://www.fairinstitute.org/blog/is-cyber-risk-measurement-just-guessing-part-3-of-3)
- Stated plainly: the evidence against matrices is strong on logic, and the evidence that FAIR produces better security decisions is not established in anything I read.

## 5. Vendor risk review

- **Standard instruments** [extract, vendor sources that conflict; official workbooks not read]:
  - SIG: 18 or 21 domains reported; Lite 128 or 150 questions, Core 627 or 825, Detail 1,936. Licensed. [Vorp Labs](https://vorplabs.com/security-framework-changes/sig), [Drata](https://drata.com/learn/assurance/sig-questionnaire-overview)
  - CAIQ v4: 261 questions on CCM v4's 197 controls across 17 domains; free. [ComplyDog, likely source](https://complydog.com/blog/caiq-vs-sig)
  - HECVAT 4: 321 questions including 32 on AI; free; launched Feb 2025. [RocketDocs](https://rocketdocs.com/resources/blog/hecvat-questionnaire-guide)
- **Regulatory hook:** CSF's GV.SC category, SOC 2 CC9.2 and DORA Art 28 each require third-party risk management. [parsed/read] sources in sections 1-2.
- **A SOC 2 report rarely ends the review:** only 7% of Whistic's respondents would require no further documentation from a vendor that supplied SOC 2 or ISO 27001. [parsed] [Whistic 2022](https://lp.whistic.com/hubfs/Marketing%20Collateral/The%20State%20of%20Vendor%20Security%20Report%202022.pdf?hsLang=en)
- **Trust in questionnaire answers** comes only from vendor-research extracts, in section 8. The figures conflict.

## 6. How the movement defines GRC Engineering

The [GRC Engineering manifesto](https://grc.engineering/) calls it "a step-change evolution in security governance, risk, and compliance". It defines it as "the practice of using science, math, user-centered design, and modern software development" to help organizations reach objectives, handle uncertainty and act with integrity. [read]

| Values (more than) | (over) |
|---|---|
| Automate early on and often | manual processes and workflows |
| GRC-as-Code | tool-specific constructs |
| Measurable and meaningful risk outcomes | checkbox compliance outputs |
| Evidence, logic, math, and reason | fear, uncertainty, and doubt |
| In-depth continuous assurance | shallow periodic monitoring |
| Stakeholder-centric UX | building what works best for GRC teams |
| Shared fate partnerships | transactional relationships |
| Open source practitioner-developed solutions | closed source vendor and industry organization paradigms |

- **Principles:** Shift, and start, GRC left; Practitioners can build better solutions; GRC as a product; Threat-informed GRC; Systems thinking + design thinking.
- **Authors:** Ayoub Fandi, Akshay Finney, Austin Rust, Charles Nwatu, Emre Ugurlu, Justin Pagano, Terra Cooke, Varun Gurnaney, Yash Devadiga.
- **Date:** the footer shows 30 Sept 2026, unlabeled, so it may be a last-updated date.
- This is a self-definition. I did not check adoption, or whether auditors accept any of it.

## 7. Real decisions: who, how often, what they hinge on

Cadence below is what the rule **requires**, not what anyone measured. I found no study of how often these decisions actually happen.

| Decision | Who | How often | Hinges on | Source status |
|---|---|---|---|---|
| Opinion type on a SOC 2 report | Service auditor (CPA) | Each report | Individual and aggregate effect of deviations; whether evidence was obtainable | [read] [CSA/A-LIGN](https://cloudsecurityalliance.org/blog/2022/10/13/can-you-fail-a-soc-2-examination) |
| Extend the sample or conclude failure | Service auditor | Per control tested, on any deviation | Deviation count and cause; firm method | [read] [Linford](https://linfordco.com/blog/audit-sampling/) |
| Accept a vendor's report or ask for more | Buyer security team | Per vendor | Whether more documents are needed (almost always yes in Whistic's sample) | [parsed] Whistic 2022 |
| Set ICT risk tolerance; approve third-party policy and continuity plans | DORA management body | Periodic review; interval not read | Entity's resilience strategy | [read] [Art 5 mirror](https://www.digital-operational-resilience-act.com/Article_5.html) |
| Classify an incident as major (starts the 4-hour clock) | DORA financial entity; the role is not specified in what I read | Per incident | RTS 2025/301 classification | [extract] Advisera |
| Decide an incident is significant (starts 24-hour and 72-hour clocks) | NIS2 entity | Per incident | "Could cause significant disruption or damage" | [read] [European Commission](https://digital-strategy.ec.europa.eu/en/policies/nis2-directive) |
| Report ICT contract changes | DORA financial entity | At least annually | Critical or important function status | [read] [Art 28 mirror](https://www.digital-operational-resilience-act.com/Article_28.html) |
| Grant or keep an ISO certificate | Certification body | Stage 2, surveillance, recertification over 3 years | Whether nonconformities block | [extract] Schellman, TUV |
| Authorize a federal system to operate | Authorizing official | Not stated on the page read | Risk to missions (the page only lists the term as a keyword) | [read] [NIST SP 800-37r2](https://csrc.nist.gov/pubs/sp/800/37/r2/final) |
| Approve residual risk and the Statement of Applicability | Risk owners / ISMS management | Not verified | ISO 27001 clause 6.1.3 | [unverified, paywalled] |

## 8. Published time and cost figures

**Read and usable, with caveats**

| Figure | Source and sample | Commercial interest |
|---|---|---|
| Vendors answer 23 assessment requests a month at about 3.5 hours each, so 80.5 hours a month | [parsed] Whistic *State of Vendor Security 2022*. Market-research panels, 600+ people across two surveys, late Dec 2021; 315 in InfoSec roles | Whistic sells vendor-assessment software |
| Buyers spend 23 hours a week assessing vendors, and wait 4.8 days for completed assessments; each clarification adds 4.1 days to the sales cycle | [parsed] same | same |
| Average 7.5 hours a week on compliance | [read] [Security Magazine on Vanta](https://www.securitymagazine.com/articles/100120-organizations-spend-almost-8-hours-a-week-on-security-compliance). Article gives no sample | Vanta sells compliance software |
| 9.6% of firms put over 10% of budget into GRC; 41.8% do not know their allocation | [read] [ICA Global GRC Survey 2025](https://www.int-comp.org/insight-and-resources/grc-survey/). 383 practitioners, 87 countries, about 44% banking and financial services; method not described | ICA is a compliance-training body (from memory, unverified); no sponsor named |

All of these are self-reported, and the time figures come from companies selling the fix. Whistic's "23 hours a week" and "23 requests a month" are different measures.

**Seen only in search extracts. Do not cite without opening the source.**

- Vanta 2024: 11 working weeks a year (2,500 respondents). Vanta 2025: 12 working weeks (3,500). The 2023 sample of 2,500 and Sapio Research as fieldwork firm also come from extracts. [Vanta](https://www.vanta.com/resources/state-of-trust-report-2024-vantacon-agenda), [Security Senses](https://securitysenses.com/posts/vanta-state-trust-2025-ai-threats-outpace-security-expertise)
- RiskRecon/Cyentia 2020 (154 TPRM professionals): 84% use questionnaires, and only 14% are confident vendor responses match reality. The report PDF returned 404 and the press release 403. A later figure of 85% not believing responses comes from another RiskRecon report via [Security Magazine](https://www.securitymagazine.com/articles/95169-the-value-of-better-data-in-third-party-risk-assessments). A further "4%" (via Drata) and "34%" (via Skypher) conflict and are untraced. RiskRecon sells vendor monitoring.
- SOC 2 audit fees: Vanta $10k-$50k audit only; Drata $25k to $200k+ all-in first year. These are vendor guides, and I found no survey-based data. [Vanta](https://www.vanta.com/resources/what-does-a-soc-2-audit-cost), [Drata](https://drata.com/blog/soc-2-audit-cost)
- CMMC Level 2 C3PAO assessment, DoD estimate, about $104,670 for small entities and $117,768 for larger ones, over a triennial cycle. Sources disagree on whether this is proposed-rule or final-rule. The rule PDF was too large to fetch. [DefenseScoop](https://defensescoop.com/2023/12/28/cmmc-implementation-cost-estimates/) (89 FR 83092)
- NIS2: a Commission impact assessment estimates up to 22% more ICT security spend in early years for newly in-scope companies, and 12% for existing NIS entities. Its own Scrutiny Board said the analysis "lacks depth, in particular regarding the costs assessment". This is the only non-commercial estimate here. [SWD(2020)345 copy](https://www.parlament.gv.at/dokument/XXVII/EU/44793/imfname_11032019.pdf)

**Not found:** any non-commercial measurement of hours per SOC 2 audit, evidence collection time, auditor effort, or the cost of a qualified opinion.
