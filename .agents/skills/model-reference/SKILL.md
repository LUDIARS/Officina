---
name: model-reference
description: Obtain and interpret three-view references or concept art for modelling, derive measurable visual requirements, and inspect blockouts and final exports. Use for 3D or layered visual asset production, not nonvisual builds or training.
---

# Reference-driven modelling

Before detailed modelling request existing three-view drawings (front, side and back; top or other elevations when useful) and/or concept art in the designated job thread. Search already supplied inputs first so the user is not asked twice. For architecture, ask for missing elevations or floor/scale information when it materially affects the result. Do not assume concept art is an orthographic drawing.

If references are missing, list what is needed and why in one concise question using `templates/question.md`. The user may provide references or authorize creation of a concept/reference sheet. Generated references are drafts until accepted; unavailable image generation is a limitation, not permission to fabricate an approved reference. A text-only, explicitly authorized provisional blockout may proceed without pretending the reference requirement was satisfied.

From the actual images extract a compact reference table: feature, source/view, required property, confidence and unresolved conflict. Cover silhouette, proportions, dimensions/units, materials, palette, intended camera and distinguishing details. Separate observations from inferred hidden geometry. Where views disagree, surface the conflict before high-detail work. Do not transplant AC/Tk-specific aesthetics into other projects.

For a layered 2D asset identify meaningful parts, occluded portions, pivots, layer order and intended movement. For 3D identify scale, axis/up direction, origin, topology, UV/material needs, poly/texture budget and target export format as appropriate to the user's runtime. Avoid prescribing numeric budgets not supplied or derived from the target.

Create a blockout and inspect front/side/back and an intended-use perspective. Post images with the exact artifact revision and ask only consequential unresolved questions. Apply approved direction before costly detail/rendering.

Before delivery:

- Open and inspect actual preview images at the intended viewing distance, lighting and camera. An object count or a completed renderer process does not establish visible quality.
- Inspect silhouette, alignment across views, scale, material readability, unintended intersections, normals and missing textures. Verify export by reopening it; keep editable source and relative asset paths.
- Include a neutral diagnostic view as well as a presentation render, so lighting does not hide defects.
- Pass the references, exact artifact revision and these previews to the independent critic. Record missing views and untested runtime integration.

Deliver the editable model, requested interchange exports, previews and generation/settings notes. Never substitute a concept image for an editable model or a successful screenshot for a usable export.
