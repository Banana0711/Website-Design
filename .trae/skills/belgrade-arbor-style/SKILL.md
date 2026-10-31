---
name: belgrade-arbor-style
description: Build luxury property and architecture sites — cream-olive palette, oversized serif type, scroll-scrubbed morphing reveals. Use for premium real-estate landing pages. Do not use for dashboards.
---

# Belgrade Arbor Style

Recreate the design language of the Belgrade Arbor residential-complex site: cinematic renders, editorial serif typography, a two-color earth palette, and scroll-scrubbed motion. The result should feel like a slow architectural film, not a marketing template.

## 1. Why it works

- **One idea per viewport.** Each screen holds a single full-bleed render, one oversized word, and at most two sentences.
- **Architecture is the narrative.** Canopy facade → location → residences → roots → amenities → aerial plan → payment plan → community. Copy never explains what the image already shows.
- **Motion is scroll-scrubbed, never autoplaying.** The user's scroll is the timeline. 900vh of scroll can carry a three-scene intro.
- **Restraint.** Cream, olive, and warm grey cover 95% of the site. Gold is an accent. Neon appears on a single micro-element at most.

## 2. Tokens

### Palette

| Token | Hex | Use |
|---|---|---|
| Vanilla | `#FDFBEF` | page background, light sections |
| Cream | `#FFF4D6` | text on dark/photo, nav text |
| Cream dark | `#CCBF99` | giant section words over photography |
| Sand | `#F4F0DB` | body copy on dark imagery |
| Golden | `#A68150` | logo, form labels, hairline rules |
| Green | `#60735C` | borders, primary accent, focus |
| Pine green | `#2E3A26` | deep text, dark stage |
| Navy | `#314759` | one dark "roots" chapter |
| Sky | `#8AB6D2` | footer gradient top |
| Glass | `#1F261E` at 80% | floating nav pill |
| Neon | `#E7FD55` | optional single micro-accent only |

Never use pure white, pure black, SaaS blue, or more than three hues per screen.

### Type

- Display: **PP Editorial Old** (serif). Weights 300 and 400, plus ultralight italic. Fallback `"Times New Roman", Georgia, serif`.
- UI/body: **Work Sans** 300–700. Fallback system sans. Do not substitute Inter or a geometric sans.
- Display type is always light (300) and set tight; uppercase only for section words.

| Class | Size (desktop / ≤1120 / ≤600) | Line height | Notes |
|---|---|---|---|
| `hero` | 160 / 86 / 48 px | 1 | section word, uppercase, `#CCBF99` |
| `huge` | 320 px | 1 | roots word, uppercase |
| `heading-1` | 100 / 76 / 52 px | 1 | light serif |
| `heading-2` | 56 / 48 / 40 px | 1.1 | letter-spacing .02em |
| `heading-3` | 32 / 32 / 40 px | 1.1 | |
| `kicker` | 20 px | 1.2 | Work Sans, uppercase, .02em |
| `paragraph` | 16 px | 1.2 | Work Sans 400 |
| `detail` | 18 px | 1.3 | Work Sans 500 |
| `menu` | 14 px | — | uppercase, .02em, buttons/nav |
| `small` | 14 px | 1.3 | form labels |

### Layout

- Content wrapper: `max-width: 117.5rem; margin-inline: auto; padding-inline: 4rem` (36px ≤1120, 24px ≤600).
- 12-column thinking: body copy occupies 1/3, imagery 1/3 to 1/2, section word the remaining edge. Leave one empty column at the left on desktop.
- Radii: nav pill `1.75rem`; media frames `1.25rem`; buttons fully rounded.
- Hairlines: `1px` golden at 40% opacity.
- Easing: `power1.inOut` for layout morphs, `power1.out` for entrances, `expo.out` for UI. No bounce, no elastic.

## 3. Signature components

**Floating nav pill.** Fixed top-center, 640px max width, height ~56px, `#1F261E` at 80% opacity, `backdrop-filter: blur(16px)`, radius `1.75rem`, cream text. Left: two-line hamburger + `MENU`. Center: gold monogram. Right: `INQUIRE`. On mobile it collapses to a 48px bar with the logo left and the menu control reversed to the right.

