# His marks

Three logos, sent by Kevin on 10 Aug 2026 as phone screenshots, traced to vector here. These
replace `components/Mark.tsx`, which was a stand-in set in the site's own display face and is
deleted as of this commit — its reasoning survives in git history and the part worth keeping is
carried into `index.tsx`.

| Component      | What it is                                  | Aspect  | Source screenshot        |
| -------------- | ------------------------------------------- | ------- | ------------------------ |
| `MirrorLockup` | MIGAS over its own reflection               | 2.36:1  | `…at_4.39.02PM` |
| `Totem`        | M, I, G, A, S downward, each mirrored       | 0.43:1  | `…at_4.38.31PM` |
| `Graffiti`     | Banner lockup, crown, bursts                | 3.15:1  | `…at_4.38.10PM` |

## How they were extracted

Each screenshot is effectively bilevel — over 94% of pixels sit in the extreme tone bins — so
there was nothing to separate by hand. Per image: isolate the artwork, threshold, crop to the ink,
trace.

`MirrorLockup` needed one extra step. It is white art on a black rounded panel, so a naive
light-pixel bounding box picks up the four corners *outside* the rounded rectangle but inside its
box, which inflated the crop and put the aspect at 1.76:1. Filling the panel's holes, eroding
inward and only then taking light pixels gives the true 2.36:1.

`Graffiti` had the words "Mi gas logo 3" in frame above it. The two ink blocks are separated by
260 clear rows, so dropping the heading is a row-profile cut, not a guess.

## Tracing

    potrace -s -a 0 -O 0.2 -t 2 --flat -o out.svg mark.pbm

`alphamax 0` — every corner preserved. Swept against 0.4 and 1.0 and it won on all three, which is
what you would expect from letterforms with pointed terminals: any corner smoothing rounds them
off. Each trace was then rasterised back at source resolution and compared pixel for pixel:

| Mark           | IoU     | Pixels disagreeing |
| -------------- | ------- | ------------------ |
| `Totem`        | 0.9965  | 0.19%              |
| `MirrorLockup` | 0.9936  | 0.32%              |
| `Graffiti`     | 0.9906  | 0.27%              |

The residual is the anti-aliased boundary of a screenshot — the limit of the source, not of the
trace. **If he ever sends the original vector, replace the `.path.ts` files and nothing else
changes.** That is the whole reason the path data lives in its own modules.

## The mirror, confirmed

The old stand-in claimed the lockup was a vertical mirror at roughly 2.4:1, worked out by masking
the letters off his sun artwork and comparing halves. That gave intersection-over-union of 0.42 for
a flip against 0.37 for a rotation — barely a signal, because the letters overhang the disc onto
pure black. On the clean artwork the same test is decisive:

    vertical flip    IoU 0.970
    180° rotation    IoU 0.289

A reflection like water, not an upside-down copy. The geometry was right; only the letters were not.

## Placement, and the one hard constraint

`Graffiti` is in the nav and the footer. `MirrorLockup` sits on the disc in the hero, where there
is room for a reflection.

**There is a legibility floor on `Graffiti` and it is 32px.** Its letters are holes in the ink and
its outlines are about 2px in an 867px-wide source, so they scale to nothing. Measured on a size
ladder: at 20–28px the crown and bursts are indistinguishable noise and MIGAS is a smudge; it
resolves at 32px and is clean at 40. The nav uses 40px in a 68px bar, the footer 48px. **Do not
size it below 32px** — put `MirrorLockup` or plain type there instead.

`MirrorLockup` has the mirror-image version of the same problem: at nav scale each of its two rows
falls under 14px and the reflection turns to mush. It is a poster mark. That split — one mark for
small placements, one for large — is what a primary mark and a horizontal lockup are for.

`Totem` is traced and exported but not placed anywhere yet.

## Colour

All three are single-path and fill `currentColor`. His marks are monochrome and take their colour
from what they sit on: near-black over the sun on his own artwork, bone in the navigation.

`Graffiti` inverts, and that is correct rather than a bug. It is drawn as white letters inside a
black banner, so the ink is the banner and the outlines, and the letters are holes in it. Filled
bone on a dark page, the banner goes bone and the letters read dark through it — the same design,
inverted, which is how a single-colour logo is supposed to behave.
