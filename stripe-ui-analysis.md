# Stripe Blog UI analysis (notes for Briefly / 2026)

This doc captures **UI rules** observed from Stripe Blog list + article pages, with concrete tokens we can port into our static longform pages.

## 1) Global layout patterns
- **Background grid**: very subtle dotted/grid pattern behind the page content, giving structure without reducing contrast.
- **Wide canvas + constrained reading column**: the overall page uses a large canvas (full width), while the reading column stays constrained and offset to create “editorial whitespace”.
- **Breadcrumbs + section label** at top-left (“Blog / Product”) provides context.
- **Meta column on desktop**: author block sits in a left column, while the title + body sit in the main reading column.

## 2) Typography tokens (measured)
Measured on desktop viewport 1440×900 for an article page:
- **Body font**: `sohne-var, "Helvetica Neue", Arial, sans-serif`
- **H1**:
  - font-size: **56px**
  - line-height: **67.2px**
  - font-weight: **425** (variable font weight)
- **Paragraph**:
  - font-size: **18px**
  - line-height: **28px**
  - color: **rgb(66, 84, 102)** (≈ `#425466`)

## 3) Reading column geometry (measured)
On desktop (1440px wide):
- **Readable paragraph box width**: **~810px**
- **Left offset**: **~450px**

Interpretation:
- Stripe keeps the paragraph column **wider than “classic 640–720px”**, but compensates with generous whitespace and strong line-height.

## 4) Visual hierarchy patterns
- **Title dominance**: huge H1, tight letter spacing, followed by a single-line date.
- **Accent rule**: date line is preceded by a small vertical accent bar (brand-feeling, low-noise).
- **Links**: vivid brand-ish blue for inline links (high discoverability without underline everywhere).
- **Author block**: avatar + name + org in a compact stack; positioned as a left rail element on desktop.

## 5) Mobile behavior (observed)
- Same hierarchy, but the author block collapses under the date/title.
- Big title remains big; spacing is more vertical, and the page feels “single column”.

## 6) Mapping to our `index.html` / `mandate.html`
Recommended ports:
- **Reading width**:
  - Consider shifting `.article-body` from 740px → **780–820px** on desktop.
  - Keep TOC rail on large screens, but ensure the reading column remains the star.
- **Type scale**:
  - Keep `p` at **18/28** (we already match the line-height vibe).
  - Ensure H1 is **56px** with a similar line-height (we already match size; weight can be tuned).
- **Background grid**:
  - Add a subtle, low-contrast background grid behind the layout.
- **Meta/author rail**:
  - Consider moving author/date into a left rail block to match Stripe’s editorial feel (optional).

## 7) Next concrete deliverable
Create a small “token sheet” in CSS:
- `--content-max: 1120px`
- `--reading-max: 810px`
- `--text-body: 18px`
- `--lh-body: 28px`
- `--h1-size: 56px`
- `--h1-lh: 67px`

Then refactor our layout to consume these tokens and adjust the reading column / whitespace accordingly.