**Dual-label button.** Transparent, full-rounded, `1px` green border, sand uppercase 14px label, 40px height. Two identical label rows stacked in a clipped box; on hover the first row slides up out of view and the second slides in from below. Optional 24px outline icon. Variants: dark outline (on imagery), solid green (primary), text link with neon accent.

**Section word.** One giant serif word at the right or bottom edge of a full-bleed image, uppercase, cream-dark. It is a label, not a headline. Keep it to one word.

**Index counter.** `01`–`05` in Work Sans 14px green, stacked absolutely; inactive numbers sit `1rem` below and blurred, active number crossfades in. Use for multi-scene chapters.

**Media frame.** Photo or portrait video inside a `1.25rem` rounded rectangle, aspect `1.43 / 1`, video cropped to `150–200%` width and pushed above center so the frame shows a moving detail rather than the whole shot.

**Organic reveal mask.** Photos clipped by an asymmetric, leaf/canopy-like SVG path. During the intro, animate the path `d` from a small canopy blob to a large rounded arch while the frame grows and reposition. This is the site's most recognizable device.

**Branch-grid facade.** The recurring architectural motif: pale concrete structure whose columns split like tree trunks into angular branches around glazing. Reuse it in illustrations, dividers, and line art.

**Footer.** Background gradient from `#8AB6D2` at the top to vanilla at the bottom, with tree cut-outs rising from the horizon. Newsletter uses labels in gold uppercase and inputs as single pine-green underlines. Close with a huge uppercase invitation and a legal line in small grey.

## 4. Motion recipes

