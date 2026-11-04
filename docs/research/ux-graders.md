# How security and quality graders communicate a verdict and its evidence

Research date: 2026-11-04. Question: how do popular grading platforms show a verdict and its evidence, and what should a benchmark of DETECTED / SILENT / ERROR cells with no composite score take from them?

## How to read this report

I read pages as text. I did not see any rendered layout, colour, size or fold line on any platform.

Evidence labels used below:

| Label | Meaning |
|---|---|
| **Observed** | I retrieved this today from the live page, the live API, or the project's own source or docs. |
| **Second-hand** | A search summary described it. I did not read the page. |
| **Unverified** | From memory. Treat it as a lead only. |

"First viewport" entries are inferred from the order of the text. They show what comes first, not what fits on screen.

### What I could not see

- **securityheaders.com:** Cloudflare returned 403 and "Just a moment... Enable JavaScript and cookies to continue". A saved copy on an EEA host also returned 403, and the Wayback Machine could not be fetched. Everything about this platform is second-hand or unverified.
- **PageSpeed Insights:** the server HTML contains only a shell reading "Running analysis". The public API returned 429 (shared daily quota), so I saw no live report. Its entry relies on Google's docs and the Lighthouse source.
- **HTTP Observatory:** the server HTML contains no results. I read the results through its API and do not know how the page arranges them.
- **OpenSSF Scorecard viewer:** I read the Handlebars template embedded in the page and the live API result, not a rendered report.
- **SSL Labs waiting and failure pages:** two requests for other hosts returned the plain start form, so I did not capture either page. I saw the waiting state only through the API.
- **Internet.nl results:** I saw the waiting page but no finished report, because curl does not run the page's polling script. The states come from its FAQ.
- **Hardenize:** I got only the marketing page and a "Run" form, so it is left out.

Test requests targeted github.com on every platform that scans a host, plus example.org, example.net and two non-resolving names on SSL Labs, and example.com on the PSI API (refused with 429). The Observatory API call was a POST that asks for a scan.

---

## Per-platform findings

### Qualys SSL Labs Server Test

