# UX wireframe

Research behind this: docs/research/ux-leaderboards.md, ux-graders.md and ux-dark-red.md.

## The question the screen answers

"What does a clean scan from this tool fail to prove?"

Possible answers: the most popular way of choosing still misses n of N planted faults, and another tool catches m of them; or every planted fault was caught, so this benchmark found no blind spot.

## First viewport, with no interaction

- **Verdict:** "The tool with the most findings stayed silent on n of N planted faults."
- **The reason:** "Another tool caught m of those, so relying on one scanner leaves a gap you can't see in its report."
- **Next action:** "Try it on your own Terraform", plus filters that answer real questions.
- **Provenance strip:** run date, tool versions and where the faults came from.
- **Scope line:** planted faults only, no claim about real-world catch rates, and these are code scanners, not full GRC platforms.
- **The grid starts here:** faults down the side, tools across the top, both frozen when scrolling. Every cell is a link.

## Cell states

Each differs in word, symbol and fill, so it survives grayscale and a projector.

| State | Word | Symbol | Fill | Colour |
|---|---|---|---|---|
| Tool caught it | Detected | Check mark | Dark tint | Blue |
| Tool ran and said nothing | Silent | Triangle | Solid | Amber |
| We don't know | Error | Question mark | Hatched | Grey |

Red is the brand colour only and never marks a status. A tool that can't parse a file shows Error.

## Column header

Tool name, version and "silent on n of N". Tools are never sorted by this count, and there's no composite score.

## Filters

All faults, missed by at least one tool, and detected by no tool. Each shows its count.

## Evidence, one click from any cell

Fault detail: plain-English title, the requirement it breaks and its source, the clean and faulty Terraform as a marked diff, and each tool's status and new findings. A silent tool reads "Ran on both files and reported nothing new."

## The viewer's own input

"Try it" shows a before and after editor, opening on a real clean case. One button loads that case's faulty version. Scanning shows honest elapsed time and which tools are running, and the code stays on screen. Each tool then reads Noticed, Silent or Error. Editing the code after a scan marks the results as out of date.

## Awkward states

- **No benchmark run yet:** says so and points to Try it. Never shows sample results as real.
- **Server unreachable:** names the problem and offers a retry.
- **Tool failed in a live scan:** only that tool shows Error, with its message. The others still show results.
- **Input too large:** the server's message, with the Terraform kept in place.

## Sample mode

For layout work before real results exist. It uses fictional scanner names and a banner that can't be dismissed, and is excluded from the production build.
