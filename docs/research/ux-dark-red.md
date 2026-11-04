# Dark red UI: brand evidence, contrast, status colours, tokens

Researched 2026-11-04. "Verified" means I read the value from the owner's own served page, CSS or asset that day. Everything else is marked.

## Decision needed first: which Figma red

**#F24E1E is not Figma's current red.** Figma's own pages now serve a different logo palette.

| Value | Where it appears | Status |
|---|---|---|
| `#FF3737` red, `#FF7237` orange, `#874FFF`, `#00B6FF`, `#24CB71` | Logo SVG inline in figma.com and figma.com/using-the-figma-brand. Also `static.figma.com/app/icon/2/favicon.svg`, the favicon those pages link. | Verified, current |
| `#F24E1E` red-orange, `#FF7262`, `#A259FF`, `#1ABCFE`, `#0ACF83` | `static.figma.com/app/icon/1/favicon.svg`, an older path that is still served. Not linked by the current brand page. Simple Icons also lists `F24E1E` and cites Figma's brand page, but that page no longer contains the value. | Verified as an older asset, not current |

**Recommendation: use `#FF3737`.** The brief asks for "Figma's red", and this is the current one. It is a truer red, and it separates better from the SILENT amber for colour-blind viewers (see Status). Contrast is almost the same as `#F24E1E` (5.48 against 5.51 on the canvas). If the team prefers the familiar orange-red, swap one token: every `#F24E1E` pass or fail below matches `#FF3737` on the token surfaces, and the amber separation drops under deuteranopia from 30.1 to 24.6.

I could not determine when Figma changed the palette.

### Using Figma's colour

Figma's brand page says: "Don't modify our marks in any way or integrate parts of our marks into your own", "Don't imitate our visual identity" and "Don't use our marks in a way that inaccurately implies affiliation, sponsorship, or endorsement by Figma."

One red as a primary colour is not a mark, in my reading, though this is not legal advice. Do not use the logo, the five-colour set or the name "Figma" in the product.

## 1. Reference themes

Read from served CSS and HTML on 2026-11-04. These can change without notice. For YouTube, I inferred which value is dark from the light and dark pairs in its CSS.

### YouTube

| Role | Value | Status |
|---|---|---|
| Base background | `#0f0f0f` | Verified, `--yt-sys-color-baseline--base-background` |
| Raised surface | `#212121` | Verified, `raised-background` |
| Menu surface | `#282828` | Verified, `menu-background` |
| Overlay tone | `rgba(255,255,255,0.1)` | Verified, `additive-background` and `tonal-background` |
| Text primary and secondary | `#f1f1f1`, `#aaa` | Verified |
| Brand red | `#f03` (`#FF0033`) | Verified, `static-brand-red`, and logo `fill` on youtube.com |
| Older red | `#FF0000` | Simple Icons and third-party palettes. Not what the page serves. |
| Hover or chip `#272727` | | Third-party sites only, unverified |

### Hugging Face

| Role | Value | Status |
|---|---|---|
| Dark canvas | `#0b0f19` (`gray-950`) | Verified, huggingface.co `style.css` |
| Dark steps | `#101623` (`gray-925`), `#141c2e` (`gray-850`) | Verified |
| Scrollbar | track `#020011`, thumb `#374151` | Verified |
| Brand colours | `#FFD21E`, `#FF9D00`, `#6B7280` | Verified, huggingface.co/brand |
| Fonts | Source Sans Pro, IBM Plex Mono | Verified, `font-family` in `style.css` |

### What to borrow

- **From YouTube:** neutral near-black surfaces and three clear steps. Its red is used sparingly, which is from memory and unverified.
- **From Hugging Face:** a dense layout with metadata in monospace. Do not borrow its blue-tinted greys, because blue is the DETECTED colour here.

## 2. Contrast

WCAG 2 formula: relative luminance in sRGB, thresholds 4.5:1 for body text and 3:1 for large text and UI. I ran the script in the appendix. The threshold and criterion numbers (1.4.1, 1.4.3, 1.4.11) are from memory, not fetched today.

### Brand reds on candidate near-blacks

