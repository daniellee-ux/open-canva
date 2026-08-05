---
name: select-marketing-image
description: Choose, rank, and crop the strongest truthful image for marketing content, covers, thumbnails, ads, and carousel first boards. Use when comparing candidate photos, screenshots, product shots, stock images, illustrations, or generated images; when deciding what kind of visual to source or shoot; when an image needs a crop and text-safe zone; or before design-marketing-cover when the focal image is not locked. Produces an ImageSelectionPack and can provide a capture brief, search queries, or generation prompt when no usable asset exists.
---

# Select a marketing image

Choose the image that best carries the content promise at feed speed. Optimize for qualified attention, self-recognition, credibility, and usable composition—not generic beauty.

`write-marketing-copy` owns the promise and `design-marketing-cover` owns the final cover composition. This skill owns the focal-image decision between them. Do not edit a design unless the user also asks for implementation.

## Read the content contract

Consume the request or its `ContentPack` and establish:

- audience and recognizable situation;
- one truthful promise;
- proof or outcome actually present;
- channel, dimensions, and likely UI crop;
- cover copy and approximate text load;
- brand, creator identity, and desired feeling;
- available assets and their provenance.

If the promise is unsettled, use `write-marketing-copy` first. Ask only when a missing fact would change truthfulness, permissions, or the image direction; otherwise state an assumption and proceed.

If the current platform dimensions or UI safe areas are not supplied by the user or maintained in a local reference, verify them against an authoritative current source before presenting them as facts. Otherwise label them as working assumptions.

For Xiaohongshu, read [references/xiaohongshu.md](references/xiaohongshu.md).

## Define the image's job

Choose one primary job before looking for a picture:

1. **Recognition** — make the audience see their situation or desired identity.
2. **Proof** — show the real outcome, artifact, comparison, or evidence.
3. **Emotion** — make the relevant feeling instantly legible.
4. **Mechanism** — show how the task, method, or product works.
5. **Context** — place a person or product inside a credible real-world use case.

Do not ask one image to carry every job. Prefer the job that supports the promise with the strongest available evidence.

## Choose the source mode

Match the source to what the image is claiming:

- **User-owned photo:** prefer for identity, lived experience, personal result, and trust.
- **Screenshot or artifact:** prefer for software, workflows, documents, outcomes, and demonstrations; hide private or sensitive data.
- **Real product in use:** prefer over an isolated product shot when the promise is contextual or functional.
- **Licensed stock:** use for a representative situation, never as implied proof or testimony. Record the source and license status.
- **Generated image or illustration:** use for a concept or representative scene, never as documentary evidence. Disclose the synthetic nature when it could be mistaken for a real event, person, or result.
- **Type-led or graphic cover:** choose when no image can add truthful, specific value. Do not force a decorative photo.

Never assume an image found online is licensed for reuse.

## Write the ImageBrief

Specify the selection target before sourcing or ranking:

```md
## ImageBrief
- Image job:
- Subject:
- Action / moment:
- Environment:
- Point of view:
- Emotion / state:
- Evidence boundary:
- Desired focal placement:
- Text-safe zone:
- Target crop(s):
- Brand cues:
- Must include:
- Must avoid:
```

Use observable direction. Replace “professional and engaging” with details such as “first-person view of a manager's notebook across from a teammate; open space in the upper left; laptop closed.”

## Inspect candidates

Inspect every candidate you rank. Do not infer the contents of an unopened file, URL, contact sheet, or unseen gallery. View important finalists at full size and at approximate feed-thumbnail size.

Reject a candidate before scoring when it:

- contradicts the content or implies unsupported proof, transformation, endorsement, or emotion;
- exposes private information, confidential UI, or an identifiable person without suitable permission;
- has unknown or unsuitable usage rights for the intended publication;
- is generic enough to fit unrelated content equally well;
- lacks one clear subject or loses the essential action at the target crop;
- is too small, blurred, watermarked, artifacted, or visibly malformed for the output;
- contains baked-in text or branding that conflicts with the cover;
- cannot leave usable space for the required copy, even with a crop, panel, or scrim.

## Rank viable candidates

Score each viable candidate 0–2 and apply the weights below. Use the score to make reasoning explicit, not to predict click-through rate.

- **0:** absent, contradictory, misleading, or unusable.
- **1:** plausible but generic, inferred, weak at thumbnail size, or dependent on a repair.
- **2:** specific, immediately visible in the asset, and strong without needing an explanatory caption.

| Dimension | Weight | Question |
| --- | ---: | --- |
| Promise relevance | ×3 | Does it visually support the exact promise? |
| Authenticity / proof fit | ×3 | Is the implied claim honest for this source mode? |
| Audience self-recognition | ×2 | Will the intended viewer recognize their situation or desire? |
| Focal stopping power | ×2 | Is there one immediately legible subject, contrast, or moment? |
| Thumbnail clarity | ×2 | Does the essential meaning survive at small size? |
| Text-safe composition | ×1 | Can the required copy sit clearly without hiding the subject? |
| Crop resilience | ×1 | Can it survive the target ratio and likely variants? |
| Brand fit | ×1 | Does it feel credible for this creator or brand? |

Maximum: 30. Treat 24–30 as strong, 20–23 as usable with a clear fix, and below 20 as a signal to source again. Reject any candidate scoring 0 on promise relevance, authenticity, or thumbnail clarity regardless of total. Break ties in that order, then use focal stopping power.

Show the per-dimension scores, not only a total. A common stock metaphor or visual cliché—generic handshake, generic meeting, floating product, anonymous smiling person—cannot receive 2 for promise relevance, self-recognition, or focal stopping power unless concrete details in the asset make it specific to this promise. Do not award specificity supplied only by the brief or cover text.

## Plan the crop and treatment

For the selected image, specify:

- target aspect ratio and any size variants;
- focal point as approximate `x% / y%` within the original;
- essential region that must survive the crop;
- preferred text-safe zone and reading direction;
- whether a crop, blur, scrim, gradient, or solid panel is needed;
- whether the subject's gaze or motion helps lead toward the copy;
- fallback crop if platform UI or responsive variants cover the first choice.

Never crop out the evidence that made the image relevant. Do not use heavy treatment to rescue an image whose subject or meaning is wrong.

## Source when no candidate works

Choose one primary next action:

- **Capture brief:** give a shot list with subject, action, viewpoint, light, background, negative space, and avoid list.
- **Search queries:** describe content literally—subject + action + environment + point of view + composition. Provide 3–5 queries and require a license check.
- **Generation prompt:** describe the same concrete scene, composition, crop, negative space, and exclusions. Label the result as representative, not evidence.
- **Graphic fallback:** recommend a screenshot, artifact, diagram, or type-led cover when a photo would be decorative or misleading.

Do not silently switch from real evidence to a generated substitute.

## Deliver an ImageSelectionPack

```md
## ImageSelectionPack
- Audience / promise:
- Image job:
- Source mode / provenance:
- Selected asset:
- Why it wins:
- Evidence boundary:
- Candidate ranking and rejection reasons:
- Target crop / focal point:
- Essential region:
- Text-safe zone:
- Recommended treatment:
- Rights / privacy status:
- Fallback asset or crop:
- Capture brief, search queries, or generation prompt if needed:
- Validation status: proposed / inspected / crop-previewed / rendered
```

Hand this pack to `design-marketing-cover`. Keep **proposed** separate from **inspected**: never claim thumbnail clarity, crop safety, resolution, or visual quality for an asset that has not actually been viewed.
