# Site Icons

How `public/logo.svg`, `public/favicon.ico`, and `public/apple-touch-icon.png` are produced from a
Figma export. Re-run this whenever the mark changes — the current glyph is provisional.

One SVG serves every surface: the sidebar brand mark, the browser favicon, and the iOS home screen.
Keep it that way. A second file means a second thing to regenerate and a second thing to forget.

## What ships

| File | Purpose | `<link>` in `BaseLayout.astro` |
| --- | --- | --- |
| `logo.svg` | Sidebar brand mark and modern-browser favicon | `rel="icon"` `type="image/svg+xml"` |
| `favicon.ico` | Legacy browsers, and the implicit root request | none needed |
| `apple-touch-icon.png` | iOS home screen | `rel="apple-touch-icon"` |

`favicon.ico` needs no `<link>`: browsers request `/favicon.ico` from the site root whether or not
it is declared. Shipping the file also removes the 404 that request would otherwise produce.

The sidebar references `logo.svg` through `<img>`, not through `astro-icon`. Inlining an 18 KB path
into every page is not worth it when one cached request does the job, and nothing in the markup
needs `currentColor` — see below.

## Source

The glyph is 游, exported from Figma with the stroke already outlined. It is **two stacked filled
paths**, and that structure is load-bearing:

1. a white path — the body of the character
2. a `#171717` path — a thick outline around it

`#171717` is the light-theme value of `--foreground`, so on a white page the mark matches body text
exactly.

### The two layers make the mark self-inverting

Neither layer is transparent, so whichever one matches the background disappears and the other
carries the shape:

| Background | What you see | Contrast |
| --- | --- | --- |
| `#ffffff` page | white body vanishes, dark outlines merge → **dark glyph** | 17.93:1 |
| `#dee1e6` light tab strip | same → dark glyph | 13.68:1 |
| `#35363a` dark tab strip | dark outline sinks, white body reads → **white glyph** | 12.07:1 |
| `#0a0a0a` dark page | same → white glyph | 19.80:1 |

Both renderings carry the same silhouette at comparable weight. The white body covers slightly more
area than the dark outline, so the dark-theme rendering reads marginally heavier; the difference is
only visible side by side.

### Why there is no dark-mode variant

Inverting the layers (white outline, dark body) would make things worse, not better. On a dark
background the dark body would vanish and only the white outline would survive, leaving a **hollow
outlined glyph** — thinner and weaker than the solid white the current file already produces.

Delivery is the second reason. A dark variant could only be switched on one of the four surfaces:

| Surface | Can it switch on theme? |
| --- | --- |
| Sidebar | yes, via `<picture>` + `prefers-color-scheme` |
| favicon | unreliable — `media` on `<link rel="icon">` is inconsistently honoured |
| apple-touch-icon | no, iOS does not switch |
| Open Graph card | no, scrapers fetch server-side |

One file that works everywhere beats two files that work in one place.

### Why Biome does not check this directory

`biome.json` excludes `**/public` from `files.includes`, so nothing here is linted or formatted.
Without that exclusion `biome check .` fails on the SVG for two reasons, neither a real defect:

- `lint/a11y/noSvgWithoutTitle` demands a `<title>` or `role="img"` + `aria-label`. That rule targets
  SVG inlined into a document, where the graphic needs its own accessible name. Here the mark is
  fetched as an image and the link carries `aria-label`; a `<title>` would never be read.
- The formatter would expand the export's attribute layout to one attribute per line.

`public/` holds assets copied verbatim into `dist/`, not source — the same reasoning that already
excludes `dist`. Nothing else destined for this directory (`og.png`, `_headers`, `robots.txt`) is a
format Biome checks, so the exclusion costs no real coverage.

Note that lefthook's pre-commit glob never included `.svg`, so that failure only surfaced at
`pre-push`, where `pnpm precheck` runs `biome check .` across every file.

## Preparing the Figma export

In Figma, before exporting:

- **Outline the stroke** (`Object → Outline Stroke`). Figma cannot express an outside-aligned stroke
  in SVG, so it emulates one with a double-width stroke plus a `<mask>` — three copies of the path
  and roughly 21 KB. Outlining first removes all of it.
- **Do not flatten the two shapes together.** The white body and the dark outline must stay separate
  or the self-inversion above stops working.