| Background | `#F24E1E` | `#FF3737` | Body 4.5 | Large/UI 3 |
|---|---|---|---|---|
| `#000000` | 5.88 | 5.85 | Pass | Pass |
| `#0A0A0A` | 5.55 | 5.52 | Pass | Pass |
| `#0B0B0D` (token) | 5.51 | 5.48 | Pass | Pass |
| `#0F0F0F` (YouTube) | 5.37 | 5.34 | Pass | Pass |
| `#121212` | 5.25 | 5.22 | Pass | Pass |
| `#141414` | 5.16 | 5.14 | Pass | Pass |
| `#181818` | 4.98 | 4.95 | Pass | Pass |
| `#1A1A1A` | 4.88 | 4.85 | Pass | Pass |
| `#1C1C1E` | 4.77 | 4.74 | Pass | Pass |
| `#212121` | 4.51 | 4.49 | `#F24E1E` pass, `#FF3737` **fail** | Pass |
| `#272727` | 4.19 | 4.16 | **Fail** | Pass |

### Text on brand reds

| Pair | Ratio | Body 4.5 | Large/UI 3 |
|---|---|---|---|
| White on `#F24E1E` | 3.57 | **Fail** | Pass |
| White on `#FF3737` | 3.59 | **Fail** | Pass |
| `#0B0B0D` on `#FF3737` | 5.48 | Pass | Pass |
| `#0B0B0D` on `#F24E1E` | 5.51 | Pass | Pass |
| White on `#D92B2B` (darkened alternative) | 4.85 | Pass | Pass |
| White on `#FF0000` (YouTube's older red) | 4.00 | **Fail** | Pass |

**White labels on the brand red fail at normal button size.** Use near-black labels on `#FF3737`. If the team wants white labels, use `#D92B2B` for the fill, which is no longer the exact brand colour and reads 4.06 on the canvas, so it passes for UI only.

### Token set against each surface

| Token | Value | canvas `#0B0B0D` | surface-1 `#131316` | surface-2 `#1B1B1F` | surface-3 `#26262B` |
|---|---|---|---|---|---|
| text-1 | `#F5F5F7` | 18.06 | 17.03 | 15.77 | 13.83 |
| text-2 | `#B4B4BC` | 9.55 | 9.00 | 8.34 | 7.31 |
| text-3 | `#8E8E98` | 6.06 | 5.72 | 5.29 | 4.64 |
| primary | `#FF3737` | 5.48 | 5.17 | 4.79 | **4.20, UI only** |
| primary-hover | `#FF5252` | 6.16 | 5.81 | 5.38 | 4.72 |
| primary-text | `#FF7A7A` | 7.79 | 7.34 | 6.80 | 5.96 |
| detected | `#4DA3FF` | 7.49 | 7.06 | 6.54 | 5.74 |
| silent | `#FFB000` | 10.73 | 10.12 | 9.37 | 8.22 |
| error | `#9A9AA3` | 7.05 | 6.65 | 6.15 | 5.40 |
| border-strong | `#74747F` | 4.26 | 4.02 | 3.72 | 3.26 |
| border-subtle | `#2C2C33` | 1.42 | 1.34 | 1.24 | 1.09 |

All pass for body text except primary on surface-3 and the two border tokens. border-strong passes the 3:1 UI threshold on every surface. border-subtle fails it on purpose, so use it only for decorative dividers.

| Filled pair | Ratio | Result |
|---|---|---|
| on-primary `#0B0B0D` on primary `#FF3737` | 5.48 | Body pass |
| on-primary `#0B0B0D` on primary-hover `#FF5252` | 6.16 | Body pass |
| on-silent `#0B0B0D` on silent `#FFB000` | 10.73 | Body pass |
| detected `#4DA3FF` on detected-tint `#10233A` | 6.04 | Body pass |
| text-1 `#F5F5F7` on detected-tint `#10233A` | 14.57 | Body pass |

Surface steps are nearly invisible by contrast alone: surface-1 is 1.06 against the canvas and surface-2 is 1.15. On a venue projector, near-blacks may merge, so **draw panel edges with borders rather than relying on the surface step**. Test on the actual projector if you can.

## 3. Keeping the brand red apart from status

### Three rules

1. **Red is never a verdict.** No red in the benchmark grid: not in cells, hover, selection, sort arrows or focus rings. Selection and focus use `text-1` white.
2. **Red belongs to the chrome only.** That means the wordmark, the primary action, the active nav or tab underline, and links in `primary-text`.
3. **Each status hue has one meaning everywhere.** Amber appears only for SILENT and blue only for DETECTED. Do not reuse them for warnings or links.

### Status encoding

Each status differs in five channels, so losing colour still leaves four.

| Status | Colour | Fill | Border | Glyph (inline SVG) | Label |
|---|---|---|---|---|---|
| **SILENT** (alarm) | `#FFB000` | Solid amber, near-black text. The only solid cells in the grid. | None | Filled triangle with `!` | `SILENT` |
| **DETECTED** (good) | `#4DA3FF` | Quiet tint `#10233A` | 1px solid | Check | `DETECTED` |
| **ERROR** (unknown) | `#9A9AA3` | None, diagonal hatch | 1px dashed | `?` | `ERROR` |

- **SILENT gets the most visual weight.** A row of quiet cells with one solid block draws the eye without needing red.
- **Do not use green for DETECTED.** It collapses into the brand red under red-green colour blindness (table below).
- **Blue does not say "good" on its own,** so keep the check glyph and an always-visible legend, for example "SILENT: fault present, tool reported nothing".
- **Text in narrow cells.** Use `SIL`, `DET` and `ERR` in mono, and keep the full word in `aria-label` and the tooltip.
- **Glyphs must be inline SVG.** The Latin font subsets recommended below contain neither `▲` (U+25B2) nor `✓` (U+2713), which I checked in the font files. A character glyph would fall back to a system font or emoji.
- **Grayscale check.** DETECTED (7.49) and ERROR (7.05) have almost the same lightness on the canvas, so the solid or dashed border and the glyph must carry that difference. Check with `filter: grayscale(1)`.

### Colour-blind simulation

Machado 2009 full-severity matrices, CIE76 ΔE between simulated colours. A higher number means easier to tell apart. I typed the matrix coefficients from memory, so they are unverified. A simulation is also not a test with real viewers.

| Pair | Normal | Protan | Deutan | Tritan |
|---|---|---|---|---|
| Brand `#FF3737` / SILENT amber | 66.8 | 51.3 | **30.1** | 54.8 |
| Brand `#F24E1E` / SILENT amber | 52.1 | 37.1 | **24.6** | 51.8 |
| Brand `#FF3737` / DETECTED blue | 123.6 | 84.1 | 111.9 | 131.0 |
| Brand `#FF3737` / ERROR grey | 89.1 | 41.7 | 59.6 | 94.0 |
| SILENT amber / DETECTED blue | 135.1 | 123.7 | 137.0 | 79.6 |
| SILENT amber / ERROR grey | 88.0 | 80.9 | 85.3 | 43.8 |
| DETECTED blue / ERROR grey | 48.5 | 43.7 | 52.5 | 37.1 |

Rejected candidates:

| Pair | Normal | Protan | Deutan | Tritan | Why rejected |
|---|---|---|---|---|---|
| Brand `#FF3737` / green `#22C55E` | 135.5 | **32.7** | **20.2** | 134.8 | Large gap for normal vision, small for red-green colour blindness |
| Amber / green `#22C55E` | 89.8 | **25.6** | 45.0 | 84.3 | SILENT and DETECTED move too close |
| Magenta `#FF4FD8` / blue | 77.9 | **12.6** | 29.9 | 104.2 | SILENT and DETECTED nearly merge |
| Magenta `#FF4FD8` / grey | 82.7 | 44.7 | **23.1** | 68.6 | SILENT and ERROR move too close |

The weakest pair kept is brand against amber under deuteranopia. That risk is acceptable because rule 1 keeps red out of the grid, so the two rarely sit together.

### Alternative: red means SILENT

Make SILENT the only red on screen and keep the chrome neutral. This would be the strongest story, since red would simply mean "the tool missed it". But it removes red from the primary action, which contradicts the brief's "primary colour", so I do not recommend it unless the user wants to revisit that.

### Code panel

Editors bring their own red, so this panel needs the same rules. Use greyscale syntax (`text-1`, `text-2`, `text-3`, with weight), `+` and `-` gutter marks for diffs, and no red or amber squiggles. Amber appears on a line only when that fault is currently SILENT.

## 4. Token set

```css
:root {
  color-scheme: dark;

  /* Backgrounds and surfaces */
  --bg:             #0B0B0D;
  --surface-1:      #131316; /* panels, grid */
  --surface-2:      #1B1B1F; /* headers, popovers */
  --surface-3:      #26262B; /* hover, selected row */

  /* Borders */
  --border-subtle:  #2C2C33; /* decorative dividers only */
  --border-strong:  #74747F; /* inputs, controls: 3:1 or better on all surfaces */
  --focus:          #F5F5F7;

  /* Text */
  --text-1:         #F5F5F7;
  --text-2:         #B4B4BC;
  --text-3:         #8E8E98;

  /* Brand: chrome only, never in the grid */
  --primary:        #FF3737;
  --primary-hover:  #FF5252;
  --on-primary:     #0B0B0D;
  --primary-text:   #FF7A7A; /* links and red text on any surface */

  /* Status: grid and legend only */
  --silent:         #FFB000;
  --on-silent:      #0B0B0D;
  --detected:       #4DA3FF;
  --detected-tint:  #10233A;
  --error:          #9A9AA3;
  --error-hatch:    #26262B;

  /* Type */
  --font-ui:   'IBM Plex Sans Variable', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  --text-xs: 12px; --text-sm: 13px; --text-md: 14px;
  --text-lg: 16px; --text-xl: 20px; --text-2xl: 28px;

  /* Radius */
  --radius-cell: 2px;
  --radius-control: 4px;
  --radius-panel: 8px;

  /* Spacing: 4px base */
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
}
```

The hatch for ERROR is `repeating-linear-gradient(45deg, transparent 0 4px, var(--error-hatch) 4px 5px)`. `--error` text stays at 5.40 or better even on the hatch colour.

### Type pairing: IBM Plex Sans and IBM Plex Mono

| Reason | Evidence |
|---|---|
| Digits align in columns without extra CSS | Plex Sans latin file: every digit is 600 units wide. Checked in the font. |
| One family for grid labels, tool names and code | Same type family, so sans and mono match |
| Fits the reference | Hugging Face uses IBM Plex Mono (verified) |
| Small offline payload | 44 KB variable sans (weights 100 to 700) plus 14 KB for each mono weight, about 72 KB for two mono weights |
| Licence allows bundling | OFL-1.1, from the npm packages and the LICENSE file |

Candidates checked and not chosen:

- **Geist:** its digits are proportional by default (widths 384 to 663). It has `tnum`, but needs `font-variant-numeric: tabular-nums` everywhere.
- **Hanken Grotesk:** tabular digits and fine, but no matching mono.
- **JetBrains Mono:** a good code font, but a separate family. It ships `calt` ligatures, which can make code read differently, so it would need them turned off.

Plex Mono has no `zero` feature in this subset. I recall its default zero being dotted, which would separate it from `O`, but that is unverified, so check it in a browser.

### Self-hosting for offline use

Both packages are on npm at version 5.3.0.

```sh
npm i @fontsource-variable/ibm-plex-sans @fontsource/ibm-plex-mono
```

```js
import '@fontsource-variable/ibm-plex-sans/wght.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
```

The bundler copies the `woff2` files into the build, so nothing is fetched at runtime. The CSS family name `IBM Plex Sans Variable` comes from the package's `wght.css`.

Without a bundler, copy these files from the packages to `public/fonts/` with the `LICENSE`, and write your own `@font-face` rules:

- `ibm-plex-sans-latin-wght-normal.woff2`
- `ibm-plex-mono-latin-400-normal.woff2`
- `ibm-plex-mono-latin-500-normal.woff2`

Then:

1. Include no `fonts.googleapis.com` link. YouTube's page does load one, so do not copy that pattern.
2. Run `npm i` before you reach the venue, and keep the build or `node_modules` on the demo machine.
3. Test with the network off. In DevTools, set the network to Offline and hard-reload, and confirm there are no requests to other hosts and the fonts render.

## Limits of this research

- Brand values are one-day snapshots of served assets, not statements of brand policy. Figma's brand page itself gives no hex values.
- Contrast is calculated for sRGB and does not predict a projector.
- Nothing here was tested on real viewers or a built screen. The tokens have not been tried in the grid.

## Sources

- Figma brand guidelines and logo SVG: https://www.figma.com/using-the-figma-brand/
- Figma current favicon: https://static.figma.com/app/icon/2/favicon.svg
- Figma older favicon: https://static.figma.com/app/icon/1/favicon.svg
- Simple Icons data: https://raw.githubusercontent.com/simple-icons/simple-icons/develop/data/simple-icons.json
- YouTube homepage and its `kevlar_base` stylesheet: https://www.youtube.com/
- YouTube brand site (no hex values in the fetched text): https://brand.youtube/
- Hugging Face brand: https://huggingface.co/brand
- Hugging Face stylesheet: https://huggingface.co/front/build/kube-e142bb8/style.css
- Third-party palettes, not relied on: https://colorfyi.com/id/brands/figma, https://brandpalettes.com/figma-logo-colors/, https://www.webdesignhot.com/design.md/youtube/, https://www.webdesignhot.com/design.md/huggingface/
- Fontsource packages: https://www.npmjs.com/package/@fontsource-variable/ibm-plex-sans, https://www.npmjs.com/package/@fontsource/ibm-plex-mono

## Appendix: contrast script

```python
def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def luminance(h):
    h = h.lstrip('#')
    r, g, b = [lin(int(h[i:i + 2], 16)) for i in (0, 2, 4)]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(a, b):
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)
```
