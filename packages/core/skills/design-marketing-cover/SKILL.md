---
name: design-marketing-cover
description: Plan, create, or improve a marketing cover or thumbnail that earns attention, communicates relevance, and converts the right viewer without deceptive clickbait. Use for Xiaohongshu covers, social post covers, video thumbnails, carousel first boards, ad hero graphics, cover copy, cover A/B variants, or before create-design when the first board must drive clicks and reading.
---

# Design a marketing cover

Design the cover as a two-stage decision: the visual makes the right person pause; the words give them a truthful reason to enter. Optimize for qualified attention and promise match, not beauty or curiosity in isolation.

`create-design` owns the new-design workflow and `canva-authoring` owns the React/file contract. This skill owns the cover composition. Read `canva-authoring` before editing any file under `designs/`. If the title, promise, or body is not settled, use `write-marketing-copy` first. If the focal image is not locked, use `select-marketing-image` before composing the cover.

## Establish the click contract

Extract these fields from the request or its `ContentPack`:

- audience and recognizable situation;
- one-sentence promise;
- proof or result actually present in the content;
- desired action after the click;
- channel and aspect ratio;
- brand or creator memory anchors;
- available photos, screenshots, product images, or illustrations.

Reject a cover concept if the body cannot pay it off. Never fake a result image, endorsement, transformation, scarcity cue, UI state, or emotional reaction.

For Xiaohongshu, read [references/xiaohongshu.md](references/xiaohongshu.md).

## Resolve the focal image

Consume the `ImageSelectionPack` from `select-marketing-image`: selected asset, evidence boundary, focal point, essential region, text-safe zone, crop, treatment, rights/privacy status, and validation status.

If the user has already locked an image, verify that it matches the promise and can survive the target crop. Do not replace it merely because another option is prettier. If it is misleading, unusable, or unlicensed, explain the conflict and use `select-marketing-image` to find a truthful alternative.

## Write cover copy with three tests

The cover copy must answer, at a glance:

1. **Is this about me?** Name the person, moment, task, or symptom.
2. **What do I gain or avoid?** Make the practical value visible.
3. **Why open this one?** Surface credible specificity, a gap, proof, or an unresolved tension.

Keep cover copy shorter than the title. Do not repeat the title verbatim. Use a short eyebrow or proof chip only when it adds a distinct piece of information.

## Pick a layout pattern

- **Sandwich:** headline above, focal person/object in the middle, payoff or proof below. Use for a strong portrait or product.
- **Information center:** one large text block integrated with the image. Use when rapid comprehension matters more than atmosphere.
- **Top/bottom:** headline in one zone, supporting line or proof in the other, with the visual carrying the center. Use for clean repeatable series.
- **Four-corner:** distribute very short text around a strong central image. Use only when every corner remains legible and the image has enough negative space.

Choose the simplest pattern that preserves the image and the promise. Do not fill every empty area.

## Build it in OpenCanva

Follow `create-design` for id, theme, scene, and handoff; follow `canva-authoring` for primitives and source-safe coordinates. Additionally:

- Make one element dominant: the focal image or the headline, not both at equal weight.
- Keep the reading order obvious at thumbnail size: context → promise → proof.
- Put text on a quiet region, solid panel, gradient/scrim, or high-contrast crop.
- Use high contrast based on the actual background. Yellow can attract attention only when it still contrasts; it is not a universal rule.
- Control line breaks. Keep the key phrase together and remove words before shrinking it into illegibility.
- Keep essential text and faces away from likely UI overlays and crop edges.
- Use named groups such as `FocalImage`, `Headline`, `Proof`, and `BrandAnchor`.
- Reuse a stable visual anchor—type treatment, framing device, color, or recurring position—when the user is building a recognizable series.

View the result at fitted zoom and at roughly 25% size. If the promise cannot be understood at the smaller view, simplify it.

## Create variants that teach something

When the user asks for options or the concept is high-stakes, create two or three labeled Scene variants. Keep the promise and brand constant; change only one major variable per variant:

- focal image;
- copy angle;
- layout;
- contrast treatment.

Do not create cosmetic variants that cannot reveal why one performs better. Once a pattern performs well, reuse its core structure until evidence supports changing it.

## Deliver a CoverSpec

Before or alongside implementation, capture:

```md
## CoverSpec
- Audience / situation:
- Channel / dimensions:
- Promise paid off by:
- Selected asset / source mode:
- Focal image / crop:
- Essential region / text-safe zone:
- Cover copy:
- Supporting proof or eyebrow:
- Layout pattern:
- Reading order:
- Contrast treatment:
- Brand anchor:
- Optional test variable:
```

## Two-second audit

Score each item 0–2:

- **Pause:** the visual has a clear focal reason to stop.
- **Relevance:** the right viewer recognizes themselves.
- **Value:** the benefit or avoided cost is concrete.
- **Reason to click:** specificity, proof, or tension remains after the topic is understood.
- **Legibility:** the message survives thumbnail size and likely UI crops.
- **Promise match:** the underlying content pays off the cover early.

Revise below 10/12. Treat a 0 on relevance, legibility, or promise match as a hard failure regardless of total score. Finally run the OpenCanva layout lint; a marketing cover is not done with hidden, crowded, occluded, or off-canvas content.

Do not award a final **Pause** or **Legibility** score to an unrendered `CoverSpec`. Mark those items `provisional` until the cover has been viewed at fitted zoom and thumbnail size. A written intention is not visual verification.
