# GRC data formats and obtainable samples

Researched 2026-11-04. Facts only. Sample paths are relative to `docs/research/samples/`.

Excerpts come from files I downloaded and parsed unless marked otherwise. "Secondary" means the claim rests on vendor or consultancy pages, or on a search-tool summary of them, and not on a primary source.

Provenance labels:

- **Published**: real, authoritative content.
- **Tool example**: real tool schema with placeholder or test values.
- **Fictional**: invented organisation.

## 1. Main findings

- Control catalogs, crosswalks, finding exports and blank questionnaires can all be downloaded today.
- Three things have no real public sample that I could find: a full SOC 2 Type 2 report, a completed access review, and a real change-ticket population.
- The closest public stand-ins are a real SOC 3 (AWS), a fictional bridge letter, documented field lists, and the SCF Evidence Request List.
- Several useful files have licence limits (section 5). CAIQ's notice says it "may not be redistributed".

## 2. Format by format

### 2.1 OSCAL (catalog, profile, SSP, AP, AR, POA&M, component definition)

- **What and who:** NIST's machine-readable compliance language. Catalogs and profiles come from standards bodies. SSPs, assessment results and POA&Ms come from system owners and assessors.
- **Licence:** public domain in the US plus CC0 worldwide, per the [oscal-content LICENSE](https://github.com/usnistgov/oscal-content/blob/main/LICENSE.md).
- **Structure, from the samples:** one root key per model.

| Model | Top-level keys | Sample | Source |
|---|---|---|---|
| `system-security-plan` | uuid, metadata, import-profile, system-characteristics, system-implementation, control-implementation, back-matter | `oscal/ssp-example.json` | [URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/examples/ssp/json/ssp-example.json) |
| `assessment-plan` | uuid, metadata, import-ssp, local-definitions, reviewed-controls, assessment-subjects, tasks | `oscal/assessment-plan-example.json` | [URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/examples/ap/json/ifa_assessment-plan-example.json) |
| `assessment-results` | uuid, metadata, import-ap, local-definitions, results | `oscal/assessment-results-example.json` | [URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/examples/ar/json/ifa_assessment-results-example.json) |
| `plan-of-action-and-milestones` | uuid, metadata, import-ssp, system-id, observations, risks, poam-items, back-matter | `oscal/poam-example.json` | [URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/examples/poam/json/ifa_plan-of-action-and-milestones.json) |
| `component-definition` | uuid, metadata, components, back-matter | `oscal/component-definition-example.json` | [URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/examples/component-definition/json/example-component.json) |
| `profile` | uuid, metadata, imports, merge, back-matter | `oscal/nist-800-53-rev5-LOW-profile.json` | [URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_LOW-baseline_profile.json) |
| `catalog` (CSF 2.0) | uuid, metadata, groups, back-matter | `oscal/nist-csf-2.0-catalog.json` | [URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/CSF/v2.0/json/NIST_CSF_v2.0_catalog.json) |
| `catalog` (800-53 LOW, resolved) | Not listed; 18 groups | `oscal/nist-800-53-rev5-LOW-resolved-catalog-min.json` | [URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_LOW-baseline-resolved-profile_catalog-min.json) |

Assessment results excerpt (Tool example, fictional "IFA GoodRead" system):

```json
{"target": {"type": "objective-id", "target-id": "ac-6.1_obj",
            "description": "This is a finding.",
            "status": {"state": "not-satisfied"}}}
```

A finding's keys are uuid, title, description, target, implementation-statement-uuid, related-observations and related-risks. An observation has methods (`["TEST"]`), types, subjects, collected and expires.

CSF catalog excerpt (Published):

```json
{"id": "PR.AA-03", "class": "subcategory", "parts": [
  {"id": "PR.AA-03_statement", "name": "statement", "prose": "Users, services, and hardware are authenticated"},
  {"id": "PR.AA-03.200", "name": "guidance", "class": "example", "prose": "Require multifactor authentication"}]}
```

Details that affect parsing:

- **Withdrawn entries:** the CSF catalog holds 185 subcategories and 34 categories, but 79 and 12 of those carry `status: withdrawn`. Active counts are 106 and 22.
- **Nesting:** CSF categories and subcategories are nested `controls`. Only functions are `groups`.
- **Version strings vary:** assessment results and plan samples say `1.1.2`. SSP, POA&M, component definition and profile say `1.2.3`. The CSF catalog says `v1.2.3`, with a leading "v".
- **File sizes:** the full 800-53 rev5 catalog is 10.4 MB, so it was not downloaded. The `-min` variant is 4.9 MB ([URL](https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog-min.json)).

### 2.2 AWS Security Hub findings (ASFF)

- **What and who:** JSON findings from AWS Security Hub CSPM and from third-party tools. Schema version is `2018-10-08`. Required attributes are AwsAccountId, CreatedAt, Description, GeneratorId, Id, ProductArn, Resources, SchemaVersion, Severity, Title, Types and UpdatedAt ([AWS docs](https://docs.aws.amazon.com/securityhub/latest/userguide/asff-required-attributes.html)).
- **OCSF change:** AWS's blog says the newer Security Hub uses OCSF, while Security Hub CSPM uses ASFF, and that some automation rules cannot migrate automatically ([AWS blog](https://aws.amazon.com/blogs/security/security-hub-cspm-automation-rule-migration-to-security-hub)). This came through a search summary. I did not read the blog directly.
- **Licence:** samples are test fixtures from DefectDojo, BSD-3-Clause per the GitHub API.

| Sample | Contents | Source |
|---|---|---|
| `asff/defectdojo-prowler-output.asff.json` | 731 findings: 441 PASSED, 286 FAILED, 4 INFOED; Prowler 3.3.0, 2023; account ID `123456789012` | [URL](https://raw.githubusercontent.com/DefectDojo/django-DefectDojo/master/unittests/scans/asff/prowler-output.asff.json) |
| `asff/defectdojo-securityhub-config_one_finding.json` | `{"findings":[...]}` wrapper; control `IAM.5`, 2020 | [URL](https://raw.githubusercontent.com/DefectDojo/django-DefectDojo/master/unittests/scans/awssecurityhub/config_one_finding.json) |
| `asff/defectdojo-one_vuln.json` | Single finding, 7 KB; structure not inspected | [URL](https://raw.githubusercontent.com/DefectDojo/django-DefectDojo/master/unittests/scans/asff/one_vuln.json) |

Excerpt (Tool example):

```json
{"SchemaVersion": "2018-10-08", "GeneratorId": "prowler-accessanalyzer_enabled",
 "Severity": {"Label": "LOW"}, "Title": "Check if IAM Access Analyzer is enabled",
 "Compliance": {"Status": "FAILED", "RelatedRequirements": ["CIS-1.5 1.20", "CIS-1.4 1.20"],
                "AssociatedStandards": [{"StandardsId": "CIS-1.5"}, {"StandardsId": "CIS-1.4"}]}}
```

The two samples are shaped differently: a bare array versus a `findings` wrapper.

### 2.3 Prowler output (OCSF JSON, CSV, compliance mappings)

- **What and who:** open-source cloud posture scanner. Licence is Apache-2.0 per the GitHub API.
- **Formats:** CSV and JSON-OCSF by default, JSON-ASFF for AWS only, plus HTML and automatic compliance reports ([docs](https://docs.prowler.com/user-guide/cli/tutorials/reporting)). This came through a search summary.

| Sample | Contents | Source |
|---|---|---|
| `prowler/example_output_aws.ocsf.json` | Array of 5 findings: 3 MANUAL, 2 FAIL; `metadata.version` is `1.4.0`; IDs are placeholders such as `<account_uid>` | [URL](https://raw.githubusercontent.com/prowler-cloud/prowler/master/examples/output/example_output_aws.ocsf.json) |
| `prowler/example_output_aws.csv` | Semicolon-delimited, 42 columns, placeholder IDs | [URL](https://raw.githubusercontent.com/prowler-cloud/prowler/master/examples/output/example_output_aws.csv) |
| `prowler/compliance-soc2_aws.json` | Keys: Framework, Name, Version, Provider, Description, Requirements. 27 requirements with IDs such as `cc_6_1` | [URL](https://raw.githubusercontent.com/prowler-cloud/prowler/master/prowler/compliance/aws/soc2_aws.json) |
| `prowler/compliance-nist_csf_2.0_aws.json` | Same repository, CSF 2.0 mapping; structure not inspected | [URL](https://raw.githubusercontent.com/prowler-cloud/prowler/master/prowler/compliance/aws/nist_csf_2.0_aws.json) |

OCSF excerpt (Tool example):

```json
{"message": "IAM Access Analyzer in account <account_uid> is not enabled.",
 "severity": "Low", "status": "New", "status_code": "FAIL",
 "metadata": {"event_code": "accessanalyzer_enabled", "version": "1.4.0"},
 "unmapped": {"compliance": {"CIS-1.4": ["1.20"], "CIS-3.0": ["1.20"]}}}
```

Compliance mapping excerpt (Published):

```json
{"Id": "cc_6_1", "Attributes": [{"ItemId": "cc_6_1", "Section": "CC6.0 - Logical and Physical Access",
  "Service": "s3", "Type": "automated"}],
 "Checks": ["s3_bucket_public_access", "kms_key_enclave_attestation_not_enforced"]}
```

CSV columns include CHECK_ID, STATUS, STATUS_EXTENDED, MUTED, SEVERITY, RESOURCE_UID, REGION, REMEDIATION_RECOMMENDATION_TEXT and COMPLIANCE.

The Prowler SOC 2 file does not cover all 33 Common Criteria. It has 27 requirements, and these include availability, confidentiality and processing-integrity items.

### 2.4 AWS Config (configuration items, evaluations, conformance packs)

- **Configuration item:** a point-in-time resource record with metadata, attributes, relationships and current configuration ([AWS docs](https://docs.aws.amazon.com/config/latest/developerguide/config-item-table.html)).
- **Evaluation result:** fields are Annotation, ComplianceType, ConfigRuleInvokedTime, EvaluationResultIdentifier, ResultRecordedTime and ResultToken. `ComplianceType` values are COMPLIANT, NON_COMPLIANT and NOT_APPLICABLE; the enum also lists INSUFFICIENT_DATA, but it is unsupported for this type ([AWS API](https://docs.aws.amazon.com/config/latest/APIReference/API_EvaluationResult.html)). No sample file was downloaded for this.

| Sample | Contents | Licence (GitHub API) | Source |
|---|---|---|---|
| `aws-config/conformance-pack-nist-800-53-rev5.yaml` | CloudFormation-style YAML, 130 `AWS::Config::ConfigRule` resources | CC0-1.0 | [URL](https://raw.githubusercontent.com/awslabs/aws-config-rules/master/aws-config-conformance-packs/Operational-Best-Practices-for-NIST-800-53-rev-5.yaml) |
| `aws-config/rdk-example_ci-AWS_EC2_EIP.json` | Example configuration item, version 1.2, dated 2016 | Apache-2.0 | [URL](https://raw.githubusercontent.com/awslabs/aws-config-rdk/master/rdk/template/example_ci/AWS_EC2_EIP.json) |
| `aws-config/sam-ConfigurationItemChangeNotification.json` | Lambda sample event; structure not inspected | Apache-2.0 | [URL](https://raw.githubusercontent.com/aws/aws-sam-cli/develop/samcli/lib/generated_sample_events/events/config/ConfigurationItemChangeNotification.json) |

Configuration item excerpt (Tool example):

```json
{"version": "1.2", "configurationItemStatus": "ResourceDiscovered",
 "resourceType": "AWS::EC2::EIP", "resourceId": "eipalloc-b67d33ce", "awsRegion": "us-east-1",
 "relationships": [], "configuration": {"publicIp": "52.45.95.91", "domain": "vpc"}}
```

Conformance pack excerpt:

```yaml
AccessKeysRotated:
  Properties:
    ConfigRuleName: access-keys-rotated
    Source: {Owner: AWS, SourceIdentifier: ACCESS_KEYS_ROTATED}
  Type: AWS::Config::ConfigRule
```

The conformance pack excerpt above is condensed, and `InputParameters` is omitted. The pack's visible structure has no control IDs next to each rule in the portion I read. I did not check the rest of the file for them.

### 2.5 Infrastructure as code and scanner output

| Sample | What it is | Licence (GitHub API) | Source |
|---|---|---|---|
| `iac/terragoat-s3.tf`, `iac/terragoat-iam.tf` | Deliberately vulnerable Terraform; Tool example, not production | Apache-2.0 | [S3](https://raw.githubusercontent.com/bridgecrewio/terragoat/master/terraform/aws/s3.tf), [IAM](https://raw.githubusercontent.com/bridgecrewio/terragoat/master/terraform/aws/iam.tf) |
| `scanners/defectdojo-checkov-report-many-vuln.json` | Checkov report fixture: check_type, results, summary | BSD-3-Clause | [URL](https://raw.githubusercontent.com/DefectDojo/django-DefectDojo/master/unittests/scans/checkov/checkov-report-many-vuln.json) |

```hcl
resource "aws_s3_bucket" "data" {
  # bucket is public
  # bucket is not encrypted
  # bucket does not have access logs
  # bucket does not have versioning
```

```json
{"check_id": "CKV_AZURE_41", "check_name": "Ensure the key vault is recoverable",
 "check_result": {"result": "FAILED"}, "file_line_range": [1, 16],
 "resource": "azurerm_key_vault.main"}
```

Terraform plan JSON and CloudFormation samples: not fetched.

### 2.6 SOC 2 reports, SOC 3 reports and bridge letters

**SOC 2 report: no public sample obtained.**

- Secondary sources describe a PDF of about 60 to 150+ pages. It contains the auditor's opinion, management's assertion, the system description, and the controls with tests and results.
- Full reports are described as restricted-use and typically shared under NDA ([tcsa.in](https://www.tcsa.in/learn/how-to-read-a-soc-2-report), [Withum](https://www.withum.com/resources/difference-between-soc2-and-soc3/), [Linford & Co](https://linfordco.com/blog/soc-2-vs-soc-3/)).
- The AICPA page I fetched did not state any of this, so section layout is unverified against a primary source ([AICPA](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2)).
- That AICPA page also mentions exposure drafts for proposed 2027 SOC 2 criteria.

**SOC 3: real sample obtained.** `soc/aws-soc3.pdf` ([URL](https://d1.awsstatic.com/whitepapers/compliance/AWS_SOC3.pdf), 1.2 MB, Published, © Amazon).

- It covers April 1, 2024 to March 31, 2025.
- Text extraction shows management's assertion and "Attachment A - Amazon Web Services System Overview".
- My text search did not find an auditor's report heading or firm name, so its presence in this PDF is unverified. It may be in a part that did not extract.

```text
Management's Report of Its Assertions on the Effectiveness of Its Controls
Over the Amazon Web Services System
Based on the Trust Services Criteria for Security, Availability, Confidentiality, and Privacy
```

**Bridge letter: fictional sample obtained.** `soc/brightdefense-sample-bridge-letter.pdf` ([URL](https://www.brightdefense.com/wp-content/uploads/2026/09/Sample-SOC-2-Bridge-Letter.pdf), one page). It states: "Illustrative sample. All organizations, names, and audit details are fictional."

- Fields present: issuer, date, recipient, system, CPA firm, report issue date, examination period, bridge period, change statement, signatory.
- Secondary sources say the AICPA publishes no official template, the service organisation writes and signs it rather than the CPA firm, and coverage is usually at most three months ([Vanta](https://www.vanta.com/resources/what-is-a-soc-2-bridge-letter), [Scrut](https://www.scrut.io/hub/soc-2/soc-2-bridge-letter)).

```text
This letter addresses the subsequent period from January 1, 2026, through March 31, 2026.
Management has identified no material changes, relevant control failures, or security incidents
```

### 2.7 Vendor security questionnaires

**CAIQ v4.1.0 (Cloud Security Alliance): obtained, blank.** `questionnaires/caiq-v4.1.0-star-questionnaire.xlsx`, from the [artifact page](https://cloudsecurityalliance.org/artifacts/star-level-1-security-questionnaire-caiq-v4-1) via its [direct download](https://cloudsecurityalliance.org/download/artifacts/star-level-1-security-questionnaire-caiq-v4-1), with no login needed.

- Sheets: Introduction, CAIQv4.1.0, Change Log.
- Columns: Question ID, Question, CSP CAIQ Answer, SSRM Control Ownership.
- Answer dropdown: `Yes,No,NA`.
- Ownership dropdown: `CSP-owned,CSC-owned,3rd-party outsourced,Shared CSP and CSC,Shared CSP and 3rd-party,Not Determined`.
- About 283 questions, inferred from the dropdown range `C3:C285`.
- Each sheet's first cell embeds JSON: `{"specification_name":"Cloud Controls Matrix","specification_version":"4.1.1","caiq_version":"4.1.0"}`.

```text
A&A-01.1 | Are audit and assurance policies, procedures, and standards established, documented, approved, communicated, a...
```

**HECVAT 4.1.6 (EDUCAUSE): obtained, blank.** `questionnaires/hecvat416.xlsx` ([URL](https://www.educause.edu/-/media/files/educause/hecvat/hecvat416.xlsx), found via a [Cal Poly knowledge base article](https://tech.calpoly.edu/space/CPKB/3647668236.md)).

- 15 sheets, including Organization, Product, Infrastructure, IT Accessibility, Case-Specific, AI, Privacy, Questions and backend scoring.
- The `Questions` sheet has IDs such as `GNRL-01` with per-tab flags.
- The EDUCAUSE page returned 403 to my fetcher, so its licence terms come from a search summary.

**SIG (Shared Assessments): not obtained.**

- Secondary sources say it requires purchase or membership.
- One vendor-run tracker cites a $7,000 licence. That figure is unverified ([Vorp Labs](https://vorplabs.com/workflows/compliance/sig-response)).
- Field structure is unverified.

**Completed questionnaires:** none downloaded. Vendors exist that publish them on request or through trust portals ([Cidilabs example](https://support.cidilabs.com/knowledgebase/is-there-a-hecvat-for-cidiscape)). I did not check the [CSA STAR Registry](https://cloudsecurityalliance.org/star/registry).

**google/vsaq** (questionnaire framework): [repository](https://github.com/google/vsaq) is archived, last pushed 2021, Apache-2.0. Not downloaded.

### 2.8 Policy documents

| Sample | Format | Licence (GitHub API) | Source |
|---|---|---|---|
| `policies/comply-access.md` | Markdown with YAML front matter that maps to TSC | Apache-2.0; repo last pushed 2022 | [URL](https://raw.githubusercontent.com/strongdm/comply/master/themes/comply-soc2/policies/access.md) |
| `policies/jupiterone-access.md.tmpl` | Markdown with Mustache variables | CC-BY-SA-4.0 | [URL](https://raw.githubusercontent.com/JupiterOne/security-policy-templates/main/templates/policies/access.md.tmpl) |

Both are templates, not a real organisation's adopted policy.

```yaml
name: Access Onboarding and Termination Policy
acronym: AOTP
satisfies:
  TSC:
    - CC6.1
    - CC6.2
    - CC6.3
```

```text
Access to {{companyShortName}} systems and application is limited for all users...
{{#needStandardHIPAA}}
```

### 2.9 Audit evidence: access reviews, change tickets, PBC lists

**No public real sample found.** My search found no downloadable access review spreadsheet or PBC template. What is available:

- **SCF Evidence Request List:** a real public list, in the `Evidence Request List 2026.3` sheet of `crosswalks/scf-2026-3.xlsx`, with 423 rows. Columns are #, ERL #, Area of Focus, ERL Artifact, Artifact Description, SCF Control Mappings, Legacy SCF Control Mappings, Relevant CMMC 2.0 L2 Control.
- **IAM credential report:** documented CSV, no sample file downloaded. Columns are user, arn, user_creation_time, password_enabled, password_last_used, password_last_changed, password_next_rotation, mfa_active, access_key_1_active, access_key_1_last_rotated, access_key_1_last_used_date, access_key_1_last_used_region, access_key_1_last_used_service, the same five for access_key_2, cert_1_active, cert_1_last_rotated, cert_2_active, cert_2_last_rotated, additional_credentials_info. Reports regenerate at most every four hours, and AWS says they can be given to an external auditor ([AWS docs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html)).
- **GitHub organisation audit log:** exports as JSON or CSV. Keys include action, actor, user, actor_location.country_code, org, repo, created_at, data.email, data.hook_id, data.events, data.events_were, data.target_login, data.old_user, data.team ([GitHub docs](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization)).

**How auditors request evidence (all secondary):**

- Auditors start from a population list, then sample from it ([Strike Graph](https://help.strikegraph.com/articles/4056301-soc-2-type-2-population-and-sampling-guide), [Keiter](https://keitercpa.com/?p=7993)).
- Vendor sources cite samples of about 25 to 30 changes, including at least two emergency changes.
- Access reviews are described as typically quarterly, with exports dated and showing the reviewer's name ([Bastion](https://bastion.tech/learn/soc2/evidence-collection/)).
- A PBC list is the auditor's master request list, usually a spreadsheet or portal queue, each item with an ID, description and period, and running from dozens to a few hundred items ([Agency](https://getagency.com/glossary/pbc-list)).

### 2.10 Framework crosswalks

**Secure Controls Framework 2026.3:** `crosswalks/scf-2026-3.xlsx` ([URL](https://raw.githubusercontent.com/securecontrolsframework/securecontrolsframework/main/secure-controls-framework-scf-2026-3.xlsx), 5.4 MB, Published).

- Main sheet `SCF 2026.3` is 1,592 rows by 431 columns.
- Columns include SCF Domain, SCF Control, SCF #, control description, Evidence Request List #, Relative Control Weighting, and per-framework mappings such as `AICPA TSC 2017:2022 (used for SOC 2)`, `ISO 27001 2022`, `NIST 800-53 R5.2`, `NIST CSF 2.0` and `PCI DSS 4.0.1`.
- Other sheets: Assessment Objectives, Risk Catalog, Threat Catalog, Focal Documents.
- Row example: `GOV-01 | Annual | E-GOV-01.1 | weighting 10`.
- Licence: SCF's terms page says CC BY-ND 4.0 ([terms](https://securecontrolsframework.com/terms-conditions)). Staging pages say CC BY 4.0. Both came through a search summary.

**CISO Assistant libraries:** YAML. Repo files outside `enterprise/` are AGPLv3 per its [LICENSE](https://github.com/intuitem/ciso-assistant-community/blob/main/LICENSE.md). The upstream framework text keeps its own copyright, and each file has a `copyright` field.

| Sample | Contents | Source |
|---|---|---|
| `crosswalks/ciso-assistant-mapping-nist-csf-2.0-to-iso27001-2022.yaml` | 428 mappings; published 2026-11-02 | [URL](https://raw.githubusercontent.com/intuitem/ciso-assistant-community/main/backend/library/libraries/mapping-nist-csf-2.0-to-iso27001-2022.yaml) |
| `crosswalks/ciso-assistant-soc2_2017_with_rev_2022.yaml` | TSC 2017 with 2022 points of focus; 33 unique CC IDs | [URL](https://raw.githubusercontent.com/intuitem/ciso-assistant-community/main/backend/library/libraries/soc2_2017_with_rev_2022.yaml) |

```yaml
- source_requirement_urn: urn:intuitem:risk:req_node:nist-csf-2.0:gv.oc-01
  target_requirement_urn: urn:intuitem:risk:req_node:iso27001-2022:4.1
  relationship: intersect
  rationale: semantic
  annotation: Mission is a core internal issue of the organizational context
  strength_of_relationship: 8
```

Its library directory has about 660 entries (my count also included a few spreadsheets under `tools/`). Mappings seen include CIS v8 to ISO 27001, NIST 800-53 to ISO 27001, and Adobe CCF to SOC 2 ([directory](https://github.com/intuitem/ciso-assistant-community/tree/main/backend/library/libraries)).

**Not downloaded:**

- MITRE Center for Threat-Informed Defense [Mappings Explorer](https://github.com/center-for-threat-informed-defense/mappings-explorer): Apache-2.0, folders for aws, azure, cis, cri_profile, csa_ccm, gcp, kev, m365, nist_800_53.
- CSA CCM: the [`/download/artifacts/cloud-controls-matrix-v4`](https://cloudsecurityalliance.org/artifacts/cloud-controls-matrix-v4) URL returned an HTML landing page, not a file. File format and licence are unverified.
- Unified Compliance Framework: not tested.

### 2.11 Other formats found

| Format | What it is | Sample | Licence or access | Source |
|---|---|---|---|---|
| FedRAMP Consolidated Rules | JSON rules, version `2026.11.02.01`; keys info, FRD, FRR, KSI, CTL | `fedramp/fedramp-consolidated-rules.json` | No licence detected by GitHub API | [URL](https://raw.githubusercontent.com/FedRAMP/rules/main/fedramp-consolidated-rules.json) |
| FedRAMP submission schemas | JSON Schema; 11+ files, e.g. vulnerability detail report | `fedramp/fedramp-vulnerability-detail-report-schema-2026-06-24.json` | No licence detected by GitHub API | [URL](https://raw.githubusercontent.com/FedRAMP/schemas/main/fedramp-vulnerability-detail-report-schema-2026-06-24.json) |
| CISA KEV | JSON: title, catalogVersion, dateReleased, count, vulnerabilities; 1,767 entries | `vuln/cisa-kev.json` | Licence unverified | [URL](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json) |
| NVD CVE API 2.0 | JSON; worked without a key | `vuln/nvd-CVE-2021-44228.json` | Rate limits unverified | [URL](https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2021-44228) |
| CycloneDX SBOM | JSON: bomFormat, specVersion, metadata, components, dependencies | `sbom/cyclonedx-bom-laravel.json` | CC0-1.0 | [URL](https://raw.githubusercontent.com/CycloneDX/bom-examples/master/SBOM/laravel-7.12.0/bom.1.3.json) |

FedRAMP key security indicator excerpt (Published):

```json
{"KSI-IAM-AAM": {"name": "Automating Account Management",
  "statement": "The lifecycle and privileges of all accounts, roles, and groups are securely managed using automation.",
  "controls": ["ac-2.13", "ac-2.2", "ac-2.3", "ac-6.7", "ia-12"]}}
```

The `controls` list above is shortened. The vulnerability detail report schema requires `certificationPackageOverviewUri`, `reportPeriod` and `vulnerabilities`.

**Confirmed to exist, not downloaded:**

- [MITRE D3FEND JSON](https://d3fend.mitre.org/ontologies/d3fend.json): 4.8 MB, HTTP 200.
- [OSV.dev query API](https://api.osv.dev/v1/query): returned real results for lodash.
- [OCSF schema](https://github.com/ocsf/ocsf-schema): Apache-2.0.
- [SARIF spec](https://github.com/oasis-tcs/sarif-spec).
- [compliance-trestle](https://github.com/oscal-compass/compliance-trestle): Apache-2.0.
- [GRCEngClub/claude-grc-engineering](https://github.com/GRCEngClub/claude-grc-engineering): existing open-source Claude Code GRC toolkit, 430 stars at time of check, GitHub reports licence as "Other". Its README lists gap assessment, IaC scanning, evidence collection, policy generation and OSCAL workflows.

**Not checked or unverified:** XCCDF/ARF, DISA STIGs, CIS Benchmarks and Okta logs. A code search found an ARF fixture in a small third-party repo (`takashi-ohmoto-git/CyberRiskScape`), which I did not open.

## 3. Download results

**Succeeded (35 files, about 14 MB):**

- `oscal/`: assessment-plan-example.json, assessment-results-example.json, component-definition-example.json, nist-800-53-rev5-LOW-profile.json, nist-800-53-rev5-LOW-resolved-catalog-min.json, nist-csf-2.0-catalog.json, poam-example.json, ssp-example.json
- `asff/`: defectdojo-one_vuln.json, defectdojo-prowler-output.asff.json, defectdojo-securityhub-config_one_finding.json
- `prowler/`: compliance-nist_csf_2.0_aws.json, compliance-soc2_aws.json, example_output_aws.csv, example_output_aws.ocsf.json
- `aws-config/`: conformance-pack-nist-800-53-rev5.yaml, rdk-example_ci-AWS_EC2_EIP.json, sam-ConfigurationItemChangeNotification.json
- `iac/`: terragoat-iam.tf, terragoat-s3.tf
- `scanners/`: defectdojo-checkov-report-many-vuln.json
- `soc/`: aws-soc3.pdf, brightdefense-sample-bridge-letter.pdf
- `questionnaires/`: caiq-v4.1.0-star-questionnaire.xlsx, hecvat416.xlsx
- `policies/`: comply-access.md, jupiterone-access.md.tmpl
- `crosswalks/`: ciso-assistant-mapping-nist-csf-2.0-to-iso27001-2022.yaml, ciso-assistant-soc2_2017_with_rev_2022.yaml, scf-2026-3.xlsx
- `fedramp/`: fedramp-consolidated-rules.json, fedramp-vulnerability-detail-report-schema-2026-06-24.json
- `vuln/`: cisa-kev.json, nvd-CVE-2021-44228.json
- `sbom/`: cyclonedx-bom-laravel.json

**Failed or not obtained:**

| Item | Result |
|---|---|
| Full NIST 800-53 rev5 catalog | 10.4 MB, stopped by my size cap (`curl` rc=63), no file saved. The `-min` variant (4.9 MB) was not fetched |
| Checkov `checkov-report-many-vulnerabilities.json` | 404, a filename I guessed. The correct name, `checkov-report-many-vuln.json`, downloaded |
| CSA CCM | Download URL returned HTML, no file |
| SIG | Paid or membership; not attempted |
| SOC 2 Type 2 report, access review, change-ticket population | No public real sample found |
| EDUCAUSE HECVAT page | 403 to my fetcher. The direct `.xlsx` URL worked |
| `GSA/fedramp-automation` | 404 by GitHub API and by web |

## 4. Checks on `grc-eng.md`

| Claim | Result | Evidence |
|---|---|---|
| SOC 2 has 33 Common Criteria | Confirmed | 33 unique CC IDs in the CISO Assistant YAML |
| ISO 27001:2022 Annex A: 93 controls, 37/8/14/34 | Confirmed indirectly | CISO Assistant YAML gave 74/16/28/68 distinct matching lines. Halving gives 37/8/14/34, assuming each ID appears in two text forms, which I did not check line by line |
| CSF 2.0: 6 functions, 22 categories, 106 subcategories | Confirmed for active entries | OSCAL catalog. The file also contains 79 withdrawn subcategories and 12 withdrawn categories, which the note does not mention |
| CSF categories per function | Confirmed | OSCAL catalog |
| CIS v8.1: 153 safeguards, IG1 about 56 | IG1 56 confirmed by [CIS](https://www.cisecurity.org/controls/implementation-groups/ig1) via search summary; 153 from a secondary source | Not checked against the CIS document |
| PCI DSS about 280 sub-requirements | Unverified | Not checked |
| `PR.AA-02`: "Identities are proofed, bound to credentials, and managed" | **Wrong wording** | Catalog text: "Identities are proofed and bound to credentials based on the context of interactions" |
| `PR.AA-02` as the CSF entry for MFA | **Questionable** | The catalog's "Require multifactor authentication" example sits under `PR.AA-03` |
| FedRAMP baselines at `github.com/GSA/fedramp-automation` | **Out of date** | Repo returns 404. The [FedRAMP org](https://github.com/FedRAMP) now publishes `rules`, `schemas`, `2026` and `docs-legacy`. `GSA/fedramp-oscal-earlyadopters` is archived. I found no notice explaining the 404. [compliance-trestle-fedramp](https://github.com/oscal-compass/compliance-trestle-fedramp) vendors rev5 baselines |
| "FedRAMP OSCAL: GitHub, free" | **Unverified as current** | I did not find a current FedRAMP-run OSCAL baseline location. `FedRAMP/rules` uses its own JSON |
| CSF 2.0 in OSCAL at `/nist.gov/CSF/` | Confirmed | File exists |
| "CSF profiles" in OSCAL content | **Not found** | The repo tree shows only a CSF catalog |
| 800-53 to CSF mapping "published by NIST in the OSCAL content repo" | **Not found** | No path matched "mapping" in the repo tree outside the 800-53 rev directories, and the rev5 JSON listing has none |
| CSA CCM is a free XLSX | Unverified | Download URL returned HTML |
| NVD limits of 5 and 50 requests per 30 seconds | Unverified | NVD's page returned no usable text. The keyless API call worked |
| OSV.dev free, no key | Confirmed | Query returned data |
| Fixture 1 maps database encryption at rest to `CC6.7` | **Questionable** | CC6.7's text concerns "transmission, movement, and removal". CC6.1 has the point of focus "Uses Encryption to Protect Data". "At rest" wording appears at lines 2241 and 2361 of the YAML; I did not confirm which criterion those lines belong to |
| Output schema status values (`IMPLEMENTED`, `PARTIAL`, and so on) | **No source given** | Not presented as a standard, but the OSCAL sample uses `not-satisfied` |
| "Security Hub findings" | Naming is out of date | AWS docs now call the ASFF product Security Hub CSPM |

Not checked: the 2013 edition's 114 controls and PCI retirement dates.

## 5. Licence limits on downloaded files

| File | Limit | Source |
|---|---|---|
| `questionnaires/caiq-v4.1.0-star-questionnaire.xlsx` | "solely for your personal, informational, non-commercial use"; "may not be modified or altered"; "may not be redistributed". Fair-use quotation allowed with attribution | Notice inside the workbook |
| `questionnaires/hecvat416.xlsx` | Free to colleges, universities and their vendors for higher-education business relationships; others, including platforms integrating it, need an EDUCAUSE licence. A 2022 copy carried CC BY-NC-SA 4.0 | [EDUCAUSE](https://www.educause.edu/hecvat), via search summary |
| `crosswalks/scf-2026-3.xlsx` | CC BY-ND 4.0 | [SCF terms](https://securecontrolsframework.com/terms-conditions), via search summary |
| `soc/aws-soc3.pdf` | © Amazon; reuse terms not checked | PDF cover |
| `soc/brightdefense-sample-bridge-letter.pdf` | Vendor publication; reuse terms not checked | PDF |
| CISO Assistant YAML | AGPLv3 repo; framework text keeps upstream copyright | Repo LICENSE, file `copyright` field |

These files are local research copies. Publishing them in a public repository may conflict with the limits above, and I have not resolved that.