Use **GSAP 3 + ScrollTrigger + Lenis** (the site's actual stack). Install Lenis for smooth inertia, then `ScrollTrigger.update` on Lenis scroll. Scrub everything; avoid one-shot animations except text entrances.

### 4.1 Sticky scrub intro (the signature)

Structure:

```
<section class="scroller">          <!-- height: 900vh -->
  <div class="stage">               <!-- position: sticky; top: 0; height: 100vh -->
    <div class="morph-frame">...</div>
    <div class="screen1">...</div>
    <div class="screen2">...</div>
    <div class="screen3">...</div>
  </div>
</section>
```

Timeline skeleton:

```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: ".scroller", start: "top top", end: "bottom bottom", scrub: 1 }
});

// 1. stage appears from blur
 tl.fromTo(".morph-frame", { scale: 1.1, opacity: 0, filter: "blur(4px)" },
                             { scale: 1, opacity: 1, filter: "blur(0px)", ease: "power1.inOut" }, 0);

// 2. mask morph + frame resize (MorphSVG is a Club plugin; otherwise interpolate path points)
tl.to("#clip1 path", { morphSVG: "M613 748V103C613 54 569 18 523 29L296 86C274 92 256 107 247 127L7 617C-13 661 12 714 59 724L525 822C571 832 613 796 613 748Z", ease: "none" }, 0.2)
  .to(".frame-1", { width: "20rem", height: "27rem", right: "16.66%", top: "14%", ease: "power1.inOut" }, 0.2)
  .to(".morph-img-a", { opacity: 0 }, 0.2)
  .to(".morph-img-b", { opacity: 1 }, 0.2);

// 3. text entrances are reversible timelines triggered at scene boundaries
const show = (el, at) => tl.fromTo(el,
  { opacity: 0, y: "2rem", filter: "blur(4px)" },
  { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.05, ease: "power1.inOut" }, at);
```

Rules:
- Keep the whole intro at ~5× viewport height per scene, 900vh total for three scenes.
- Text must be split into words or characters (SplitText or manual wrapping). Never animate a whole paragraph as one block.
- Reverse the text timeline when scrolling back, so the story rewinds.
- Move the progress counter with the same boundary offsets.

### 4.2 Full-bleed still scene

```html
<div class="scene">
  <img class="bg" src="..." />
  <div class="wrapper">
    <div class="copy">...</div>
    <h2 class="hero">Location</h2>
  </div>
</div>
```

- Image: `position:absolute; top:33%; height:calc(100% + 20rem); transform:translateY(-50%); object-fit:cover`.
- Add a `bg-black/20` scrim for text contrast; never a flat heavy overlay.
- Animate the image `yPercent` and `scale` slowly across the scene (`scrub: true`) while copy fades in at `top 80%`.
- Copy block sits in the left third; the section word is pushed to the opposite edge or bottom.

### 4.3 Horizontal aerial pan

- Pinned `100vh` viewport, image `height:100%; width:auto; max-width:none`.
- Pan distance: `-(image.scrollWidth - window.innerWidth)`.
- Scroll length: `+=${2 * distance}` so the image crosses at half scroll speed.
- Parallax layers: three cloud PNGs move left by 10%, 20%, 30%; the word moves 10%.
- Curtain reveal: two vanilla panels cover each half, then animate `width: 0` as the section enters.
- Split the giant center word into chars; blur/scale them out at 30% progress.

### 4.4 Masked image drift

- Oversized images (`width: 1200px+`) masked by organic SVG shapes (`mask-image: url(...)`, `mask-size: 100%`).
- Give each mask a different parallax speed (`yPercent: -10` to `+15`) and slight rotation.
- Keep the mask silhouettes asymmetric; avoid circles and rounded rectangles.

### 4.5 Mobile

- Do not pin on ≤600px. Replace the scrub intro with five stacked screens, each advancing at 20% scroll intervals (60vh steps).
- Text still reveals word-by-word; background images scale down to 100%.
- Copy moves below imagery, never over it, except for the section word.

### 4.6 Accessibility & resilience

- Respect `prefers-reduced-motion`: skip scrubbing, render final states, keep only opacity fades.
- Set initial states in JS, not CSS, so the page is readable if JS fails.
- Use `invalidateOnRefresh: true` and recalculate on resize.
- Animate only `transform`, `opacity`, and `filter`.

## 5. Copy voice

- Declarative, place-led, calm. One clause per sentence where possible.
- Kickers are two to four words, uppercase: `BELGRADE ARBOR DESIGN`, `THE WAY OF LIVING`, `WHAT'S AROUND`.
- Section words are singular: `Location`, `Residences`, `Amenities`, `Your roots`.
- Body copy is 1–2 sentences, max ~35 words. No exclamation marks, no "imagine", no stock superlatives.
- Name concrete things: street, school, minutes, materials, percentages.
- Use em dashes and typographic punctuation; avoid emoji and title-case clichés.

Skeleton:

```
[kicker]        THE WAY OF LIVING
[section word]  Your roots
[body]          Each residence is crafted not merely for living,
                but as a space that evolves alongside you.
[cta]           Explore residences →
```

## 6. Art direction

- Renders are golden-hour or dusk, with warm interior lights against a cool olive facade. Keep one grade across every image.
- Show people small, at the base of the building, for scale.
- The building's canopy/branch structure is the hero geometry; crop it, mask it, and echo it in line art.
- Use a top-down aerial for plans, a portrait crop for lifestyle video, and a single dusk exterior for the hero.
- No generic stock photography, no glossy blue skies, no heavy HDR.

## 7. Implementation order

1. Set tokens, type scale, wrapper, and nav pill; verify one still scene looks right before adding motion.
2. Build the static sequence of scenes with real or placeholder renders.
3. Add Lenis + GSAP; implement text reveals first (cheapest, highest impact).
4. Implement the sticky intro and mask morph.
5. Implement the horizontal pan.
6. Add footer gradient, trees, and form.
7. Test at 1440, 1120, 600, and 375 px; test reduced motion and JS-off.

## 8. QA checklist

- [ ] One focal idea per viewport; no competing headlines.
- [ ] At most three hues per screen; gold and neon are accents only.
- [ ] Body text ≥14px; display type never bold.
- [ ] Every image has a scrim or a dark/cream text color with ≥4.5:1 contrast.
- [ ] Scroll length matches motion distance; no dead scroll, no rushed scene.
- [ ] Text reveals are reversible and split by word/char.
- [ ] Mobile has no pinned sections and no horizontal overflow.
- [ ] Reduced motion renders a complete, static page.
- [ ] Nav, forms, and index counters have labels and keyboard focus states.

## 9. Do not

- Copy the actual Belgrade Arbor renders, logo, copy, or floor plans; use the language, not the assets.
- Add neon green as a brand color, gradients on buttons, glassmorphism panels, or drop shadows.
- Animate everything at once. Motion should mark chapter changes, not decorate.
- Use centered body copy, icon grids, or card carousels; this language is asymmetric and editorial.

## Reference

- [references/teardown.md](references/teardown.md) — measured section map, extracted tokens, motion timings, and copy samples from the original site.
