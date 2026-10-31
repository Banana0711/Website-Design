# Belgrade Arbor — site teardown

Source: `https://belgradearbor.rs/en` (Awwwards SOTD). Stack observed: Next.js, Tailwind CSS v4, GSAP 3 + ScrollTrigger, Lenis, MorphSVG. All values below are measured from the live CSS and page markup, not estimated.

## Page anatomy

| # | Section id | Type | Notes |
|---|---|---|---|
| 1 | `Introduction` | Sticky scrub, `height: 900vh` | Three copy scenes over a pinned stage; morphing clip-path images; progress counter 01–05; radial stage gradient from `#3E562E` to pine green; background `leafs.webp` |
| 2 | `Location` | Full-bleed still | Location render, portrait video card, giant word `Location` bottom-right, body copy left third |
| 3 | `Around` | Editorial list | `What's around` kicker; accordion rows for Railway Station, Savremena Elementary School, West 65, Airport City, Hangar Food Market, Airport Nikola Tesla; minutes; hairline separators `golden/40` |
| 4 | `Residences` | Full-bleed still | Giant word `Residences` in golden; copy right; portrait video top-left |
| 5 | `ResidenceOptions` | Hidden overflow section | Opens after the residences scene |
| 6 | `BusinessSpaces` | Full-bleed still | Same grammar, `Office spaces and retails` |
| 7 | `BusinessSpacesOptions` | Hidden | |
| 8 | `Roots` / `RootsMobile` | Navy chapter | `bg-navy #314759`; kicker `The way of living`; giant `Your roots`; oversized images masked by `mask1–3.svg` with parallax |
| 9 | `Amenities` | Full-bleed still | Video card, copy, giant `Amenities` |
| 10 | `AmenitiesOptions` | Hidden | |
| 11 | `Horizontal` | Pinned horizontal pan | Aerial render, clouds, letters A/B, giant `View from above`, cream curtain reveal |
| 12 | `Installment` | Split reveal | Image left 55vw, payment plan right; 20 / 20 / 20 / 30 / 10 % |
| 13 | Footer | Gradient | `#8AB6D2` → vanilla; tree cut-outs; newsletter; nav; legal |

## Tokens (exact)

```
vanilla      #FDFBEF
cream        #FFF4D6
cream-dark   #CCBF99
sand         #F4F0DB
golden       #A68150
green        #60735C
pine-green   #2E3A26
navy         #314759
sky          #8AB6D2
nav glass    #1F261E / 80% + blur(16px)
neon accent  #E7FD55  (award badge, one link only)
intro stage  radial at bottom right, from #3E562E to #2E3A26
```

Type:

```
display  PP Editorial Old 300/400 + ultralight italic
body     Work Sans 300–700
hero     10rem / 5.375rem / 3rem, line-height 1
huge     20rem, line-height 1
h1       6.25rem / 4.75rem / 3.25rem, line-height 1
h2       3.5rem / 3rem / 2.5rem, line-height 1.1, tracking .02em
h3       2rem / 2rem / 2.5rem, line-height 1.1
kicker   1.25rem, tracking .02em
para     1rem / 1.2
detail   1.125rem / 1.3, weight 500
menu     .875rem, tracking .02em
small    .875rem / 1.3
```

Layout:

```
wrapper     max-width 117.5rem (1880px); padding-inline 4rem / 2.25rem / 1.5rem
radii       nav 1.75rem; media 1.25rem; buttons 9999px
breakpoints 1440 (JS state), 1121 (desktop/tablet), 601 (mobile)
```

## Motion measurements

Text entrance:

```
from  opacity 0, y 2rem, blur(4px)
to    opacity 1, y 0,    blur(0px)
ease  power1.inOut
time  0.7s; stagger 0.05–0.1; chars for kickers/headings, words for paragraphs
```

Intro morph:

```
stage enter   scale 1.1 → 1; blur 4px → 0; opacity 0 → 1
frame 1       w 20rem, h 27rem, right 16.66%, top 14%   (desktop)
frame 2       w 35rem, h 35rem, left 0, bottom 20%
clip morph    small canopy blob → large rounded arch, ease none, scrubbed
images        A fades out while B fades in at the same offset
progress      01 visible; 02/03 sit y 1rem, blurred; crossfade on scene change
```

Horizontal pan:

```
start          x = -(imageWidth - viewportWidth) * 0.00
end            x = -(imageWidth - viewportWidth) * 1.00   (desktop)
scroll length  += 2 * distance
clouds         left -= 10% / 20% / 30%
word           left -= 10%; chars blur out and scale 0.7 at 30% progress
curtain        two vanilla halves, width 100% → 0%, ease power1.inOut
```

Still-scene parallax:

```
image  top 33%; height calc(100% + 20rem); translateY(-50%)
motion yPercent and scale, scrubbed, slow
scrim  black 20%
```

## Copy samples

```
BELGRADE ARBOR DESIGN
The visual identity of Belgrade Arbor is defined by an elegant facade inspired
by the form of a tree canopy, a symbol of growth, balance, and longevity.

Belgrade Arbor isn't just another addition to the skyline; it's a curated urban
ecosystem that evolves with the rhythm of the city.

At one of New Belgrade's most dynamic locations, on Bulevar heroja sa Košara,
Belgrade Arbor is taking shape as a contemporary residential and commercial
development that seamlessly brings together refined architecture, everyday
comfort, and enduring value.

In Belgrade Arbor, each residence is crafted not merely for living, but as a
space that evolves alongside you.

JOIN THE WORLD OF BELGRADE ARBOR
Subscribe to join our community and stay up to date.
```

## Component notes

- Nav: fixed pill, `max-w-160` (640px), top 24px, `p-2`, left `Menu` + 2-line hamburger, center gold monogram (9×9), right `Inquire`; mobile 48px bar.
- Button: `rounded-full`, transparent, `1px` green border, `h-10`, `px-5`, sand uppercase 14px, dual labels sliding vertically, optional 32×32 outline icon.
- Form: gold uppercase 14px labels, 1px bottom pine-green border, focus border green, no filled inputs.
- Media card: `aspect-[1.43/1]`, `rounded-[1.25rem]`, portrait video at 150–200% width and negative top.
- Index: 14px green, tabular; `01`–`05` stacked.
- Footer legal: 14px grey, max two lines, no uppercase.

## Assets used by the original (for reference only)

```
home/introduction/leafs.webp, image1–4.webp
home/location/location.webp, location.mp4
home/residences/residences-hero.webp, residences.mp4
home/business/business.webp, business.mp4
home/amenities/amenities-bg.webp, amenities.mp4
home/horizontal/horizontal.webp, cloud1–3.webp
home/roots/image2–3.webp, mask1–3.svg
home/footer/front.webp, tree-l.webp, tree-r.webp
```

Do not redistribute these files. Recreate the composition with original renders.
