# How comparison platforms present results, and what fits a fault-by-tool grid

Pages read on 2026-11-04.

## How to read this report

**I did not see any page rendered.** Nothing here reports layout, colour, hover behaviour or what fits above the fold on a real screen. "First viewport" below means "what comes first in the page text", which is an approximation.

| Label | Source | How far to trust it |
|---|---|---|
| [fetched] | Page text, summarised by a small model through WebFetch | Labels and order are probably right, but they are second-hand |
| [docs] | Hugging Face documentation, returned close to verbatim | Describes intended behaviour, not the live page |
| [html] | Raw HTML I downloaded and searched myself | Strongest evidence, but JavaScript did not run |
| [inferred] | My reading of the above | A conclusion, not an observation |
| [unverified] | From memory | Check before relying on it |

Not reachable as content:

- The Open LLM Leaderboard app returned only a title, and its Hub page returned only the wrapper.
- wpt.fyi returned only a title.
- The SWE-bench table is drawn by JavaScript, so I read its data and markup but not the table itself.
- arena.ai returned 403 to curl, so it has no [html] evidence.

## Platform observations

### Artificial Analysis

Sources: [leaderboard](https://artificialanalysis.ai/leaderboards/models), [model page](https://artificialanalysis.ai/models/claude-opus-5-5), [methodology](https://artificialanalysis.ai/methodology)

- **First in the page:** navigation, a one-sentence summary ("over 250 AI models"), then highlights that name the leaders in plain text for Intelligence, Time per Task, Time to First Answer Token, Cost per Task and Context Window. The table follows. [fetched]
- **Grid:**
  - Headers are grouped: Features, Intelligence, Price, Speed, Latency. [html]
  - Columns are Model, Context Window, Creator, Intelligence Index, Cost per Task, Time per Task, First Answer Token, and Further Analysis. [fetched]
  - Filters are short dropdown labels: `Weights:All`, `Size:All`, `Price:All`, `Reasoning:All`, `Status:Current`. An "Expand columns" button sits with them. [fetched]
- **Frozen axes:** inline styles make the header cells `sticky` to the top and the model cell `sticky; left:0px`. 279 cells carry the left-sticky style, out of 2,232 cells in total. That works out to about 279 rows of 8 columns, all in the initial HTML. [html for the counts, inferred for the row and column reading]
- **Sorting:** there is no `aria-sort`, but six `lucide-arrow-up-down` icons suggest sortable headers. [html, inferred]
- **Cell encoding:** plain numbers with units in the header, and `--` for missing values. [fetched]
- **Link to detail:** each row links to `/models/<slug>` and `/models/<slug>/providers`. The detail page opens with four rank cards ("#2 / 65"), then comparison prose, then long sections of charts. It names the evaluations, but the extracted text shows no per-evaluation scores for the model, and the charts could not be read. [fetched]
- **Date, version, methodology:**
  - The leaderboard has only an undated "Updated" tag and a link to FAQs. [fetched]
  - The version ("v5.0.1") and the run cadence ("runs every 6 hours", "past 5 days") appear only far down the detail page. [fetched]
  - The methodology page is well organised by modality but gives no revision dates. [fetched]

### Arena (formerly LMArena)

`lmarena.ai` now redirects with a 301 to `arena.ai`. Sources: [overview](https://arena.ai/leaderboard), [text leaderboard](https://arena.ai/leaderboard/text)

- **First in the page, overview:** a "Start Voting" button, mode tabs, the headline "Measuring AI in the real-world" and a session counter (374,154,492). A full table is not on this page: it has ten sections, including Top 10 lists with "View all", a Pareto list, a trend chart and news. [fetched]
- **First in the page, text leaderboard:** the heading, "Oct 27, 2026", 9,003,272 votes and 419 models come before the filters and table. [fetched]
- **Grid:** Rank, Rank Spread, Model, Score, Votes, Cost/Task (P50), Price $/M, Context. Filters include 29 categories, Ranking or Pareto view, Style Control, Factuality, License Type, four range filters, and a Hide Filters toggle. [fetched]
- **Cell encoding:** the score carries its uncertainty, as in `1528±9`, and some carry a "Preliminary" label. Rank Spread sits next to Rank. [fetched]
- **Link to detail:** model names link to vendor pages such as blog.google, not to the votes or evidence behind the score. [fetched]
- **Date, version, methodology:** this has the clearest date and sample size of the group, at the top of the page. I saw no general methodology link. The "Learn more" links on Expert and Factuality point to blog posts, and the footer has FAQ and "How It Works". [fetched]
- **Live status:** "Live Agent Sessions" rows show model, lab and a status such as "Reading files", "Running bash" or "Session complete". [fetched]

### Hugging Face

Sources: [dataset viewer docs](https://huggingface.co/docs/hub/en/datasets-viewer), [eval results docs](https://huggingface.co/docs/hub/en/eval-results), [model card docs](https://huggingface.co/docs/hub/en/model-cards), [HLE benchmark](https://huggingface.co/datasets/cais/hle), [Open LLM Leaderboard](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard)

- **Spaces leaderboards:**
  - Only the wrapper was readable: name, likes, "Running on CPU Upgrade", and App, Files and Community tabs. I cannot describe the table. [fetched]
  - I recall that many use a Gradio table with a column selector and search, and that this leaderboard was retired in 2025. The text I got showed no such notice. [unverified]
- **Benchmark dataset page:** the HLE page puts tags and tabs first, then a three-column leaderboard (`#`, `MODEL`, `SCORE`) with a parameter-size filter and "Show all 50 models". Every score I saw has an unexplained asterisk, and the leaderboard shows no date. [fetched]
- **Dataset viewer:**
  - It shows 100 rows a page, with distribution graphs at the top of each column. [docs]
  - Clicking a histogram bar or a class filters the rows. [docs]
  - Search and a SQL console are built in. [docs]
  - Clicking a row produces a shareable URL such as `?p=2&row=241`. [docs]
- **Evidence model:** each result can record `dataset.revision`, `date`, `source.url`, `notes` and `verifyToken`. Badges are `verified`, `community`, `leaderboard` and `source`, where `source` "links to evaluation logs or external source". This feature is marked "work in progress". [docs]
- **Model cards:** results are parsed from metadata into a widget, and a `source` can point to where they were computed. [docs]

### SWE-bench (added: closest analogue, per-item outcomes under each run)

Source: [swebench.com](https://www.swebench.com/)

- **First in the page:** navigation, "Official Leaderboards", then tabs for Verified, Multimodal, Multilingual, Lite and Full. [fetched, html]
- **Grid:** the table itself was not readable. There is a filter menu, a "Bash Only" toggle, and checkboxes with "Select top 10", "Select top 20", "Select all" and "Select all (open weights)". [html]
- **Harness note:** the Bash Only toggle's tooltip reads "Show only runs in the mini-SWE-agent environment, so scores compare models rather than harnesses". [html]
- **Legend:** one sentence defines the metric ("Each entry reports % Resolved"), and a legend explains the open-weights and verified tags. [html]
- **Evidence in the data:** each run record has `date`, agent version, `logs`, `trajs`, `warning` and `per_instance_details`, which gives `resolved` per task, such as `"apache__druid-14136": {"api_calls": 44, "cost": 0.32, "resolved": false}`. [html]
- **Gap:** "Compare results" opens a chart in a modal. In the static HTML I found no task-by-run grid, even though the page ships the data for one. JavaScript did not run, so a grid drawn at runtime cannot be ruled out. [html, inferred]

### caniuse (added: closest analogue, a discrete-state matrix)

Source: [caniuse.com/css-grid](https://caniuse.com/css-grid)

- **First in the page:** the feature title and spec status, then "Global usage 97.25% + 0.21% = 97.46%". [fetched]
- **Cell encoding:** symbol and word together, in a legend with colour named: "Green ✅ = Supported", "Red ❌ = Not supported", "Greenish yellow ◐ = Partial support", "Gray ﹖ = Support unknown". [fetched]
- **Qualifiers:** "Disabled by default" and "Not supported (but has polyfill available)" sit next to the version range they apply to. [fetched]
- **Layout:** the extracted text gives one row per version range. I recall a coloured grid with browsers as columns. [unverified]

### wpt.fyi (added: closest analogue, test-by-browser runs)

Sources: [results](https://wpt.fyi/results/), [API docs](https://github.com/web-platform-tests/wpt.fyi/blob/main/api/README.md)

- **Page:** not readable. I recall browsers as columns with version and date in the header, and folders as rows with pass/total counts that drill down to individual tests. [unverified]
- **Run records:** `browser_name`, `browser_version`, `os_name`, `os_version`, `revision`, `full_revision_hash`, `created_at`, `results_url`, `raw_results_url`. [fetched from the docs]
- **Per-test results:** a status plus `[passes, total]`. [fetched from the docs]

## Five patterns to use

**1. Freeze both axes: fault names on the left, tool names on top.**
Taken from Artificial Analysis, which makes the header and the first column sticky. A DETECTED cell means nothing once its fault or tool has scrolled away, and on a phone both will.

**2. Show every state as a symbol and a word, with a legend beside the grid, and make ERROR look unlike SILENT.**
Taken from caniuse, which gives "unknown" its own state rather than folding it into "no". The same distinction is the honest core of this product: SILENT means the tool ran and said nothing, and ERROR means no finding was possible. Using words as well as symbols also means the grid does not rely on colour alone.

**3. Make every cell a shareable link to its evidence.**
Taken from Hugging Face row URLs and its `source` badge, plus SWE-bench `logs` and `trajs`. The link should open the planted fault, the exact command and the raw tool output. With no composite score, the cells are the whole claim, so each must be checkable on its own.

**4. Put tool version and run date in the grid header, not on a methodology page.**
Taken from Arena's date and counts at the top of the page, the wpt.fyi run record, and Hugging Face `date` and `revision`. Artificial Analysis shows the cost of the alternative: its version sits far down a detail page. A cell is only true of one tool version on one date, and that fact should be visible where the cell is read.

**5. Lead with state filters that answer real questions, such as "Faults no tool detected".**
Taken from the click-to-filter on Hugging Face column graphs, the short plain-language highlights on Artificial Analysis, and the SWE-bench preset toggle that explains itself in a tooltip. This gives the quick takeaway a composite score would normally provide, while staying a statement about faults.

**A decision for the team:** counts per fault are safe, but "tool X: 7 detected" at the top of a column works as a score even if nothing is summed or sorted. I recommend counts on rows only, and no default ordering of tools by detections. Hugging Face's per-column graphs do not transfer directly for this reason.

**For the live panel (outside the five):** Arena's status rows, such as "Running bash", are a useful precedent for showing each tool's progress. [inferred] I would reuse the grid's exact cell encoding when each tool finishes, so people do not have to learn it twice.

## Three patterns to avoid

**1. Rank numbers, "Top 10" and "Best" labels, or anything that leads with an aggregate.**
Seen in Arena's Top 10 and "Best Overall" chips, the `#` column on Hugging Face, and the Artificial Analysis Index and "#2 / 65" cards. SWE-bench's single "% Resolved" has a similar effect, even with per-task data available. Each one teaches the reader to look for a winner, which undoes the deliberate choice to have no composite score. It also pushes individual outcomes one step away.

**2. Marks and freshness tags with no explanation or date.**
Seen in the unexplained asterisks on Hugging Face's HLE leaderboard, and the undated "Updated" tag on Artificial Analysis. A security audience will read an unexplained mark as something being hidden, and a benchmark's credibility rests on being able to check it.

**3. Landing pages or control panels that push the grid down.**
Seen in Arena's overview, which has ten sections and no full table, and its text leaderboard, which lists a large filter set before the table in the page text. Those controls suit 419 models and 29 categories. A hand-built set of faults and tools can be read directly, so filters would cost more than they save. Actual on-screen placement is unconfirmed, because I did not see it rendered. [inferred]