- **Turn off Clip content** on the frame, or a `<clipPath>` can appear.
- In the SVG export options, keep **Include "id" attribute** off and the colour profile on **sRGB**.
  Display P3 would shift `#171717` off the `--foreground` value.

Two artefacts survive anyway and are removed by the pipeline below rather than by hand:

- a full-canvas `<rect fill="#F5F5F5">` (Figma's default canvas grey) that no amount of clearing the
  frame fill has removed;
- zero padding — the artwork runs flush to all four edges of the 512 canvas and slightly past the
  right one (`x` reaches `512.002`). Rasterised small, that flush right edge collapses into a hard
  dark column instead of a rounded terminal.

## Regenerating

Requires `rsvg-convert` (librsvg) and `magick` (imagemagick), both provided by the Nix devShell.
Point `SRC` at the Figma export.

```sh
SRC=path/to/figma-export.svg

# Drop the background rect, and widen the viewBox to add 32 units (6.25%) of
# margin on every side. Widening the viewBox moves no geometry and distorts
# nothing — it only changes which region of the coordinate space is shown.
sed -e '/<rect width="512" height="512" fill="#F5F5F5"\/>/d' \
    -e 's|width="512" height="512" viewBox="0 0 512 512"|width="576" height="576" viewBox="-32 -32 576 576"|' \
    "$SRC" > public/logo.svg

# favicon.ico — 16px and 32px bundled into one file
rsvg-convert -w 16 -h 16 public/logo.svg -o /tmp/fav-16.png
rsvg-convert -w 32 -h 32 public/logo.svg -o /tmp/fav-32.png
magick /tmp/fav-16.png /tmp/fav-32.png public/favicon.ico

# apple-touch-icon.png — glyph centred on an opaque 180px canvas.
# 158, not 180: the viewBox margin already shrinks the glyph to 89% of the
# canvas, so 158 lands it at ~140px of visible mark (~11% breathing room).
rsvg-convert -w 158 -h 158 public/logo.svg -o /tmp/touch.png
magick /tmp/touch.png -background white -gravity center -extent 180x180 \
  -alpha remove -alpha off public/apple-touch-icon.png
```

iOS does not honour transparency; it composites the icon onto black. The background must be opaque,
which `-alpha remove -alpha off` guarantees. iOS also adds no padding of its own and rounds the
corners, hence the margin built into the 180px canvas.

All three files are committed. CI builds only copy `public/` into `dist/`, so the image tools are
never needed outside this runbook.

## Verifying

The `sed` patterns above match one specific export. If Figma's output shifts they will silently do
nothing, so check the result rather than trusting the command:

```sh
grep -c '<rect' public/logo.svg              # 0 — background rect gone
grep -o 'viewBox="[^"]*"' public/logo.svg    # viewBox="-32 -32 576 576"

# Margin actually present: 512x512+0+0 means the artwork still runs to the edge
rsvg-convert -w 512 -h 512 public/logo.svg -o /tmp/chk.png
magick /tmp/chk.png -trim -format '%wx%h%O\n' info:   # 456x456+28+28

magick identify public/favicon.ico            # two lines: 16x16 and 32x32
magick identify -format '%[channels]\n' public/apple-touch-icon.png
```

The last check must report a channel string **without a trailing `a`**. `gray` and `srgb` both pass;
`graya` or `srgba` mean transparency survived. ImageMagick picks grayscale here because the mark uses
no hue — that is expected, not a fault.

Then `pnpm build` and confirm all three files reach `dist/`, and that `/favicon.ico` no longer 404s
in the browser network panel.

## Small sizes

A 12-stroke kanji has a hard floor. Showing N parallel strokes needs at least 2N−1 pixels, so:

| Size | Result |
| --- | --- |
| 16px | illegible — an undifferentiated smudge |
| 32px | dense, but recognisable as a distinct CJK mark |
| 45px+ | fully legible; the sidebar renders at `2.7rem` |

No colour or stroke adjustment changes this; it is stroke count against pixel count. HiDPI displays
rasterise the 16px favicon slot at 32 device pixels, so the 32px row is what most people actually
see, and a favicon needs to be *distinguishable* rather than *readable*.

If 16px legibility ever becomes a requirement, the answer is a simplified mark — the `氵` radical
alone is three strokes, reads cleanly at 16px, and stays visually continuous with the full glyph.
That would be a second file, with the maintenance cost noted at the top of this document.

## Related

The same two tools generate the Open Graph card (`public/og.png`) — see #114.