Sample: [github.com report](https://www.ssllabs.com/ssltest/analyze.html?d=github.com&hideResults=on&latest)

- **Verdict (observed):** one letter under "Summary / Overall Rating" (A+ here). Beside it sits a 0-100 scale with four named sub-ratings: Certificate, Protocol Support, Key Exchange and Cipher Strength. The bar values were not in the text I extracted.
- **Non-letter verdicts (observed):** T (no trust) and M (certificate name mismatch) replace the letter when a normal grade would mislead. The API also exposes `gradeTrustIgnored`, the grade if trust issues are ignored. Sources: [API docs](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md), [rating guide](https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide).
- **Text order (observed):**
  1. Hostname and IP
  2. "Assessed on" timestamp
  3. "Clear cache" and "Scan Another"
  4. Overall rating and sub-ratings
  5. Short plain sentences, such as "This server supports TLS 1.3. MORE INFO »" and "This server does not support PQC (Post-Quantum Cryptography) key exchange."
  6. Very long detail sections: certificate, Configuration, Protocols, Cipher Suites, Handshake Simulation, Protocol Details, HTTP Requests, Miscellaneous
- **Input and result (observed):** a single hostname form, and the result has a shareable URL (`?d=host`). A "Do not show the results on the boards" checkbox sits on the form, next to public "Recently Seen" and "Recent Best" lists.
- **Waiting (observed through the API only):** `status` runs through DNS, IN_PROGRESS, READY and ERROR. My live response named the exact step for one endpoint: `"statusDetails":"TESTING_PROTO_3_2","statusDetailsMessage":"Testing TLS 1.1"`. The docs also define `progress` and `eta`. The percentage table I recall on the waiting page is **unverified**.
- **Evidence and fix (observed):** findings sit inline with raw facts, such as fingerprints, chains and WEAK labels on cipher suites. "MORE INFO »" links lead outward (for example to Wikipedia on HSTS, and a Qualys blog on CAA). I saw no per-finding fix text; the page points generally to a documentation page for "configuration guides".
- **Failed versus not run (observed):**
  - An endpoint succeeded only if `statusMessage` is "Ready".
  - The docs do not say what `grade` contains when an endpoint fails.
  - The report does carry an explicit not-run idea: "Not simulated clients (Protocol mismatch)".
  - The "Assessment failed: Unable to connect" wording I recall is **unverified**.

### Mozilla HTTP Observatory

Sample: [github.com report](https://developer.mozilla.org/en-US/observatory/analyze?host=github.com), [API result](https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=github.com)

- **Verdict (observed):** letter plus number, A+ and 115 here, with `tests_passed: 11`, `tests_failed: 1`, `tests_quantity: 12`. The scale runs to 145, and [the docs](https://developer.mozilla.org/en-US/observatory/docs/tests_and_scoring) call the bands and modifiers "essentially arbitrary".
- **The grade can hide a failure (observed):** github.com gets A+ while `subresource-integrity` fails with a -5 modifier. The other modifiers add 20, which gives 115.
- **First viewport:** not seen. The tabs I recall (Scoring, CSP analysis, Cookies, Raw server headers, Scan history, Benchmark comparison) are **unverified**.
- **Input and waiting (observed):** the result has a URL (`?host=`). [The FAQ](https://developer.mozilla.org/en-US/observatory/docs/faq) says a site can only be rescanned every 60 seconds, and a deep link triggers a rescan if the data is older than 24 hours. The scan history is public; for github.com it runs back to 2016 and includes an F on 2016-10-04.
- **Evidence and fix (observed):** this is the cleanest row shape in the set. Each test has `result` (a stable id), `score_modifier`, `score_description`, `recommendation` and `link`, and the raw `response_headers` are kept with the scan. Example: SRI not implemented, -5, "Add SRI to external scripts", linked to the MDN page. The FAQ says recommendations from the test results are shown together.
- **Failed versus not run (observed, with one inference):**
  - `pass` has three values. `cross-origin-resource-policy` has `pass: null`.
  - `coep-not-implemented` and `coop-not-implemented` have `pass: true`, so "absent" reads as passed.
  - My count is 10 true, 1 false and 1 null, while the summary says 11 passed. The null seems to be counted as a pass. That is my arithmetic, not documented behaviour.
  - The scan has a separate `error` field, which was null here.
- **Scope (observed):** the FAQ says plainly that an A+ does not mean secure, and lists what it does not test: outdated software, SQL injection, vulnerable plugins and password storage.

### securityheaders.com

Page blocked: [github.com report](https://securityheaders.com/?q=github.com&followRedirects=on) returned 403.

- **Verdict (second-hand):** a letter grade from A+ to F that checks a fixed list of headers. A sample report showed a grade capped at A with a warning explaining why. Sources: [Hailbytes project](https://github.com/HailBytes/security-headers), [inventivehq](https://inventivehq.com/blog/security-headers-validation-failures), [centralcsp](https://next.centralcsp.com/en/blog/improve-security-headers-grade).
- **Sections (second-hand, from a search summary of [a sample report](https://securityheaders.com/?q=hmail.id)):** Security Report Summary, Missing Headers (what each header protects against, sometimes with a recommended value), Raw Headers, Upcoming Headers, Additional Information. The pill row of present and missing headers near the grade is **unverified**.
- **Waiting:** "within seconds", according to a second-hand source. Otherwise not seen.
- **Evidence and fix (second-hand):** Raw Headers shows the actual response, which is the evidence. Missing Headers explains each gap.
- **Failed versus not run:** not seen. The separate Upcoming Headers section suggests that checks outside the grade are kept apart from it, but that is my inference.
- **Scope (second-hand):** Helme has described it as an educational tool rather than a definitive security assessment.

### OpenSSF Scorecard

Sample: [viewer](https://scorecard.dev/viewer/?uri=github.com/ossf/scorecard), [API result](https://api.securityscorecards.dev/projects/github.com/ossf/scorecard)

- **Verdict (observed):** an aggregate out of 10 (8.8 here) followed by a 0-10 score for each check, with a named risk level. The [README](https://raw.githubusercontent.com/ossf/scorecard/main/README.md) itself warns: "Aggregate scores in particular tells you nothing about what individual behaviors a repository is or is not doing", and "there are false positives and false negatives".
- **Template order (observed):**
  1. Score and repo name
  2. API URL
  3. COMMIT
  4. GENERATED AT
  5. SCORECARD VERSION
  6. SORT control (check name, check score or risk level, each both ways)
  7. One expandable section per check
- **Input and waiting (observed):** a single "Repo in platform/org/repo format" field and a shareable URL. Results come from a results API dated 2026-11-03, a day before my read, so there is no scan to wait for. The template has an error block and an `isPlaceholder` state, whose appearance I did not see.
- **Evidence and fix (observed):** each check holds its score, name, risk, one-line description, **Reason**, **Details** and **Check documentation**. The documentation link is pinned to the Scorecard commit that produced the result. Details carry evidence and fix in one line, with file and line number:

  > `Warn: third-party GitHubAction not pinned by hash: .github/workflows/goreleaser.yaml:80: update your workflow using https://app.stepsecurity.io/secureworkflow/ossf/scorecard/goreleaser.yaml/main?enable=pin`

  [Check docs](https://github.com/ossf/scorecard/blob/main/docs/checks.md) give each check a risk line and remediation steps.
- **Failed versus not run (observed):** this is the sharpest distinction in the set.
  - A number means a real result, and 0 is a real score.
  - `-1` means "no reliable information can be retrieved" ([source](https://raw.githubusercontent.com/ossf/scorecard/main/checker/check_result.go)), and renders as "?".
  - The template shows "-" when the score is missing.
  - The sample I read had no -1 checks, so I saw these states only in the template and source.
- **A weakness (observed):** the aggregate [skips inconclusive checks](https://raw.githubusercontent.com/ossf/scorecard/main/pkg/scorecard/scorecard_result.go), and its code comment admits "aggregate score changes depending on which checks are run". A tool that errors out can therefore raise the aggregate.

### Google PageSpeed Insights and Lighthouse

Live page: [analysis](https://pagespeed.web.dev/analysis?url=https://github.com), shell only.

- **Verdict (observed in docs):** [PSI docs](https://developers.google.com/speed/docs/insights/v5/about) put category scores at the top, with bands at 90+, 50-89 and under 50. Metrics carry **a shape as well as a colour**: green circle, amber square, red triangle. The [scoring docs](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) confirm it is a weighted average of metrics, and that Opportunities and Diagnostics do not count.
- **Two evidence sources kept apart (observed in docs):** real-user field data (28 days, 75th percentile) and simulated lab data appear as separate sections.
- **Waiting (observed):** the page shell reads "Running analysis" and "data loading". The stepwise progress I recall is **unverified**.
- **Evidence and fix (observed in [Lighthouse's report strings](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/report/renderer/report-utils.js)):** results are grouped under an "Opportunity" column, "Passed audits", and "Passed audits but with warnings". The score explanation links to a calculator ("See calculator."). Each audit has a `details` table ([results docs](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/understanding-results.md)). That PSI uses this exact Lighthouse renderer is **unverified**.
- **Failed versus not run (observed in source):** `scoreDisplayMode` is one of `binary`, `numeric`, `error`, `manual`, `notApplicable` or `informative`, and the last four set `score` to null. The visible labels are distinct:
  - "Error!"
  - "Not applicable"
  - "Additional items to manually check"
  - Run-level: "There were issues affecting this run of Lighthouse:"
- **Variance (observed):** "Values are estimated and may vary."
- **Missing field data (observed in docs):** PSI falls back to origin-level data. If that is missing too, it is "unable to show any real-user experience data". So absent data is reported as absent, not as poor.

### Added: Internet.nl

Sample: [github.com test](https://internet.nl/site/github.com/), [report FAQ](https://internet.nl/faqs/report/)

I added this for its waiting page and its not-tested state.

- **Verdict (observed in FAQ):** an overall percentage with equal category weights. Only REQUIRED subtests count.
- **Waiting (observed):** the best example I found. "The duration of the test is between 5 and 200 seconds." It then lists five named categories, each reading "Running...". It redirects automatically when finished, and has prepared messages for both ends: "Test finished! Results available..." and "Test error. Please try again later, or test another domain name."
- **Failed versus not run (observed in FAQ):**
  - Category states are Failed, Warning, Informational, Passed and Test error ("execution error... no result in test category").
  - Subtests can be "Not tested, because already failed related parent subtest".
  - The FAQ thus keeps three things apart: the check failed, the check itself broke, and the check was skipped for a stated reason.
- **Public ranking (observed):** the site navigation includes a "Hall of Fame".

---

## Comparison

| Platform | Headline | Evidence next to finding | Fix next to finding | Separates error from failure | Names a not-run state |
|---|---|---|---|---|---|
| SSL Labs | Letter, or T / M | Raw facts inline | Outward links | Yes, in API status | Yes, "Not simulated" |
| Observatory | Letter and number | `result` id, raw headers | Yes, recommendation and link | Yes, `error` field | Partly, `pass: null`, apparently counted as a pass |
| securityheaders.com | Letter (second-hand) | Raw Headers (second-hand) | Partly (second-hand) | Not seen | Not seen |
| Scorecard | Aggregate /10 | File and line in Details | Yes, in Details and docs | Partly, "?" | "-" in template |
| PSI / Lighthouse | 0-100 per category | `details` table | Grouped as opportunities | Yes, "Error!" | Yes, "Not applicable" |
| Internet.nl | Percentage | Results not seen | Results not seen | Yes, "Test error" | Yes, "Not tested" with reason |

---

## Five patterns best suited to our product

### 1. Give each cell state its own word and shape, and never merge them

- **Seen in:** Scorecard (number, "?", "-"), Lighthouse ("Error!", "Not applicable"), Internet.nl (Failed, Test error, Not tested), PSI (circle, square, triangle).
- **Why:** our whole claim rests on SILENT meaning "the tool ran and said nothing". If ERROR looks like SILENT, we accuse a tool of missing something it never got to examine. Keeping the word in the cell, plus a shape, also survives greyscale and colour-blind viewing.
- **Decision needed:** these platforms all separate "broke" from "did not apply". We have three states and no "not applicable". If a tool cannot analyse a fault's language or file type, its cell needs a defined meaning before the page ships.

### 2. Open each cell to the tool's own words, with the location and the rule

- **Seen in:** Scorecard's Reason, Details and Check documentation, and its `file:line: fix` line. Observatory's `result`, `recommendation` and `link`.
- **Why:** with no score to lean on, the cell has to be checkable. DETECTED should show the tool's real output line and rule id. ERROR should show the failure message. SILENT has no output to quote, so it should show what was run: the command, the exit code and "no finding at this location". This is the hardest cell to believe, and the one most in need of evidence.

### 3. Put a run provenance strip above the matrix, and give the view a link

- **Seen in:** Scorecard's COMMIT, GENERATED AT and SCORECARD VERSION, plus documentation pinned to a commit. SSL Labs' "Assessed on". Every platform's result URL.
- **Why:** a benchmark claim is only as good as the versions it ran against. A SILENT verdict from an old tool version is a different claim, and a tool's maintainer will check this first. Show each tool's version and the run time.

### 4. In the live panel, show each tool's own progress and keep the code on screen

- **Seen in:** Internet.nl's named "Running..." list and honest "5 to 200 seconds" range. SSL Labs' `statusDetailsMessage` ("Testing TLS 1.1").
- **Why:** the live panel's moment is watching which tools notice, so each column should change on its own. Mark a previous verdict as stale once the code changes, so that an old DETECTED never appears to describe the new code. "Running" is a passing display state, not a fourth verdict. State the real time range from our own measured runs.

### 5. State beside the matrix what it does not claim

- **Seen in:** Observatory's FAQ listing what it does not test. Scorecard's "false positives and false negatives". Lighthouse's "Values are estimated and may vary".
- **Why:** a grid of planted faults invites the reading "this tool is best". A short, specific line, such as how many faults, which classes and that they are planted, heads that off. The strongest versions name what is out of scope. Generic disclaimers do not do this job.

---

## Three patterns to avoid

### 1. A headline grade, or anything that turns into one

- **Seen in:** every platform here leads with one. Observatory calls its bands "essentially arbitrary" and gives github.com A+ with a failed test. Scorecard's README says the aggregate "tells you nothing" about individual behaviours. SSL Labs' "Recent Best" and Internet.nl's "Hall of Fame" then turn such scores into rankings.
- **Why:** this is what we deliberately refused. It can come back by accident through a per-tool total, a default sort by detections, or a "best tool" highlight, each of which reads as a leaderboard. If column totals appear at all, they need to keep the three states separate.

### 2. Counting non-results as results, or dropping them from the sum

- **Seen in:** Observatory gives `coep-not-implemented` `pass: true`, and its null result appears to be counted among the passes. Scorecard's aggregate skips inconclusive checks, so its result "changes depending on which checks are run".
- **Why:** both make a summary look more complete than the run was. For us, an ERROR rolled into any figure either flatters or slanders a tool. Any tally should show ERROR on its own.

### 3. A blocking wait page that redirects to results

- **Seen in:** Internet.nl's "You will be automatically redirected to the results page", and PSI's shell, which shows only "Running analysis" until the report loads.
- **Why:** this suits a one-shot scan of a URL, but it would break our edit-and-watch loop. Someone who changes one line needs the code and the previous result in view to see what changed. The comparison is the product, and a page change would destroy it.

---

## Sources

- SSL Labs: [report](https://www.ssllabs.com/ssltest/analyze.html?d=github.com&hideResults=on&latest), [API docs](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md), [rating guide](https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide)
- HTTP Observatory: [report](https://developer.mozilla.org/en-US/observatory/analyze?host=github.com), [API](https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=github.com), [scoring](https://developer.mozilla.org/en-US/observatory/docs/tests_and_scoring), [FAQ](https://developer.mozilla.org/en-US/observatory/docs/faq)
- securityheaders.com (blocked, second-hand only): [report URL](https://securityheaders.com/?q=github.com&followRedirects=on), [sample in search results](https://securityheaders.com/?q=hmail.id), [Hailbytes](https://github.com/HailBytes/security-headers), [inventivehq](https://inventivehq.com/blog/security-headers-validation-failures), [centralcsp](https://next.centralcsp.com/en/blog/improve-security-headers-grade), [Scott Helme](https://scotthelme.co.uk/hardening-your-http-response-headers/)
- Scorecard: [viewer](https://scorecard.dev/viewer/?uri=github.com/ossf/scorecard), [API](https://api.securityscorecards.dev/projects/github.com/ossf/scorecard), [README](https://raw.githubusercontent.com/ossf/scorecard/main/README.md), [checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md), [result constants](https://raw.githubusercontent.com/ossf/scorecard/main/checker/check_result.go), [aggregate code](https://raw.githubusercontent.com/ossf/scorecard/main/pkg/scorecard/scorecard_result.go)
- PSI and Lighthouse: [PSI page](https://pagespeed.web.dev/analysis?url=https://github.com), [PSI docs](https://developers.google.com/speed/docs/insights/v5/about), [scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring), [results docs](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/docs/understanding-results.md), [report strings](https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/report/renderer/report-utils.js)
- Internet.nl: [waiting page](https://internet.nl/site/github.com/), [report FAQ](https://internet.nl/faqs/report/)
